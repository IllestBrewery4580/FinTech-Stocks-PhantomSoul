import express from 'express';
import cors from 'cors';
import { YahooFinance } from 'yahoo-finance2';

// 1. Instantiate the YahooFinance client (Required in v3)
const yahooFinance = new YahooFinance();

const app = express();
const PORT = 5001;

// Global Middleware
app.use(cors());
app.use(express.json());

// 2. Ticker Autocomplete API
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  try {
    const searchResult = await yahooFinance.search(q);
    const results = (searchResult.quotes || [])
      .filter((quote) => quote.isYahooFinance && (quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF'))
      .map((quote) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        exchange: quote.exchDisp || quote.exchange,
      }));

    res.json(results);
  } catch (error) {
    console.error('[SEARCH API ERROR]:', error.message || error);
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
});

// 3. Real-Time Stock Quote API
app.get('/api/quote/:symbol', async (req, res) => {
  const { symbol } = req.params;

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
    });
  } catch (error) {
    console.error('[QUOTE API ERROR]:', error.message || error);
    res.status(500).json({ error: 'Failed to fetch quote data', details: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`[PHANTOM_SOUL API] Running on http://localhost:${PORT}`);
});