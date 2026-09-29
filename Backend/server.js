import express from 'express';
import cors from 'cors';
import YahooFinance from 'yahoo-finance2';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

import Thesis from './models/Thesis.js';
import Notification from './models/Notification.js';

dotenv.config();

// 1. Instantiate Clients
const yahooFinance = new YahooFinance();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = 5001;

// Global Middleware
app.use(cors());
app.use(express.json());

// In-Memory Private & Strategic Comps Database (For Corporate Strategy & Consulting)
const corporateStrategyDatabase = [
  {
    symbol: 'MA-TECH-2025-01',
    name: 'SaaS Enterprise Valuation Multiples (Q1 Comps)',
    exchange: 'STRATEGIC_DB',
    category: 'M&A Benchmark',
    evToRevenue: '8.4x',
    evToEbitda: '22.1x',
    context: 'Corporate Strategy Comps'
  },
  {
    symbol: 'LBO-RETAIL-08',
    name: 'Middle Market LBO Leverage Benchmark',
    exchange: 'STRATEGIC_DB',
    category: 'Private Debt',
    leverageRatio: '4.5x Debt/EBITDA',
    context: 'LBO Modeling'
  },
  {
    symbol: 'MACRO-CPI-US',
    name: 'US Consumer Price Index (YoY Inflation Rate)',
    exchange: 'FRED_MACRO',
    category: 'Macro Indicator',
    unit: 'Percentage',
    context: 'Economic Assessment'
  },
  {
    symbol: 'DEAL-CLD-2024',
    name: 'Project Cloudburst (Hyperscale Asset Acquisition)',
    exchange: 'INTERNAL_DEALS',
    category: 'M&A Target',
    dealSize: '$450M Target EV',
    context: 'Acquisition Pipeline'
  }
];

// In-Memory Notification Store & Tracked Watchlist
let userNotifications = [
  {
    id: 1,
    symbol: 'AAPL',
    type: 'WARNING',
    message: 'Margin compression noted in supply chain channel checks. Recommend reviewing valuation floor.',
    timestamp: new Date().toLocaleTimeString()
  }
];

const watchlistTheses = [
  { 
    symbol: 'AAPL', 
    thesis: 'Services revenue growth > 15% YoY with steady gross margins above 44%.',
    valuationFloor: '$180 Entry Target'
  }
];

// 2. Dual-Practice Ticker & Strategic Telemetry Search API
app.get('/api/search', async (req, res) => {
  const { q, mode = 'WEALTH' } = req.query; // mode can be 'WEALTH' or 'STRATEGY'
  if (!q) return res.json([]);

  try {
    const searchResult = await yahooFinance.search(q);
    
    // Wealth Management Mode: Public Equities, ETFs, Indices, FX/Currencies, Futures, Mutual Funds
    const allowedWealthQuoteTypes = new Set([
      'EQUITY',
      'ETF',
      'INDEX',
      'CURRENCY',
      'FUTURE',
      'MUTUALFUND'
    ]);

    const publicResults = (searchResult.quotes || [])
      .filter((quote) => quote.isYahooFinance && allowedWealthQuoteTypes.has(quote.quoteType))
      .map((quote) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        exchange: quote.exchDisp || quote.exchange || 'GLOBAL',
        category: quote.quoteType,
        source: 'PUBLIC_MARKETS'
      }));

    // Corporate Strategy / Consulting Mode: Combine public markets + private deals/macro comps
    if (mode === 'STRATEGY') {
      const normalizedQuery = q.toString().toLowerCase();
      
      const matchedStrategicResults = corporateStrategyDatabase.filter(
        (item) =>
          item.symbol.toLowerCase().includes(normalizedQuery) ||
          item.name.toLowerCase().includes(normalizedQuery) ||
          item.category.toLowerCase().includes(normalizedQuery)
      ).map((item) => ({
        symbol: item.symbol,
        name: item.name,
        exchange: item.exchange,
        category: item.category,
        source: 'STRATEGIC_DB'
      }));

      // Strategic queries prioritize strategic benchmarks first, followed by public comps
      return res.json([...matchedStrategicResults, ...publicResults]);
    }

    res.json(publicResults);
  } catch (error) {
    console.error('[SEARCH API ERROR]:', error.message || error);
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
});

// 3. Real-Time Telemetry & Strategic Quote API
app.get('/api/quote/:symbol', async (req, res) => {
  const { symbol } = req.params;

  // Check if symbol belongs to internal strategic database
  const strategicItem = corporateStrategyDatabase.find((item) => item.symbol === symbol);
  if (strategicItem) {
    return res.json({
      symbol: strategicItem.symbol,
      name: strategicItem.name,
      price: strategicItem.evToRevenue || strategicItem.leverageRatio || 'N/A',
      sma50: null,
      sma200: null,
      exchange: strategicItem.exchange,
      currency: 'USD',
      isStrategicComp: true,
      category: strategicItem.category
    });
  }

  try {
    const quote = await yahooFinance.quote(symbol);

    if (!quote) {
      return res.status(404).json({ error: `Symbol '${symbol}' not found.` });
    }

    res.json({
      symbol: quote.symbol,
      name: quote.shortname || quote.longname || quote.symbol,
      price: quote.regularMarketPrice ?? quote.postMarketPrice ?? 0,
      sma50: quote.fiftyDayAverage ?? null,
      sma200: quote.twoHundredDayAverage ?? null,
      exchange: quote.fullExchangeName || quote.exchange || 'N/A',
      currency: quote.currency || 'USD',
      quoteType: quote.quoteType || 'EQUITY',
      isStrategicComp: false
    });
  } catch (error) {
    console.error('[QUOTE API ERROR]:', error.message || error);
    res.status(500).json({ error: 'Failed to fetch quote data', details: error.message });
  }
});

// 4. OpenAI Thesis & Strategic Advisory Audit Endpoint
app.post('/api/analyze-thesis', async (req, res) => {
  const { symbol, thesis, currentPrice, valuationFloor, contextMode = 'WEALTH' } = req.body;

  try {
    const systemPrompt = contextMode === 'STRATEGY'
      ? 'You are a Senior Management Consultant and Corporate Strategy Advisor evaluating strategic M&A targets, valuation benchmarks, and operational risk factors.'
      : 'You are a disciplined Wealth Manager and Equity Risk Analyst evaluating portfolio asset theses.';

    const prompt = `
    Mode: ${contextMode}
    Target Symbol/Asset: ${symbol}
    Current Benchmark Price/Value: $${currentPrice}
    Strategic Thesis: "${thesis}"
    Floor Target / Target Threshold: "${valuationFloor}"
    
    Evaluate thesis health (HEALTHY, REVIEW, or BROKEN) and provide a concise 2-sentence risk assessment and actionable recommendation.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
    });

    res.json({
      success: true,
      analysis: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('[OPENAI API ERROR]:', error.message || error);
    res.status(500).json({ error: 'AI analysis failed', details: error.message });
  }
});

// 5. Notification Stream Endpoint
app.get('/api/notifications', (req, res) => {
  res.json({ success: true, data: userNotifications });
});

// 6. Background Automated Risk Checker (Runs every 15 minutes)
const checkWatchlistRisk = async () => {
  console.log('[CRON] Running background thesis risk audit...');
  for (const item of watchlistTheses) {
    try {
      const quote = await yahooFinance.quote(item.symbol);
      const price = quote.regularMarketPrice ?? quote.postMarketPrice ?? 0;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are an automated risk engine. Respond ONLY in valid JSON: {\"shouldAlert\": boolean, \"message\": string, \"type\": \"INFO\"|\"WARNING\"|\"CRITICAL\"}" 
          },
          { 
            role: "user", 
            content: `Asset: \({item.symbol}, Price/Value:\){price}, Thesis: ${item.thesis}. Does market/macro movement warrant an urgent update to the portfolio manager?` 
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content);

      if (result.shouldAlert) {
        userNotifications.unshift({
          id: Date.now(),
          symbol: item.symbol,
          type: result.type,
          message: result.message,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    } catch (err) {
      console.error(`[BACKGROUND CHECK ERROR - ${item.symbol}]:`, err.message || err);
    }
  }
};

// Run background check every 15 minutes
setInterval(checkWatchlistRisk, 15 * 60 * 1000);

// Start Server
app.listen(5001, () => {
  console.log(`[PHANTOM_SOUL API] Dual-Practice Server running on http://localhost:5001`);
});