import express from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import {
  generateAccessToken,
  verifyAccessToken,
} from "../utils/tokenUtils.js";

const router = express.Router();

const MIN_PASSWORD_LENGTH = 12;

function publicUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    verified: user.isEmailVerified,
  };
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: "Database is unavailable.",
      });
    }

    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body.password === "string"
        ? req.body.password
        : "";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required.",
      });
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json({
        success: false,
        error: "Enter a valid email address.",
      });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        success: false,
        error: "Password is too long.",
      });
    }

    const existingUser = await User.findOne({ email }).lean();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "An account with that email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Public registration always creates a client account.
    const user = await User.create({
      email,
      passwordHash,
      role: "client",
      isActive: true,
      isEmailVerified: false,
    });

    return res.status(201).json({
      success: true,
      message: "Account created.",
      data: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: "An account with that email already exists.",
      });
    }

    console.error("[AUTH REGISTER ERROR]:", error.message);

    return res.status(500).json({
      success: false,
      error: "Registration failed.",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: "Database is unavailable.",
      });
    }

    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body.password === "string"
        ? req.body.password
        : "";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email }).select(
      "+passwordHash"
    );

    if (
      !user ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: "This account is inactive.",
      });
    }

    const token = generateAccessToken(user);

    user.lastLoginAt = new Date();
    await user.save();

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      data: publicUser(user),
    });
  } catch (error) {
    console.error("[AUTH LOGIN ERROR]:", error.message);

    return res.status(500).json({
      success: false,
      error: "Login failed.",
    });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Missing authentication token.",
      });
    }

    const token = authHeader.slice("Bearer ".length).trim();

    const decoded = verifyAccessToken(token);

    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        error: "Invalid authentication token.",
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: "Database is unavailable.",
      });
    }

    const user = await User.findById(decoded.id).select(
      "-passwordHash"
    );

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "Account not found or inactive.",
      });
    }

    return res.json({
      success: true,
      data: publicUser(user),
    });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired authentication token.",
      });
    }

    console.error("[AUTH ME ERROR]:", error.message);

    return res.status(500).json({
      success: false,
      error: "Unable to retrieve account information.",
    });
  }
});

export default router;
