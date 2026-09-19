-- Execute no SQL Editor do Supabase (Dashboard → SQL → New query)
-- Corrige "permission denied for table profiles" após o cadastro.

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles: select own row" ON public.profiles;
CREATE POLICY "Profiles: select own row"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: insert own row" ON public.profiles;
CREATE POLICY "Profiles: insert own row"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: update own row" ON public.profiles;
CREATE POLICY "Profiles: update own row"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
