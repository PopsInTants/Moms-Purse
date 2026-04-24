import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signUp } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { Handbag, Eye, EyeOff } from 'lucide-react';

export default function Signup() {
  const [searchParams] = useSearchParams();
  const preselectedRole = searchParams.get('role') === 'mom' ? 'mom' : 'seeker';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'mom' | 'seeker'>(preselectedRole);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, displayName, role);
      await refreshProfile();
      navigate(role === 'mom' ? '/dashboard' : '/browse');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Handbag size={32} strokeWidth={2.5} />
          <h1>Join Mom's Purse</h1>
          <p>Choose how you want to participate</p>
        </div>

        <div className="role-selector">
          <button
            type="button"
            className={`role-option ${role === 'seeker' ? 'active' : ''}`}
            onClick={() => setRole('seeker')}
          >
            <span className="role-emoji">🔍</span>
            <strong>Seeker</strong>
            <span>Find items nearby</span>
          </button>
          <button
            type="button"
            className={`role-option ${role === 'mom' ? 'active' : ''}`}
            onClick={() => setRole('mom')}
          >
            <span className="role-emoji">👜</span>
            <strong>Mom</strong>
            <span>Share what you carry</span>
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="What should people call you?"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
              />
              <button type="button" className="input-icon" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account...' : `Sign up as ${role === 'mom' ? 'a Mom' : 'a Seeker'}`}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
