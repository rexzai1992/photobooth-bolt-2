/*
  # Admin Photo Management System

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `role` (text, default 'admin')
      - `created_at` (timestamp)
      - `last_login` (timestamp)
    
    - `generated_photos`
      - `id` (uuid, primary key)
      - `season_id` (text, indexed)
      - `file_path` (text)
      - `file_url` (text)
      - `original_filename` (text)
      - `file_size` (bigint)
      - `image_width` (integer)
      - `image_height` (integer)
      - `mime_type` (text)
      - `generation_timestamp` (timestamp)
      - `metadata` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for admin access only
    - Create indexes for performance

  3. Storage
    - Create storage bucket for photos
    - Set up proper access policies
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  is_active boolean DEFAULT true
);

-- Create generated_photos table
CREATE TABLE IF NOT EXISTS generated_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id text NOT NULL,
  file_path text NOT NULL,
  file_url text NOT NULL,
  original_filename text NOT NULL,
  file_size bigint NOT NULL,
  image_width integer NOT NULL,
  image_height integer NOT NULL,
  mime_type text NOT NULL DEFAULT 'image/png',
  generation_timestamp timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_generated_photos_season_id ON generated_photos(season_id);
CREATE INDEX IF NOT EXISTS idx_generated_photos_generation_timestamp ON generated_photos(generation_timestamp);
CREATE INDEX IF NOT EXISTS idx_generated_photos_created_at ON generated_photos(created_at);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_photos ENABLE ROW LEVEL SECURITY;

-- Admin users policies
CREATE POLICY "Admin users can read own data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admin users can update own data"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Generated photos policies (admin access only)
CREATE POLICY "Admins can read all photos"
  ON generated_photos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can insert photos"
  ON generated_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can update photos"
  ON generated_photos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can delete photos"
  ON generated_photos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-photos', 'generated-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Admins can upload photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'generated-photos' AND
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can view photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'generated-photos' AND
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can delete photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'generated-photos' AND
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );