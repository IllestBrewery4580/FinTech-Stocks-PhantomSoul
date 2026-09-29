const jwt = require('jsonwebtoken');

const verifyCRFTToken = (req, res, next) => {
  const token = req.headers['x-crft-token'] || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'CRFT token required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'PHANTOM_SOUL_SUPER_SECRET_KEY');
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { verifyCRFTToken };
