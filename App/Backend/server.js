import express from 'express';
import cors from 'cors';
import YahooFinance from 'yahoo-finance2';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import crypto from 'node:crypto';

import Thesis from './models/Thesis.js';
import Notifications from './models/Notification.js';

import portfolioRoutes from './routes/portfolioRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

import authRoutes from './routes/authRoutes.js';

import mongoose from 'mongoose';
import { authenticateToken } from './middleware/authMiddleware.js';

import adminRoutes from "./routes/adminRoutes.js";


// Load environment variables before initializing application services.
dotenv.config();

if (!process.env.MONGO_URI) {
  throw new Error(
    '[DATABASE] MONGO_URI is missing. Configure it in Backend/.env.'
  );
}

try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[DATABASE] MongoDB connected.');
} catch (error) {
  console.error('[DATABASE] MongoDB connection failed:', error.message);
  process.exit(1);
}

// --------------------------------------------------
// CONFIGURATION & ENVIRONMENT VALIDATION
// --------------------------------------------------

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET;

console.log('PORT:', PORT);
console.log('OPENAI Key Loaded:', process.env.OPENAI_API_KEY ? 'YES' : 'NO');
console.log('Mongo URI Loaded:', process.env.MONGO_URI ? 'YES' : 'NO');

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters.');
}

// OpenAI is optional. Core features should work without API credits.
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

if (!openai) {
  console.warn(
    '[AI] OPENAI_API_KEY is not configured. AI features are disabled.'
  );
}

// APP & SERVICES INITIALIZATION
const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRoutes);
app.use('/api', portfolioRoutes);
app.use('/api', aiRoutes);
app.use('/api/admin', adminRoutes);

const yahooFinance = new YahooFinance();

// --------------------------------------------------
// TEMPORARY IN-MEMORY DATABASES
// --------------------------------------------------

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

    if (!openai) {
      return res.status(503).json({
        error: 'AI analysis is unavailable. Configure OPENAI_API_KEY to enable this feature.',
      });
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
  if (!openai) {
    console.warn('[AI] Background risk checks are disabled because OPENAI_API_KEY is missing.');
    return;
  }

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

if (openai) {
  checkWatchlistRisk();
  setInterval(checkWatchlistRisk, 15 * 60 * 1000);
} else {
  console.warn('[AI] Background watchlist checks are not scheduled.');
}

// --------------------------------------------------
// 10. START SERVER
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(`[PHANTOM_SOUL API] Dual-Practice Server running on http://localhost:${PORT}`);
});