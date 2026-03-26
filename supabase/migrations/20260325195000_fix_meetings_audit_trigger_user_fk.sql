-- Prevent meeting deletes/updates/inserts from failing when meetings.sdr_id is not
-- present in auth.users (common in token/local auth flows).

CREATE OR REPLACE FUNCTION public.log_meeting_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_entity_id text;
  v_user_id uuid;
  v_user_email text;
  v_agency_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'meeting_create';
    v_entity_id := NEW.id::text;
    v_user_id := NEW.sdr_id;
    v_agency_id := NEW.agency_id;

    -- Avoid FK violations on audit_logs.user_id -> auth.users(id)
    IF v_user_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM auth.users u WHERE u.id = v_user_id
    ) THEN
      v_user_id := NULL;
    END IF;

    SELECT p.email INTO v_user_email
    FROM public.profiles p
    WHERE p.id = NEW.sdr_id
    LIMIT 1;

    INSERT INTO public.audit_logs (
      user_id,
      user_email,
      user_role,
      agency_id,
      action,
      entity_type,
      entity_id,
      changes,
      old_values,
      new_values,
      metadata,
      status
    ) VALUES (
      v_user_id,
      v_user_email,
      'sdr',
      v_agency_id,
      v_action,
      'meeting',
      v_entity_id,
      jsonb_build_object('operation', 'insert'),
      NULL,
      to_jsonb(NEW),
      jsonb_build_object(
        'sdr_id', NEW.sdr_id,
        'client_id', NEW.client_id,
        'source', 'db_trigger'
      ),
      'success'
    );

    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'meeting_update';
    v_entity_id := NEW.id::text;
    v_user_id := COALESCE(NEW.sdr_id, OLD.sdr_id);
    v_agency_id := COALESCE(NEW.agency_id, OLD.agency_id);

    -- Avoid FK violations on audit_logs.user_id -> auth.users(id)
    IF v_user_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM auth.users u WHERE u.id = v_user_id
    ) THEN
      v_user_id := NULL;
    END IF;

    SELECT p.email INTO v_user_email
    FROM public.profiles p
    WHERE p.id = COALESCE(NEW.sdr_id, OLD.sdr_id)
    LIMIT 1;

    INSERT INTO public.audit_logs (
      user_id,
      user_email,
      user_role,
      agency_id,
      action,
      entity_type,
      entity_id,
      changes,
      old_values,
      new_values,
      metadata,
      status
    ) VALUES (
      v_user_id,
      v_user_email,
      'sdr',
      v_agency_id,
      v_action,
      'meeting',
      v_entity_id,
      jsonb_build_object('operation', 'update'),
      to_jsonb(OLD),
      to_jsonb(NEW),
      jsonb_build_object(
        'sdr_id', COALESCE(NEW.sdr_id, OLD.sdr_id),
        'client_id', COALESCE(NEW.client_id, OLD.client_id),
        'source', 'db_trigger'
      ),
      'success'
    );

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'meeting_delete';
    v_entity_id := OLD.id::text;
    v_user_id := OLD.sdr_id;
    v_agency_id := OLD.agency_id;

    -- Avoid FK violations on audit_logs.user_id -> auth.users(id)
    IF v_user_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM auth.users u WHERE u.id = v_user_id
    ) THEN
      v_user_id := NULL;
    END IF;

    SELECT p.email INTO v_user_email
    FROM public.profiles p
    WHERE p.id = OLD.sdr_id
    LIMIT 1;

    INSERT INTO public.audit_logs (
      user_id,
      user_email,
      user_role,
      agency_id,
      action,
      entity_type,
      entity_id,
      changes,
      old_values,
      new_values,
      metadata,
      status
    ) VALUES (
      v_user_id,
      v_user_email,
      'sdr',
      v_agency_id,
      v_action,
      'meeting',
      v_entity_id,
      jsonb_build_object('operation', 'delete'),
      to_jsonb(OLD),
      NULL,
      jsonb_build_object(
        'sdr_id', OLD.sdr_id,
        'client_id', OLD.client_id,
        'source', 'db_trigger'
      ),
      'success'
    );

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;
