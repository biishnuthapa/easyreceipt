/*
  # Fix Storage Policies and Owner Setting

  1. Changes
    - Ensure owner is set before policy checks
    - Add trigger to set owner automatically
*/

-- Create a trigger to set owner before insert
CREATE OR REPLACE FUNCTION storage.set_owner()
RETURNS trigger AS $$
BEGIN
  NEW.owner = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set owner before insert
DROP TRIGGER IF EXISTS set_owner_trigger ON storage.objects;
CREATE TRIGGER set_owner_trigger
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION storage.set_owner();

-- Recreate policies with proper order
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read files" ON storage.objects;

CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = 'pdfs'
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