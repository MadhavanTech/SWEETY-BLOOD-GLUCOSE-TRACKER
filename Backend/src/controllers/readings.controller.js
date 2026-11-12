const readingsService = require('../services/readings.service');
const { readingSchema, dateSchema } = require('../validators/schemas');
const AppError = require('../utils/AppError');

function parseId(value) {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new AppError('Reading not found.', 404);
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id)) {
    throw new AppError('Reading not found.', 404);
  }
  return id;
}

function parseDateQuery(value, field) {
  if (value === undefined) return undefined;
  const result = dateSchema.safeParse(value);
  if (!result.success) {
    throw new AppError(`Invalid ${field}.`, 400);
  }
  return result.data;
}

async function list(req, res) {
  const startDate = parseDateQuery(req.query.startDate, 'start date');
  const endDate = parseDateQuery(req.query.endDate, 'end date');
  if (startDate && endDate && startDate > endDate) {
    throw new AppError('End date must be on or after start date.', 400);
  }
  const readings = await readingsService.list(req.user.id, { startDate, endDate });
  return res.json({ success: true, data: { readings } });
}

async function create(req, res) {
  const input = readingSchema.parse(req.body);
  const reading = await readingsService.create(req.user.id, input);
  return res.status(201).json({ success: true, data: { reading } });
}

async function get(req, res) {
  const reading = await readingsService.get(req.user.id, parseId(req.params.id));
  return res.json({ success: true, data: { reading } });
}

async function update(req, res) {
  const input = readingSchema.parse(req.body);
  const reading = await readingsService.update(req.user.id, parseId(req.params.id), input);
  return res.json({ success: true, data: { reading } });
}

async function remove(req, res) {
  await readingsService.remove(req.user.id, parseId(req.params.id));
  return res.status(204).end();
}

module.exports = { list, get, create, update, remove };
