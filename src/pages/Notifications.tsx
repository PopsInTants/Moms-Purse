import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Notification } from '../lib/types';
import { Bell, Megaphone, DollarSign, Star, CircleCheck as CheckCircle, Inbox } from 'lucide-react';

const typeConfig: Record<string, { icon: any; color: string }> = {
  request_received: { icon: Bell, color: 'var(--accent-500)' },
  request_accepted: { icon: CheckCircle, color: 'var(--primary-500)' },
  broadcast_match: { icon: Megaphone, color: 'var(--accent-500)' },
  tip_received: { icon: DollarSign, color: 'var(--primary-600)' },
  rating_received: { icon: Star, color: 'var(--warm-300)' },
};

export default function Notifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) fetchNotifications();
  }, [profile]);

  const fetchNotifications = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) setNotifications(data);
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllRead = async () => {
    if (!profile) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <div className="notifications-header-actions">
            <span className="unread-badge">{unreadCount} unread</span>
            <button className="btn-outline btn-sm" onClick={markAllRead}>Mark all read</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <Inbox size={48} />
          <h3>No notifications</h3>
          <p>You'll see requests, tips, and broadcast alerts here</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => {
            const config = typeConfig[n.type] || { icon: Bell, color: 'var(--neutral-500)' };
            const Icon = config.icon;
            return (
              <div
                key={n.id}
                className={`notification-card ${!n.is_read ? 'unread' : ''}`}
                onClick={() => !n.is_read && markRead(n.id)}
              >
                <div className="notification-icon" style={{ color: config.color }}>
                  <Icon size={20} />
                </div>
                <div className="notification-content">
                  <strong>{n.title}</strong>
                  {n.body && <p>{n.body}</p>}
                  <span className="notification-time">{new Date(n.created_at).toLocaleString()}</span>
                </div>
                {!n.is_read && <div className="notification-dot" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
