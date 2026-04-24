import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Item, ItemCategory } from '../lib/types';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '../lib/types';
import { MapPin, Search, ShoppingBag } from 'lucide-react';
import ItemRequestModal from '../components/ItemRequestModal';

export default function Browse() {
  const { } = useAuth();
  const [items, setItems] = useState<(Item & { mom_profiles?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ItemCategory | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  useEffect(() => {
    fetchItems();
  }, [category]);

  const fetchItems = async () => {
    setLoading(true);
    let query = supabase
      .from('items')
      .select('*, mom_profiles(*, profiles(*))')
      .eq('is_available', true);

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) {
      setItems(data as any);
    }
    setLoading(false);
  };

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>Browse Items</h1>
        <p>Find what you need from Moms nearby</p>
      </div>

      <div className="browse-controls">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search for gum, sunscreen, band-aids..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="category-filters">
          <button
            className={`filter-chip ${category === 'all' ? 'active' : ''}`}
            onClick={() => setCategory('all')}
          >
            All
          </button>
          {(Object.keys(CATEGORY_LABELS) as ItemCategory[]).map((cat) => (
            <button
              key={cat}
              className={`filter-chip ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading items...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={48} />
          <h3>No items found</h3>
          <p>Try a different search or category</p>
        </div>
      ) : (
        <div className="items-grid">
          {filtered.map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-category-badge">
                {CATEGORY_ICONS[item.category]} {CATEGORY_LABELS[item.category]}
              </div>
              <h3>{item.name}</h3>
              {item.description && <p className="item-desc">{item.description}</p>}
              {item.mom_profiles && (
                <div className="item-mom-info">
                  <div className="mom-avatar">
                    {item.mom_profiles.profiles?.display_name?.[0]?.toUpperCase() || 'M'}
                  </div>
                  <div>
                    <span className="mom-name">{item.mom_profiles.profiles?.display_name}</span>
                    {item.mom_profiles.location_name && (
                      <span className="mom-location">
                        <MapPin size={12} /> {item.mom_profiles.location_name}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="item-footer">
                {item.suggested_tip && (
                  <span className="item-tip">Suggested tip: ${Number(item.suggested_tip).toFixed(2)}</span>
                )}
                <button
                  className="btn-primary btn-sm"
                  onClick={() => setSelectedItem(item)}
                >
                  Request
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <ItemRequestModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
