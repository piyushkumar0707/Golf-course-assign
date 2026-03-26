-- Allow admins to read all scores (fixes "No scores" on admin user detail page)
CREATE POLICY "Admins can read all scores"
  ON public.scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
