import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const verifyCRFTToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        error: 'User account not found',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'User account is inactive',
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error('[AUTH ERROR]:', error.message);

    return res.status(401).json({
      error: 'Invalid or expired authentication token',
    });
  }
};
