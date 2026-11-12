CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS glucose_readings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  glucose_value NUMERIC(5, 1) NOT NULL CONSTRAINT glucose_readings_value_range_check
    CHECK (glucose_value >= 40 AND glucose_value <= 600 AND glucose_value = TRUNC(glucose_value)),
  measurement_category VARCHAR(30) NOT NULL CHECK (
    measurement_category IN ('morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner')
  ),
  reading_date DATE NOT NULL,
  reading_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT glucose_readings_user_date_category_key
    UNIQUE (user_id, reading_date, measurement_category)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'glucose_readings_value_range_check'
      AND conrelid = 'glucose_readings'::regclass
  ) THEN
    ALTER TABLE glucose_readings
      ADD CONSTRAINT glucose_readings_value_range_check
      CHECK (glucose_value >= 40 AND glucose_value <= 600 AND glucose_value = TRUNC(glucose_value));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'glucose_readings_user_date_category_key'
      AND conrelid = 'glucose_readings'::regclass
  ) AND NOT EXISTS (
    SELECT 1
    FROM glucose_readings
    GROUP BY user_id, reading_date, measurement_category
    HAVING COUNT(*) > 1
  ) THEN
    ALTER TABLE glucose_readings
      ADD CONSTRAINT glucose_readings_user_date_category_key
      UNIQUE (user_id, reading_date, measurement_category);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_glucose_readings_user_date_time
  ON glucose_readings (user_id, reading_date DESC, reading_time DESC);

CREATE OR REPLACE FUNCTION enforce_glucose_reading_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  daily_count INTEGER;
  slot_count INTEGER;
BEGIN
  IF NEW.reading_date > CURRENT_DATE THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'glucose_readings_future_date',
      MESSAGE = 'Reading date cannot be in the future.';
  END IF;

  IF TG_OP = 'UPDATE'
    AND NEW.user_id = OLD.user_id
    AND NEW.reading_date = OLD.reading_date
    AND NEW.measurement_category = OLD.measurement_category
  THEN
    RETURN NEW;
  END IF;

  PERFORM 1 FROM users WHERE id = NEW.user_id FOR UPDATE;

  IF TG_OP = 'UPDATE' THEN
    SELECT COUNT(*)::INTEGER,
           COUNT(*) FILTER (WHERE measurement_category = NEW.measurement_category)::INTEGER
      INTO daily_count, slot_count
      FROM glucose_readings
      WHERE user_id = NEW.user_id
        AND reading_date = NEW.reading_date
        AND id <> OLD.id;
  ELSE
    SELECT COUNT(*)::INTEGER,
           COUNT(*) FILTER (WHERE measurement_category = NEW.measurement_category)::INTEGER
      INTO daily_count, slot_count
      FROM glucose_readings
      WHERE user_id = NEW.user_id
        AND reading_date = NEW.reading_date;
  END IF;

  IF slot_count > 0 THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'glucose_readings_duplicate_slot',
      MESSAGE = 'A reading already exists for this time slot on this date.';
  END IF;

  IF daily_count >= 4 THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      CONSTRAINT = 'glucose_readings_max_four_per_day',
      MESSAGE = 'No more than four readings can be saved per day.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS glucose_readings_enforce_rules ON glucose_readings;
CREATE TRIGGER glucose_readings_enforce_rules
  BEFORE INSERT OR UPDATE ON glucose_readings
  FOR EACH ROW
  EXECUTE FUNCTION enforce_glucose_reading_rules();

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
