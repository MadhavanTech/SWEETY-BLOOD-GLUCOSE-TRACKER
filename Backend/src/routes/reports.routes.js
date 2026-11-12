const express = require('express');
const reportsController = require('../controllers/reports.controller');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.get('/daily', authenticate, reportsController.getDailyReport);
router.get('/month-to-date', authenticate, reportsController.getMonthToDateReport);
router.get('/previous-month', authenticate, reportsController.getPreviousMonthReport);
router.get('/', authenticate, reportsController.getReport);

module.exports = router;
