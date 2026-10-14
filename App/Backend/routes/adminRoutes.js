import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Every endpoint in this router requires an admin.
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/accounts>page=1&limit=25
router.get("/accounts", async (req, res, next) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                error: "Account database is unavailable.",
            });
        }

        const page = Math.max(
            1,
            Number.parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            100,
            Math.max(1, Number.parseInt(req.query.limit, 10) || 25)
        );

        const [accounts, total] = await Promise.all([
            User.find({})
                .select("_id name email role isActive createdAt updatedAt")
                .sort({ createdAt: -1, _id: 1})
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            User.countDocuments({}),
        ]);

        return res.json({
            accounts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router; 