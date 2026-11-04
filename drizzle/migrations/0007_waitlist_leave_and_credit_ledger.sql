CREATE TABLE public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  old_credits integer,
  new_credits integer,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_ledger TO authenticated;
GRANT ALL ON public.credit_ledger TO service_role;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read credit ledger" ON public.credit_ledger FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.log_credit_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.credits_remaining IS DISTINCT FROM OLD.credits_remaining THEN
    INSERT INTO public.credit_ledger(student_id, old_credits, new_credits, actor_id)
    VALUES (NEW.id, OLD.credits_remaining, NEW.credits_remaining, auth.uid());
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_log_credit_change AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_credit_change();

-- One server-side action to leave the queue: deletes the entry and refunds the held credit in the same transaction.
CREATE OR REPLACE FUNCTION public.leave_waitlist(_entry_id text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE entry public.app_records%ROWTYPE; staff boolean; result integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acesso não autorizado.'; END IF;
  staff := public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher');
  SELECT * INTO entry FROM public.app_records WHERE id=_entry_id AND collection='WaitlistEntry' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Você não está mais nesta fila de espera.'; END IF;
  IF NOT staff AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND lower(p.email)=lower(entry.data->>'student_email')) THEN
    RAISE EXCEPTION 'Você só pode sair da sua própria fila de espera.';
  END IF;
  DELETE FROM public.app_records WHERE id=_entry_id AND collection='WaitlistEntry';
  SELECT credits_remaining INTO result FROM public.profiles WHERE lower(email)=lower(entry.data->>'student_email');
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.leave_waitlist(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leave_waitlist(text) TO authenticated;
REVOKE ALL ON FUNCTION public.log_credit_change() FROM PUBLIC, anon, authenticated;