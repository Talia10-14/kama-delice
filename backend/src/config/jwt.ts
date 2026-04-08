/**
 * Configuration JWT
 */

export const jwtConfig = {
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

// Vérifier que les secrets sont configurés en production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT secrets must be configured in production!');
  }
}

/**
 * Vérifier que les secrets sont configurés
 */
if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 32
) {
  console.warn(
    '⚠️  JWT_SECRET should be at least 32 characters for security'
  );
}

if (
  !process.env.JWT_REFRESH_SECRET ||
  process.env.JWT_REFRESH_SECRET.length < 32
) {
  console.warn(
    '⚠️  JWT_REFRESH_SECRET should be at least 32 characters for security'
  );
}
