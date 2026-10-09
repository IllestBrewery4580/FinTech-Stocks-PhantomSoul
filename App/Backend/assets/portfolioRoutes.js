import express from 'express';
import YahooFinance from 'yahoo-finance2';

import Portfolio from '../models/Portfolio.js';
import { verifyCRFTToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const yahooFinance = new YahooFinance();

/*
 * Search assets
 *
 * GET /api/assets/search?q=apple
 */
router.get('/assets/search', verifyCRFTToken, async (req, res) => {
    const query = String(req.query.q || '').trim();

    if (!query) {
        return res.json({
            success: true,
            data: [],
        });
    }

    try {
        const result = await yahooFinance.search(query);

        const allowedTypes = new Set([
            'EQUITY',
            'ETF',
            'MUTUALFUND',
            'INDEX',
            'FUTURE',
            'CRYPTOCURRENCY',
        ]);

        const assets = (result.quotes || [])
            .filter((quote) => {
                return (
                    quote.isYahooFinance !== false &&
                    allowedTypes.has(quote.quoteType)
                );
            })
            .slice(0, 10)
            .map((quote) => ({
                symbol: quote.symbol,
                name:
                    quote.shortname ||
                    quote.longname ||
                    quote.symbol,
                exchange:
                    quote.exchDisp ||
                    quote.exchange ||
                    'GLOBAL',
                assetType: quote.quoteType,
            }));

        return res.json({
            success: true,
            data: assets,
        });
    } catch (error) {
        console.error('[ASSET SEARCH ERROR]', error);

        return res.status(500).json({
            success: false,
            error: 'Asset search failed',
        });
    }
});


/*
 * Get asset details
 *
 * GET /api/assets/AAPL
 */
router.get('/assets/:symbol', verifyCRFTToken, async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();

    try {
        const quote = await yahooFinance.quote(symbol);

        if (!quote) {
            return res.status(404).json({
                success: false,
                error: `Asset ${symbol} not found`,
            });
        }

        return res.json({
            success: true,
            data: {
                symbol: quote.symbol,
                name:
                    quote.shortname ||
                    quote.longname ||
                    quote.symbol,
                price:
                    quote.regularMarketPrice ??
                    quote.postMarketPrice ??
                    null,
                currency: quote.currency || 'USD',
                exchange:
                    quote.fullExchangeName ||
                    quote.exchange ||
                    'N/A',
                assetType: quote.quoteType || 'EQUITY',
            },
        });
    } catch (error) {
        console.error('[ASSET DETAILS ERROR]', error);

        return res.status(500).json({
            success: false,
            error: 'Could not retrieve asset',
        });
    }
});


/*
 * Add holding
 *
 * POST /api/portfolio/assets
 */
router.post('/portfolio/assets', verifyCRFTToken, async (req, res) => {
    const {
        symbol,
        assetType,
        quantity,
        purchasePrice,
        purchaseDate,
        accountType,
        notes,
    } = req.body;

    if (
        !symbol ||
        !assetType ||
        quantity === undefined ||
        purchasePrice === undefined ||
        !purchaseDate
    ) {
        return res.status(400).json({
            success: false,
            error:
                'symbol, assetType, quantity, purchasePrice, and purchaseDate are required',
        });
    }

    try {
        const normalizedSymbol = symbol.toUpperCase();

        const quote = await yahooFinance.quote(normalizedSymbol);

        if (!quote) {
            return res.status(404).json({
                success: false,
                error: 'Asset could not be verified',
            });
        }

        let portfolio = await Portfolio.findOne({
            userId: req.user._id,
        });

        if (!portfolio) {
            portfolio = await Portfolio.create({
                userId: req.user._id,
                holdings: [],
            });
        }

        portfolio.holdings.push({
            symbol: normalizedSymbol,
            name:
                quote.shortname ||
                quote.longname ||
                normalizedSymbol,
            assetType,
            quantity: Number(quantity),
            purchasePrice: Number(purchasePrice),
            purchaseDate: new Date(purchaseDate),
            accountType: accountType || 'BROKERAGE',
            notes: notes || '',
        });

        await portfolio.save();

        return res.status(201).json({
            success: true,
            message: 'Asset added',
            data: portfolio,
        });
    } catch (error) {
        console.error('[ADD ASSET ERROR]', error);

        return res.status(500).json({
            success: false,
            error: 'Could not add asset',
        });
    }
});


/*
 * Get authenticated user's portfolio
 *
 * GET /api/portfolio
 */
router.get('/portfolio', verifyCRFTToken, async (req, res) => {
    try {
        const portfolio = await Portfolio.findOne({
            userId: req.user._id,
        });

        return res.json({
            success: true,
            data: portfolio || {
                userId: req.user._id,
                holdings: [],
            },
        });
    } catch (error) {
        console.error('[GET PORTFOLIO ERROR]', error);

        return res.status(500).json({
            success: false,
            error: 'Could not retrieve portfolio',
        });
    }
});


export default router;