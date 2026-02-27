-- Security Policies for JustBB

-- 1. Enable RLS
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;

-- 2. Select Policies (Reading)
-- Allow anyone to read public memos that are not deleted
CREATE POLICY "Public memos are viewable by everyone" 
ON memos FOR SELECT 
USING (is_private = FALSE AND deleted_at IS NULL);

-- Allow authenticated admins to read everything
CREATE POLICY "Admins can read all memos" 
ON memos FOR SELECT 
TO authenticated 
USING (TRUE);

-- 3. Write Policies (Creating)
-- Only authenticated users (admins) can create memos
CREATE POLICY "Admins can create memos" 
ON memos FOR INSERT 
TO authenticated 
WITH CHECK (TRUE);

-- 4. Update Policies
-- Only authenticated users (admins) can update memos
CREATE POLICY "Admins can update memos" 
ON memos FOR UPDATE 
TO authenticated 
USING (TRUE) 
WITH CHECK (TRUE);

-- 5. Delete Policies (Physical Delete)
-- Note: The app uses soft delete (deleted_at), but RLS should still protect physical delete
CREATE POLICY "Admins can delete memos" 
ON memos FOR DELETE 
TO authenticated 
USING (TRUE);

-- 6. Storage Security (Assume a 'memos' bucket exists)
-- Note: Run these only if you use Supabase Storage
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'memos');
-- CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'memos');
