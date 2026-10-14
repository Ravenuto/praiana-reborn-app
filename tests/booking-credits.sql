\set ON_ERROR_STOP on
BEGIN;
-- Every test runs against an existing student inside a rolled-back transaction.
SELECT set_config('test.student_id', id::text, true),set_config('test.email',email,true) FROM public.profiles WHERE full_name ilike '%Victoria%' LIMIT 1;
SELECT set_config('test.session_id',id,true) FROM public.app_records WHERE collection='ClassSession' LIMIT 1;
UPDATE public.profiles SET data=jsonb_set(data,'{credits}','4') WHERE id=current_setting('test.student_id')::uuid;
SELECT set_config('request.jwt.claim.sub',current_setting('test.student_id'),true);
DO $$
DECLARE i integer; b text; amount integer;
BEGIN
 FOR i IN 1..4 LOOP
 INSERT INTO public.app_records(id,collection,owner_id,data) VALUES ('credit-test-'||i,'Booking',current_setting('test.student_id')::uuid,jsonb_build_object('student_email',current_setting('test.email'),'session_id',current_setting('test.session_id'),'session_date','2099-01-0'||i,'status','confirmada'));
 END LOOP;
 SELECT (data->>'credits')::integer INTO amount FROM public.profiles WHERE id=current_setting('test.student_id')::uuid;
 IF amount <> 0 THEN RAISE EXCEPTION 'Four bookings must consume all four credits, got %',amount; END IF;
 BEGIN
 INSERT INTO public.app_records(id,collection,owner_id,data) VALUES ('credit-test-5','Booking',current_setting('test.student_id')::uuid,jsonb_build_object('student_email',current_setting('test.email'),'session_id',current_setting('test.session_id'),'session_date','2099-01-05','status','confirmada'));
 RAISE EXCEPTION 'Fifth booking was allowed';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Esta aluna não tem créditos disponíveis.' THEN RAISE; END IF; END;
 IF EXISTS(SELECT 1 FROM public.app_records WHERE id='credit-test-5') THEN RAISE EXCEPTION 'Failed reservation persisted'; END IF;
 UPDATE public.app_records SET data=data||'{"status":"presente"}' WHERE id='credit-test-1';
 SELECT (data->>'credits')::integer INTO amount FROM public.profiles WHERE id=current_setting('test.student_id')::uuid;
 IF amount<>0 THEN RAISE EXCEPTION 'Attendance must not charge again'; END IF;
 UPDATE public.app_records SET data=data||'{"status":"cancelada"}' WHERE id='credit-test-1';
 UPDATE public.app_records SET data=data||'{"status":"cancelada"}' WHERE id='credit-test-1';
 SELECT (data->>'credits')::integer INTO amount FROM public.profiles WHERE id=current_setting('test.student_id')::uuid;
 IF amount<>1 THEN RAISE EXCEPTION 'Repeated cancellation must refund exactly one'; END IF;
 UPDATE public.profiles SET data=data||'{"credits":4}' WHERE id=current_setting('test.student_id')::uuid;
 SELECT (data->>'credits')::integer INTO amount FROM public.profiles WHERE id=current_setting('test.student_id')::uuid;
 IF amount<>1 THEN RAISE EXCEPTION 'Legacy student writes must not restore stale credits'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','',true);
DO $$
DECLARE amount integer;
BEGIN
 UPDATE public.profiles SET plan_start_date='2099-01-01',plan_end_date='2099-02-01',data=data||'{"credits":4,"_reset_plan_credits":true}' WHERE id=current_setting('test.student_id')::uuid;
 SELECT (data->>'credits')::integer INTO amount FROM public.profiles WHERE id=current_setting('test.student_id')::uuid;
  IF amount<>4 THEN RAISE EXCEPTION 'Renewal of four classes must grant all four purchased credits despite three existing reservations, got %',amount; END IF;
 INSERT INTO public.app_records(id,collection,data) VALUES ('credit-test-guest','Booking',jsonb_build_object('student_email','guest@participante.invalid','guest_type','experimental','session_id',current_setting('test.session_id'),'session_date','2099-01-06','status','confirmada'));
 SELECT (data->>'credits')::integer INTO amount FROM public.profiles WHERE id=current_setting('test.student_id')::uuid;
  IF amount<>4 THEN RAISE EXCEPTION 'Guest must not consume student credits'; END IF;
  INSERT INTO public.app_records(id,collection,owner_id,data) VALUES ('credit-test-new-cycle','Booking',current_setting('test.student_id')::uuid,jsonb_build_object('student_email',current_setting('test.email'),'session_id',current_setting('test.session_id'),'session_date','2099-01-07','status','confirmada'));
  SELECT (data->>'credits')::integer INTO amount FROM public.profiles WHERE id=current_setting('test.student_id')::uuid;
  IF amount<>3 THEN RAISE EXCEPTION 'A new booking after renewal must debit one credit, got %',amount; END IF;
  UPDATE public.app_records SET data=data||'{"status":"cancelada"}' WHERE id='credit-test-new-cycle';
  SELECT (data->>'credits')::integer INTO amount FROM public.profiles WHERE id=current_setting('test.student_id')::uuid;
  IF amount<>4 THEN RAISE EXCEPTION 'Cancellation after renewal must return one credit, got %',amount; END IF;
END $$;
ROLLBACK;
