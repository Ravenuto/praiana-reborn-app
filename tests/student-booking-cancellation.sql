\set ON_ERROR_STOP on
BEGIN;
-- Isolated fixtures and balance changes are always rolled back, including the ledger.
SELECT set_config('test.admin', user_id::text, true) FROM public.user_roles WHERE role='admin' LIMIT 1;
SELECT set_config('test.student', p.id::text, true), set_config('test.email', p.email, true)
FROM public.profiles p WHERE NOT public.has_role(p.id,'admin') AND NOT public.has_role(p.id,'teacher') ORDER BY p.id LIMIT 1;
SELECT set_config('test.other', p.id::text, true), set_config('test.other_email', p.email, true)
FROM public.profiles p WHERE NOT public.has_role(p.id,'admin') AND NOT public.has_role(p.id,'teacher') AND p.id<>current_setting('test.student')::uuid ORDER BY p.id LIMIT 1;
UPDATE public.profiles SET is_active=true,plan_start_date=now()-interval '1 day',plan_end_date='2100-01-01',
data=(data-'carryover_credits'-'carryover_expires'-'carryover_base')||'{"credits":4,"plan_paused":false}'::jsonb
WHERE id IN (current_setting('test.student')::uuid,current_setting('test.other')::uuid);
SELECT set_config('request.jwt.claim.sub',current_setting('test.admin'),true);
INSERT INTO public.app_records(id,collection,owner_id,data) VALUES
('cancellation-test-normal-session','ClassSession',current_setting('test.admin')::uuid,'{"time":"18:00","max_students":8}'),
('cancellation-test-free-session','ClassSession',current_setting('test.admin')::uuid,'{"time":"18:00","max_students":8,"is_free":true}'),
('cancellation-test-near-session','ClassSession',current_setting('test.admin')::uuid,jsonb_build_object('time',to_char((now()+interval '2 hours') AT TIME ZONE 'America/Sao_Paulo','HH24:MI'),'max_students',8));
INSERT INTO public.app_records(id,collection,owner_id,data) VALUES
('cancellation-test-normal','Booking',current_setting('test.admin')::uuid,jsonb_build_object('student_email',current_setting('test.email'),'session_id','cancellation-test-normal-session','session_date','2099-01-01','status','confirmada')),
('cancellation-test-free','Booking',current_setting('test.admin')::uuid,jsonb_build_object('student_email',current_setting('test.email'),'session_id','cancellation-test-free-session','session_date','2099-01-01','status','confirmada')),
('cancellation-test-other','Booking',current_setting('test.admin')::uuid,jsonb_build_object('student_email',current_setting('test.other_email'),'session_id','cancellation-test-normal-session','session_date','2099-01-02','status','confirmada')),
('cancellation-test-near','Booking',current_setting('test.admin')::uuid,jsonb_build_object('student_email',current_setting('test.email'),'session_id','cancellation-test-near-session','session_date',to_char((now()+interval '2 hours') AT TIME ZONE 'America/Sao_Paulo','YYYY-MM-DD'),'status','confirmada'));
-- Start the no-credit fixture at exactly zero; admin insertion must remain free.
SELECT set_config('request.jwt.claim.sub','',true);
UPDATE public.profiles SET data=data||'{"credits":0}'::jsonb WHERE id=current_setting('test.student')::uuid;
SELECT set_config('request.jwt.claim.sub',current_setting('test.admin'),true);
INSERT INTO public.app_records(id,collection,owner_id,data) VALUES
('cancellation-test-zero','Booking',current_setting('test.admin')::uuid,jsonb_build_object('student_email',current_setting('test.email'),'session_id','cancellation-test-normal-session','session_date','2099-01-03','status','confirmada','admin_zero_credit',true));
SELECT set_config('request.jwt.claim.sub',current_setting('test.student'),true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE affected integer; balance integer;
BEGIN
 UPDATE public.app_records SET data=data||'{"status":"cancelada"}'::jsonb WHERE id='cancellation-test-zero';
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected<>1 THEN RAISE EXCEPTION 'Student must cancel the admin-created zero-credit booking'; END IF;
 SELECT credits_remaining INTO balance FROM public.profiles WHERE id=auth.uid();
 IF balance<>0 THEN RAISE EXCEPTION 'Zero-credit cancellation must leave balance at 0, got %',balance; END IF;
 UPDATE public.app_records SET data=data||'{"status":"cancelada"}'::jsonb WHERE id='cancellation-test-free';
 SELECT credits_remaining INTO balance FROM public.profiles WHERE id=auth.uid();
 IF balance<>0 THEN RAISE EXCEPTION 'Free cancellation must not grant credit, got %',balance; END IF;
 UPDATE public.app_records SET data=data||'{"status":"cancelada"}'::jsonb WHERE id='cancellation-test-normal';
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected<>1 THEN RAISE EXCEPTION 'Student must cancel her own booking created by admin'; END IF;
 SELECT credits_remaining INTO balance FROM public.profiles WHERE id=auth.uid();
 IF balance<>1 THEN RAISE EXCEPTION 'Charged cancellation must refund exactly 1 credit, got %',balance; END IF;
 UPDATE public.app_records SET data=data||'{"status":"cancelada"}'::jsonb WHERE id='cancellation-test-normal';
 SELECT credits_remaining INTO balance FROM public.profiles WHERE id=auth.uid();
 IF balance<>1 THEN RAISE EXCEPTION 'Repeated cancellation must not refund again, got %',balance; END IF;
 UPDATE public.app_records SET data=data||'{"status":"cancelada"}'::jsonb WHERE id='cancellation-test-other';
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected<>0 THEN RAISE EXCEPTION 'Student must never cancel another student booking'; END IF;
 BEGIN
  UPDATE public.app_records SET data=data||'{"status":"cancelada","admin_zero_credit":true}'::jsonb WHERE id='cancellation-test-near';
  RAISE EXCEPTION 'Student changed protected booking fields';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM<>'Você só pode cancelar a reserva, sem alterar os demais dados.' THEN RAISE; END IF;
 END;
 BEGIN
  UPDATE public.app_records SET data=data||'{"status":"cancelada"}'::jsonb WHERE id='cancellation-test-near';
  RAISE EXCEPTION 'Student bypassed the four-hour deadline';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM<>'Cancelamento não permitido: faltam menos de 4 horas para a aula.' THEN RAISE; END IF;
 END;
 IF NOT EXISTS(SELECT 1 FROM public.app_records WHERE id='cancellation-test-normal' AND data->>'status'='cancelada') THEN RAISE EXCEPTION 'Cancelled status cannot be read back'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
\echo 'PASS: admin-created cancellation, exactly one refund, free/zero refunds, recipient isolation, protected fields, four-hour deadline, and read-back; all fixture changes rolled back.'