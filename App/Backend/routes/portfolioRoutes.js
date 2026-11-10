import express from "express";
import mongoose from "mongoose";
import YahooFinance from "yahoo-finance2";
import Portfolio from "../models/Portfolio.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { recordAudit } from "../utils/auditLogger.js";

const router = express.Router();
const yahooFinance = new YahooFinance();

const ALLOWED_ASSET_TYPES = [
  "EQUITY", "ETF", "MUTUAL_FUND", "BOND", "TREASURY",
  "CRYPTO", "CASH", "REAL_ESTATE", "RETIREMENT_ACCOUNT",
  "ALTERNATIVE", "OTHER",
];

const ALLOWED_ACCOUNT_TYPES = [
  "BROKERAGE", "RETIREMENT", "401K", "IRA",
  "ROTH_IRA", "BANK", "OTHER",
];

router.use(authenticateToken);

function getUserId(req) {
  return req.user?._id ?? req.user?.id ?? null;
}

function databaseUnavailable(res) {
  if (mongoose.connection.readyState === 1) return false;

  res.status(503).json({
    success: false,
    error: "Database temporarily unavailable.",
  });
  return true;
}

function validSymbol(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 20 &&
    /^[A-Za-z0-9.^=_-]+$/.test(value.trim())
  );
}

function validPositiveNumber(value) {
  return value !== null && value !== undefined && value !== "" &&
    Number.isFinite(Number(value)) && Number(value) > 0;
}

function validNonNegativeNumber(value) {
  return value !== null && value !== undefined && value !== "" &&
    Number.isFinite(Number(value)) && Number(value) >= 0;
}

function assetName(quote) {
  return quote.shortname || quote.longname || quote.symbol || "Unknown asset";
}

function normalizeAssetType(type) {
  switch (type) {
    case "EQUITY": return "EQUITY";
    case "ETF": return "ETF";
    case "MUTUALFUND": return "MUTUAL_FUND";
    case "CRYPTOCURRENCY": return "CRYPTO";
    default: return "OTHER";
  }
}

// GET /api/assets/search?q=apple
router.get("/assets/search", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  if (q.length > 100) {
    return res.status(400).json({
      success: false,
      error: "Search query is too long.",
    });
  }

  if (!q) return res.json({ success: true, data: [] });

  try {
    const result = await yahooFinance.search(q);
    const supportedTypes = new Set([
      "EQUITY", "ETF", "MUTUALFUND", "INDEX", "FUTURE",
      "CRYPTOCURRENCY",
    ]);

    const data = (result.quotes || [])
      .filter((quote) =>
        quote.isYahooFinance !== false &&
        supportedTypes.has(quote.quoteType)
      )
      .slice(0, 10)
      .map((quote) => ({
        symbol: quote.symbol,
        name: assetName(quote),
        exchange: quote.exchDisp || quote.exchange || "GLOBAL",
        assetType: normalizeAssetType(quote.quoteType),
        source: "YAHOO_FINANCE",
      }));

    await recordAudit({
      userId: getUserId(req),
      action: "ASSET_SEARCH",
      resource: q,
      ipAddress: req.ip,
      details: `Asset search performed for "${q}"`,
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("[ASSET SEARCH ERROR]:", error.message);
    return res.status(502).json({
      success: false,
      error: "Asset search service is temporarily unavailable.",
    });
  }
});

// GET /api/assets/:symbol
router.get("/assets/:symbol", async (req, res) => {
  const rawSymbol = req.params.symbol;

  if (!validSymbol(rawSymbol)) {
    return res.status(400).json({
      success: false,
      error: "Invalid asset symbol.",
    });
  }

  const symbol = rawSymbol.trim().toUpperCase();

  try {
    const quote = await yahooFinance.quote(symbol);

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: `Asset '${symbol}' not found.`,
      });
    }

    const data = {
      symbol: quote.symbol,
      name: assetName(quote),
      price: quote.regularMarketPrice ?? quote.postMarketPrice ?? null,
      currency: quote.currency || "USD",
      exchange: quote.fullExchangeName || quote.exchange || "N/A",
      assetType: normalizeAssetType(quote.quoteType),
      fiftyDayAverage: quote.fiftyDayAverage ?? null,
      twoHundredDayAverage: quote.twoHundredDayAverage ?? null,
    };

    await recordAudit({
      userId: getUserId(req),
      action: "ASSET_VIEWED",
      resource: symbol,
      ipAddress: req.ip,
      details: "Asset quote retrieved",
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("[ASSET QUOTE ERROR]:", error.message);
    return res.status(502).json({
      success: false,
      error: "Asset quote service is temporarily unavailable.",
    });
  }
});

// POST /api/portfolio/assets
router.post("/portfolio/assets", async (req, res) => {
  if (databaseUnavailable(res)) return;

  const body = req.body ?? {};
  const symbol = typeof body.symbol === "string"
    ? body.symbol.trim().toUpperCase() : "";
  const assetType = typeof body.assetType === "string"
    ? body.assetType.trim().toUpperCase() : "";
  const accountType = typeof body.accountType === "string"
    ? body.accountType.trim().toUpperCase() : "BROKERAGE";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const { quantity, purchasePrice, purchaseDate, notes } = body;

  if (!validSymbol(symbol)) {
    return res.status(400).json({
      success: false,
      error: "Invalid asset symbol.",
    });
  }

  if (!ALLOWED_ASSET_TYPES.includes(assetType)) {
    return res.status(400).json({
      success: false,
      error: "Invalid asset type.",
      allowedValues: ALLOWED_ASSET_TYPES,
    });
  }

  if (!ALLOWED_ACCOUNT_TYPES.includes(accountType)) {
    return res.status(400).json({
      success: false,
      error: "Invalid account type.",
      allowedValues: ALLOWED_ACCOUNT_TYPES,
    });
  }

  if (!validPositiveNumber(quantity) || !validNonNegativeNumber(purchasePrice)) {
    return res.status(400).json({
      success: false,
      error: "Quantity must be positive and purchase price must be non-negative.",
    });
  }

  if (name.length > 200) {
    return res.status(400).json({
      success: false,
      error: "Asset name cannot exceed 200 characters.",
    });
  }

  if (notes !== undefined &&
      (typeof notes !== "string" || notes.length > 2000)) {
    return res.status(400).json({
      success: false,
      error: "Notes must be text no longer than 2000 characters.",
    });
  }

  if (typeof purchaseDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) {
    return res.status(400).json({
      success: false,
      error: "Purchase date must use YYYY-MM-DD format.",
    });
  }

  const parsedDate = new Date(`${purchaseDate}T00:00:00.000Z`);
  const today = new Date().toISOString().slice(0, 10);

  if (Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== purchaseDate ||
      purchaseDate > today) {
    return res.status(400).json({
      success: false,
      error: "Purchase date must be valid and cannot be in the future.",
    });
  }

  const userId = getUserId(req);

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({
      success: false,
      error: "Authenticated user ID is invalid.",
    });
  }

  try {
    const quote = await yahooFinance.quote(symbol);

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: `Asset '${symbol}' could not be verified.`,
      });
    }

    let portfolio = await Portfolio.findOne({ userId });

    if (!portfolio) {
      portfolio = new Portfolio({ userId, holdings: [] });
    }

    portfolio.holdings.push({
      symbol,
      name: name || assetName(quote),
      assetType,
      quantity: Number(quantity),
      purchasePrice: Number(purchasePrice),
      purchaseDate: parsedDate,
      accountType,
      notes: typeof notes === "string" ? notes.trim() : "",
    });

    await portfolio.save();

    await recordAudit({
      userId,
      action: "PORTFOLIO_ASSET_ADDED",
      resource: symbol,
      ipAddress: req.ip,
      details: JSON.stringify({
        assetType,
        quantity: Number(quantity),
        purchasePrice: Number(purchasePrice),
      }),
    });

    return res.status(201).json({
      success: true,
      message: "Asset added to portfolio.",
      data: portfolio,
    });
  } catch (error) {
    console.error("[PORTFOLIO ADD ERROR]:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to add asset to portfolio.",
    });
  }
});

// GET /api/portfolio
router.get("/portfolio", async (req, res) => {
  if (databaseUnavailable(res)) return;

  const userId = getUserId(req);

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({
      success: false,
      error: "Authenticated user ID is invalid.",
    });
  }

  try {
    const portfolio = await Portfolio.findOne({ userId }).lean();

    return res.json({
      success: true,
      data: portfolio || { userId, holdings: [] },
    });
  } catch (error) {
    console.error("[PORTFOLIO GET ERROR]:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve portfolio.",
    });
  }
});

export default router;
