CREATE OR REPLACE FUNCTION public.guard_profile_credits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE balance integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    balance := COALESCE((NEW.data->>'credits')::integer, NEW.credits_remaining, 0);
  ELSE
    balance := COALESCE((OLD.data->>'credits')::integer, (OLD.data#>>'{data,credits}')::integer, OLD.credits_remaining, 0);
    IF pg_trigger_depth() > 1 OR auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
      balance := COALESCE((NEW.data->>'credits')::integer, balance);
    END IF;
  END IF;
  IF balance < 0 THEN RAISE EXCEPTION 'O saldo de créditos não pode ser negativo.'; END IF;
  NEW.data := jsonb_set(COALESCE(NEW.data, '{}') - '_reset_plan_credits', '{credits}', to_jsonb(balance));
  NEW.credits_remaining := balance;
  RETURN NEW;
END $$;
COMMENT ON FUNCTION public.guard_profile_credits() IS 'Protect credit writes; purchased renewal credits are granted in full without subtracting existing bookings or waitlist holds.';