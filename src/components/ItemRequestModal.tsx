import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Item } from '../lib/types';
import { X, Send } from 'lucide-react';

interface Props {
  item: Item;
  onClose: () => void;
}

export default function ItemRequestModal({ item, onClose }: Props) {
  const { profile } = useAuth();
  const [tipAmount, setTipAmount] = useState(item.suggested_tip ? Number(item.suggested_tip) : 2);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const momUserId = (item as any).mom_profiles?.user_id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !momUserId) return;
    setError('');
    setLoading(true);

    try {
      const { error: reqError } = await supabase.from('requests').insert({
        seeker_id: profile.id,
        item_id: item.id,
        mom_user_id: momUserId,
        tip_amount: tipAmount,
        message,
        status: 'pending',
      });

      if (reqError) throw reqError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {success ? (
          <div className="modal-success">
            <span className="success-emoji">🎉</span>
            <h2>Request Sent!</h2>
            <p>Your request has been sent to the Mom. You'll be notified when they respond.</p>
            <button className="btn-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <h2>Request Item</h2>
            <div className="request-item-info">
              <strong>{item.name}</strong>
              {item.suggested_tip && (
                <span className="suggested-tip">
                  Suggested tip: ${Number(item.suggested_tip).toFixed(2)}
                </span>
              )}
            </div>

            {error && <div className="form-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="tip">Tip Amount ($)</label>
                <div className="tip-presets">
                  {[1, 2, 3, 5].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className={`tip-preset ${tipAmount === amount ? 'active' : ''}`}
                      onClick={() => setTipAmount(amount)}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                <input
                  id="tip"
                  type="number"
                  min="0"
                  step="0.5"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message (optional)</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. I'm near the lifeguard stand at the beach"
                  rows={3}
                />
              </div>

              <button type="submit" className="btn-primary btn-full" disabled={loading}>
                <Send size={16} /> {loading ? 'Sending...' : `Send Request & Tip $${tipAmount.toFixed(2)}`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
