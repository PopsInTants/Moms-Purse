import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Request } from '../lib/types';
import { Clock, CircleCheck as CheckCircle, Circle as XCircle, Inbox } from 'lucide-react';

export default function Requests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<(Request & { items?: any; profiles?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'received' | 'sent'>('sent');

  useEffect(() => {
    if (profile?.id) fetchRequests();
  }, [profile, tab]);

  const fetchRequests = async () => {
    if (!profile) return;
    setLoading(true);

    let query = supabase
      .from('requests')
      .select('*, items(*), profiles!requests_seeker_id_fkey(*)')
      .order('created_at', { ascending: false });

    if (tab === 'sent') {
      query = query.eq('seeker_id', profile.id);
    } else {
      query = query.eq('mom_user_id', profile.id);
    }

    const { data, error } = await query;
    if (!error && data) {
      setRequests(data as any);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: Request['status']) => {
    await supabase.from('requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    fetchRequests();
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="status-pending" />;
      case 'accepted': return <CheckCircle size={16} className="status-accepted" />;
      case 'completed': return <CheckCircle size={16} className="status-completed" />;
      case 'cancelled': return <XCircle size={16} className="status-cancelled" />;
      default: return null;
    }
  };

  const statusLabel: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <div className="requests-page">
      <h1>Requests</h1>

      <div className="requests-tabs">
        <button
          className={`tab ${tab === 'sent' ? 'active' : ''}`}
          onClick={() => setTab('sent')}
        >
          Sent
        </button>
        <button
          className={`tab ${tab === 'received' ? 'active' : ''}`}
          onClick={() => setTab('received')}
        >
          Received
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <Inbox size={48} />
          <h3>No requests yet</h3>
          <p>{tab === 'sent' ? 'Browse items and send your first request' : 'When seekers request your items, they\'ll appear here'}</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((req) => (
            <div key={req.id} className="request-card">
              <div className="request-header">
                <div className="request-status">
                  {statusIcon(req.status)}
                  <span className={`status-text status-${req.status}`}>{statusLabel[req.status]}</span>
                </div>
                <span className="request-time">
                  {new Date(req.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="request-body">
                <h3>{req.items?.name || 'Item'}</h3>
                {req.message && <p className="request-message">"{req.message}"</p>}
                <div className="request-meta">
                  <span className="request-tip">Tip: ${Number(req.tip_amount).toFixed(2)}</span>
                  {tab === 'sent' ? (
                    <span className="request-user">From: {req.profiles?.display_name || 'A Mom'}</span>
                  ) : (
                    <span className="request-user">From: {req.profiles?.display_name || 'A Seeker'}</span>
                  )}
                </div>
              </div>

              {tab === 'received' && req.status === 'pending' && (
                <div className="request-actions">
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => updateStatus(req.id, 'accepted')}
                  >
                    Accept
                  </button>
                  <button
                    className="btn-outline btn-sm"
                    onClick={() => updateStatus(req.id, 'cancelled')}
                  >
                    Decline
                  </button>
                </div>
              )}

              {tab === 'received' && req.status === 'accepted' && (
                <div className="request-actions">
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => updateStatus(req.id, 'completed')}
                  >
                    Mark Completed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
