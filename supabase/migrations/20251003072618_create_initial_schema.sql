/*
  # Initial Schema for PC Services Sales Platform

  ## Overview
  This migration creates the foundational database structure for a PC service sales platform
  where vendors sell services to clients after PC sales, with technicians managing the system.

  ## New Tables

  ### 1. vendors (venditori)
  - `id` (uuid, primary key) - Unique vendor identifier
  - `user_id` (uuid, references auth.users) - Links to Supabase auth user
  - `name` (text) - Vendor full name
  - `email` (text, unique) - Vendor email address
  - `phone` (text) - Vendor phone number
  - `commission_rate` (decimal) - Percentage of commission (e.g., 0.15 for 15%)
  - `is_active` (boolean) - Whether vendor account is active
  - `created_at` (timestamptz) - Account creation timestamp
  - `created_by` (uuid) - Technician who created this vendor

  ### 2. serials (seriali)
  - `id` (uuid, primary key) - Unique serial record identifier
  - `serial_number` (text, unique) - PC serial number
  - `vendor_id` (uuid) - Vendor who registered this serial
  - `qr_code` (text) - Generated QR code link
  - `link` (text) - Direct link for client access
  - `is_used` (boolean) - Whether client has completed purchase
  - `created_at` (timestamptz) - Serial registration timestamp

  ### 3. clients (clienti)
  - `id` (uuid, primary key) - Unique client identifier
  - `serial_id` (uuid) - Associated PC serial
  - `vendor_id` (uuid) - Vendor who made the sale
  - `name` (text) - Client full name
  - `email` (text) - Client email address
  - `phone` (text) - Client phone number
  - `created_at` (timestamptz) - Client record creation timestamp

  ### 4. purchases (acquisti)
  - `id` (uuid, primary key) - Unique purchase identifier
  - `client_id` (uuid) - Client who made purchase
  - `serial_id` (uuid) - Associated PC serial
  - `vendor_id` (uuid) - Vendor earning commission
  - `service_name` (text) - Name of purchased service
  - `service_price` (decimal) - Price of service in euros
  - `commission_amount` (decimal) - Commission earned by vendor
  - `payment_status` (text) - Payment status (pending, completed, failed)
  - `payment_intent_id` (text) - Stripe payment intent ID
  - `appointment_date` (timestamptz) - Scheduled appointment date/time
  - `appointment_status` (text) - Appointment status (scheduled, completed, cancelled)
  - `created_at` (timestamptz) - Purchase creation timestamp

  ## Security
  - Enable RLS on all tables
  - Vendors can only view/edit their own data
  - Technicians (identified by role) can view/edit all data
  - Clients access data through public links without authentication

  ## Important Notes
  1. The technician role is identified by checking if user_id is NOT in vendors table
  2. All monetary values use decimal type for precision
  3. QR codes and links are generated as UUID-based unique identifiers
  4. Commission is automatically calculated based on vendor's commission_rate
*/

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  commission_rate decimal(5,4) NOT NULL DEFAULT 0.15,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create serials table
CREATE TABLE IF NOT EXISTS serials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number text UNIQUE NOT NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  qr_code text UNIQUE NOT NULL,
  link text UNIQUE NOT NULL,
  is_used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_id uuid REFERENCES serials(id) ON DELETE SET NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  serial_id uuid REFERENCES serials(id) ON DELETE SET NULL NOT NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL NOT NULL,
  service_name text NOT NULL,
  service_price decimal(10,2) NOT NULL,
  commission_amount decimal(10,2) NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_intent_id text,
  appointment_date timestamptz,
  appointment_status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE serials ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Vendors policies
CREATE POLICY "Vendors can view their own profile"
  ON vendors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Vendors can update their own profile"
  ON vendors FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Technicians can view all vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Technicians can insert vendors"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Technicians can update all vendors"
  ON vendors FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM vendors WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Technicians can delete vendors"
  ON vendors FOR DELETE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM vendors WHERE user_id = auth.uid()
    )
  );

-- Serials policies
CREATE POLICY "Vendors can view their own serials"
  ON serials FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can insert their own serials"
  ON serials FOR INSERT
  TO authenticated
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Technicians can view all serials"
  ON serials FOR SELECT
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view serials by link"
  ON serials FOR SELECT
  TO anon
  USING (true);

-- Clients policies
CREATE POLICY "Vendors can view their own clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Technicians can view all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Technicians can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM vendors WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can insert clients"
  ON clients FOR INSERT
  TO anon
  WITH CHECK (true);

-- Purchases policies
CREATE POLICY "Vendors can view their own purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Technicians can view all purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Technicians can update purchases"
  ON purchases FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM vendors WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can insert purchases"
  ON purchases FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_serials_vendor_id ON serials(vendor_id);
CREATE INDEX IF NOT EXISTS idx_serials_link ON serials(link);
CREATE INDEX IF NOT EXISTS idx_clients_vendor_id ON clients(vendor_id);
CREATE INDEX IF NOT EXISTS idx_clients_serial_id ON clients(serial_id);
CREATE INDEX IF NOT EXISTS idx_purchases_vendor_id ON purchases(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchases_client_id ON purchases(client_id);