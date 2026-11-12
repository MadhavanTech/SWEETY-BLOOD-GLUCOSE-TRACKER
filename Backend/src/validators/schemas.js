const { z } = require('zod');
const env = require('../config/env');
const { dateInTimeZone } = require('../utils/reportPeriods');

const isValidDate = (value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const password = z.string()
  .min(8, 'Password must be at least 8 characters long.')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must not exceed 72 bytes.');

const email = z.string({ error: 'Email is required.' })
  .trim()
  .min(1, 'Email is required.')
  .email('Enter a valid email address.')
  .max(255)
  .transform((value) => value.toLowerCase());
const date = z.string({ error: 'Date is required.' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format.')
  .refine(isValidDate, 'Enter a valid date.');
const time = z.string({ error: 'Time is required.' })
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time.');
const readingValue = z.preprocess(
  (value) => value === '' || value === null ? undefined : value,
  z.coerce.number({ error: 'Glucose value is required.' })
    .finite('Glucose value must be a whole number between 40 and 600 mg/dL.')
    .int('Glucose value must be a whole number.')
    .min(40, 'Glucose value must be at least 40 mg/dL.')
    .max(600, 'Glucose value must be no more than 600 mg/dL.'),
);

const registerSchema = z.object({
  name: z.string({ error: 'Name is required.' }).trim().min(1, 'Name is required.').max(100),
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
  value: readingValue,
  date: date.refine(
    (value) => value <= dateInTimeZone(new Date(), env.applicationTimeZone),
    'Reading date cannot be in the future.',
  ),
  time,
  category: z.enum(
    ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'],
    { error: 'Time slot is required. Choose a valid time slot.' },
  ),
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
