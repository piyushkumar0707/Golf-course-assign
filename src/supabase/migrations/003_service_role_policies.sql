-- Explicit documentation migration for subscription/profile writes.
-- Service role performs reconciliation writes to subscriptions/profiles.
-- Authenticated users keep read-only access as defined by existing RLS policies.

COMMENT ON TABLE public.subscriptions IS
  'Write access is performed by service role flows (webhook, checkout confirmation, reconciliation service).';
