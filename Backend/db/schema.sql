CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS glucose_readings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  glucose_value NUMERIC(5, 1) NOT NULL CHECK (glucose_value > 0 AND glucose_value <= 1000),
  measurement_category VARCHAR(30) NOT NULL CHECK (
    measurement_category IN ('morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner')
  ),
  reading_date DATE NOT NULL,
  reading_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_glucose_readings_user_date_time
  ON glucose_readings (user_id, reading_date DESC, reading_time DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS glucose_readings_set_updated_at ON glucose_readings;
CREATE TRIGGER glucose_readings_set_updated_at
  BEFORE UPDATE ON glucose_readings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
