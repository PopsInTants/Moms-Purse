/*
  # Full Feature Set Migration

  1. Changes to `profiles`
    - Add `zip_code`, `photo_url`, `suspended` columns
    - Allow 'both' role

  2. Changes to `mom_profiles`
    - Add `total_earnings`, `zip_code` columns

  3. Changes to `items`
    - Drop old category constraint, migrate data, add new constraint

  4. New tables: `approved_items`, `notifications`, `reports`

  5. Changes to `requests`
    - Add `tip_paid`, `platform_fee` columns

  6. Database triggers for auto-notifications
*/

-- 1. Update profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended boolean DEFAULT false;

DO $$
BEGIN
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
    CHECK (role = ANY (ARRAY['mom'::text, 'seeker'::text, 'both'::text]));
END $$;

-- 2. Update mom_profiles
ALTER TABLE mom_profiles ADD COLUMN IF NOT EXISTS total_earnings numeric DEFAULT 0;
ALTER TABLE mom_profiles ADD COLUMN IF NOT EXISTS zip_code text DEFAULT '';

-- 3. Migrate items categories: drop constraint first, update data, re-add
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_category_check;

UPDATE items SET category = 'sunscreen' WHERE category = 'beach';
UPDATE items SET category = 'firstaid' WHERE category = 'health';
UPDATE items SET category = 'beauty' WHERE category = 'baby';

ALTER TABLE items ADD CONSTRAINT items_category_check
  CHECK (category = ANY (ARRAY['sunscreen'::text, 'firstaid'::text, 'hair'::text, 'beauty'::text, 'laundry'::text, 'snacks'::text, 'tech'::text, 'general'::text]));

-- 4. Create approved_items
CREATE TABLE IF NOT EXISTS approved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['sunscreen'::text, 'firstaid'::text, 'hair'::text, 'beauty'::text, 'laundry'::text, 'snacks'::text, 'tech'::text, 'general'::text])),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE approved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved items"
  ON approved_items FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO approved_items (name, category) VALUES
  ('Sunscreen SPF 50', 'sunscreen'),
  ('Sunscreen SPF 30', 'sunscreen'),
  ('Aloe Vera', 'sunscreen'),
  ('After-Sun Lotion', 'sunscreen'),
  ('Bug Spray', 'sunscreen'),
  ('Band-aids', 'firstaid'),
  ('Moleskin', 'firstaid'),
  ('Antiseptic Wipes', 'firstaid'),
  ('Pain Relief (sealed)', 'firstaid'),
  ('Allergy Medicine (sealed)', 'firstaid'),
  ('Hair Ties', 'hair'),
  ('Bobby Pins', 'hair'),
  ('Safety Pins', 'hair'),
  ('Hair Clips', 'hair'),
  ('Chapstick', 'beauty'),
  ('Lip Balm', 'beauty'),
  ('Lotion', 'beauty'),
  ('Hand Sanitizer', 'beauty'),
  ('Floss Picks', 'beauty'),
  ('Tide Pen', 'laundry'),
  ('Stain Remover', 'laundry'),
  ('Wet Wipes', 'laundry'),
  ('Gum', 'snacks'),
  ('Mints', 'snacks'),
  ('Breath Strips', 'snacks'),
  ('Phone Charger (Lightning)', 'tech'),
  ('Phone Charger (USB-C)', 'tech'),
  ('Phone Charger (Micro-USB)', 'tech'),
  ('Portable Battery', 'tech'),
  ('Tissues', 'general'),
  ('Tape', 'general'),
  ('Scissors', 'general'),
  ('Pen', 'general')
ON CONFLICT (name) DO NOTHING;

-- 5. Create notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  reference_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 6. Create reports
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id),
  reported_id uuid NOT NULL REFERENCES profiles(id),
  request_id uuid REFERENCES requests(id),
  reason text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- 7. Update requests
ALTER TABLE requests ADD COLUMN IF NOT EXISTS tip_paid boolean DEFAULT false;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS platform_fee numeric;

-- 8. Auto-notification triggers
CREATE OR REPLACE FUNCTION notify_mom_on_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, reference_id)
  VALUES (
    NEW.mom_user_id,
    'request_received',
    'New item request!',
    'A Seeker has requested an item from you.',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_request_created ON requests;
CREATE TRIGGER on_request_created
  AFTER INSERT ON requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_mom_on_request();

CREATE OR REPLACE FUNCTION notify_on_request_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, body, reference_id)
    VALUES (
      NEW.seeker_id,
      'request_accepted',
      'Request accepted!',
      'A MOM has accepted your item request.',
      NEW.id
    );
  END IF;

  IF NEW.status = 'completed' AND OLD.status = 'accepted' THEN
    UPDATE requests
    SET platform_fee = NEW.tip_amount * 0.12,
        tip_paid = true
    WHERE id = NEW.id;

    UPDATE mom_profiles
    SET total_earnings = total_earnings + (NEW.tip_amount * 0.88),
        exchange_count = exchange_count + 1
    WHERE user_id = NEW.mom_user_id;

    INSERT INTO notifications (user_id, type, title, body, reference_id)
    VALUES (
      NEW.mom_user_id,
      'tip_received',
      'Tip received!',
      'You received a tip of $' || NEW.tip_amount || ' (minus 12% platform fee).',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_request_updated ON requests;
CREATE TRIGGER on_request_updated
  AFTER UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_request_update();

CREATE OR REPLACE FUNCTION notify_moms_on_broadcast()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, reference_id)
  SELECT
    mp.user_id,
    'broadcast_match',
    'A Seeker needs something!',
    'Someone nearby is looking for: ' || NEW.item_name,
    NEW.id
  FROM mom_profiles mp
  JOIN items i ON i.mom_id = mp.id
  WHERE mp.is_active = true
    AND (i.name ILIKE '%' || NEW.item_name || '%'
         OR i.description ILIKE '%' || NEW.item_name || '%')
    AND mp.user_id != NEW.seeker_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_broadcast_created ON broadcasts;
CREATE TRIGGER on_broadcast_created
  AFTER INSERT ON broadcasts
  FOR EACH ROW
  EXECUTE FUNCTION notify_moms_on_broadcast();
