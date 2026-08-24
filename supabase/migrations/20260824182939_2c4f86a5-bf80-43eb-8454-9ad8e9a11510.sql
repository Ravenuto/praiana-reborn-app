ALTER TABLE public.app_records ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.app_records ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.app_records ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
