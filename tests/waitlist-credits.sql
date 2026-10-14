\set ON_ERROR_STOP on
BEGIN;
SELECT set_config('test.student_id', id::text, true), set_config('test.email', email, true)
FROM public.profiles WHERE full_name ilike '%Victoria%' LIMIT 1;
INSERT INTO public.app_records(id, collection, data)
VALUES ('waitlist-credit-session', 'ClassSession', '{"max_students":0,"class_type_name":"Teste","time":"18:00"}');
UPDATE public.profiles SET data=jsonb_set(data,'{credits}','1'), credits_remaining=1
WHERE id=current_setting('test.student_id')::uuid;
SELECT set_config('request.jwt.claim.sub', current_setting('test.student_id'), true);
INSERT INTO public.app_records(id, collection, owner_id, data)
VALUES ('waitlist-credit-entry', 'WaitlistEntry', current_setting('test.student_id')::uuid,
  jsonb_build_object('student_email',current_setting('test.email'),'student_name','Teste','session_id','waitlist-credit-session','session_date','2099-06-01','session_time','18:00','class_type_name','Teste'));
DO $$
DECLARE amount integer; held boolean;
BEGIN
  SELECT credits_remaining INTO amount FROM public.profiles WHERE id=current_setting('test.student_id')::uuid;
  SELECT (data->>'credit_held')::boolean INTO held FROM public.app_records WHERE id='waitlist-credit-entry';
  IF amount<>0 OR held IS DISTINCT FROM true THEN RAISE EXCEPTION 'Waitlist join must reserve exactly one credit'; END IF;
  BEGIN
    INSERT INTO public.app_records(id,collection,owner_id,data) VALUES ('waitlist-credit-entry-2','WaitlistEntry',current_setting('test.student_id')::uuid,jsonb_build_object('student_email',current_setting('test.email'),'session_id','waitlist-credit-session','session_date','2099-06-02'));
    RAISE EXCEPTION 'Waitlist join without credit was allowed';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Você não tem créditos disponíveis para entrar na fila de espera.' THEN RAISE; END IF;
  END;
END $$;
DELETE FROM public.app_records WHERE id='waitlist-credit-entry';
DO $$ DECLARE amount integer; BEGIN
  SELECT credits_remaining INTO amount FROM public.profiles WHERE id=current_setting('test.student_id')::uuid;
  IF amount<>1 THEN RAISE EXCEPTION 'Leaving waitlist must refund exactly one credit'; END IF;
END $$;
INSERT INTO public.app_records(id, collection, owner_id, data)
VALUES ('waitlist-credit-entry', 'WaitlistEntry', current_setting('test.student_id')::uuid,
  jsonb_build_object('student_email',current_setting('test.email'),'student_name','Teste','session_id','waitlist-credit-session','session_date','2099-06-01','session_time','18:00','class_type_name','Teste'));
UPDATE public.app_records SET data=jsonb_set(data,'{max_students}','1') WHERE id='waitlist-credit-session';
SELECT * FROM public.promote_waitlist('waitlist-credit-session','2099-06-01');
DO $$ DECLARE amount integer; bookings integer; BEGIN
  SELECT credits_remaining INTO amount FROM public.profiles WHERE id=current_setting('test.student_id')::uuid;
  SELECT count(*) INTO bookings FROM public.app_records WHERE collection='Booking' AND data->>'from_waitlist_entry_id'='waitlist-credit-entry';
  IF amount<>0 OR bookings<>1 THEN RAISE EXCEPTION 'Promotion must transfer the held credit without another debit'; END IF;
  IF EXISTS(SELECT 1 FROM public.app_records WHERE id='waitlist-credit-entry') THEN RAISE EXCEPTION 'Promoted waitlist entry must be removed'; END IF;
END $$;
ROLLBACK;