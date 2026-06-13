import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          width: '30px',
          height: '30px',
          background: 'linear-gradient(135deg, var(--teal) 0%, var(--teal-dim) 100%)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0, 180, 136, 0.2)',
        }}
      >
        <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: 'bold' }}>⚡</span>
      </div>
      <div
        style={{
          fontSize: '18px',
          fontWeight: '800',
          fontFamily: "'Outfit', sans-serif",
          letterSpacing: '-0.5px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span style={{ color: 'var(--ink)' }}>VOLT</span>
        <span style={{ color: 'var(--teal)', fontWeight: '500' }}>path</span>
      </div>
    </Link>
  );
}
