ALTER TABLE public.cli_device_sessions
  DROP CONSTRAINT IF EXISTS cli_device_sessions_status_check;

ALTER TABLE public.cli_device_sessions
  ADD CONSTRAINT cli_device_sessions_status_check
  CHECK (status IN ('pending', 'approved', 'consumed', 'expired', 'denied'));
