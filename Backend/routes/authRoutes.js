import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Temporary in-memory user store.
// Replace this with your database/User model once persistence is connected.
const users = [];

const JWT_SECRET = process.env.JWT_SECRET || 'phantom-soul-dev-secret';

// -------------------------
// POST /api/auth/register
// -------------------------
router.post('/register', async (req, res) => {
  try {
    const { email, password, role = 'CLIENT' } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters.'
      });
    }

    const existingUser = users.find(
      (user) => user.email === normalizedEmail
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with that email already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = {
      id: users.length + 1,
      email: normalizedEmail,
      passwordHash,
      role,
      verified: false,
      createdAt: new Date().toISOString()
    };

    users.push(user);

    return res.status(201).json({
      success: true,
      message: 'Account created.',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (error) {
    console.error('[AUTH REGISTER ERROR]:', error);

    return res.status(500).json({
      success: false,
      error: 'Registration failed.'
    });
  }
});

// -------------------------
// POST /api/auth/login
// -------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = users.find(
      (candidate) => candidate.email === normalizedEmail
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: '8h'
      }
    );

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (error) {
    console.error('[AUTH LOGIN ERROR]:', error);

    return res.status(500).json({
      success: false,
      error: 'Login failed.'
    });
  }
});

// -------------------------
// GET /api/auth/me
// -------------------------
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing authentication token.'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    return res.json({
      success: true,
      data: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token.'
    });
  }
});

export default router;
