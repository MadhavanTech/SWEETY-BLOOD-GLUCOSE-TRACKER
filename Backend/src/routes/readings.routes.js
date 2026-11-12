const express = require('express');
const readingsController = require('../controllers/readings.controller');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);
router.get('/', readingsController.list);
router.post('/', readingsController.create);
router.get('/:id', readingsController.get);
router.put('/:id', readingsController.update);
router.delete('/:id', readingsController.remove);

module.exports = router;
