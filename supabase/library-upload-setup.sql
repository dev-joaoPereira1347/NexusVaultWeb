-- Execute no SQL Editor do Supabase (Dashboard → SQL → New query)
--
-- Buckets recomendados (Storage → New bucket):
--   1) library-documents — arquivos da biblioteca (PDF, EPUB, TXT, MD); marque como Public bucket.
--   2) library-covers     — capas dos livros (WebP); marque como Public bucket.
--
-- O script abaixo cria os buckets (se ainda não existirem), a tabela de metadados e as políticas.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'library-documents',
    'library-documents',
    true,
    52428800,
    ARRAY['application/pdf', 'application/epub+zip', 'text/plain', 'text/markdown', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'library-covers',
    'library-covers',
    true,
    5242880,
    ARRAY['image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE IF NOT EXISTS public.library_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    title text NOT NULL,
    author text NOT NULL,
    category text NOT NULL,
    content_type text NOT NULL,
    year integer,
    genre text,
    language text,
    description text,
    file_path text NOT NULL,
    file_name text NOT NULL,
    file_mime text NOT NULL,
    file_size bigint NOT NULL,
    cover_path text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS library_items_uploaded_by_idx ON public.library_items (uploaded_by);
CREATE INDEX IF NOT EXISTS library_items_created_at_idx ON public.library_items (created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_items TO authenticated;
GRANT SELECT ON public.library_items TO anon;

ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Library items: public read" ON public.library_items;
CREATE POLICY "Library items: public read"
    ON public.library_items
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Library items: insert own" ON public.library_items;
CREATE POLICY "Library items: insert own"
    ON public.library_items
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Library items: update own" ON public.library_items;
CREATE POLICY "Library items: update own"
    ON public.library_items
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = uploaded_by)
    WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Library items: delete own" ON public.library_items;
CREATE POLICY "Library items: delete own"
    ON public.library_items
    FOR DELETE
    TO authenticated
    USING (auth.uid() = uploaded_by);

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Library documents: public read" ON storage.objects;
CREATE POLICY "Library documents: public read"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'library-documents');

DROP POLICY IF EXISTS "Library documents: authenticated upload own folder" ON storage.objects;
CREATE POLICY "Library documents: authenticated upload own folder"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'library-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Library documents: owner delete" ON storage.objects;
CREATE POLICY "Library documents: owner delete"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'library-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Library covers: public read" ON storage.objects;
CREATE POLICY "Library covers: public read"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'library-covers');

DROP POLICY IF EXISTS "Library covers: authenticated upload own folder" ON storage.objects;
CREATE POLICY "Library covers: authenticated upload own folder"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'library-covers'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Library covers: owner delete" ON storage.objects;
CREATE POLICY "Library covers: owner delete"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'library-covers'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );