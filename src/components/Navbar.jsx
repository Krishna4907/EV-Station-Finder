import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav
      style={{
        height: '64px',
        background: 'rgba(247, 247, 245, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.3s ease',
      }}
    >
      <Logo />
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user ? (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.02)',
                padding: '6px 12px',
                borderRadius: '99px',
                border: '1px solid rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--teal)',
                  boxShadow: '0 0 6px var(--teal)',
                }}
              />
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: 'var(--ink2)',
                  maxWidth: '160px',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.displayName || user.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                e.currentTarget.style.color = '#dc2626';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.color = 'var(--ink2)';
              }}
              style={{
                border: '1px solid rgba(0, 0, 0, 0.06)',
                background: 'rgba(0, 0, 0, 0.02)',
                color: 'var(--ink2)',
                height: '34px',
                padding: '0 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ink)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--ink3)')}
              style={{
                fontSize: '13px',
                color: 'var(--ink3)',
                fontWeight: '500',
                transition: 'color 0.2s ease',
              }}
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.background = '#1e293b';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'var(--ink)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              style={{
                background: 'var(--ink)',
                color: '#ffffff',
                height: '34px',
                padding: '0 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
