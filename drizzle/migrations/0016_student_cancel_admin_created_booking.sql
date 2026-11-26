CREATE OR REPLACE FUNCTION public.guard_student_booking_cancellation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE session_data jsonb; class_start timestamptz; cancel_hours integer;
BEGIN
  IF OLD.collection <> 'Booking' OR auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher') THEN RETURN NEW; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND lower(p.email) = lower(OLD.data->>'student_email')) THEN
    RAISE EXCEPTION 'Você só pode cancelar suas próprias reservas.';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.collection IS DISTINCT FROM OLD.collection OR NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.created_date IS DISTINCT FROM OLD.created_date OR NEW.created_at IS DISTINCT FROM OLD.created_at OR (NEW.data - 'status') IS DISTINCT FROM (OLD.data - 'status') OR NEW.data->>'status' IS DISTINCT FROM 'cancelada' THEN
    RAISE EXCEPTION 'Você só pode cancelar a reserva, sem alterar os demais dados.';
  END IF;
  IF OLD.data->>'status' = 'cancelada' THEN RETURN NEW; END IF;
  IF COALESCE(OLD.data->>'status', 'confirmada') <> 'confirmada' THEN RAISE EXCEPTION 'Esta reserva não pode mais ser cancelada.'; END IF;
  session_data := public.session_data_on_date(OLD.data->>'session_id', OLD.data->>'session_date');
  class_start := ((OLD.data->>'session_date')::date + COALESCE(NULLIF(session_data->>'time', ''), NULLIF(OLD.data->>'session_time', ''))::time) AT TIME ZONE 'America/Sao_Paulo';
  IF class_start IS NULL THEN RAISE EXCEPTION 'Não foi possível conferir o horário desta aula. Fale com o estúdio.'; END IF;
  SELECT COALESCE((r.data->>'value')::integer, 4) INTO cancel_hours FROM public.app_records r WHERE r.collection = 'StudioSettings' AND r.data->>'key' = 'cancel_min_hours' ORDER BY r.created_at DESC LIMIT 1;
  cancel_hours := COALESCE(cancel_hours, 4);
  IF class_start <= now() THEN RAISE EXCEPTION 'Esta aula já passou, não é possível cancelar.'; END IF;
  IF class_start <= now() + make_interval(hours => cancel_hours) THEN RAISE EXCEPTION 'Cancelamento não permitido: faltam menos de % horas para a aula.', cancel_hours; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_student_booking_cancellation() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER app_records_b_cancel_guard BEFORE UPDATE ON public.app_records FOR EACH ROW EXECUTE FUNCTION public.guard_student_booking_cancellation();
CREATE POLICY "Students can cancel recipient bookings" ON public.app_records FOR UPDATE TO authenticated
USING (collection = 'Booking' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND lower(p.email) = lower(app_records.data->>'student_email')))
WITH CHECK (collection = 'Booking' AND data->>'status' = 'cancelada' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND lower(p.email) = lower(app_records.data->>'student_email')));