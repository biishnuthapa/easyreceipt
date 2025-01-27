-- Enable storage by creating the receipts bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true);

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = 'pdfs'
);

-- Create policy to allow authenticated users to update their files
CREATE POLICY "Allow authenticated users to update their files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = 'pdfs'
);

-- Create policy to allow public access to read files
CREATE POLICY "Allow public to read files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'receipts');