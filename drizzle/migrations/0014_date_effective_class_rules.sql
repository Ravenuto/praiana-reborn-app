CREATE OR REPLACE FUNCTION public.session_data_on_date(_session_id text, _date text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result jsonb; version jsonb;
BEGIN
 SELECT data INTO result FROM public.app_records WHERE collection='ClassSession' AND id=_session_id;
 IF result IS NULL THEN RETURN NULL; END IF;
 FOR version IN SELECT value FROM jsonb_array_elements(COALESCE(result->'session_versions','[]'::jsonb)) WHERE value->>'from' <= _date ORDER BY value->>'from' LOOP
  result := result || (version->'data');
 END LOOP;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.session_data_on_date(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.session_data_on_date(text,text) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.session_is_free(_session_id text, _date text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT COALESCE((public.session_data_on_date(_session_id,_date)->>'is_free')::boolean,false);
$$;
REVOKE ALL ON FUNCTION public.session_is_free(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.session_is_free(text,text) TO authenticated,service_role;
DO $$
DECLARE f record; definition text;
BEGIN
 FOR f IN SELECT oid FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('apply_booking_credits','apply_waitlist_credits','admin_place_from_waitlist','promote_waitlist') LOOP
  definition := pg_get_functiondef(f.oid);
  definition := replace(definition, 'public.session_is_free(payload->>''session_id'')', 'public.session_is_free(payload->>''session_id'',payload->>''session_date'')');
  definition := replace(definition, 'public.session_is_free(head.data->>''session_id'')', 'public.session_is_free(head.data->>''session_id'',head.data->>''session_date'')');
  definition := replace(definition, 'public.session_is_free(_session_id)', 'public.session_is_free(_session_id,_session_date)');
  definition := replace(definition, 'SELECT COALESCE((r.data->>''max_students'')::integer, 8) INTO capacity FROM public.app_records r WHERE r.collection=''ClassSession'' AND r.id=payload->>''session_id'';', 'SELECT COALESCE((public.session_data_on_date(payload->>''session_id'',payload->>''session_date'')->>''max_students'')::integer,8) INTO capacity FROM public.app_records r WHERE r.collection=''ClassSession'' AND r.id=payload->>''session_id'';');
  EXECUTE definition;
 END LOOP;
END $$;