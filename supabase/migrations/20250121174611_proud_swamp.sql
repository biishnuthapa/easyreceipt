/*
  # Add new fields to receipts table

  1. Changes
    - Add receipt_number field
    - Add customer_number field
    - Add customer_address field
    - Add currency field
    - Add tax_rate field
    - Add signature field
    - Add title field

  2. Security
    - Maintain existing RLS policies
*/

DO $$ 
BEGIN
  -- Add receipt_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'receipts' AND column_name = 'receipt_number'
  ) THEN
    ALTER TABLE receipts ADD COLUMN receipt_number text;
  END IF;

  -- Add customer_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'receipts' AND column_name = 'customer_number'
  ) THEN
    ALTER TABLE receipts ADD COLUMN customer_number text;
  END IF;

  -- Add customer_address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'receipts' AND column_name = 'customer_address'
  ) THEN
    ALTER TABLE receipts ADD COLUMN customer_address text;
  END IF;

  -- Add currency column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'receipts' AND column_name = 'currency'
  ) THEN
    ALTER TABLE receipts ADD COLUMN currency text DEFAULT 'USD';
  END IF;

  -- Add tax_rate column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'receipts' AND column_name = 'tax_rate'
  ) THEN
    ALTER TABLE receipts ADD COLUMN tax_rate numeric DEFAULT 1;
  END IF;

  -- Add signature column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'receipts' AND column_name = 'signature'
  ) THEN
    ALTER TABLE receipts ADD COLUMN signature text;
  END IF;

  -- Add title column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'receipts' AND column_name = 'title'
  ) THEN
    ALTER TABLE receipts ADD COLUMN title text;
  END IF;
END $$;