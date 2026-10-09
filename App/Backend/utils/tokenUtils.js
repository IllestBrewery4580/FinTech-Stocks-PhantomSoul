const jwt = require('jsonwebtoken');

// Generate a CRFT access toke for a user
const generateCRFTToken = (userId, role = 'user') => {
    return jwt.sign(
        { userId, role, tokenType: 'CRFT' },
        process.env.CRFT_SECRET || 'fallback_crft_secret_key',
        { expiresIn: '24h' }
    );
};

moduleExec.exports = { generateCRFTToken };