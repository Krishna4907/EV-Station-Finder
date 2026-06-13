import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function StationDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const source = queryParams.get('source');
  const destination = queryParams.get('destination');

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredStationId, setHoveredStationId] = useState(null);
  const [backHovered, setBackHovered] = useState(false);

  useEffect(() => {
    if (!source || !destination) return;
    fetchStations(source, destination);
  }, [source, destination]);

  const fetchStations = async (source, destination) => {
    try {
      setLoading(true);
      setError(null);

      const sourceCoords = await geocodeLocation(source);
      const destinationCoords = await geocodeLocation(destination);

      const centerLat = (sourceCoords.lat + destinationCoords.lat) / 2;
      const centerLng = (sourceCoords.lng + destinationCoords.lng) / 2;

      const response = await fetch(
        `https://api.openchargemap.io/v3/poi/?latitude=${centerLat}&longitude=${centerLng}&distance=50&key=3e3b739e-9a3e-4b18-bf1a-0e9f1d5418bb`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch stations");
      }

      const data = await response.json();
      setStations(data);

    } catch (err) {
      console.error("Error fetching stations:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const geocodeLocation = async (place) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`
    );

    if (!response.ok) {
      throw new Error(`Could not geocode location: ${place}`);
    }

    const data = await response.json();

    if (!data.length) {
      throw new Error(`No results found for: ${place}`);
    }

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    return { lat, lng };
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Navbar />

      {/* Decorative Warm Accent Light */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(0, 180, 136, 0.03) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '680px',
          margin: '0 auto',
          padding: '40px 24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Back navigation button */}
        <button
          onClick={() => navigate('/')}
          onMouseEnter={() => setBackHovered(true)}
          onMouseLeave={() => setBackHovered(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: backHovered ? 'var(--teal)' : 'var(--ink3)',
            fontSize: '13px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0',
            marginBottom: '28px',
            cursor: 'pointer',
            transform: backHovered ? 'translateX(-4px)' : 'translateX(0)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to search
        </button>

        {/* Header section */}
        <h1
          className="font-display"
          style={{
            fontSize: '28px',
            fontWeight: '800',
            color: 'var(--ink)',
            letterSpacing: '-0.5px',
            marginBottom: '6px',
          }}
        >
          Available Stations
        </h1>
        
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--ink3)',
            marginBottom: '36px',
          }}
        >
          <span>Between</span>
          <span style={{ color: 'var(--teal)', fontWeight: '600', background: 'rgba(0, 180, 136, 0.04)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(0, 180, 136, 0.1)' }}>{source}</span>
          <span>and</span>
          <span style={{ color: 'var(--accent-blue)', fontWeight: '600', background: 'rgba(2, 132, 199, 0.04)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(2, 132, 199, 0.1)' }}>{destination}</span>
        </div>

        {/* Shimmer loading loader */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: '112px',
                  background: '#ffffff',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  borderRadius: '12px',
                  animation: 'shimmerPulse 1.8s infinite ease-in-out',
                }}
              />
            ))}
            <style>
              {`
                @keyframes shimmerPulse {
                  0% { opacity: 0.5; background-color: #ffffff; }
                  50% { opacity: 0.8; background-color: #f3f3f0; }
                  100% { opacity: 0.5; background-color: #ffffff; }
                }
              `}
            </style>
          </div>
        )}

        {/* Error notification display */}
        {error && (
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#c53030',
              background: 'rgba(239, 68, 68, 0.02)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span style={{ fontSize: '13px', fontWeight: '500' }}>{error}</span>
          </div>
        )}

        {/* Empty state alert */}
        {!loading && !error && stations.length === 0 && (
          <div
            className="glass-panel"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              border: '1px dashed rgba(0, 0, 0, 0.08)',
              borderRadius: '16px',
              color: 'var(--ink3)',
              fontSize: '13.5px',
              background: '#ffffff',
            }}
          >
            No charging stations found along this route.
          </div>
        )}

        {/* Station list */}
        {!loading && !error && stations.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stations.map((station) => {
              const isHovered = hoveredStationId === station.ID;
              return (
                <div
                  key={station.ID}
                  onMouseEnter={() => setHoveredStationId(station.ID)}
                  onMouseLeave={() => setHoveredStationId(null)}
                  className="glass-panel"
                  style={{
                    padding: '24px',
                    borderRadius: '16px',
                    position: 'relative',
                    overflow: 'hidden',
                    transform: isHovered ? 'translateY(-4px) translateX(2px)' : 'translateY(0) translateX(0)',
                    borderColor: isHovered ? 'rgba(0, 180, 136, 0.2)' : 'var(--line)',
                    background: '#ffffff',
                    boxShadow: isHovered 
                      ? '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03), 0 0 15px rgba(0, 180, 136, 0.05)' 
                      : '0 4px 12px -6px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.01)',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  }}
                >
                  {/* Left edge premium glowing indicator bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      background: 'linear-gradient(to bottom, var(--teal), var(--teal-dim))',
                      transform: isHovered ? 'scaleY(1)' : 'scaleY(0)',
                      transformOrigin: 'center',
                      opacity: isHovered ? 1 : 0,
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    }}
                  />

                  {/* Title */}
                  <div
                    className="font-display"
                    style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: isHovered ? 'var(--teal)' : 'var(--ink)',
                      marginBottom: '10px',
                      letterSpacing: '-0.3px',
                      transition: 'color 0.25s ease',
                    }}
                  >
                    {station.AddressInfo?.Title || 'Unnamed Station'}
                  </div>

                  {/* Location Info */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      marginBottom: '18px',
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={isHovered ? 'var(--teal)' : 'var(--ink3)'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ 
                        marginTop: '3px', 
                        flexShrink: 0, 
                        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                        transition: 'all 0.25s ease' 
                      }}
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span style={{ fontSize: '12.5px', color: 'var(--ink2)', lineHeight: 1.5 }}>
                      {station.AddressInfo?.AddressLine1 ? `${station.AddressInfo.AddressLine1}, ` : ''}
                      {station.AddressInfo?.Town || ''}
                    </span>
                  </div>

                  {/* Connectors tag list */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--teal)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        marginRight: '2px',
                        transform: isHovered ? 'scale(1.2) rotate(15deg)' : 'scale(1) rotate(0deg)',
                        transition: 'transform 0.25s ease',
                      }}
                    >
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>

                    {station.Connections?.length > 0 ? (
                      station.Connections.map((conn, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: 'var(--teal-bg)',
                            border: '1px solid rgba(0, 180, 136, 0.15)',
                            borderRadius: '99px',
                            fontSize: '11px',
                            color: 'var(--teal-dim)',
                            padding: '3px 10px',
                            fontWeight: '600',
                            letterSpacing: '0.1px',
                            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                            transition: 'transform 0.25s ease',
                          }}
                        >
                          {conn.ConnectionType?.Title || 'Unknown Connection'}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>No connector info available</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
