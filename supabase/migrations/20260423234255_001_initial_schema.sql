/*
  # Mom's Purse - Initial Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `display_name` (text)
      - `avatar_url` (text, optional)
      - `role` (text: 'mom' or 'seeker', default 'seeker')
      - `created_at` (timestamp)

    - `mom_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles, unique)
      - `bio` (text)
      - `location_lat` (float8, optional)
      - `location_lng` (float8, optional)
      - `location_name` (text, e.g. "Santa Monica Beach")
      - `is_active` (boolean, default true - whether currently available)
      - `created_at` (timestamp)

    - `items`
      - `id` (uuid, primary key)
      - `mom_id` (uuid, references mom_profiles)
      - `name` (text, e.g. "Gum", "Sunscreen")
      - `description` (text, optional)
      - `category` (text, e.g. "snacks", "health", "beach", "baby", "general")
      - `is_available` (boolean, default true)
      - `suggested_tip` (numeric, optional suggested tip amount in dollars)
      - `created_at` (timestamp)

    - `requests`
      - `id` (uuid, primary key)
      - `seeker_id` (uuid, references profiles)
      - `item_id` (uuid, references items)
      - `mom_user_id` (uuid, references profiles)
      - `status` (text: 'pending', 'accepted', 'completed', 'cancelled')
      - `tip_amount` (numeric)
      - `message` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Profiles: users can read all, update own
    - Mom profiles: users can read all, insert/update own
    - Items: users can read all, moms can insert/update own items
    - Requests: seekers can create and read own, moms can read and update requests for their items

  3. Indexes
    - Index on mom_profiles.user_id for fast lookups
    - Index on items.mom_id for filtering by mom
    - Index on items.category for category filtering
    - Index on requests.seeker_id and requests.mom_user_id
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  role text NOT NULL DEFAULT 'seeker' CHECK (role IN ('mom', 'seeker')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Mom profiles table
CREATE TABLE IF NOT EXISTS mom_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bio text NOT NULL DEFAULT '',
  location_lat float8,
  location_lng float8,
  location_name text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mom_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mom profiles"
  ON mom_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own mom profile"
  ON mom_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Moms can update own profile"
  ON mom_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mom_id uuid NOT NULL REFERENCES mom_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('snacks', 'health', 'beach', 'baby', 'beauty', 'general')),
  is_available boolean NOT NULL DEFAULT true,
  suggested_tip numeric(10,2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view items"
  ON items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Moms can insert own items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mom_profiles
      WHERE mom_profiles.id = items.mom_id
      AND mom_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Moms can update own items"
  ON items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mom_profiles
      WHERE mom_profiles.id = items.mom_id
      AND mom_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mom_profiles
      WHERE mom_profiles.id = items.mom_id
      AND mom_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Moms can delete own items"
  ON items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mom_profiles
      WHERE mom_profiles.id = items.mom_id
      AND mom_profiles.user_id = auth.uid()
    )
  );

-- Requests table
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  mom_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
  tip_amount numeric(10,2) NOT NULL DEFAULT 0,
  message text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seekers can view own requests"
  ON requests FOR SELECT
  TO authenticated
  USING (auth.uid() = seeker_id OR auth.uid() = mom_user_id);

CREATE POLICY "Seekers can create requests"
  ON requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seeker_id);

CREATE POLICY "Moms can update requests for their items"
  ON requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = mom_user_id)
  WITH CHECK (auth.uid() = mom_user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mom_profiles_user_id ON mom_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_items_mom_id ON items(mom_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_requests_seeker_id ON requests(seeker_id);
CREATE INDEX IF NOT EXISTS idx_requests_mom_user_id ON requests(mom_user_id);
