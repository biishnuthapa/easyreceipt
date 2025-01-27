/*
  # Complete Database Schema for Digital Receipt System
  
  1. Tables
    - profiles: Stores user profile information
    - receipts: Stores receipt data with all necessary fields
  
  2. Security
    - Row Level Security (RLS) enabled on all tables
    - Policies for user data access control
    - Storage policies for file management
  
  3. Storage
    - Receipts bucket for PDF storage
    - Public access for reading files
    - Restricted upload/update access
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  company_name text,
  company_logo text,
  signature text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create receipts table
CREATE TABLE receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) NOT NULL,
  receipt_number text,
  customer_name text NOT NULL,
  customer_email text,
  customer_whatsapp text,
  customer_number text,
  customer_address text,
  payment_method text NOT NULL,
  items jsonb NOT NULL,
  currency text DEFAULT 'USD',
  subtotal numeric NOT NULL,
  tax_rate numeric DEFAULT 1,
  tax numeric NOT NULL,
  total numeric NOT NULL,
  sent_via text NOT NULL,
  signature text,
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_sent_via CHECK (sent_via IN ('email', 'whatsapp'))
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for receipts
CREATE POLICY "Users can view own receipts"
  ON receipts
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can create receipts"
  ON receipts
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own receipts"
  ON receipts
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid());

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
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
  (storage.foldername(name))[1] = 'pdfs'
);

CREATE POLICY "Allow public to read files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'receipts');

-- Create function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name)
  VALUES (new.id, (new.raw_user_meta_data->>'company_name')::text);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();