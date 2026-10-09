import express from 'express';
import cors from 'cors';
import YahooFinance from 'yahoo-finance2';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

import Thesis from './models/Thesis.js';
import Notifications from './models/Notification.js';

import portfolioRoutes from './routs/portfolioRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

import authRoutes from './routes/authRoutes.js';

import mongoose from 'mongoose';

import portfolioRoutes from './routes/portfolioRoutes.js';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

console.log('[DATABASE) MongoDB connected');

// --------------------------------------------------
// CONFIGURATION & ENVIRONMENT VALIDATION
// --------------------------------------------------

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'PHANTOM_SOUL_SUPER_SECRET_KEY';
const FIRM_EMAIL_DOMAIN = (process.env.FIRM_EMAIL_DOMAIN || '@firm.com').toLowerCase();

console.log('PORT:', PORT);
console.log('OPENAI Key Loaded:', process.env.OPENAI_API_KEY ? 'YES' : 'NO');
console.log('Mongo URI Loaded:', process.env.MONGO_URI ? 'YES' : 'NO');

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters.');
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required.');
}

// --------------------------------------------------
// APP & SERVICES INITIALIZATION
// --------------------------------------------------

const app = express();
// Global Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/api/auth', authRoutes);

// Protected Portfolio + Asset APIs
app.use('/api', portfolioRoutes);

app.use('/api', portfolioRoutes);

// Protected PhantomSoul At APIs
app.use('/api', aiRoutes);

const yahooFinance = new YahooFinance();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --------------------------------------------------
// TEMPORARY IN-MEMORY DATABASES
// --------------------------------------------------

const usersDB = new Map();
const verificationCodes = new Map();
const firmAuditLogs = new Map();

let userNotifications = [
  {
    id: 1,
    symbol: 'AAPL',
    type: 'WARNING',
    message: 'Margin compression noted in supply chain channel checks. Review valuation assumptions.',
    timestamp: new Date().toISOString(),
  },
];

const watchlistTheses = [
  {
    symbol: 'AAPL',
    thesis: 'Services revenue growth above 15% YoY with steady gross margins above 44%.',
    valuationFloor: '$180 Entry Target',
  },
];

// Corporate Strategy Database
const corporateStrategyDatabase = [
  {
    symbol: 'MA-TECH-2025-01',
    name: 'SaaS Enterprise Valuation Multiples (Q1 Comps)',
    exchange: 'STRATEGIC_DB',
    category: 'M&A Benchmark',
    evToRevenue: '8.4x',
    evToEbitda: '22.1x',
    context: 'Corporate Strategy Comps',
  },
  {
    symbol: 'LBO-RETAIL-08',
    name: 'Middle Market LBO Leverage Benchmark',
    exchange: 'STRATEGIC_DB',
    category: 'Private Debt',
    leverageRatio: '4.5x Debt/EBITDA',
    context: 'LBO Modeling',
  },
  {
    symbol: 'MACRO-CPI-US',
    name: 'US Consumer Price Index (YoY Inflation Rate)',
    exchange: 'FRED_MACRO',
    category: 'Macro Indicator',
    unit: 'Percentage',
    context: 'Economic Assessment',
  },
  {
    symbol: 'DEAL-CLD-2024',
    name: 'Project Cloudburst (Hyperscale Asset Acquisition)',
    exchange: 'INTERNAL_DEALS',
    category: 'M&A Target',
    dealSize: '$450M Target EV',
    context: 'Acquisition Pipeline',
  },
];

// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    req.user = jwt.verify(authorization.slice(7), JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function getStrategicValue(item) {
  return (
    item.evToRevenue ||
    item.leverageRatio ||
    item.unit ||
    item.dealSize ||
    'N/A'
  );
}

// --------------------------------------------------
// 1. SIGNUP AND EMAIL VERIFICATION
// --------------------------------------------------

app.post('/api/auth/signup', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password, name } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }

    if (typeof password !== 'string' || password.length < 12) {
      return res.status(400).json({ error: 'Password must be at least 12 characters.' });
    }

    if (usersDB.has(email)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Determine dual practice role automatically based on email domain
    const isEmployee = email.endsWith(FIRM_EMAIL_DOMAIN) || email.endsWith('@company.com');
    const role = isEmployee ? 'EMPLOYEE' : 'CLIENT';

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = crypto.randomInt(100000, 1000000).toString();

    const newUser = {
      id: crypto.randomUUID(),
      name: name || email.split('@')[0],
      email,
      password: hashedPassword,
      verified: false,
      role,
    };

    usersDB.set(email, newUser);
    verificationCodes.set(email, {
      code: verificationCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`Verification code for \({email}:\){verificationCode}`);
    }

    return res.status(201).json({
      message: `Verification code sent to \({email}. Registered as\){role}`,
      role,
    });
  } catch (error) {
    console.error('[SIGNUP ERROR]', error.message);
    return res.status(500).json({ error: 'Signup failed.' });
  }
});

// --------------------------------------------------
// 2. VERIFY EMAIL
// --------------------------------------------------

app.post('/api/auth/verify', (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { code } = req.body;

  const user = usersDB.get(email);
  const verification = verificationCodes.get(email);

  if (
    !user ||
    !verification ||
    verification.expiresAt < Date.now() ||
    verification.code !== code
  ) {
    return res.status(400).json({ error: 'Invalid or expired verification code.' });
  }

  user.verified = true;
  verificationCodes.delete(email);

  const token = createToken(user);

  return res.json({
    token,
    user: {
      email: user.email,
      role: user.role,
    },
  });
});

// --------------------------------------------------
// 3. LOGIN
// --------------------------------------------------

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    const user = usersDB.get(email);

    if (
      !user ||
      typeof password !== 'string' ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (!user.verified) {
      return res.status(403).json({ error: 'Account not verified.' });
    }

    const token = createToken(user);

    return res.json({
      token,
      user: {
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[LOGIN ERROR]', error.message);
    return res.status(500).json({ error: 'Login failed.' });
  }
});

// --------------------------------------------------
// 4. FIRM AUDIT LOGS
// --------------------------------------------------

app.get('/api/audit/:symbol', authenticateToken, (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  return res.json(firmAuditLogs.get(symbol) || []);
});

app.post('/api/audit/:symbol', authenticateToken, (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const { text } = req.body;

  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Comment text is required.' });
  }

  const newEntry = {
    id: crypto.randomUUID(),
    author: req.user.email,
    text: text.trim(),
    timestamp: new Date().toISOString(),
  };

  const entries = firmAuditLogs.get(symbol) || [];
  entries.push(newEntry);
  firmAuditLogs.set(symbol, entries);

  return res.status(201).json({ success: true, data: newEntry });
});

// --------------------------------------------------
// 5. DUAL-PRACTICE TICKER AND STRATEGIC SEARCH API
// --------------------------------------------------

app.get('/api/search', async (req, res) => {
  const { q, mode = 'WEALTH' } = req.query;

  if (typeof q !== 'string' || !q.trim()) {
    return res.json([]);
  }

  if (!['WEALTH', 'STRATEGY'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid search mode.' });
  }

  try {
    const searchResult = await yahooFinance.search(q.trim());
    const allowedWealthQuoteTypes = new Set([
      'EQUITY',
      'ETF',
      'INDEX',
      'CURRENCY',
      'FUTURE',
      'MUTUALFUND',
    ]);

    const publicResults = (searchResult.quotes || [])
      .filter(
        (quote) =>
          quote.isYahooFinance && allowedWealthQuoteTypes.has(quote.quoteType)
      )
      .map((quote) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        exchange: quote.exchDisp || quote.exchange || 'GLOBAL',
        category: quote.quoteType,
        source: 'PUBLIC_MARKETS',
      }));

    if (mode === 'STRATEGY') {
      const normalizedQuery = q.trim().toLowerCase();
      const matchedStrategicResults = corporateStrategyDatabase
        .filter(
          (item) =>
            item.symbol.toLowerCase().includes(normalizedQuery) ||
            item.name.toLowerCase().includes(normalizedQuery) ||
            item.category.toLowerCase().includes(normalizedQuery)
        )
        .map((item) => ({
          symbol: item.symbol,
          name: item.name,
          exchange: item.exchange,
          category: item.category,
          source: 'STRATEGIC_DB',
        }));

      return res.json([...matchedStrategicResults, ...publicResults]);
    }

    return res.json(publicResults);
  } catch (error) {
    console.error('[SEARCH API ERROR]', error.message);
    return res.status(500).json({ error: 'Failed to fetch search results.' });
  }
});

// --------------------------------------------------
// 6. REAL-TIME QUOTE AND STRATEGIC TELEMETRY API
// --------------------------------------------------

app.get('/api/quote/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const strategicItem = corporateStrategyDatabase.find((item) => item.symbol === symbol);

  if (strategicItem) {
    return res.json({
      symbol: strategicItem.symbol,
      name: strategicItem.name,
      price: getStrategicValue(strategicItem),
      sma50: null,
      sma200: null,
      exchange: strategicItem.exchange,
      currency: 'USD',
      isStrategicComp: true,
      category: strategicItem.category,
    });
  }

  try {
    const quote = await yahooFinance.quote(symbol);

    if (!quote) {
      return res.status(404).json({ error: `Symbol '${symbol}' not found.` });
    }

    return res.json({
      symbol: quote.symbol,
      name: quote.shortname || quote.longname || quote.symbol,
      price: quote.regularMarketPrice ?? quote.postMarketPrice ?? 0,
      sma50: quote.fiftyDayAverage ?? null,
      sma200: quote.twoHundredDayAverage ?? null,
      exchange: quote.fullExchangeName || quote.exchange || 'N/A',
      currency: quote.currency || 'USD',
      quoteType: quote.quoteType || 'EQUITY',
      isStrategicComp: false,
    });
  } catch (error) {
    console.error('[QUOTE API ERROR]', error.message);
    return res.status(500).json({ error: 'Failed to fetch quote data.' });
  }
});

// --------------------------------------------------
// 7. OPENAI THESIS AND STRATEGIC ADVISORY AUDIT
// --------------------------------------------------

app.post('/api/analyze-thesis', authenticateToken, async (req, res) => {
  const {
    symbol,
    thesis,
    currentPrice,
    valuationFloor,
    contextMode = 'WEALTH',
  } = req.body;

  if (typeof symbol !== 'string' || typeof thesis !== 'string' || !thesis.trim()) {
    return res.status(400).json({ error: 'Symbol and thesis are required.' });
  }

  if (!['WEALTH', 'STRATEGY'].includes(contextMode)) {
    return res.status(400).json({ error: 'Invalid analysis mode.' });
  }

  try {
    const systemPrompt =
      contextMode === 'STRATEGY'
        ? 'You are a Senior Management Consultant and Corporate Strategy Advisor evaluating strategic M&A targets, valuation benchmarks, and operational risk factors.'
        : 'You are a disciplined Wealth Manager and Equity Risk Analyst evaluating portfolio asset theses.';

    const prompt = `
Mode: ${contextMode}
Target Symbol/Asset: ${symbol}
Current Benchmark Price/Value: ${currentPrice ?? 'N/A'}
Strategic Thesis: "${thesis}"
Floor Target / Target Threshold: "${valuationFloor ?? 'N/A'}"

Evaluate thesis health as HEALTHY, REVIEW, or BROKEN.
Provide a concise two-sentence risk assessment and actionable recommendation.
Explain uncertainty and assumptions.
Do not present the output as a guarantee.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    });

    return res.json({
      success: true,
      analysis: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error('[OPENAI API ERROR]', error.message);
    return res.status(500).json({ error: 'AI analysis failed.' });
  }
});

// --------------------------------------------------
// 8. NOTIFICATION STREAM
// --------------------------------------------------

app.get('/api/notifications', authenticateToken, (req, res) => {
  return res.json({
    success: true,
    data: userNotifications,
  });
});

// --------------------------------------------------
// 9. BACKGROUND AUTOMATED RISK CHECKER
// --------------------------------------------------

let riskCheckRunning = false;

async function checkWatchlistRisk() {
  if (riskCheckRunning) {
    console.log('[CRON] Risk check already running.');
    return;
  }

  riskCheckRunning = true;
  console.log('[CRON] Running background thesis risk audit...');

  try {
    for (const item of watchlistTheses) {
      try {
        const quote = await yahooFinance.quote(item.symbol);
        const price = quote.regularMarketPrice ?? quote.postMarketPrice ?? 0;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are an automated risk engine. Respond ONLY in valid JSON with shouldAlert (boolean), message (string), and type (INFO, WARNING, or CRITICAL). Use only supplied information. Do not invent market events.',
            },
            {
              role: 'user',
              content: `
Asset: ${item.symbol}
Price/Value: ${price}
Thesis: ${item.thesis}
Valuation Floor: ${item.valuationFloor}

Does the supplied information warrant an urgent update to the portfolio manager?
If information is insufficient, do not invent an alert.
`,
            },
          ],
          response_format: { type: 'json_object' },
        });

        const result = JSON.parse(completion.choices[0].message.content);

        if (result.shouldAlert === true && typeof result.message === 'string') {
          userNotifications.unshift({
            id: crypto.randomUUID(),
            symbol: item.symbol,
            type: ['INFO', 'WARNING', 'CRITICAL'].includes(result.type)
              ? result.type
              : 'INFO',
            message: result.message,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`[BACKGROUND CHECK ERROR - ${item.symbol}]`, error.message);
      }
    }
  } finally {
    riskCheckRunning = false;
  }
}

checkWatchlistRisk();
setInterval(checkWatchlistRisk, 15 * 60 * 1000);

// --------------------------------------------------
// 10. START SERVER
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(`[PHANTOM_SOUL API] Dual-Practice Server running on http://localhost:${PORT}`);
});