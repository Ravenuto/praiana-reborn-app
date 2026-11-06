CREATE OR REPLACE FUNCTION public.guard_profile_credits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE balance integer; old_balance integer; old_end date; new_start date; leftover integer; today date;
BEGIN
  IF TG_OP = 'INSERT' THEN
    balance := COALESCE((NEW.data->>'credits')::integer, NEW.credits_remaining, 0);
  ELSE
    old_balance := COALESCE((OLD.data->>'credits')::integer, (OLD.data#>>'{data,credits}')::integer, OLD.credits_remaining, 0);
    balance := old_balance;
    IF pg_trigger_depth() > 1 OR auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin')
       OR current_setting('praiana.credit_system', true) = 'true' THEN
      balance := COALESCE((NEW.data->>'credits')::integer, balance);
      IF COALESCE((NEW.data->>'_reset_plan_credits')::boolean, false) THEN
        today := (now() AT TIME ZONE 'America/Bahia')::date;
        old_end := NULLIF(left(COALESCE(OLD.data->>'plan_end_date', OLD.plan_end_date::text, ''), 10), '')::date;
        new_start := NULLIF(left(COALESCE(NEW.data->>'plan_start_date', NEW.plan_start_date::text, ''), 10), '')::date;
        leftover := 0;
        IF old_end IS NOT NULL AND old_end >= today AND (new_start IS NULL OR old_end >= new_start) AND old_balance > 0 THEN
          leftover := old_balance;
        END IF;
        NEW.data := NEW.data - 'carryover_credits' - 'carryover_expires' - 'carryover_base' - 'credits_expired_for';
        IF leftover > 0 THEN
          NEW.data := NEW.data || jsonb_build_object('carryover_credits', leftover, 'carryover_expires', old_end::text, 'carryover_base', balance);
          balance := balance + leftover;
        END IF;
      END IF;
    END IF;
  END IF;
  IF balance < 0 THEN RAISE EXCEPTION 'O saldo de créditos não pode ser negativo.'; END IF;
  NEW.data := jsonb_set(COALESCE(NEW.data, '{}') - '_reset_plan_credits', '{credits}', to_jsonb(balance));
  NEW.credits_remaining := balance;
  RETURN NEW;
END $$;
COMMENT ON FUNCTION public.guard_profile_credits() IS 'Protect credit writes; renewals grant purchased credits in full and keep unused old-cycle credits only until the old plan end date (carryover_*).';

CREATE OR REPLACE FUNCTION public.expire_plan_credits()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p record; today date; balance integer; expire integer; changed integer := 0; end_d date;
BEGIN
  today := (now() AT TIME ZONE 'America/Bahia')::date;
  PERFORM set_config('praiana.credit_system', 'true', true);
  FOR p IN SELECT * FROM public.profiles
    WHERE COALESCE((data->>'carryover_credits')::integer, 0) > 0
      AND NULLIF(left(data->>'carryover_expires', 10), '')::date < today
    FOR UPDATE SKIP LOCKED
  LOOP
    balance := COALESCE((p.data->>'credits')::integer, p.credits_remaining, 0);
    expire := LEAST((p.data->>'carryover_credits')::integer, GREATEST(0, balance - COALESCE((p.data->>'carryover_base')::integer, 0)));
    UPDATE public.profiles SET data = jsonb_set(data - 'carryover_credits' - 'carryover_expires' - 'carryover_base', '{credits}', to_jsonb(balance - expire))
      WHERE id = p.id;
    changed := changed + 1;
  END LOOP;
  FOR p IN SELECT * FROM public.profiles pr
    WHERE COALESCE((pr.data->>'credits')::integer, pr.credits_remaining, 0) > 0
      AND NULLIF(left(COALESCE(pr.data->>'plan_end_date', pr.plan_end_date::text, ''), 10), '')::date < today
      AND NOT public.has_role(pr.id, 'admin')
    FOR UPDATE SKIP LOCKED
  LOOP
    end_d := left(COALESCE(p.data->>'plan_end_date', p.plan_end_date::text), 10)::date;
    UPDATE public.profiles SET data = jsonb_set(data - 'carryover_credits' - 'carryover_expires' - 'carryover_base', '{credits}', '0'::jsonb)
        || jsonb_build_object('credits_expired_for', end_d::text)
      WHERE id = p.id;
    changed := changed + 1;
  END LOOP;
  PERFORM set_config('praiana.credit_system', 'false', true);
  RETURN changed;
END $$;
GRANT EXECUTE ON FUNCTION public.expire_plan_credits() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enforce_plan_window()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target public.profiles%ROWTYPE; s date; e date; d date;
BEGIN
  IF NEW.collection NOT IN ('Booking', 'WaitlistEntry') THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher') THEN RETURN NEW; END IF;
  IF COALESCE(NEW.data->>'from_waitlist_entry_id', '') <> '' OR COALESCE(NEW.data->>'guest_type', '') <> '' THEN RETURN NEW; END IF;
  IF COALESCE(NEW.data->>'status', 'confirmada') = 'cancelada' THEN RETURN NEW; END IF;
  SELECT * INTO target FROM public.profiles p WHERE lower(p.email) = lower(NEW.data->>'student_email');
  IF NOT FOUND OR public.has_role(target.id, 'admin') THEN RETURN NEW; END IF;
  d := NULLIF(left(NEW.data->>'session_date', 10), '')::date;
  s := NULLIF(left(COALESCE(target.data->>'plan_start_date', target.plan_start_date::text, ''), 10), '')::date;
  e := NULLIF(left(COALESCE(target.data->>'plan_end_date', target.plan_end_date::text, ''), 10), '')::date;
  IF d IS NOT NULL AND ((s IS NOT NULL AND d < s) OR (e IS NOT NULL AND d > e)) THEN
    RAISE EXCEPTION 'Esta data está fora do período do seu plano. Renove seu plano para continuar reservando!';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS app_records_a_plan_window ON public.app_records;
CREATE TRIGGER app_records_a_plan_window BEFORE INSERT ON public.app_records
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_window();