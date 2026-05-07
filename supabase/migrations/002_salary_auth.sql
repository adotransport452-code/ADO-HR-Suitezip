-- ============================================================
-- Migration 002 — Salary & Auth Profiles
-- Paste into Supabase SQL Editor and Run.
-- ============================================================

-- ─── Salary Table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salaries (
  id              serial PRIMARY KEY,
  employee_id     integer NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  nepali_year     integer NOT NULL,
  nepali_month    integer NOT NULL,
  total_salary    integer NOT NULL DEFAULT 0,
  provided_salary integer NOT NULL DEFAULT 0,
  payment_type    text,
  payment_date    text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, nepali_year, nepali_month)
);

DO $$ BEGIN
  CREATE TRIGGER salaries_updated_at
    BEFORE UPDATE ON salaries
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "allow_read_salaries" ON salaries FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE salaries;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── User Profiles Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL,
  full_name  text,
  role       text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "allow_read_own_profile" ON profiles FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── NOTE: Create your first Admin user ───────────────────────
-- 1. Go to Supabase Dashboard → Authentication → Users → Add User
-- 2. Enter email + password, click "Create User"
-- 3. Copy the user's UUID
-- 4. Run this (replace the UUID):
--
-- INSERT INTO profiles (id, email, full_name, role)
-- VALUES ('YOUR-USER-UUID-HERE', 'admin@example.com', 'Admin', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
