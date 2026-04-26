export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  photo_url: string | null;
  role: 'mom' | 'seeker' | 'both';
  phone: string;
  zip_code: string;
  suspended: boolean;
  created_at: string;
}

export interface MomProfile {
  id: string;
  user_id: string;
  bio: string;
  location_lat: number | null;
  location_lng: number | null;
  location_name: string;
  is_active: boolean;
  verified: boolean;
  exchange_count: number;
  avg_rating: number | null;
  total_earnings: number;
  zip_code: string;
  created_at: string;
  profiles?: Profile;
}

export interface Item {
  id: string;
  mom_id: string;
  name: string;
  description: string;
  category: ItemCategory;
  is_available: boolean;
  suggested_tip: number | null;
  created_at: string;
  mom_profiles?: MomProfile;
}

export type ItemCategory =
  | 'sunscreen'
  | 'firstaid'
  | 'hair'
  | 'beauty'
  | 'laundry'
  | 'snacks'
  | 'tech'
  | 'general';

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  sunscreen: 'Sunscreen & Sun Care',
  firstaid: 'First Aid & Bandages',
  hair: 'Hair Ties & Accessories',
  beauty: 'Chapstick & Beauty',
  laundry: 'Tide Pen & Laundry',
  snacks: 'Gum & Mints',
  tech: 'Phone Chargers & Tech',
  general: 'Safety Pins & General',
};

export const CATEGORY_ICONS: Record<ItemCategory, string> = {
  sunscreen: '☀️',
  firstaid: '🩹',
  hair: '🎀',
  beauty: '💄',
  laundry: '🧴',
  snacks: '🍬',
  tech: '🔌',
  general: '📌',
};

export interface ApprovedItem {
  id: string;
  name: string;
  category: ItemCategory;
  is_active: boolean;
  created_at: string;
}

export interface Broadcast {
  id: string;
  seeker_id: string;
  item_name: string;
  message: string;
  is_active: boolean;
  created_at: string;
  profiles?: Profile;
}

export interface Request {
  id: string;
  seeker_id: string;
  item_id: string;
  mom_user_id: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  tip_amount: number;
  tip_paid: boolean;
  platform_fee: number | null;
  message: string;
  created_at: string;
  updated_at: string;
  items?: Item;
  profiles?: Profile;
}

export interface Rating {
  id: string;
  request_id: string;
  rater_id: string;
  ratee_id: string;
  score: number;
  comment: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'request_received' | 'request_accepted' | 'broadcast_match' | 'tip_received' | 'rating_received';
  title: string;
  body: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  request_id: string | null;
  reason: string;
  created_at: string;
}
