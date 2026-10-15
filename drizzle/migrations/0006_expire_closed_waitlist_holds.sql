CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.waitlist_close_at(_date text, _time text)
RETURNS timestamptz LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ((_date || ' ' || COALESCE(NULLIF(_time,''),'00:00'))::timestamp AT TIME ZONE 'America/Bahia')
    - make_interval(hours => COALESCE((SELECT NULLIF(r.data->>'value','')::integer FROM public.app_records r
        WHERE r.collection='StudioSettings' AND r.data->>'key'='booking_min_hours' LIMIT 1), 4));
$$;

CREATE OR REPLACE FUNCTION public.block_closed_waitlist()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.collection = 'WaitlistEntry' AND COALESCE(NEW.data->>'session_date','') <> ''
     AND public.waitlist_close_at(NEW.data->>'session_date', NEW.data->>'session_time') <= now() THEN
    RAISE EXCEPTION 'As inscrições para esta aula já foram encerradas.';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER app_records_waitlist_closed BEFORE INSERT ON public.app_records
FOR EACH ROW EXECUTE FUNCTION public.block_closed_waitlist();

-- Entries still queued when the class closes or passes are deleted; the waitlist credit trigger refunds the held credit once.
CREATE OR REPLACE FUNCTION public.expire_waitlist_holds()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE removed integer; entry record;
BEGIN
  removed := 0;
  FOR entry IN SELECT r.id, r.owner_id, r.data FROM public.app_records r
    WHERE r.collection='WaitlistEntry' AND COALESCE(r.data->>'session_date','') <> ''
      AND public.waitlist_close_at(r.data->>'session_date', r.data->>'session_time') <= now()
    FOR UPDATE SKIP LOCKED
  LOOP
    DELETE FROM public.app_records WHERE id=entry.id AND collection='WaitlistEntry';
    IF COALESCE((entry.data->>'credit_held')::boolean,false) THEN
      INSERT INTO public.app_records(collection, owner_id, data) VALUES ('Notification', entry.owner_id, jsonb_build_object(
        'user_email', entry.data->>'student_email', 'type', 'credits_added',
        'title', 'Crédito devolvido 💙',
        'message', 'Não abriu vaga em ' || COALESCE(entry.data->>'class_type_name','Aula') || ' (' || to_char((entry.data->>'session_date')::date,'DD/MM') || ' às ' || COALESCE(entry.data->>'session_time','') || '). Seu crédito da fila de espera voltou.',
        'link', '/agenda', 'read', false));
    END IF;
    removed := removed + 1;
  END LOOP;
  RETURN removed;
END $$;

REVOKE ALL ON FUNCTION public.expire_waitlist_holds() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expire_waitlist_holds() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.waitlist_close_at(text,text) FROM PUBLIC, anon;

SELECT cron.schedule('expire-waitlist-holds', '0 * * * *', 'SELECT public.expire_waitlist_holds()');