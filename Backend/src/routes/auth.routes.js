const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,

  message: { success: false, message: 'Too many requests. Please try again later.' },
  handler: (req, res) => {

    res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
    
  },
});

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;
