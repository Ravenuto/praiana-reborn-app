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
        WHERE r.collection = 'Booking' AND lower(r.data->>'student_email') = lower(NEW.email)
          AND COALESCE(r.data->>'status', 'confirmada') <> 'cancelada'
          AND COALESCE(r.data->>'guest_type', '') = ''
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