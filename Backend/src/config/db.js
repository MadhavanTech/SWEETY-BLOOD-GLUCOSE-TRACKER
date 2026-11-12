const { Pool, types } = require('pg');
const env = require('./env');

types.setTypeParser(1082, (value) => value);

const pool = new Pool({ connectionString: env.databaseUrl });

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

module.exports = pool;
