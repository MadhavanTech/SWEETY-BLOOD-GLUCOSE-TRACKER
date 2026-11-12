jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  on: jest.fn(),
}));

const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const pool = require('../src/config/db');
const env = require('../src/config/env');
const reportPeriods = require('../src/utils/reportPeriods');

const tokenFor = (id = 7) => jwt.sign({}, env.jwtSecret, {
  subject: String(id),
  expiresIn: '5m',
});

const futureDate = () => {
  const date = new Date(`${reportPeriods.dateInTimeZone(new Date(), env.applicationTimeZone)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};

const validReading = {
  date: reportPeriods.dateInTimeZone(new Date(), env.applicationTimeZone),
  time: '08:30',
  category: 'morning_fasting',
  value: 108,
};

beforeEach(() => {
  pool.query.mockReset();
});

describe('authentication API', () => {
  test('registers a user without returning the password hash', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 7, name: 'Test Person', email: 'test@example.com', created_at: new Date() }],
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test Person', email: 'TEST@example.com', password: 'password123' });

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe('test@example.com');
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.user.password_hash).toBeUndefined();
    expect(pool.query.mock.calls[0][1][1]).toBe('test@example.com');
    expect(await bcrypt.compare('password123', pool.query.mock.calls[0][1][2])).toBe(true);
    expect(pool.query.mock.calls[0][1][2]).not.toBe('password123');
  });

  test('logs in with a hashed password and returns an access token', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 7,
        name: 'Test Person',
        email: 'test@example.com',
        password_hash: passwordHash,
        created_at: new Date(),
      }],
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'TEST@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.user.password_hash).toBeUndefined();
    expect(pool.query.mock.calls[0][1]).toEqual(['test@example.com']);
  });

  test('rejects invalid credentials without disclosing which field was wrong', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'missing@example.com', password: 'password123' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Email or password is incorrect.');
  });

  test('returns the authenticated user without exposing password data', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 7, name: 'Test Person', email: 'test@example.com', created_at: new Date() }],
    });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe('test@example.com');
    expect(pool.query.mock.calls[0][1]).toEqual([7]);
  });
});

describe('glucose readings API', () => {
  test('requires a valid bearer token', async () => {
    const response = await request(app).get('/api/readings');
    expect(response.status).toBe(401);
  });

  test('returns a normalized ISO date when listing readings', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 21,
        reading_date: validReading.date,
        reading_time: '08:30:00',
        measurement_category: 'morning_fasting',
        glucose_value: '108',
        created_at: new Date(),
        updated_at: new Date(),
      }],
    });

    const response = await request(app)
      .get('/api/readings')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.readings[0].date).toBe(validReading.date);
    expect(response.body.data.readings[0].time).toBe('08:30');
  });

  test('creates an authenticated reading using parameterized values', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ daily_count: 0, slot_count: 0 }] })
      .mockResolvedValueOnce({
      rows: [{
        id: 21,
        reading_date: validReading.date,
        reading_time: '08:30:00',
        measurement_category: 'morning_fasting',
        glucose_value: '108',
        created_at: new Date(),
        updated_at: new Date(),
      }],
      });

    const response = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validReading);

    expect(response.status).toBe(201);
    expect(response.body.data.reading.value).toBe(108);
    expect(response.body.data.reading.slot).toBe('Morning (Fasting)');
    expect(pool.query.mock.calls[1][0]).toContain('$1');
    expect(pool.query.mock.calls[1][1]).toEqual([7, 108, 'morning_fasting', validReading.date, '08:30']);
  });

  test.each([
    [39, 'at least 40'],
    [601, 'no more than 600'],
    [108.5, 'whole number'],
  ])('rejects invalid glucose value %s', async (value, message) => {
    const response = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({ ...validReading, value });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(message);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test.each([40, 600])('accepts inclusive glucose boundary %s mg/dL', async (value) => {
    pool.query.mockResolvedValueOnce({ rows: [{ daily_count: 0, slot_count: 0 }] })
      .mockResolvedValueOnce({
        rows: [{
          id: 21,
          reading_date: validReading.date,
          reading_time: validReading.time,
          measurement_category: validReading.category,
          glucose_value: String(value),
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

    const response = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({ ...validReading, value });

    expect(response.status).toBe(201);
    expect(response.body.data.reading.value).toBe(value);
  });

  test('rejects missing required reading fields with clear messages', async () => {
    const response = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Glucose value is required.');
    expect(response.body.message).toContain('Date is required.');
    expect(response.body.message).toContain('Time is required.');
    expect(response.body.message).toContain('Time slot is required.');
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('rejects future reading dates', async () => {
    const response = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({ ...validReading, date: futureDate() });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Reading date cannot be in the future.');
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('rejects impossible calendar dates', async () => {
    const response = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({ ...validReading, date: '2026-02-30' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Enter a valid date.');
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('rejects duplicate time slots for a user and date', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ daily_count: 1, slot_count: 1 }] });

    const response = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validReading);

    expect(response.status).toBe(409);
    expect(response.body.message).toContain('already exists for this time slot');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  test('returns a conflict if the database detects a concurrent duplicate', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ daily_count: 0, slot_count: 0 }] })
      .mockRejectedValueOnce(Object.assign(new Error('duplicate slot'), {
        code: '23514',
        constraint: 'glucose_readings_duplicate_slot',
      }));

    const response = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validReading);

    expect(response.status).toBe(409);
    expect(response.body.message).toContain('already exists for this time slot');
  });

  test('rejects a fifth reading on the same day', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ daily_count: 4, slot_count: 0 }] });

    const response = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({ ...validReading, category: 'after_dinner' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('No more than four readings');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  test('updates only the authenticated user reading and excludes it from day limits', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 21,
        reading_date: validReading.date,
        reading_time: '08:30:00',
        measurement_category: 'morning_fasting',
        glucose_value: '108',
        created_at: new Date(),
        updated_at: new Date(),
      }],
    })
      .mockResolvedValueOnce({ rows: [{ daily_count: 3, slot_count: 0 }] })
      .mockResolvedValueOnce({
        rows: [{
          id: 21,
          reading_date: validReading.date,
          reading_time: '09:00:00',
          measurement_category: 'after_breakfast',
          glucose_value: '110',
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

    const response = await request(app)
      .put('/api/readings/21')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({ ...validReading, category: 'after_breakfast', time: '09:00', value: 110 });

    expect(response.status).toBe(200);
    expect(response.body.data.reading.value).toBe(110);
    expect(pool.query.mock.calls[0][1]).toEqual([21, 7]);
    expect(pool.query.mock.calls[1][1]).toEqual([7, validReading.date, 'after_breakfast', 21]);
    expect(pool.query.mock.calls[2][1]).toEqual([110, 'after_breakfast', validReading.date, '09:00', 21, 7]);
    expect(pool.query.mock.calls[2][0]).toContain('WHERE id = $5 AND user_id = $6');
  });

  test('deletes only the authenticated user reading', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const response = await request(app)
      .delete('/api/readings/21')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).toBe(204);
    expect(pool.query.mock.calls[0][1]).toEqual([21, 7]);
    expect(pool.query.mock.calls[0][0]).toContain('WHERE id = $1 AND user_id = $2');
  });

  test('does not expose another user reading during an update or deletion', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const updateResponse = await request(app)
      .put('/api/readings/99')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validReading);
    const deleteResponse = await request(app)
      .delete('/api/readings/99')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
    expect(pool.query.mock.calls[0][1]).toEqual([99, 7]);
    expect(pool.query.mock.calls[1][1]).toEqual([99, 7]);
  });
});

describe('health API', () => {
  test('returns a sanitized unavailable response when the database is missing', async () => {
    pool.query.mockRejectedValueOnce(Object.assign(new Error('database connection detail'), { code: '3D000' }));

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      message: 'The configured database is unavailable.',
    });
  });
});

describe('account endpoint', () => {
  test('checks the current password before storing a new password', async () => {
    const passwordHash = await bcrypt.hash('oldpassword123', 4);
    pool.query
      .mockResolvedValueOnce({ rows: [{ password_hash: passwordHash }] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const response = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({ currentPassword: 'oldpassword123', newPassword: 'newpassword123' });

    expect(response.status).toBe(200);
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(pool.query.mock.calls[1][1][0]).not.toBe('newpassword123');
  });
});

describe('report API', () => {
  test('returns a daily report using the authenticated user and actual reading rows', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 21,
          reading_date: '2026-11-12',
          reading_time: '07:30:00',
          measurement_category: 'morning_fasting',
          glucose_value: '98.0',
          total_readings: '2',
          average: '112.0',
          highest: '126.0',
          lowest: '98.0',
        },
        {
          id: 22,
          reading_date: '2026-11-12',
          reading_time: '12:00:00',
          measurement_category: 'after_breakfast',
          glucose_value: '126.0',
          total_readings: '2',
          average: '112.0',
          highest: '126.0',
          lowest: '98.0',
        },
      ],
    });

    const response = await request(app)
      .get('/api/reports/daily?date=2026-11-12&user_id=999')
      .set('Authorization', `Bearer ${tokenFor(7)}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      reportType: 'daily',
      period: { startDate: '2026-11-12', endDate: '2026-11-12' },
      summary: { highest: 126, lowest: 98, average: 112, totalReadings: 2 },
      readings: [
        {
          id: 21,
          reading_date: '2026-11-12',
          reading_time: '07:30',
          measurement_category: 'morning_fasting',
          glucose_value: 98,
        },
        {
          id: 22,
          reading_date: '2026-11-12',
          reading_time: '12:00',
          measurement_category: 'after_breakfast',
          glucose_value: 126,
        },
      ],
    });
    expect(pool.query.mock.calls[0][1]).toEqual([7, '2026-11-12', '2026-11-12']);
    expect(pool.query.mock.calls[0][0]).toContain('WHERE user_id = $1');
  });

  test('returns an empty month-to-date report with the configured timezone period', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const today = reportPeriods.dateInTimeZone(new Date(), env.applicationTimeZone);

    const response = await request(app)
      .get('/api/reports/month-to-date')
      .set('Authorization', `Bearer ${tokenFor(7)}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      reportType: 'month-to-date',
      period: {
        startDate: `${today.slice(0, 7)}-01`,
        endDate: today,
      },
      summary: { highest: null, lowest: null, average: null, totalReadings: 0 },
      readings: [],
    });

    expect(pool.query.mock.calls[0][1]).toEqual([
      7,
      `${today.slice(0, 7)}-01`,
      today,
    ]);
  });

  test('returns an empty daily report with a zero-count summary', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .get('/api/reports/daily?date=2026-11-12')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      reportType: 'daily',
      period: { startDate: '2026-11-12', endDate: '2026-11-12' },
      summary: { highest: null, lowest: null, average: null, totalReadings: 0 },
      readings: [],
    });
  });

  test('returns the previous calendar month, including year and leap-day boundaries', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    expect(reportPeriods.getPreviousMonthPeriod('2026-01-12')).toEqual({
      startDate: '2025-12-01',
      endDate: '2025-12-31',
    });
    expect(reportPeriods.getPreviousMonthPeriod('2024-03-12')).toEqual({
      startDate: '2024-02-01',
      endDate: '2024-02-29',
    });

    const today = reportPeriods.dateInTimeZone(new Date(), env.applicationTimeZone);
    const expectedPeriod = reportPeriods.getPreviousMonthPeriod(today);
    const response = await request(app)
      .get('/api/reports/previous-month')
      .set('Authorization', `Bearer ${tokenFor(7)}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      reportType: 'previous-month',
      period: expectedPeriod,
      summary: { highest: null, lowest: null, average: null, totalReadings: 0 },
      readings: [],
    });
    expect(pool.query.mock.calls[0][1]).toEqual([
      7,
      expectedPeriod.startDate,
      expectedPeriod.endDate,
    ]);
  });

  test('rejects invalid daily dates and unauthenticated requests without querying data', async () => {
    const invalidDateResponse = await request(app)
      .get('/api/reports/daily?date=2026-02-30')
      .set('Authorization', `Bearer ${tokenFor(7)}`);
    const unauthenticatedResponse = await request(app)
      .get('/api/reports/previous-month');

    expect(invalidDateResponse.status).toBe(400);
    expect(unauthenticatedResponse.status).toBe(401);
    expect(pool.query).not.toHaveBeenCalled();
  });
});
