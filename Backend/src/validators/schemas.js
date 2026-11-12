const { z } = require('zod');

const isValidDate = (value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const password = z.string()
  .min(8, 'Password must be at least 8 characters long.')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must not exceed 72 bytes.');

const email = z.string().trim().email('Enter a valid email address.').max(255).transform((value) => value.toLowerCase());
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isValidDate, 'Enter a valid date.');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time.');

const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email,
  password,
});

const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: email.optional(),
}).refine((data) => Object.keys(data).length > 0, 'Provide a name or email to update.');

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

const readingSchema = z.object({
  value: z.coerce.number().finite().gt(0).lte(1000),
  date,
  time,
  category: z.enum(['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner']),
});

const reportQuerySchema = z.object({
  startDate: date,
  endDate: date,
}).refine((range) => range.startDate <= range.endDate, {
  path: ['endDate'],
  message: 'End date must be on or after start date.',
});
const dailyReportDateSchema = date;

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  readingSchema,
  reportQuerySchema,
  dailyReportDateSchema,
  dateSchema: date,
};
