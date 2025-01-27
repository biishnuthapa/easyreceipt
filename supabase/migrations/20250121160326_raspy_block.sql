/*
  # Initial Schema Setup for Digital Receipt Platform

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - References auth.users
      - `company_name` (text)
      - `company_logo` (text) - URL to logo in storage
      - `signature` (text) - URL to signature in storage
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `receipts`
      - `id` (uuid, primary key)
      - `profile_id` (uuid) - References profiles
      - `customer_name` (text)
      - `customer_email` (text, optional)
      - `customer_whatsapp` (text, optional)
      - `payment_method` (text)
      - `items` (jsonb) - Array of items with names and prices
      - `subtotal` (numeric)
      - `tax` (numeric)
      - `total` (numeric)
      - `sent_via` (text) - 'email' or 'whatsapp'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
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
  customer_name text NOT NULL,
  customer_email text,
  customer_whatsapp text,
  payment_method text NOT NULL,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL,
  tax numeric NOT NULL,
  total numeric NOT NULL,
  sent_via text NOT NULL,
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

-- Create function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();