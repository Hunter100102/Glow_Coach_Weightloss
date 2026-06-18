CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  sex TEXT CHECK (sex IN ('male','female','other')),
  age INT CHECK (age BETWEEN 13 AND 120),
  height_cm NUMERIC(6,2) CHECK (height_cm BETWEEN 90 AND 250),
  current_weight_lb NUMERIC(6,2) CHECK (current_weight_lb BETWEEN 50 AND 800),
  goal_weight_lb NUMERIC(6,2) CHECK (goal_weight_lb BETWEEN 50 AND 800),
  activity_level TEXT CHECK (activity_level IN ('sedentary','light','moderate','active','very_active')) DEFAULT 'light',
  pace TEXT CHECK (pace IN ('slow','standard','aggressive')) DEFAULT 'standard',
  daily_calorie_target INT,
  maintenance_calories INT,
  protein_target_g INT,
  dietary_preferences TEXT,
  struggle_notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  weight_lb NUMERIC(6,2) NOT NULL CHECK (weight_lb BETWEEN 50 AND 800),
  note TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, logged_at DESC);

CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  meal_type TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack','other')) DEFAULT 'other',
  title TEXT NOT NULL,
  calories INT NOT NULL CHECK (calories >= 0 AND calories <= 10000),
  protein_g NUMERIC(7,2) DEFAULT 0,
  carbs_g NUMERIC(7,2) DEFAULT 0,
  fat_g NUMERIC(7,2) DEFAULT 0,
  fiber_g NUMERIC(7,2) DEFAULT 0,
  photo_path TEXT,
  ai_confidence TEXT,
  ai_notes TEXT,
  estimate_json JSONB DEFAULT '{}'::jsonb,
  eaten_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meals_user_eaten ON meals(user_id, eaten_at DESC);

CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_per_day INT DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON habit_logs(user_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS coach_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  memory TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_memories_user ON coach_memories(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_user_date ON chat_messages(user_id, created_at DESC);
