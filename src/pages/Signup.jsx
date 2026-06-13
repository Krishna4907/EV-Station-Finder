import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
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
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const getStrength = (pwd) => {
    if (!pwd) return { color: 'transparent', width: '0%', text: '' };
    
    if (pwd.length < 6) return { color: '#ef4444', width: '33%', text: 'Weak' };
    
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[^A-Za-z0-9]/.test(pwd);
    
    if (pwd.length >= 10 && hasUpper && hasNumber && hasSymbol) {
      return { color: '#22c55e', width: '100%', text: 'Strong' };
    }
    
    if (pwd.length >= 6 && (hasUpper || hasNumber)) {
      return { color: '#f59e0b', width: '66%', text: 'Fair' };
    }
    
    return { color: '#ef4444', width: '33%', text: 'Weak' };
  };

  const strength = getStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
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
          Create account
        </h1>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--ink3)',
            textAlign: 'center',
            marginBottom: '28px',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--teal-dim)',
              textDecoration: 'none',
            }}
            onMouseOver={(e) => (e.target.style.textDecoration = 'underline')}
            onMouseOut={(e) => (e.target.style.textDecoration = 'none')}
          >
            Sign in
          </Link>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="text"
            placeholder="Krishna Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
          
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 36px 0 14px',
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
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '12px',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showPassword ? (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </>
                )}
              </svg>
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 36px 0 14px',
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
          </div>

          {password && (
            <div style={{ marginTop: '8px' }}>
              <div
                style={{
                  height: '3px',
                  width: '100%',
                  background: 'var(--line)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: strength.width,
                    background: strength.color,
                    transition: 'all 0.2s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: '11px', color: strength.color, marginTop: '4px' }}>
                {strength.text}
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
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
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
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

        <GoogleButton text="Sign up with Google" onClick={handleGoogle} />

        {error && (
          <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>
            {error}
          </p>
        )}

        <p
          style={{
            fontSize: '11px',
            color: 'var(--ink3)',
            textAlign: 'center',
            marginTop: '16px',
            lineHeight: 1.5,
          }}
        >
          By continuing, you agree to our{' '}
          <Link
            to="#"
            style={{ color: 'var(--ink3)', textDecoration: 'none' }}
            onMouseOver={(e) => {
              e.target.style.color = 'var(--ink)';
              e.target.style.textDecoration = 'underline';
            }}
            onMouseOut={(e) => {
              e.target.style.color = 'var(--ink3)';
              e.target.style.textDecoration = 'none';
            }}
          >
            Terms
          </Link>{' '}
          and{' '}
          <Link
            to="#"
            style={{ color: 'var(--ink3)', textDecoration: 'none' }}
            onMouseOver={(e) => {
              e.target.style.color = 'var(--ink)';
              e.target.style.textDecoration = 'underline';
            }}
            onMouseOut={(e) => {
              e.target.style.color = 'var(--ink3)';
              e.target.style.textDecoration = 'none';
            }}
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
