import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../lib/auth';
import { Handbag, LogOut, Menu, X, Map, Bell, Search, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const channel = supabase
        .channel('nav-notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          setUnreadCount((c) => c + 1);
        })
        .subscribe();

      // Also fetch initial count
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .then(({ count }) => { if (count) setUnreadCount(count); });

      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMenuOpen(false);
  };

  const isMom = profile?.role === 'mom' || profile?.role === 'both';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <Handbag size={28} strokeWidth={2.5} />
          <span>Mom's Purse</span>
        </Link>

        <button className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {user ? (
            <>
              <Link to="/map" onClick={() => setMenuOpen(false)}><Map size={14} /> Map</Link>
              <Link to="/browse" onClick={() => setMenuOpen(false)}><Search size={14} /> Browse</Link>
              {isMom && (
                <Link to="/dashboard" onClick={() => setMenuOpen(false)}><ShoppingBag size={14} /> My Purse</Link>
              )}
              <Link to="/requests" onClick={() => setMenuOpen(false)}>Requests</Link>
              <Link to="/notifications" onClick={() => { setMenuOpen(false); setUnreadCount(0); }} className="nav-notifications-link">
                <Bell size={14} />
                {unreadCount > 0 && <span className="nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </Link>
              <button className="btn-ghost" onClick={handleSignOut}>
                <LogOut size={16} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/signup" className="btn-primary btn-sm" onClick={() => setMenuOpen(false)}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
