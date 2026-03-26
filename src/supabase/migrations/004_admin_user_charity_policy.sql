-- Allow admins to read all user_charity rows (fixes "No charity selected" on admin user detail page)
CREATE POLICY "Admins can read all user_charity"
  ON public.user_charity
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
