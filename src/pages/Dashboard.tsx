import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Item, MomProfile, ItemCategory, ApprovedItem } from '../lib/types';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '../lib/types';
import { Plus, X, MapPin, CreditCard as Edit3, ShoppingBag, ToggleLeft, ToggleRight, Star, Shield, Phone, DollarSign, Clock } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [momProfile, setMomProfile] = useState<MomProfile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [approvedItems, setApprovedItems] = useState<ApprovedItem[]>([]);
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showExchangeHistory, setShowExchangeHistory] = useState(false);

  const [selectedApproved, setSelectedApproved] = useState<string>('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemTip, setItemTip] = useState('1');

  const [bio, setBio] = useState('');
  const [locationName, setLocationName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (profile?.id) fetchMomProfile();
  }, [profile]);

  useEffect(() => {
    if (momProfile) {
      fetchItems();
      fetchApprovedItems();
      fetchExchanges();
    }
  }, [momProfile]);

  const fetchMomProfile = async () => {
    const { data } = await supabase
      .from('mom_profiles')
      .select('*')
      .eq('user_id', profile!.id)
      .maybeSingle();

    if (data) {
      setMomProfile(data);
      setBio(data.bio);
      setLocationName(data.location_name);
    }
    setLoading(false);
  };

  const fetchItems = async () => {
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('mom_id', momProfile!.id)
      .order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const fetchApprovedItems = async () => {
    const { data } = await supabase
      .from('approved_items')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    if (data) setApprovedItems(data);
  };

  const fetchExchanges = async () => {
    const { data } = await supabase
      .from('requests')
      .select('*, items(name), profiles!requests_seeker_id_fkey(display_name)')
      .eq('mom_user_id', profile!.id)
      .in('status', ['completed'])
      .order('updated_at', { ascending: false });
    if (data) setExchanges(data);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!momProfile || !selectedApproved) return;

    const approved = approvedItems.find((a) => a.id === selectedApproved);
    if (!approved) return;

    const already = items.find((i) => i.name === approved.name);
    if (already) return;

    const { error } = await supabase.from('items').insert({
      mom_id: momProfile.id,
      name: approved.name,
      description: itemDesc,
      category: approved.category,
      suggested_tip: itemTip ? parseFloat(itemTip) : null,
      is_available: true,
    });

    if (!error) {
      setSelectedApproved('');
      setItemDesc('');
      setItemTip('1');
      setShowAddItem(false);
      fetchItems();
    }
  };

  const toggleItemAvailability = async (item: Item) => {
    await supabase
      .from('items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id);
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    await supabase.from('items').delete().eq('id', id);
    fetchItems();
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!momProfile) return;

    await supabase
      .from('mom_profiles')
      .update({ bio, location_name: locationName })
      .eq('id', momProfile.id);

    if (phone && profile) {
      await supabase.from('profiles').update({ phone }).eq('id', profile.id);
    }

    fetchMomProfile();
    setShowEditProfile(false);
  };

  const toggleActive = async () => {
    if (!momProfile) return;
    await supabase
      .from('mom_profiles')
      .update({ is_active: !momProfile.is_active })
      .eq('id', momProfile.id);
    fetchMomProfile();
  };

  if (loading) return <div className="page-loading">Loading...</div>;

  if (!momProfile) {
    return (
      <div className="dashboard-page">
        <div className="empty-state">
          <ShoppingBag size={48} />
          <h3>Not a MOM yet?</h3>
          <p>Your profile role needs to include "MOM" to access the dashboard.</p>
        </div>
      </div>
    );
  }

  const groupedApproved = approvedItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ApprovedItem[]>);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>My Purse</h1>
          <p>Manage your items and profile</p>
        </div>
        <div className="active-toggle" onClick={toggleActive}>
          {momProfile.is_active ? <ToggleRight size={36} className="toggle-on" /> : <ToggleLeft size={36} className="toggle-off" />}
          <span>{momProfile.is_active ? 'Active' : 'Inactive'}</span>
        </div>
      </div>

      <div className="dashboard-profile-card">
        <div className="profile-card-info">
          <div className="profile-name-row">
            <h3>{profile?.display_name}</h3>
            {momProfile.verified && <Shield size={16} className="verified-badge-lg" />}
          </div>
          <div className="profile-stats">
            {momProfile.avg_rating != null && (
              <span className="profile-stat">
                <Star size={14} className="star-icon" /> {Number(momProfile.avg_rating).toFixed(1)}
              </span>
            )}
            <span className="profile-stat">{momProfile.exchange_count} exchanges</span>
            <span className="profile-stat earnings-stat">
              <DollarSign size={14} /> {Number(momProfile.total_earnings).toFixed(2)} earned
            </span>
          </div>
          {momProfile.location_name && (
            <p><MapPin size={14} /> {momProfile.location_name}</p>
          )}
          {profile?.phone && (
            <p><Phone size={14} /> {profile.phone}</p>
          )}
          {momProfile.bio && <p className="profile-bio">{momProfile.bio}</p>}
        </div>
        <div className="profile-card-actions">
          <button className="btn-outline btn-sm" onClick={() => { setPhone(profile?.phone || ''); setShowEditProfile(true); }}>
            <Edit3 size={14} /> Edit Profile
          </button>
          {exchanges.length > 0 && (
            <button className="btn-outline btn-sm" onClick={() => setShowExchangeHistory(true)}>
              <Clock size={14} /> History
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-items-header">
        <h2>Items in Your Purse ({items.length})</h2>
        <button className="btn-primary btn-sm" onClick={() => setShowAddItem(true)}>
          <Plus size={16} /> Add Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={48} />
          <h3>Your purse is empty</h3>
          <p>Add items you carry so seekers can find you</p>
          <button className="btn-primary" onClick={() => setShowAddItem(true)}>
            <Plus size={16} /> Add Your First Item
          </button>
        </div>
      ) : (
        <div className="dashboard-items-list">
          {items.map((item) => (
            <div key={item.id} className={`dashboard-item ${!item.is_available ? 'unavailable' : ''}`}>
              <div className="dashboard-item-info">
                <span className="item-cat-badge">{CATEGORY_ICONS[item.category]}</span>
                <div>
                  <strong>{item.name}</strong>
                  {item.description && <span className="item-desc-inline">{item.description}</span>}
                  {item.suggested_tip && (
                    <span className="item-tip-inline">Tip: ${Number(item.suggested_tip).toFixed(2)}</span>
                  )}
                </div>
              </div>
              <div className="dashboard-item-actions">
                <button
                  className="btn-icon"
                  onClick={() => toggleItemAvailability(item)}
                  title={item.is_available ? 'Mark unavailable' : 'Mark available'}
                >
                  {item.is_available ? <ToggleRight size={20} className="toggle-on" /> : <ToggleLeft size={20} className="toggle-off" />}
                </button>
                <button className="btn-icon btn-icon-danger" onClick={() => deleteItem(item.id)}>
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddItem && (
        <div className="modal-overlay" onClick={() => setShowAddItem(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddItem(false)}>
              <X size={20} />
            </button>
            <h2>Add Item from Catalog</h2>
            <p className="modal-sub">Choose from the approved item list. Only community-approved items can be listed.</p>
            <form onSubmit={handleAddItem}>
              <div className="form-group">
                <label>Select an item</label>
                <div className="approved-items-catalog">
                  {(Object.keys(CATEGORY_LABELS) as ItemCategory[]).map((cat) => {
                    const catItems = groupedApproved[cat];
                    if (!catItems || catItems.length === 0) return null;
                    return (
                      <div key={cat} className="catalog-category">
                        <h4>{CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}</h4>
                        <div className="catalog-items">
                          {catItems.map((ai) => {
                            const alreadyAdded = items.some((i) => i.name === ai.name);
                            return (
                              <button
                                key={ai.id}
                                type="button"
                                className={`catalog-item-btn ${selectedApproved === ai.id ? 'active' : ''} ${alreadyAdded ? 'added' : ''}`}
                                onClick={() => !alreadyAdded && setSelectedApproved(ai.id)}
                                disabled={alreadyAdded}
                              >
                                {ai.name} {alreadyAdded && '✓'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="itemDesc">Description (optional)</label>
                <input
                  id="itemDesc"
                  type="text"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder='e.g. "50 SPF", "Spearmint"'
                />
              </div>

              <div className="form-group">
                <label htmlFor="itemTip">Suggested Tip ($)</label>
                <div className="tip-presets">
                  {[0.5, 1, 2].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className={`tip-preset ${itemTip === String(amount) ? 'active' : ''}`}
                      onClick={() => setItemTip(String(amount))}
                    >
                      ${amount.toFixed(2)}
                    </button>
                  ))}
                </div>
                <input
                  id="itemTip"
                  type="number"
                  min="0"
                  step="0.25"
                  value={itemTip}
                  onChange={(e) => setItemTip(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary btn-full" disabled={!selectedApproved}>
                <Plus size={16} /> Add to Purse
              </button>
            </form>
          </div>
        </div>
      )}

      {showEditProfile && (
        <div className="modal-overlay" onClick={() => setShowEditProfile(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEditProfile(false)}>
              <X size={20} />
            </button>
            <h2>Edit MOM Profile</h2>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell seekers about yourself and what you typically carry"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label htmlFor="locationName">Location Name</label>
                <input
                  id="locationName"
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Santa Monica Beach, Central Park"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <button type="submit" className="btn-primary btn-full">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {showExchangeHistory && (
        <div className="modal-overlay" onClick={() => setShowExchangeHistory(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowExchangeHistory(false)}>
              <X size={20} />
            </button>
            <h2>Exchange History</h2>
            <div className="earnings-summary">
              <div className="earnings-card">
                <span className="earnings-label">Total Earned</span>
                <span className="earnings-value">${Number(momProfile.total_earnings).toFixed(2)}</span>
              </div>
              <div className="earnings-card">
                <span className="earnings-label">Exchanges</span>
                <span className="earnings-value">{momProfile.exchange_count}</span>
              </div>
            </div>
            {exchanges.length === 0 ? (
              <p className="empty-text">No completed exchanges yet.</p>
            ) : (
              <div className="exchange-list">
                {exchanges.map((ex) => (
                  <div key={ex.id} className="exchange-item">
                    <div className="exchange-info">
                      <strong>{ex.items?.name || 'Item'}</strong>
                      <span className="exchange-seeker">from {ex.profiles?.display_name || 'Seeker'}</span>
                    </div>
                    <div className="exchange-meta">
                      <span className="exchange-tip">+${Number(ex.tip_amount * 0.88).toFixed(2)}</span>
                      <span className="exchange-date">{new Date(ex.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
