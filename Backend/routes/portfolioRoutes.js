import express from 'express';
import YahooFinance from 'yahoo-finance2';

import Portfolio from '../models/Portfolio.js';
import { verifyCRFTToken } from '../middleware/authMiddleware.js';
import { recordAudit } from '../utils/auditLogger.js';

const router = express.Router();
const yahooFinance = new YahooFinance();

/*
 * GET /api/assets/search?q=apple
 *
 * Searches public securities.
 */
router.get('/assets/search', verifyCRFTToken, async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim().length < 1) {
        return res.json({
            success: true,
            data: [],
        });
    }

    try {
        const searchResult = await yahooFinance.search(q.trim());

        const allowedTypes = new Set([
            'EQUITY',
            'ETF',
            'MUTUALFUND',
            'INDEX',
            'FUTURE',
            'CRYPTOCURRENCY',
        ]);

        const results = (searchResult.quotes || [])
            .filter(
                (quote) =>
                    quote.isYahooFinance !== false &&
                    allowedTypes.has(quote.quoteType)
            )
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
                source: 'YAHOO_FINANCE',
            }));

        await recordAudit({
            userId: req.user._id,
            action: 'ASSET_SEARCH',
            resource: q.trim(),
            ipAddress: req.ip,
            details: `Asset search performed for "${q.trim()}"`,
        });

        return res.json({
            success: true,
            data: results,
        });
    } catch (error) {
        console.error('[ASSET SEARCH ERROR]:', error.message);

        return res.status(500).json({
            success: false,
            error: 'Failed to search for assets',
        });
    }
});


/*
 * GET /api/assets/:symbol
 *
 * Gets detailed information about one asset.
 */
router.get('/assets/:symbol', verifyCRFTToken, async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();

    try {
        const quote = await yahooFinance.quote(symbol);

        if (!quote) {
            return res.status(404).json({
                success: false,
                error: `Asset '${symbol}' not found`,
            });
        }

        const asset = {
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
            fiftyDayAverage:
                quote.fiftyDayAverage ?? null,
            twoHundredDayAverage:
                quote.twoHundredDayAverage ?? null,
        };

        await recordAudit({
            userId: req.user._id,
            action: 'ASSET_VIEWED',
            resource: symbol,
            ipAddress: req.ip,
        });

        return res.json({
            success: true,
            data: asset,
        });
    } catch (error) {
        console.error('[ASSET QUOTE ERROR]:', error.message);

        return res.status(500).json({
            success: false,
            error: 'Failed to retrieve asset',
        });
    }
});


/*
 * POST /api/portfolio/assets
 *
 * Adds an asset to the authenticated client's portfolio.
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

    if (Number(quantity) < 0 || Number(purchasePrice) < 0) {
        return res.status(400).json({
            success: false,
            error: 'Quantity and purchase price cannot be negative',
        });
    }

    try {
        const normalizedSymbol = symbol.toUpperCase();

        const quote = await yahooFinance.quote(normalizedSymbol);

        if (!quote) {
            return res.status(404).json({
                success: false,
                error: `Asset '${normalizedSymbol}' could not be verified`,
            });
        }

        const assetName =
            quote.shortname ||
            quote.longname ||
            normalizedSymbol;

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
            name: assetName,
            assetType,
            quantity: Number(quantity),
            purchasePrice: Number(purchasePrice),
            purchaseDate: new Date(purchaseDate),
            accountType: accountType || 'BROKERAGE',
            notes: notes || '',
        });

        await portfolio.save();

        await recordAudit({
            userId: req.user._id,
            action: 'PORTFOLIO_ASSET_ADDED',
            resource: normalizedSymbol,
            ipAddress: req.ip,
            details: `Added ${quantity} shares/units of ${normalizedSymbol}`,
        });

        return res.status(201).json({
            success: true,
            message: 'Asset added to portfolio',
            data: portfolio,
        });
    } catch (error) {
        console.error('[PORTFOLIO ADD ERROR]:', error.message);

        return res.status(500).json({
            success: false,
            error: 'Failed to add asset to portfolio',
        });
    }
});


/*
 * GET /api/portfolio
 *
 * Returns ONLY the authenticated user's portfolio.
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
        console.error('[PORTFOLIO GET ERROR]:', error.message);

        return res.status(500).json({
            success: false,
            error: 'Failed to retrieve portfolio',
        });
    }
});


export default router;
