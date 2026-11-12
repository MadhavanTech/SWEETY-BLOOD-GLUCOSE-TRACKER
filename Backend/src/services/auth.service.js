const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const SALT_ROUNDS = 12;

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
  };
}

function createToken(user) {
  return jwt.sign({}, env.jwtSecret, {
    subject: String(user.id),
    expiresIn: env.jwtExpiresIn,
  });
}

async function register({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, passwordHash],
  );
  const user = rows[0];
  return { user: publicUser(user), token: createToken(user) };
}

async function login({ email, password }) {
  const { rows } = await pool.query(
    'SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1',
    [email],
  );
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError('Email or password is incorrect.', 401);
  }

  return { user: publicUser(user), token: createToken(user) };
}

async function getUser(userId) {
  const { rows } = await pool.query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [userId],
  );
  if (!rows[0]) {
    throw new AppError('User not found.', 404);
  }
  return publicUser(rows[0]);
}

async function updateProfile(userId, changes) {
  const fields = [];
  const values = [];

  if (changes.name !== undefined) {
    values.push(changes.name);
    fields.push(`name = $${values.length}`);
  }
  if (changes.email !== undefined) {
    values.push(changes.email);
    fields.push(`email = $${values.length}`);
  }
  values.push(userId);

  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(', ')}
     WHERE id = $${values.length}
     RETURNING id, name, email, created_at`,
    values,
  );
  if (!rows[0]) {
    throw new AppError('User not found.', 404);
  }
  return publicUser(rows[0]);
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const { rows } = await pool.query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId],
  );
  if (!rows[0]) {
    throw new AppError('User not found.', 404);
  }
  if (!(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
    throw new AppError('Current password is incorrect.', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
}

module.exports = { register, login, getUser, updateProfile, changePassword };
