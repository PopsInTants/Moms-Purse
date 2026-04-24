import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Item, ItemCategory, Broadcast } from '../lib/types';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '../lib/types';
import { MapPin, Search, ShoppingBag, Megaphone, X, Star, Shield } from 'lucide-react';
import ItemRequestModal from '../components/ItemRequestModal';

export default function Browse() {
  const { profile } = useAuth();
  const [items, setItems] = useState<(Item & { mom_profiles?: any })[]>([]);
  const [broadcasts, setBroadcasts] = useState<(Broadcast & { profiles?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ItemCategory | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastItem, setBroadcastItem] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [view, setView] = useState<'items' | 'broadcasts'>('items');

  useEffect(() => {
    fetchItems();
    fetchBroadcasts();
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
    if (!error && data) setItems(data as any);
    setLoading(false);
  };

  const fetchBroadcasts = async () => {
    const { data } = await supabase
      .from('broadcasts')
      .select('*, profiles(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) setBroadcasts(data as any);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const { error } = await supabase.from('broadcasts').insert({
      seeker_id: profile.id,
      item_name: broadcastItem,
      message: broadcastMsg,
      is_active: true,
    });

    if (!error) {
      setBroadcastItem('');
      setBroadcastMsg('');
      setShowBroadcast(false);
      fetchBroadcasts();
    }
  };

  const deactivateBroadcast = async (id: string) => {
    await supabase.from('broadcasts').update({ is_active: false }).eq('id', id);
    fetchBroadcasts();
  };

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="browse-page">
      <div className="browse-header">
        <div>
          <h1>Browse</h1>
          <p>Find what you need from MOMs nearby</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowBroadcast(true)}>
          <Megaphone size={16} /> In Need Of...
        </button>
      </div>

      <div className="browse-tabs">
        <button
          className={`tab ${view === 'items' ? 'active' : ''}`}
          onClick={() => setView('items')}
        >
          Items
        </button>
        <button
          className={`tab ${view === 'broadcasts' ? 'active' : ''}`}
          onClick={() => setView('broadcasts')}
        >
          <Megaphone size={14} /> In Need Of
        </button>
      </div>

      {view === 'items' && (
        <>
          <div className="browse-controls">
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search for sunscreen, band-aids, gum..."
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
              <p>Try a different search or category, or post an "In Need Of" broadcast</p>
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
                        <span className="mom-name">
                          {item.mom_profiles.profiles?.display_name}
                          {item.mom_profiles.verified && <Shield size={12} className="verified-badge" />}
                        </span>
                        <div className="mom-meta">
                          {item.mom_profiles.avg_rating && (
                            <span className="mom-rating">
                              <Star size={12} /> {Number(item.mom_profiles.avg_rating).toFixed(1)}
                            </span>
                          )}
                          {item.mom_profiles.location_name && (
                            <span className="mom-location">
                              <MapPin size={12} /> {item.mom_profiles.location_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="item-footer">
                    {item.suggested_tip && (
                      <span className="item-tip">Suggested tip: ${Number(item.suggested_tip).toFixed(2)}</span>
                    )}
                    <button className="btn-primary btn-sm" onClick={() => setSelectedItem(item)}>
                      Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'broadcasts' && (
        <>
          {broadcasts.length === 0 ? (
            <div className="empty-state">
              <Megaphone size={48} />
              <h3>No active broadcasts</h3>
              <p>Be the first to post what you need — nearby MOMs will see it</p>
              <button className="btn-primary" onClick={() => setShowBroadcast(true)}>
                <Megaphone size={16} /> Post a Broadcast
              </button>
            </div>
          ) : (
            <div className="broadcasts-list">
              {broadcasts.map((b) => (
                <div key={b.id} className="broadcast-card">
                  <div className="broadcast-header">
                    <Megaphone size={16} className="broadcast-icon" />
                    <span className="broadcast-item-name">{b.item_name}</span>
                    {b.seeker_id === profile?.id && (
                      <button
                        className="btn-icon btn-icon-danger"
                        onClick={() => deactivateBroadcast(b.id)}
                        title="Cancel broadcast"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {b.message && <p className="broadcast-message">"{b.message}"</p>}
                  <div className="broadcast-meta">
                    <span className="broadcast-user">{b.profiles?.display_name || 'A Seeker'}</span>
                    <span className="broadcast-time">{new Date(b.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selectedItem && (
        <ItemRequestModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {showBroadcast && (
        <div className="modal-overlay" onClick={() => setShowBroadcast(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowBroadcast(false)}>
              <X size={20} />
            </button>
            <h2>In Need Of...</h2>
            <p className="modal-sub">Tell nearby MOMs what you need. They'll see your broadcast and can reach out if they have it.</p>
            <form onSubmit={handleBroadcast}>
              <div className="form-group">
                <label htmlFor="broadcastItem">What do you need?</label>
                <input
                  id="broadcastItem"
                  type="text"
                  value={broadcastItem}
                  onChange={(e) => setBroadcastItem(e.target.value)}
                  required
                  placeholder="e.g. Sunscreen, Band-aid, Phone charger"
                />
              </div>
              <div className="form-group">
                <label htmlFor="broadcastMsg">Message (optional)</label>
                <textarea
                  id="broadcastMsg"
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  placeholder="e.g. I'm at the south end of the beach near the volleyball nets"
                  rows={3}
                />
              </div>
              <button type="submit" className="btn-primary btn-full">
                <Megaphone size={16} /> Broadcast to nearby MOMs
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
