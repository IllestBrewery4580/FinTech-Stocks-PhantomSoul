import express from 'express';
import cors from 'cors';
import yahooFinance from 'yahoo-finance2';

const app = express();
app.use(cors());
app.use(express.json());

// 1. Ticker Search / Autocomplete Endpoint
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  try {
    const searchResult = await yahooFinance.search(q);
    // Filter down to equity and ETF instruments
    const formattedResults = searchResult.quotes
      .filter((quote) => quote.isYahooFinance && (quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF'))
      .map((quote) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        exchange: quote.exchDisp || quote.exchange,
      }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Yahoo Finance Search Error:', error);
    res.status(500).json({ error: 'Failed to fetch ticker search results' });
  }
});

// 2. Fetch Live Quote & Detail Endpoint
app.get('/api/quote/:symbol', async (req, res) => {
  const { symbol } = req.params;

  try {
    const quote = await yahooFinance.quote(symbol);
    
    // Extract price and moving averages
    res.json({
      symbol: quote.symbol,
      name: quote.shortname || quote.longname,
      price: quote.regularMarketPrice,
      sma50: quote.fiftyDayAverage,
      sma200: quote.twoHundredDayAverage,
      exchange: quote.fullExchangeName,
      currency: quote.currency,
    });
  } catch (error) {
    console.error('Yahoo Finance Quote Error:', error);
    res.status(500).json({ error: 'Failed to fetch quote data' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`[PHANTOM_SOUL] Backend running on http://localhost:${PORT}`);
});