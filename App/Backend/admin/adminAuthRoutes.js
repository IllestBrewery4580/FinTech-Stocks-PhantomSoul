
import express from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import { generateAccessToken } from "../utils/tokenUtils.js";

const router = express.Router();

// POST /api/admin-auth/login
// Admins must already exist in the database.
// Public signup cannot grant admin privileges.
router.post("/login", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: "Authentication service is unavailable.",
      });
    }

    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body?.password === "string"
        ? req.body.password
        : "";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email }).select("+passwordHash");

    // Use the same response for invalid credentials and non-admin accounts.
    if (
      !user ||
      user.role !== "admin" ||
      user.isActive === false ||
      !user.passwordHash
    ) {
      return res.status(401).json({
        success: false,
        error: "Invalid admin credentials.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        error: "Invalid admin credentials.",
      });
    }

    const token = generateAccessToken(user);

    user.lastLoginAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      token,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin authentication error:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to authenticate administrator.",
    });
  }
});

export default router;
