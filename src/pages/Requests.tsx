import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Request as Req, Rating } from '../lib/types';
import { Clock, CircleCheck as CheckCircle, Circle as XCircle, Inbox, Star, X, Flag } from 'lucide-react';

export default function Requests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<(Req & { items?: any; profiles?: any })[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'received' | 'sent'>('sent');
  const [showRating, setShowRating] = useState<string | null>(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [showReport, setShowReport] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchRequests();
      fetchRatings();
    }
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
    if (!error && data) setRequests(data as any);
    setLoading(false);
  };

  const fetchRatings = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('ratings')
      .select('*')
      .or(`rater_id.eq.${profile.id},ratee_id.eq.${profile.id}`);
    if (data) setRatings(data);
  };

  const updateStatus = async (id: string, status: Req['status']) => {
    await supabase.from('requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    fetchRequests();
  };

  const hasRated = (requestId: string) => {
    return ratings.some((r) => r.request_id === requestId && r.rater_id === profile?.id);
  };

  const getOtherUserId = (req: Req & { items?: any; profiles?: any }) => {
    return tab === 'sent' ? req.mom_user_id : req.seeker_id;
  };

  const submitRating = async (req: Req & { items?: any; profiles?: any }) => {
    if (!profile) return;
    setRatingLoading(true);
    const { error } = await supabase.from('ratings').insert({
      request_id: req.id,
      rater_id: profile.id,
      ratee_id: getOtherUserId(req),
      score: ratingScore,
      comment: ratingComment,
    });
    if (!error) {
      setShowRating(null);
      setRatingScore(5);
      setRatingComment('');
      fetchRatings();
    }
    setRatingLoading(false);
  };

  const submitReport = async (req: Req & { items?: any; profiles?: any }) => {
    if (!profile) return;
    setReportLoading(true);
    const { error } = await supabase.from('reports').insert({
      reporter_id: profile.id,
      reported_id: getOtherUserId(req),
      request_id: req.id,
      reason: reportReason,
    });
    if (!error) {
      setShowReport(null);
      setReportReason('');
    }
    setReportLoading(false);
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
        <button className={`tab ${tab === 'sent' ? 'active' : ''}`} onClick={() => setTab('sent')}>Sent</button>
        <button className={`tab ${tab === 'received' ? 'active' : ''}`} onClick={() => setTab('received')}>Received</button>
      </div>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <Inbox size={48} />
          <h3>No requests yet</h3>
          <p>{tab === 'sent' ? 'Browse items and send your first request' : "When seekers request your items, they'll appear here"}</p>
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
                <span className="request-time">{new Date(req.created_at).toLocaleDateString()}</span>
              </div>

              <div className="request-body">
                <h3>{req.items?.name || 'Item'}</h3>
                {req.message && <p className="request-message">"{req.message}"</p>}
                <div className="request-meta">
                  <span className="request-tip">Tip: ${Number(req.tip_amount).toFixed(2)}</span>
                  <span className="request-user">
                    {tab === 'sent' ? 'MOM' : 'Seeker'}: {req.profiles?.display_name || 'Unknown'}
                  </span>
                </div>
              </div>

              {tab === 'received' && req.status === 'pending' && (
                <div className="request-actions">
                  <button className="btn-primary btn-sm" onClick={() => updateStatus(req.id, 'accepted')}>Accept</button>
                  <button className="btn-outline btn-sm" onClick={() => updateStatus(req.id, 'cancelled')}>Decline</button>
                </div>
              )}

              {tab === 'received' && req.status === 'accepted' && (
                <div className="request-actions">
                  <button className="btn-primary btn-sm" onClick={() => updateStatus(req.id, 'completed')}>Mark Completed</button>
                </div>
              )}

              {req.status === 'completed' && !hasRated(req.id) && (
                <div className="request-actions">
                  <button className="btn-outline btn-sm" onClick={() => setShowRating(req.id)}>
                    <Star size={14} /> Rate this exchange
                  </button>
                </div>
              )}

              {req.status === 'completed' && hasRated(req.id) && (
                <div className="request-actions rated">
                  <Star size={14} className="star-icon" /> Rated
                </div>
              )}

              {req.status !== 'cancelled' && (
                <button className="report-btn" onClick={() => setShowReport(req.id)}>
                  <Flag size={12} /> Report
                </button>
              )}

              {showRating === req.id && (
                <div className="rating-form">
                  <div className="rating-form-header">
                    <strong>Rate this exchange</strong>
                    <button className="btn-icon" onClick={() => setShowRating(null)}><X size={14} /></button>
                  </div>
                  <div className="star-selector">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`star-btn ${ratingScore >= s ? 'active' : ''}`}
                        onClick={() => setRatingScore(s)}
                      >
                        <Star size={24} fill={ratingScore >= s ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Optional comment about the exchange"
                    rows={2}
                  />
                  <button className="btn-primary btn-sm btn-full" onClick={() => submitRating(req)} disabled={ratingLoading}>
                    {ratingLoading ? 'Submitting...' : 'Submit Rating'}
                  </button>
                </div>
              )}

              {showReport === req.id && (
                <div className="rating-form">
                  <div className="rating-form-header">
                    <strong>Report this exchange</strong>
                    <button className="btn-icon" onClick={() => setShowReport(null)}><X size={14} /></button>
                  </div>
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Describe the issue"
                    rows={2}
                  />
                  <button className="btn-primary btn-sm btn-full" onClick={() => submitReport(req)} disabled={reportLoading}>
                    {reportLoading ? 'Submitting...' : 'Submit Report'}
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
