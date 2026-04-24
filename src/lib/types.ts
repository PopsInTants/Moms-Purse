export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: 'mom' | 'seeker';
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

export type ItemCategory = 'snacks' | 'health' | 'beach' | 'baby' | 'beauty' | 'general';

export interface Request {
  id: string;
  seeker_id: string;
  item_id: string;
  mom_user_id: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  tip_amount: number;
  message: string;
  created_at: string;
  updated_at: string;
  items?: Item;
  profiles?: Profile;
}

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  snacks: 'Snacks & Gum',
  health: 'Health & Medicine',
  beach: 'Beach Essentials',
  baby: 'Baby Supplies',
  beauty: 'Beauty & Care',
  general: 'General',
};

export const CATEGORY_ICONS: Record<ItemCategory, string> = {
  snacks: '🍬',
  health: '💊',
  beach: '🏖️',
  baby: '🍼',
  beauty: '💄',
  general: '👜',
};
