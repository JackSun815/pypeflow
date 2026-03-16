/*
  # Create AI practice sessions table

  Stores Tavus practice session metadata and transcripts for SDR roleplay.
  Records expire after 7 days and are opportunistically purged on session activity.
*/

CREATE TABLE IF NOT EXISTS public.ai_practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  sdr_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  tavus_conversation_id text NOT NULL UNIQUE,
  tavus_conversation_url text NOT NULL,
  tavus_persona_id text,
  tavus_replica_id text,
  status text NOT NULL DEFAULT 'created',
  meeting_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  transcript_json jsonb,
  transcript_text text,
  callback_payload jsonb,
  error_message text,
  completed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_practice_sessions_meeting_id
  ON public.ai_practice_sessions(meeting_id);

CREATE INDEX IF NOT EXISTS idx_ai_practice_sessions_sdr_id
  ON public.ai_practice_sessions(sdr_id);

CREATE INDEX IF NOT EXISTS idx_ai_practice_sessions_expires_at
  ON public.ai_practice_sessions(expires_at);

ALTER TABLE public.ai_practice_sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_ai_practice_sessions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_ai_practice_sessions_updated_at
  ON public.ai_practice_sessions;

CREATE TRIGGER set_ai_practice_sessions_updated_at
  BEFORE UPDATE ON public.ai_practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ai_practice_sessions_updated_at();

CREATE OR REPLACE FUNCTION public.purge_expired_ai_practice_sessions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.ai_practice_sessions
  WHERE expires_at <= now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS purge_expired_ai_practice_sessions_on_write
  ON public.ai_practice_sessions;

CREATE TRIGGER purge_expired_ai_practice_sessions_on_write
  BEFORE INSERT OR UPDATE ON public.ai_practice_sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.purge_expired_ai_practice_sessions();
