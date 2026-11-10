import jwt from 'jsonwebtoken';

const ISSUER = 'phantom-soul';
const AUDIENCE = 'phantom-soul-app';
const ACCESS_TOKEN_TTL = '15m';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (
    typeof secret !== 'string' ||
    secret.length < 32
  ) {
    throw new Error(
      'JWT_SECRET must be configured with at least 32 characters.'
    );
  }

  return secret;
}

export function generateAccessToken(user) {
  if (!user?._id || !user?.role) {
    throw new Error('A valid user ID and role are required.');
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    getJwtSecret(),
    {
      expiresIn: ACCESS_TOKEN_TTL,
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithm: 'HS256',
    }
  );
}

export function verifyAccessToken(token) {
  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('A token is required.');
  }

  return jwt.verify(token, getJwtSecret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: ['HS256'],
  });
}
