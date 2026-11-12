const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const env = require('../config/env');

function authenticate(req, res, next) {
  const authorization = req.get('authorization');
  const [scheme, token] = authorization ? authorization.split(' ') : [];

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Authentication is required.', 401));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const userId = Number(payload.sub);
    if (!/^[1-9]\d*$/.test(payload.sub) || !Number.isSafeInteger(userId)) {
      return next(new AppError('Authentication is required.', 401));
    }

    req.user = { id: userId };
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Authentication is required.', 401));
    }
    return next(error);
  }
}

module.exports = authenticate;
