-- Drop existing tables and triggers 
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS prize_pool CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS user_charity CASCADE;
DROP TABLE IF EXISTS winners CASCADE;
DROP TABLE IF EXISTS draw_entries CASCADE;
DROP TABLE IF EXISTS draws CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS charity_contributions CASCADE;
DROP TABLE IF EXISTS charity_events CASCADE;
DROP TABLE IF EXISTS charities CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP FUNCTION IF EXISTS enforce_score_limit CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- ─── USERS (extends Supabase auth.users) ───────────────────────────────────
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  email           TEXT NOT NULL,
  role            TEXT DEFAULT 'subscriber' CHECK (role IN ('subscriber', 'admin')),
  charity_id      UUID, -- will reference charities(id) after charities table is created
  charity_percent NUMERIC(5,2) DEFAULT 10 CHECK (charity_percent >= 10),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── CHARITIES ─────────────────────────────────────────────────────────────
CREATE TABLE charities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url   TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key constraint to profiles now that charities exists
ALTER TABLE profiles ADD CONSTRAINT profiles_charity_id_fkey FOREIGN KEY (charity_id) REFERENCES charities(id);

-- ─── SUBSCRIPTIONS ─────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id   TEXT,
  stripe_subscription_id TEXT,
  plan                 TEXT CHECK (plan IN ('monthly', 'yearly')),
  status               TEXT CHECK (status IN ('active', 'cancelled', 'lapsed', 'trialing')),
  current_period_end   TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- ─── SCORES ────────────────────────────────────────────────────────────────
CREATE TABLE scores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score      INT NOT NULL CHECK (score BETWEEN 1 AND 45),
  played_on  DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rolling window: enforce max 5 scores per user via trigger
CREATE OR REPLACE FUNCTION enforce_score_limit()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM scores
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id FROM scores
      WHERE user_id = NEW.user_id
      ORDER BY played_on DESC
      LIMIT 4  -- keep 4 after insert, total = 5
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER score_limit_trigger
AFTER INSERT ON scores
FOR EACH ROW EXECUTE FUNCTION enforce_score_limit();

-- ─── CHARITY EVENTS ────────────────────────────────────────────────────────
CREATE TABLE charity_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charity_id  UUID REFERENCES charities(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  event_date  DATE,
  description TEXT
);

-- ─── DRAWS ─────────────────────────────────────────────────────────────────
CREATE TABLE draws (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month           DATE NOT NULL,          -- First day of draw month
  logic           TEXT CHECK (logic IN ('random', 'algorithmic')),
  drawn_numbers   INT[],                  -- Array of 5 numbers drawn
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'simulated', 'published')),
  jackpot_amount  NUMERIC(10,2) DEFAULT 0,
  jackpot_rollover BOOLEAN DEFAULT false,
  prize_pool      JSONB,                  -- { five_match: X, four_match: Y, three_match: Z }
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── DRAW ENTRIES ──────────────────────────────────────────────────────────
CREATE TABLE draw_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id    UUID REFERENCES draws(id),
  user_id    UUID REFERENCES profiles(id),
  scores     INT[],                       -- Snapshot of user's 5 scores at draw time
  match_type TEXT CHECK (match_type IN ('5-match', '4-match', '3-match', 'no-match')),
  prize      NUMERIC(10,2) DEFAULT 0
);

-- ─── WINNERS ───────────────────────────────────────────────────────────────
CREATE TABLE winners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_entry_id   UUID REFERENCES draw_entries(id),
  user_id         UUID REFERENCES profiles(id),
  match_type      TEXT,
  prize_amount    NUMERIC(10,2),
  proof_url       TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  reviewed_at     TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── CHARITY CONTRIBUTIONS ─────────────────────────────────────────────────
CREATE TABLE charity_contributions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  charity_id  UUID REFERENCES charities(id),
  amount      NUMERIC(10,2),
  period      DATE,                       -- Month/year of contribution
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Trigger 2: Profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'subscriber');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Row Level Security Context Functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Enable RLS and Create Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "scores_own" ON scores USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update any scores" ON scores FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can view all scores" ON scores FOR SELECT USING (public.is_admin());

CREATE POLICY "Authenticated can view charities" ON charities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert charities" ON charities FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update charities" ON charities FOR UPDATE USING (public.is_admin());

CREATE POLICY "Authenticated can view charity events" ON charity_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert charity events" ON charity_events FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update charity events" ON charity_events FOR UPDATE USING (public.is_admin());

CREATE POLICY "Anyone can view published draws" ON draws FOR SELECT USING (status = 'published');
CREATE POLICY "Admins have full access to draws" ON draws FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view own entries" ON draw_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all entries" ON draw_entries FOR SELECT USING (public.is_admin());

CREATE POLICY "winners_owner_or_admin" ON winners USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can view own contributions" ON charity_contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all contributions" ON charity_contributions FOR SELECT USING (public.is_admin());
