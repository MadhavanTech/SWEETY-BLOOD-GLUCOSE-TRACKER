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
  });

  test('rejects invalid credentials without disclosing which field was wrong', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'missing@example.com', password: 'password123' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Email or password is incorrect.');
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
        reading_date: '2026-11-12',
        reading_time: '08:30:00',
        measurement_category: 'morning_fasting',
        glucose_value: '108.5',
        created_at: new Date(),
        updated_at: new Date(),
      }],
    });

    const response = await request(app)
      .get('/api/readings')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.readings[0].date).toBe('2026-11-12');
    expect(response.body.data.readings[0].time).toBe('08:30');
  });

  test('creates an authenticated reading using parameterized values', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 21,
        reading_date: '2026-11-12',
        reading_time: '08:30:00',
        measurement_category: 'morning_fasting',
        glucose_value: '108.5',
        created_at: new Date(),
        updated_at: new Date(),
      }],
    });

    const response = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({
        date: '2026-11-12',
        time: '08:30',
        category: 'morning_fasting',
        value: 108.5,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.reading.value).toBe(108.5);
    expect(response.body.data.reading.slot).toBe('Morning (Fasting)');
    expect(pool.query.mock.calls[0][0]).toContain('$1');
    expect(pool.query.mock.calls[0][1]).toEqual([7, 108.5, 'morning_fasting', '2026-11-12', '08:30']);
  });

  test('rejects out-of-range glucose measurements', async () => {
    const response = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send({
        date: '2026-11-12',
        time: '08:30',
        category: 'morning_fasting',
        value: 0,
      });

    expect(response.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
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
