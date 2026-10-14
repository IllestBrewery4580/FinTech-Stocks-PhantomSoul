
import User from "../models/User.js";

import { verifyAccessToken } from '../utils/tokenUtils.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const token = authHeader.slice("Bearer ".length).trim();

    if (!token) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      console.error("[AUTH ERROR]: JWT_SECRET is missing or too short.");

      return res.status(500).json({
        error: "Authentication service is not configured",
      });
    }


    if (!decoded.id) {
      return res.status(401).json({
        error: "Invalid authentication token",
      });
    }

    const user = await User.findById(decoded.id).select("-passwordHash");

    if (!user) {
      return res.status(401).json({
        error: "User account not found",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        error: "User account is inactive",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name !== "JsonWebTokenError" &&
        error.name !== "TokenExpiredError" &&
        error.name !== "CastError") {
      console.error("[AUTH ERROR]:", error.message);
    }

    return res.status(401).json({
      error: "Invalid or expired authentication token",
    });
  }
};

// Backward-compatible name for existing route imports.
export const verifyCRFTToken = authenticateToken;

export default authenticateToken;
