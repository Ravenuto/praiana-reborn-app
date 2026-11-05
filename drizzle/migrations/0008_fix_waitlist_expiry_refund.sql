CREATE OR REPLACE FUNCTION public.apply_waitlist_credits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE payload jsonb; target public.profiles%ROWTYPE; staff boolean; balance integer; occupied integer; capacity integer; next_position integer; promoting boolean;
BEGIN
  IF (CASE WHEN TG_OP = 'DELETE' THEN OLD.collection ELSE NEW.collection END) <> 'WaitlistEntry' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  payload := CASE WHEN TG_OP = 'DELETE' THEN OLD.data ELSE NEW.data END;
  staff := auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher');
  promoting := TG_OP = 'DELETE' AND current_setting('praiana.promoting_waitlist_id', true) = OLD.id;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.collection IS DISTINCT FROM OLD.collection
      OR NEW.data->>'student_email' IS DISTINCT FROM OLD.data->>'student_email'
      OR NEW.data->>'session_id' IS DISTINCT FROM OLD.data->>'session_id'
      OR NEW.data->>'session_date' IS DISTINCT FROM OLD.data->>'session_date' THEN
      RAISE EXCEPTION 'Não é permitido alterar a identidade ou a aula da fila de espera.';
    END IF;
    NEW.data := (NEW.data - 'credit_held' - 'credit_student_id' - 'position')
      || jsonb_build_object('credit_held', COALESCE(OLD.data->'credit_held', 'false'::jsonb), 'position', OLD.data->'position');
    IF OLD.data ? 'credit_student_id' THEN NEW.data := NEW.data || jsonb_build_object('credit_student_id', OLD.data->'credit_student_id'); END IF;
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(COALESCE(payload->>'session_id', '') || ':' || COALESCE(payload->>'session_date', ''), 0));
  SELECT * INTO target FROM public.profiles p WHERE lower(p.email)=lower(payload->>'student_email') FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Aluna não encontrada.'; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NOT staff AND target.id <> auth.uid() THEN RAISE EXCEPTION 'Você só pode entrar na sua própria fila de espera.'; END IF;
    IF NOT target.is_active OR COALESCE((target.data->>'plan_paused')::boolean, false) THEN RAISE EXCEPTION 'Seu plano está inativo ou pausado.'; END IF;
    IF public.has_role(target.id, 'admin') THEN
      balance := COALESCE((target.data->>'credits')::integer, target.credits_remaining, 0);
    ELSE
      balance := COALESCE((target.data->>'credits')::integer, target.credits_remaining, 0);
      IF balance < 1 THEN RAISE EXCEPTION 'Você não tem créditos disponíveis para entrar na fila de espera.'; END IF;
      UPDATE public.profiles SET data=jsonb_set(data,'{credits}',to_jsonb(balance-1)), credits_remaining=balance-1 WHERE id=target.id;
    END IF;
    SELECT COALESCE((r.data->>'max_students')::integer, 8) INTO capacity FROM public.app_records r WHERE r.collection='ClassSession' AND r.id=payload->>'session_id';
    IF capacity IS NULL THEN RAISE EXCEPTION 'Aula não encontrada.'; END IF;
    SELECT count(*) INTO occupied FROM public.app_records r WHERE r.collection='Booking' AND r.data->>'session_id'=payload->>'session_id' AND r.data->>'session_date'=payload->>'session_date' AND COALESCE(r.data->>'status','confirmada')<>'cancelada';
    IF occupied < capacity THEN RAISE EXCEPTION 'Esta aula ainda tem vaga disponível.'; END IF;
    IF EXISTS (SELECT 1 FROM public.app_records r WHERE r.collection='Booking' AND r.data->>'session_id'=payload->>'session_id' AND r.data->>'session_date'=payload->>'session_date' AND lower(r.data->>'student_email')=lower(payload->>'student_email') AND COALESCE(r.data->>'status','confirmada')<>'cancelada') THEN RAISE EXCEPTION 'Esta aluna já está nesta aula.'; END IF;
    SELECT COALESCE(max((r.data->>'position')::integer), 0) + 1 INTO next_position FROM public.app_records r WHERE r.collection='WaitlistEntry' AND r.data->>'session_id'=payload->>'session_id' AND r.data->>'session_date'=payload->>'session_date';
    NEW.data := (NEW.data - 'credit_held' - 'credit_student_id' - 'position')
      || jsonb_build_object('credit_held', NOT public.has_role(target.id, 'admin'), 'credit_student_id', target.id, 'position', next_position);
    RETURN NEW;
  END IF;

  IF NOT promoting AND NOT staff AND target.id <> auth.uid() THEN RAISE EXCEPTION 'Você só pode sair da sua própria fila de espera.'; END IF;
  IF NOT promoting
     AND current_setting('praiana.expiry_refunded', true) IS DISTINCT FROM 'true'
     AND COALESCE((OLD.data->>'credit_held')::boolean, false) THEN
    balance := COALESCE((target.data->>'credits')::integer, target.credits_remaining, 0);
    UPDATE public.profiles SET data=jsonb_set(data,'{credits}',to_jsonb(balance+1)), credits_remaining=balance+1 WHERE id=target.id;
  END IF;
  RETURN OLD;
END $function$;

CREATE OR REPLACE FUNCTION public.expire_waitlist_holds()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE removed integer; entry record; target public.profiles%ROWTYPE; balance integer;
BEGIN
  removed := 0;
  FOR entry IN SELECT r.id, r.owner_id, r.data FROM public.app_records r
    WHERE r.collection='WaitlistEntry' AND COALESCE(r.data->>'session_date','') <> ''
      AND public.waitlist_close_at(r.data->>'session_date', r.data->>'session_time') <= now()
    FOR UPDATE SKIP LOCKED
  LOOP
    IF COALESCE((entry.data->>'credit_held')::boolean,false) THEN
      SELECT * INTO target FROM public.profiles p WHERE lower(p.email)=lower(entry.data->>'student_email') FOR UPDATE;
      IF FOUND THEN
        balance := COALESCE((target.data->>'credits')::integer, target.credits_remaining, 0);
        UPDATE public.profiles SET data=jsonb_set(data,'{credits}',to_jsonb(balance+1)), credits_remaining=balance+1 WHERE id=target.id;
      END IF;
      PERFORM set_config('praiana.expiry_refunded', 'true', true);
    END IF;
    DELETE FROM public.app_records WHERE id=entry.id AND collection='WaitlistEntry';
    PERFORM set_config('praiana.expiry_refunded', 'false', true);
    IF COALESCE((entry.data->>'credit_held')::boolean,false) THEN
      INSERT INTO public.app_records(collection, owner_id, data) VALUES ('Notification', entry.owner_id, jsonb_build_object(
        'user_email', entry.data->>'student_email', 'type', 'credits_added', 'source', 'waitlist_expiry',
        'waitlist_entry_id', entry.id,
        'student_name', COALESCE(entry.data->>'student_name','Aluna'),
        'class_type_name', COALESCE(entry.data->>'class_type_name','Aula'),
        'session_date', entry.data->>'session_date',
        'session_time', entry.data->>'session_time',
        'title', 'Crédito devolvido 💙',
        'message', 'Não abriu vaga em ' || COALESCE(entry.data->>'class_type_name','Aula') || ' (' || to_char((entry.data->>'session_date')::date,'DD/MM') || ' às ' || COALESCE(entry.data->>'session_time','') || '). Seu crédito da fila de espera voltou.',
        'link', '/agenda', 'read', false));
    END IF;
    removed := removed + 1;
  END LOOP;
  RETURN removed;
END $function$;