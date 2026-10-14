CREATE UNIQUE INDEX IF NOT EXISTS app_records_waitlist_student_unique
ON public.app_records ((data->>'session_id'), (data->>'session_date'), lower(data->>'student_email'))
WHERE collection = 'WaitlistEntry';

CREATE UNIQUE INDEX IF NOT EXISTS app_records_waitlist_position_unique
ON public.app_records ((data->>'session_id'), (data->>'session_date'), ((data->>'position')::integer))
WHERE collection = 'WaitlistEntry';

CREATE OR REPLACE FUNCTION public.guard_profile_credits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE balance integer; reserved integer; resetting boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    balance := COALESCE((NEW.data->>'credits')::integer, NEW.credits_remaining, 0);
  ELSE
    balance := COALESCE((OLD.data->>'credits')::integer, (OLD.data#>>'{data,credits}')::integer, OLD.credits_remaining, 0);
    IF pg_trigger_depth() > 1 OR auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
      balance := COALESCE((NEW.data->>'credits')::integer, balance);
      resetting := COALESCE((NEW.data->>'_reset_plan_credits')::boolean, false)
        OR NEW.data->>'plan' IS DISTINCT FROM OLD.data->>'plan'
        OR NEW.data->>'last_payment_date' IS DISTINCT FROM OLD.data->>'last_payment_date';
      IF resetting AND pg_trigger_depth() = 1 THEN
        SELECT count(*) INTO reserved FROM public.app_records r
        WHERE lower(r.data->>'student_email') = lower(NEW.email)
          AND (
            (r.collection = 'Booking'
              AND COALESCE(r.data->>'status', 'confirmada') <> 'cancelada'
              AND COALESCE(r.data->>'guest_type', '') = '')
            OR
            (r.collection = 'WaitlistEntry'
              AND COALESCE((r.data->>'credit_held')::boolean, false))
          )
          AND r.data->>'session_date' >= COALESCE(to_char(NEW.plan_start_date, 'YYYY-MM-DD'), NEW.data->>'plan_start_date', '0001-01-01')
          AND r.data->>'session_date' <= COALESCE(to_char(NEW.plan_end_date, 'YYYY-MM-DD'), NEW.data->>'plan_end_date', '9999-12-31');
        balance := GREATEST(0, balance - reserved);
      END IF;
    END IF;
  END IF;
  IF balance < 0 THEN RAISE EXCEPTION 'O saldo de créditos não pode ser negativo.'; END IF;
  NEW.data := jsonb_set(COALESCE(NEW.data, '{}') - '_reset_plan_credits', '{credits}', to_jsonb(balance));
  NEW.credits_remaining := balance;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.apply_waitlist_credits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  IF NOT promoting AND COALESCE((OLD.data->>'credit_held')::boolean, false) THEN
    balance := COALESCE((target.data->>'credits')::integer, target.credits_remaining, 0);
    UPDATE public.profiles SET data=jsonb_set(data,'{credits}',to_jsonb(balance+1)), credits_remaining=balance+1 WHERE id=target.id;
  END IF;
  RETURN OLD;
END $$;

CREATE TRIGGER app_records_waitlist_credits BEFORE INSERT OR UPDATE OR DELETE ON public.app_records
FOR EACH ROW EXECUTE FUNCTION public.apply_waitlist_credits();

CREATE OR REPLACE FUNCTION public.apply_booking_credits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE payload jsonb; previous jsonb; target public.profiles%ROWTYPE; staff boolean; was_active boolean; now_active boolean; guest boolean; balance integer; capacity integer; occupied integer; current_id text; charge boolean; waitlist_id text; held_waitlist public.app_records%ROWTYPE; transferred boolean;
BEGIN
  IF (CASE WHEN TG_OP = 'DELETE' THEN OLD.collection ELSE NEW.collection END) <> 'Booking' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  payload := CASE WHEN TG_OP = 'DELETE' THEN OLD.data ELSE NEW.data END;
  previous := CASE WHEN TG_OP = 'INSERT' THEN '{}'::jsonb ELSE OLD.data END;
  current_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;
  staff := auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher');
  IF TG_OP = 'UPDATE' AND (NEW.collection IS DISTINCT FROM OLD.collection OR NEW.data->>'student_email' IS DISTINCT FROM OLD.data->>'student_email' OR NEW.data->>'session_id' IS DISTINCT FROM OLD.data->>'session_id' OR NEW.data->>'session_date' IS DISTINCT FROM OLD.data->>'session_date' OR NEW.data->>'guest_type' IS DISTINCT FROM OLD.data->>'guest_type') THEN RAISE EXCEPTION 'Não é permitido alterar a identidade ou a aula de uma reserva.'; END IF;
  IF TG_OP <> 'INSERT' AND NOT staff AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND lower(p.email)=lower(previous->>'student_email')) THEN RAISE EXCEPTION 'Você só pode alterar suas próprias reservas.'; END IF;
  guest := COALESCE(payload->>'guest_type', '') <> '' OR COALESCE(payload->>'student_email', '') LIKE '%@participante.invalid' OR COALESCE(payload->>'student_email', '') LIKE 'avulsa-%';
  IF guest AND NOT staff THEN RAISE EXCEPTION 'Somente o estúdio pode cadastrar convidadas.'; END IF;
  was_active := TG_OP <> 'INSERT' AND COALESCE(previous->>'status', 'confirmada') <> 'cancelada';
  now_active := TG_OP <> 'DELETE' AND COALESCE(payload->>'status', 'confirmada') <> 'cancelada';
  IF was_active = now_active THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.data := (NEW.data - 'credit_debited' - 'credit_student_id') || jsonb_build_object('credit_debited', COALESCE(previous->'credit_debited', 'true'::jsonb));
      IF previous ? 'credit_student_id' THEN NEW.data := NEW.data || jsonb_build_object('credit_student_id', previous->'credit_student_id'); END IF;
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(COALESCE(payload->>'session_id', '') || ':' || COALESCE(payload->>'session_date', ''), 0));
  IF now_active THEN
    SELECT COALESCE((r.data->>'max_students')::integer, 8) INTO capacity FROM public.app_records r WHERE r.collection='ClassSession' AND r.id=payload->>'session_id';
    IF capacity IS NULL THEN RAISE EXCEPTION 'Aula não encontrada.'; END IF;
    SELECT count(*) INTO occupied FROM public.app_records r WHERE r.collection='Booking' AND r.id<>current_id AND r.data->>'session_id'=payload->>'session_id' AND r.data->>'session_date'=payload->>'session_date' AND COALESCE(r.data->>'status','confirmada')<>'cancelada';
    IF occupied >= capacity THEN RAISE EXCEPTION 'Esta aula está lotada.'; END IF;
    IF EXISTS (SELECT 1 FROM public.app_records r WHERE r.collection='Booking' AND r.id<>current_id AND r.data->>'session_id'=payload->>'session_id' AND r.data->>'session_date'=payload->>'session_date' AND lower(r.data->>'student_email')=lower(payload->>'student_email') AND COALESCE(r.data->>'status','confirmada')<>'cancelada') THEN RAISE EXCEPTION 'Esta aluna já está nesta aula.'; END IF;
  END IF;
  IF NOT guest THEN
    SELECT * INTO target FROM public.profiles p WHERE lower(p.email)=lower(payload->>'student_email') FOR UPDATE;
    IF NOT FOUND AND now_active THEN RAISE EXCEPTION 'Aluna não encontrada.'; END IF;
    IF FOUND THEN
      IF now_active AND NOT staff AND target.id<>auth.uid() AND NOT EXISTS (SELECT 1 FROM public.app_records r WHERE r.collection='WaitlistEntry' AND r.data->>'session_id'=payload->>'session_id' AND r.data->>'session_date'=payload->>'session_date' AND lower(r.data->>'student_email')=lower(target.email)) THEN RAISE EXCEPTION 'Você só pode reservar para sua própria conta.'; END IF;
      charge := NOT public.has_role(target.id, 'admin');
      balance := COALESCE((target.data->>'credits')::integer, target.credits_remaining, 0);
      waitlist_id := payload->>'from_waitlist_entry_id';
      transferred := false;
      IF now_active AND charge AND COALESCE(waitlist_id, '') <> '' THEN
        SELECT * INTO held_waitlist FROM public.app_records r WHERE r.id=waitlist_id AND r.collection='WaitlistEntry' AND r.data->>'session_id'=payload->>'session_id' AND r.data->>'session_date'=payload->>'session_date' AND lower(r.data->>'student_email')=lower(payload->>'student_email') AND COALESCE((r.data->>'credit_held')::boolean, false) FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'O crédito reservado na fila de espera não foi encontrado.'; END IF;
        transferred := true;
      END IF;
      IF now_active AND charge AND NOT transferred THEN
        IF NOT target.is_active OR COALESCE((target.data->>'plan_paused')::boolean,false) THEN RAISE EXCEPTION 'Seu plano está inativo ou pausado.'; END IF;
        IF balance < 1 THEN RAISE EXCEPTION 'Esta aluna não tem créditos disponíveis.'; END IF;
        UPDATE public.profiles SET data=jsonb_set(data,'{credits}',to_jsonb(balance-1)),credits_remaining=balance-1 WHERE id=target.id;
      ELSIF was_active AND charge AND COALESCE((previous->>'credit_debited')::boolean,true) THEN
        UPDATE public.profiles SET data=jsonb_set(data,'{credits}',to_jsonb(balance+1)),credits_remaining=balance+1 WHERE id=target.id;
      END IF;
    END IF;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    NEW.data := (NEW.data - 'credit_debited' - 'credit_student_id') || jsonb_build_object('credit_debited', now_active AND NOT guest AND COALESCE(charge,false));
    IF target.id IS NOT NULL THEN NEW.data := NEW.data || jsonb_build_object('credit_student_id',target.id); END IF;
    RETURN NEW;
  END IF;
  RETURN OLD;
END $$;

CREATE OR REPLACE FUNCTION public.promote_waitlist(_session_id text, _session_date text)
RETURNS TABLE(booking_id text, student_email text, student_name text, class_type_name text, session_time text, session_date text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE head public.app_records%ROWTYPE; created public.app_records%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acesso não autorizado.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(COALESCE(_session_id, '') || ':' || COALESCE(_session_date, ''), 0));
  SELECT * INTO head FROM public.app_records r
  WHERE r.collection='WaitlistEntry' AND r.data->>'session_id'=_session_id AND r.data->>'session_date'=_session_date
  ORDER BY (r.data->>'position')::integer, r.created_date, r.id
  FOR UPDATE LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;
  PERFORM set_config('praiana.promoting_waitlist_id', head.id, true);
  INSERT INTO public.app_records(collection, owner_id, data)
  VALUES ('Booking', head.owner_id, (head.data - 'position' - 'credit_held' - 'credit_student_id') || jsonb_build_object('status','confirmada','from_waitlist_entry_id',head.id))
  RETURNING * INTO created;
  DELETE FROM public.app_records WHERE id=head.id AND collection='WaitlistEntry';
  INSERT INTO public.app_records(collection, owner_id, data)
  VALUES ('Notification', head.owner_id, jsonb_build_object(
    'user_email', head.data->>'student_email',
    'type', 'waitlist_promoted',
    'title', 'Vaga liberada! 🎉',
    'message', 'Você foi confirmada em ' || COALESCE(head.data->>'class_type_name','Aula') || ' no dia ' || COALESCE(head.data->>'session_date','') || ' às ' || COALESCE(head.data->>'session_time','') || '.',
    'link', '/minhas-reservas',
    'read', false
  ));
  RETURN QUERY SELECT created.id, head.data->>'student_email', head.data->>'student_name', head.data->>'class_type_name', head.data->>'session_time', head.data->>'session_date';
END $$;

REVOKE ALL ON FUNCTION public.apply_waitlist_credits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_waitlist_credits() TO service_role;
REVOKE ALL ON FUNCTION public.promote_waitlist(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_waitlist(text,text) TO authenticated, service_role;