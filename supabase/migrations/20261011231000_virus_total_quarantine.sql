-- Apply with `supabase db push`. Configure the server-only VirusTotal secret and deploy:
--   supabase secrets set VIRUSTOTAL_API_KEY=<sua-chave>
--   supabase functions deploy scan-virus-total

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('library-quarantine', 'library-quarantine', false, 52428800)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "Library documents: authenticated upload own folder" ON storage.objects;
DROP POLICY IF EXISTS "Library covers: authenticated upload own folder" ON storage.objects;

DROP POLICY IF EXISTS "Library quarantine: authenticated upload own folder" ON storage.objects;
CREATE POLICY "Library quarantine: authenticated upload own folder"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'library-quarantine'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Library quarantine: owner delete" ON storage.objects;
CREATE POLICY "Library quarantine: owner delete"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'library-quarantine'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
