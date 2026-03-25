-- Create profiles
CREATE TABLE public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  role text default 'subscriber',
  subscription_status text default 'inactive',
  created_at timestamptz default now()
);

-- Create subscriptions
CREATE TABLE public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text,
  status text,
  current_period_end timestamptz,
  created_at timestamptz default now()
);

-- Create scores
CREATE TABLE public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  score integer check (score between 1 and 45),
  played_on date,
  created_at timestamptz default now()
);

-- Create charities
CREATE TABLE public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_urls text[],
  events jsonb,
  is_featured boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Create user_charity
CREATE TABLE public.user_charity (
  user_id uuid references public.profiles(id) primary key,
  charity_id uuid references public.charities(id),
  contribution_pct integer default 10 check (contribution_pct >= 10 and contribution_pct <= 100),
  updated_at timestamptz default now()
);

-- Create draws
CREATE TABLE public.draws (
  id uuid primary key default gen_random_uuid(),
  month integer,
  year integer,
  draw_type text,
  status text default 'pending',
  winning_numbers integer[],
  jackpot_carried_in numeric default 0,
  jackpot_carry_out numeric default 0,
  created_at timestamptz default now()
);

-- Create draw_entries
CREATE TABLE public.draw_entries (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid references public.draws(id),
  user_id uuid references public.profiles(id),
  scores_snapshot integer[],
  tier_matched integer,
  created_at timestamptz default now()
);

-- Create prize_pool
CREATE TABLE public.prize_pool (
  draw_id uuid references public.draws(id) primary key,
  total_pool numeric,
  pool_tier_5 numeric,
  pool_tier_4 numeric,
  pool_tier_3 numeric,
  winners_tier_5 integer default 0,
  winners_tier_4 integer default 0,
  winners_tier_3 integer default 0
);

-- Create winners
CREATE TABLE public.winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid references public.draws(id),
  user_id uuid references public.profiles(id),
  tier integer,
  prize_amount numeric,
  proof_url text,
  proof_status text default 'awaiting',
  payment_status text default 'unpaid',
  rejection_reason text,
  created_at timestamptz default now()
);

-- Create audit_log
CREATE TABLE public.audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id),
  action text,
  target_table text,
  target_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz default now()
);

-- Create function for profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'subscriber');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function for score rolling trigger
CREATE OR REPLACE FUNCTION public.roll_scores()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.scores
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
      FROM public.scores
      WHERE user_id = NEW.user_id
    ) t WHERE rn > 5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_score_inserted
  AFTER INSERT ON public.scores
  FOR EACH ROW EXECUTE PROCEDURE public.roll_scores();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_charity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- create RLS policies
-- profiles: read/update own row; admins read all
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- subscriptions: read own; service role writes only
CREATE POLICY "Users can read own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- scores: full CRUD own; admins update any
CREATE POLICY "Users can CRUD own scores" ON scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any score" ON scores FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- charities: read (authenticated); full write admin
CREATE POLICY "Authenticated users can read charities" ON charities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can write charities" ON charities FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- user_charity: read/update own
CREATE POLICY "Users can read own charity selection" ON user_charity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own charity selection" ON user_charity FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own charity selection" ON user_charity FOR INSERT WITH CHECK (auth.uid() = user_id);

-- draws: read published; full write admin
CREATE POLICY "Authenticated users can read published draws" ON draws FOR SELECT TO authenticated USING (status = 'published');
CREATE POLICY "Admins can write draws" ON draws FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- draw_entries: read own; read all admin
CREATE POLICY "Users can read own entries" ON draw_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all entries" ON draw_entries FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can insert draw entries" ON draw_entries FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- prize_pool: read all; service role writes
CREATE POLICY "All authenticated can read prize pool" ON prize_pool FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert prize pool" ON prize_pool FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- winners: read own; read/update all admin
CREATE POLICY "Users can read own wins" ON winners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all wins" ON winners FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update all wins" ON winners FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can insert wins" ON winners FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- audit_log: none (user/anon); admins read only; service role writes
CREATE POLICY "Admins can read audit logs" ON audit_log FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Winner Proofs Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('winner-proofs', 'winner-proofs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own proofs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'winner-proofs');
CREATE POLICY "Users can read own proofs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'winner-proofs');
CREATE POLICY "Admins can read all proofs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'winner-proofs' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

