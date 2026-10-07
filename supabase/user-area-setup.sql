-- Execute no SQL Editor do Supabase após supabase/library-upload-setup.sql
-- Progresso de leitura (RF15) e avaliações (RF16) da área do usuário.

CREATE TABLE IF NOT EXISTS public.reading_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    document_id uuid NOT NULL REFERENCES public.library_items (id) ON DELETE CASCADE,
    page integer NOT NULL DEFAULT 1 CHECK (page >= 0),
    percent numeric(5, 2) NOT NULL DEFAULT 0 CHECK (percent >= 0 AND percent <= 100),
    status text NOT NULL DEFAULT 'lendo' CHECK (status IN ('lendo', 'lido', 'pausado')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, document_id)
);

CREATE INDEX IF NOT EXISTS reading_progress_user_id_idx ON public.reading_progress (user_id);

CREATE TABLE IF NOT EXISTS public.document_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    document_id uuid NOT NULL REFERENCES public.library_items (id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, document_id)
);

CREATE INDEX IF NOT EXISTS document_reviews_user_id_idx ON public.document_reviews (user_id);
CREATE INDEX IF NOT EXISTS document_reviews_document_id_idx ON public.document_reviews (document_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_reviews TO authenticated;
GRANT SELECT ON public.document_reviews TO anon;

ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reading progress: own select" ON public.reading_progress;
CREATE POLICY "Reading progress: own select"
    ON public.reading_progress
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Reading progress: own insert" ON public.reading_progress;
CREATE POLICY "Reading progress: own insert"
    ON public.reading_progress
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Reading progress: own update" ON public.reading_progress;
CREATE POLICY "Reading progress: own update"
    ON public.reading_progress
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Reading progress: own delete" ON public.reading_progress;
CREATE POLICY "Reading progress: own delete"
    ON public.reading_progress
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Document reviews: public read" ON public.document_reviews;
CREATE POLICY "Document reviews: public read"
    ON public.document_reviews
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Document reviews: own insert" ON public.document_reviews;
CREATE POLICY "Document reviews: own insert"
    ON public.document_reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Document reviews: own update" ON public.document_reviews;
CREATE POLICY "Document reviews: own update"
    ON public.document_reviews
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Document reviews: own delete" ON public.document_reviews;
CREATE POLICY "Document reviews: own delete"
    ON public.document_reviews
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
