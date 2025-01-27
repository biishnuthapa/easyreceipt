/*
  # Add Storage Policies for File Upload

  1. Changes
    - Add policy for authenticated users to create files in storage
    - Add policy for authenticated users to own their files
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read files" ON storage.objects;

-- Create comprehensive storage policies
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = 'pdfs' AND
  auth.uid() = owner
);

CREATE POLICY "Allow authenticated users to update their files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = 'pdfs' AND
  auth.uid() = owner
);

CREATE POLICY "Allow public to read files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'receipts');

-- Ensure owner column is set automatically
ALTER TABLE storage.objects
  ALTER COLUMN owner SET DEFAULT auth.uid();