import mongoose from "mongoose";
import User from "../models/User.js";
import { verifyAccessToken } from "../utils/tokenUtils.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required.",
      });
    }

    const token = authHeader.slice("Bearer ".length).trim();

    if (!token) {
      return res.status(401).json({
        error: "Authentication required.",
      });
    }

    // Verify the signature, issuer, audience, algorithm, and expiration.
    const decoded = verifyAccessToken(token);

    if (!decoded?.id) {
      return res.status(401).json({
        error: "Invalid authentication token.",
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database is unavailable.",
      });
    }

    const user = await User.findById(decoded.id).select("-passwordHash");

    if (!user) {
      return res.status(401).json({
        error: "User account not found.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        error: "User account is inactive.",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (
      [
        "JsonWebTokenError",
        "TokenExpiredError",
        "NotBeforeError",
        "CastError",
      ].includes(error.name)
    ) {
      return res.status(401).json({
        error: "Invalid or expired authentication token.",
      });
    }

    console.error("[AUTH ERROR]:", error.message);

    return res.status(500).json({
      error: "Authentication could not be completed.",
    });
  }
};

// Preserve compatibility with existing route imports.
export const verifyCRFTToken = authenticateToken;
export default authenticateToken;
