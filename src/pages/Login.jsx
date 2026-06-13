import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import GoogleButton from '../components/GoogleButton';

function friendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err) {
      setError(friendlyError(err.code));
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '32px',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <Logo />
        </div>

        <h1
          style={{
            fontSize: '22px',
            fontWeight: '600',
            color: 'var(--ink)',
            textAlign: 'center',
            marginBottom: '4px',
            letterSpacing: '-0.3px',
            lineHeight: 1.3,
          }}
        >
          Sign in
        </h1>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--ink3)',
            textAlign: 'center',
            marginBottom: '28px',
          }}
        >
          New here?{' '}
          <Link
            to="/signup"
            style={{
              color: 'var(--teal-dim)',
              textDecoration: 'none',
            }}
            onMouseOver={(e) => (e.target.style.textDecoration = 'underline')}
            onMouseOut={(e) => (e.target.style.textDecoration = 'none')}
          >
            Create an account
          </Link>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              height: '40px',
              padding: '0 14px',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--ink)',
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.border = '1px solid var(--teal)')}
            onBlur={(e) => (e.target.style.border = '1px solid var(--line)')}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              height: '40px',
              padding: '0 14px',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--ink)',
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.border = '1px solid var(--teal)')}
            onBlur={(e) => (e.target.style.border = '1px solid var(--line)')}
          />

          <div style={{ textAlign: 'right', marginTop: '6px', marginBottom: '20px' }}>
            <Link
              to="#"
              style={{
                fontSize: '12px',
                color: 'var(--ink3)',
                textDecoration: 'none',
              }}
              onMouseOver={(e) => (e.target.style.color = 'var(--ink)')}
              onMouseOut={(e) => (e.target.style.color = 'var(--ink3)')}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '40px',
              background: 'var(--ink)',
              color: 'var(--surface)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Signing in...' : 'Continue'}
          </button>
        </form>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px 0',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
          <span style={{ fontSize: '12px', color: 'var(--ink3)', padding: '0 12px' }}>
            or
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
        </div>

        <GoogleButton text="Continue with Google" onClick={handleGoogle} />
        
        {error && (
          <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
