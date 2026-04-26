import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { MomProfile, ItemCategory } from '../lib/types';
import { CATEGORY_ICONS } from '../lib/types';
import { MapPin, Star, Shield, Navigation, X, Handbag } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const momIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MomWithItems extends MomProfile {
  profiles?: any;
  items?: any[];
}

function RecenterButton({ center }: { center: [number, number] }) {
  const map = useMap();
  return (
    <button
      className="map-recenter-btn"
      onClick={() => map.flyTo(center, 14)}
      title="Re-center map"
    >
      <Navigation size={18} />
    </button>
  );
}

export default function MapPage() {
  const { } = useAuth();
  const [moms, setMoms] = useState<MomWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState<[number, number]>([40.7128, -74.006]);
  const [locationError, setLocationError] = useState('');
  const [selectedMom, setSelectedMom] = useState<MomWithItems | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => setLocationError('Location access denied. Showing default area.')
      );
    }
  }, []);

  useEffect(() => { fetchMoms(); }, []);

  const fetchMoms = async () => {
    const { data, error } = await supabase
      .from('mom_profiles')
      .select('*, profiles(*), items(*)')
      .eq('is_active', true);

    if (!error && data) setMoms(data as any);
    setLoading(false);
  };

  const momsOnMap = moms.filter((m) => m.location_lat != null && m.location_lng != null);

  const getDistance = (lat: number, lng: number) => {
    const R = 3959;
    const dLat = (lat - userPos[0]) * Math.PI / 180;
    const dLng = (lng - userPos[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(userPos[0] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  return (
    <div className="map-page">
      <div className="map-header">
        <div>
          <h1>Nearby MOMs</h1>
          <p>{moms.length} active MOM{moms.length !== 1 ? 's' : ''} nearby</p>
        </div>
      </div>

      {locationError && <div className="map-location-notice">{locationError}</div>}

      <div className="map-container">
        {loading ? (
          <div className="loading-state">Loading map...</div>
        ) : (
          <MapContainer center={userPos} zoom={14} className="leaflet-map" zoomControl={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterButton center={userPos} />
            {momsOnMap.map((mom) => (
              <Marker
                key={mom.id}
                position={[mom.location_lat!, mom.location_lng!]}
                icon={momIcon}
                eventHandlers={{ click: () => setSelectedMom(mom) }}
              >
                <Popup>
                  <div className="map-popup">
                    <div className="map-popup-header">
                      <strong>{mom.profiles?.display_name || 'MOM'}</strong>
                      {mom.verified && <Shield size={12} className="verified-badge" />}
                    </div>
                    {mom.location_name && (
                      <div className="map-popup-location"><MapPin size={12} /> {mom.location_name}</div>
                    )}
                    {mom.avg_rating != null && (
                      <div className="map-popup-rating">
                        <Star size={12} /> {Number(mom.avg_rating).toFixed(1)} ({mom.exchange_count} exchanges)
                      </div>
                    )}
                    {mom.items && mom.items.length > 0 && (
                      <div className="map-popup-items">
                        {mom.items.slice(0, 5).map((item: any) => (
                          <span key={item.id} className="map-popup-item-tag">
                            {CATEGORY_ICONS[item.category as ItemCategory] || '📌'} {item.name}
                          </span>
                        ))}
                        {mom.items.length > 5 && <span className="map-popup-item-tag">+{mom.items.length - 5} more</span>}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {selectedMom && (
        <div className="bottom-sheet-overlay" onClick={() => setSelectedMom(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="bottom-sheet-close" onClick={() => setSelectedMom(null)}>
              <X size={20} />
            </button>
            <div className="bottom-sheet-header">
              <div className="bottom-sheet-avatar">
                {selectedMom.profiles?.display_name?.[0]?.toUpperCase() || 'M'}
              </div>
              <div className="bottom-sheet-info">
                <div className="bottom-sheet-name">
                  {selectedMom.profiles?.display_name}
                  {selectedMom.verified && <Shield size={14} className="verified-badge" />}
                </div>
                <div className="bottom-sheet-meta">
                  {selectedMom.avg_rating != null && (
                    <span><Star size={12} className="star-icon" /> {Number(selectedMom.avg_rating).toFixed(1)}</span>
                  )}
                  <span>{selectedMom.exchange_count} exchanges</span>
                  {selectedMom.location_lat && selectedMom.location_lng && (
                    <span><MapPin size={12} /> {getDistance(selectedMom.location_lat, selectedMom.location_lng).toFixed(1)} mi</span>
                  )}
                </div>
                {selectedMom.location_name && (
                  <div className="bottom-sheet-location"><MapPin size={12} /> {selectedMom.location_name}</div>
                )}
              </div>
            </div>
            {selectedMom.bio && <p className="bottom-sheet-bio">{selectedMom.bio}</p>}
            {selectedMom.items && selectedMom.items.length > 0 && (
              <div className="bottom-sheet-items">
                <h4><Handbag size={14} /> Carrying ({selectedMom.items.length})</h4>
                <div className="bottom-sheet-item-list">
                  {selectedMom.items.map((item: any) => (
                    <div key={item.id} className="bottom-sheet-item">
                      <span className="bottom-sheet-item-icon">{CATEGORY_ICONS[item.category as ItemCategory] || '📌'}</span>
                      <div>
                        <strong>{item.name}</strong>
                        {item.description && <span className="bottom-sheet-item-desc">{item.description}</span>}
                      </div>
                      {item.suggested_tip && (
                        <span className="bottom-sheet-item-tip">${Number(item.suggested_tip).toFixed(2)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {moms.length > 0 && (
        <div className="map-mom-list">
          {moms.map((mom) => (
            <div key={mom.id} className="map-mom-card" onClick={() => setSelectedMom(mom)}>
              <div className="map-mom-avatar">
                {mom.profiles?.display_name?.[0]?.toUpperCase() || 'M'}
              </div>
              <div className="map-mom-info">
                <span className="map-mom-name">
                  {mom.profiles?.display_name}
                  {mom.verified && <Shield size={12} className="verified-badge" />}
                </span>
                {mom.location_name && (
                  <span className="map-mom-location"><MapPin size={12} /> {mom.location_name}</span>
                )}
                {mom.avg_rating != null && (
                  <span className="map-mom-rating"><Star size={12} /> {Number(mom.avg_rating).toFixed(1)}</span>
                )}
              </div>
              <div className="map-mom-items">
                {mom.items?.slice(0, 3).map((item: any) => (
                  <span key={item.id} className="map-mom-item-badge">
                    {CATEGORY_ICONS[item.category as ItemCategory] || '📌'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
