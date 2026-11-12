const dotenv = require('dotenv');

dotenv.config();

const requiredVariables = ['DATABASE_URL', 'JWT_SECRET', 'CLIENT_URL'];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);
const applicationTimeZone = process.env.APP_TIME_ZONE
  || Intl.DateTimeFormat().resolvedOptions().timeZone
  || 'UTC';

new Intl.DateTimeFormat('en-US', { timeZone: applicationTimeZone });

if (missingVariables.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`);
}

module.exports = {
  port: Number.parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  clientUrl: process.env.CLIENT_URL,
  applicationTimeZone,
};
