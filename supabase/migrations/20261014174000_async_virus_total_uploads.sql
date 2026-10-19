CREATE TABLE IF NOT EXISTS public.library_upload_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    target_item_id uuid NOT NULL,
    is_update boolean NOT NULL DEFAULT false,
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'scanning', 'approved', 'rejected', 'failed')),
    status_message text,
    analysis_id text,
    cover_analysis_id text,
    document_sha256 text,
    cover_sha256 text,
    title text NOT NULL,
    author text NOT NULL,
    category text NOT NULL,
    content_type text NOT NULL,
    year integer,
    genre text,
    language text,
    description text,
    file_name text NOT NULL,
    file_mime text NOT NULL,
    file_size bigint NOT NULL CHECK (file_size >= 0),
    file_path text NOT NULL,
    document_quarantine_path text,
    cover_path text,
    cover_quarantine_path text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (document_sha256 IS NULL OR document_sha256 ~ '^[0-9a-f]{64}$'),
    CHECK (cover_sha256 IS NULL OR cover_sha256 ~ '^[0-9a-f]{64}$')
);

CREATE INDEX IF NOT EXISTS library_upload_requests_owner_created_idx
    ON public.library_upload_requests (uploaded_by, created_at DESC);

ALTER TABLE public.library_upload_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Library upload requests: owner read" ON public.library_upload_requests;
CREATE POLICY "Library upload requests: owner read"
    ON public.library_upload_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Library upload requests: owner insert" ON public.library_upload_requests;
CREATE POLICY "Library upload requests: owner insert"
    ON public.library_upload_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = uploaded_by
        AND status = 'pending'
        AND (document_quarantine_path IS NOT NULL OR cover_quarantine_path IS NOT NULL)
        AND (
            (is_update AND target_item_id <> id)
            OR (NOT is_update AND target_item_id = id)
        )
        AND (storage.foldername(file_path))[1] = auth.uid()::text
        AND (
            document_quarantine_path IS NULL
            OR document_quarantine_path = file_path
        )
        AND (
            document_quarantine_path IS NULL
            OR (storage.foldername(document_quarantine_path))[1] = auth.uid()::text
        )
        AND (
            cover_path IS NULL
            OR (storage.foldername(cover_path))[1] = auth.uid()::text
        )
        AND (
            cover_quarantine_path IS NULL
            OR (storage.foldername(cover_quarantine_path))[1] = auth.uid()::text
        )
        AND (
            cover_quarantine_path IS NULL
            OR cover_quarantine_path = cover_path
        )
    );

GRANT SELECT, INSERT ON public.library_upload_requests TO authenticated;
