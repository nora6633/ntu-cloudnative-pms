import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api';
import { Button } from '../app/components/ui/button'

import './Login.css';

interface LocationState {
  from?: { pathname?: string };
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from?.pathname ?? '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 401) {
        setError('Invalid username or password');
      } else if (e instanceof ApiError && e.kind === 'network') {
        setError('Network error. Please try again later.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setSubmitting(false);
    }
  };
  const allfilled = !!username.trim() && !!password.trim();
  // Helper for input styling to ensure visibility and spacing
  const inputStyle = {
    display: 'block',
    marginTop: '0.5rem', // Creates space from the label text
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '100%',
    boxSizing: 'border-box' as const,
    backgroundColor: '#fff',
    color: '#000'
  };

  return (
    <section style={{ maxWidth: 360, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Login</h1>
      <form onSubmit={onSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <label style={{ fontWeight: 'bold' }}>
            Username
            <input
              style={inputStyle}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="Enter your username"
              required
            />
          </label>

          <label style={{ fontWeight: 'bold' }}>
            Password
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </label>

          {error && <p style={{ color: 'crimson', margin: 0 }}>{error}</p>}
          <Button onClick={onSubmit} disabled={submitting || !allfilled}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>
      </form>
    </section>
  );
}
