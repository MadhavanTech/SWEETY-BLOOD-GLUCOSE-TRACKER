const authService = require('../services/auth.service');
const { registerSchema, loginSchema } = require('../validators/schemas');

async function register(req, res) {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);
  return res.status(201).json({ success: true, data: result });
}

async function login(req, res) {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  return res.json({ success: true, data: result });
}

async function me(req, res) {
  const user = await authService.getUser(req.user.id);
  return res.json({ success: true, data: { user } });
}

module.exports = { register, login, me };
