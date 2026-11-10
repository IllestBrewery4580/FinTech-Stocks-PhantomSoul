import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

const allowedWealthQuoteTypes = new Set([
  'EQUITY',
  'ETF',
  'INDEX',
  'CURRENCY',
  'FUTURE',
  'MUTUALFUND'
]);

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

export async function searchAssets(query, mode = 'WEALTH') {
  const q = String(query || '').trim();

  if (!q) {
    return [];
  }

  try {
    const searchResult = await yahooFinance.search(q);

    const publicResults = (searchResult.quotes || [])
      .filter(
        (quote) =>
          quote.isYahooFinance &&
          allowedWealthQuoteTypes.has(quote.quoteType)
      )
      .map((quote) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        exchange:
          quote.exchDisp ||
          quote.exchange ||
          'GLOBAL',
        category: quote.quoteType,
        source: 'PUBLIC_MARKETS'
      }));

    if (mode === 'STRATEGY') {
      const normalizedQuery = q.toLowerCase();

      const strategicResults = corporateStrategyDatabase
        .filter((item) => {
          return (
            item.symbol.toLowerCase().includes(normalizedQuery) ||
            item.name.toLowerCase().includes(normalizedQuery) ||
            item.category.toLowerCase().includes(normalizedQuery)
          );
        })
        .map((item) => ({
          symbol: item.symbol,
          name: item.name,
          exchange: item.exchange,
          category: item.category,
          source: 'STRATEGIC_DB'
        }));

      return [...strategicResults, ...publicResults];
    }

    return publicResults;
  } catch (error) {
    console.error('[ASSET SEARCH ERROR]:', error);

    throw new Error('Failed to search assets.');
  }
}

export default searchAssets;