const jwt = require('jsonwebtoken');

const generateCRFTToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'PHANTOM_SOUL_SUPER_SECRET_KEY',
    { expiresIn: '8h' }
  );
};

module.exports = { generateCRFTToken };
