REVOKE ALL ON FUNCTION public.promote_waitlist(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promote_waitlist(text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.promote_waitlist(_session_id text, _session_date text, _cancelled_booking_id text)
RETURNS TABLE(booking_id text, student_email text, student_name text, class_type_name text, session_time text, session_date text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE source public.app_records%ROWTYPE; head public.app_records%ROWTYPE; created public.app_records%ROWTYPE; staff boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acesso não autorizado.'; END IF;
  staff := public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher');
  SELECT * INTO source FROM public.app_records r
  WHERE r.id=_cancelled_booking_id AND r.collection='Booking'
    AND r.data->>'session_id'=_session_id AND r.data->>'session_date'=_session_date
    AND COALESCE(r.data->>'status','confirmada')='cancelada'
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cancelamento não encontrado.'; END IF;
  IF NOT staff AND source.owner_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Acesso não autorizado.'; END IF;
  IF COALESCE((source.data->>'waitlist_promotion_processed')::boolean,false) THEN RETURN; END IF;
  UPDATE public.app_records SET data=jsonb_set(data,'{waitlist_promotion_processed}','true'::jsonb) WHERE id=source.id;
  PERFORM pg_advisory_xact_lock(hashtextextended(COALESCE(_session_id, '') || ':' || COALESCE(_session_date, ''), 0));
  SELECT * INTO head FROM public.app_records r
  WHERE r.collection='WaitlistEntry' AND r.data->>'session_id'=_session_id AND r.data->>'session_date'=_session_date
    AND COALESCE((r.data->>'credit_held')::boolean,false)
  ORDER BY (r.data->>'position')::integer, r.created_date, r.id
  FOR UPDATE LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;
  PERFORM set_config('praiana.promoting_waitlist_id', head.id, true);
  INSERT INTO public.app_records(collection, owner_id, data)
  VALUES ('Booking', head.owner_id, (head.data - 'position' - 'credit_held' - 'credit_student_id') || jsonb_build_object('status','confirmada','from_waitlist_entry_id',head.id,'promotion_source_booking_id',source.id))
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

REVOKE ALL ON FUNCTION public.promote_waitlist(text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_waitlist(text,text,text) TO authenticated, service_role;