const authService = require('../services/auth.service');
const { updateProfileSchema, changePasswordSchema } = require('../validators/schemas');

async function getProfile(req, res) {
  const user = await authService.getUser(req.user.id);
  return res.json({ success: true, data: { user } });
}

async function updateProfile(req, res) {
  const input = updateProfileSchema.parse(req.body);
  const user = await authService.updateProfile(req.user.id, input);
  return res.json({ success: true, data: { user } });
}

async function changePassword(req, res) {
  const input = changePasswordSchema.parse(req.body);
  await authService.changePassword(req.user.id, input);
  return res.json({ success: true, message: 'Password updated.' });
}

module.exports = { getProfile, updateProfile, changePassword };
