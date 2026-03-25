-- RLS Policies for Admin Inserts
-- These policies allow admin users to insert records into draw_entries, prize_pool, and winners tables

-- Ensure draw_entries policy exists (drop if exists to avoid conflicts)
DROP POLICY IF EXISTS "Admins can insert draw entries" ON public.draw_entries;
CREATE POLICY "Admins can insert draw entries" ON public.draw_entries
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Ensure prize_pool policy exists
DROP POLICY IF EXISTS "Admins can insert prize pool" ON public.prize_pool;
CREATE POLICY "Admins can insert prize pool" ON public.prize_pool
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Ensure winners policy exists
DROP POLICY IF EXISTS "Admins can insert wins" ON public.winners;
CREATE POLICY "Admins can insert wins" ON public.winners
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
