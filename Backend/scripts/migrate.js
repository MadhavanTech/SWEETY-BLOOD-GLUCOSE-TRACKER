const fs = require('node:fs/promises');
const path = require('node:path');

async function migrate() {
  let pool;

  try {
    pool = require('../src/config/db');
    const schema = await fs.readFile(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Migration complete.');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (pool) {
      try {
        await pool.end();
      } catch (error) {
        console.error('Failed to close the database pool:', error.message);
        process.exitCode = 1;
      }
    }
  }
}

migrate();
