CREATE TABLE public.financial_forecast_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('allocation', 'monthly_override')),
  month date NOT NULL CHECK (EXTRACT(DAY FROM month) = 1),
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  installments integer NOT NULL DEFAULT 1 CHECK (installments BETWEEN 1 AND 120),
  plan_key text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, kind, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_forecast_entries TO authenticated;
GRANT ALL ON public.financial_forecast_entries TO service_role;
ALTER TABLE public.financial_forecast_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only administrators manage financial forecast" ON public.financial_forecast_entries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));