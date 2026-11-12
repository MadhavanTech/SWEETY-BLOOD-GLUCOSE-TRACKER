const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    return res.json({
      success: true,
      data: { status: 'ok', database: 'connected' },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
