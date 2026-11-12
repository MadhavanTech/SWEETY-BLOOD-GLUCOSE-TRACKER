const express = require('express');
const usersController = require('../controllers/users.controller');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);
router.get('/me', usersController.getProfile);
router.patch('/me', usersController.updateProfile);
router.patch('/me/password', usersController.changePassword);

module.exports = router;
