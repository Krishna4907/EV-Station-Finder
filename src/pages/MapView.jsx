import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MapPanel from '../components/MapPanel';

export default function MapView() {
  const location    = useLocation();
  const navigate    = useNavigate();
  const params      = new URLSearchParams(location.search);
  const source      = params.get('source')      || '';
  const destination = params.get('destination') || '';

  const [stations,          setStations]          = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(null);
  const [sourceCoords,      setSourceCoords]      = useState(null);
  const [destCoords,        setDestCoords]        = useState(null);
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [backHovered,       setBackHovered]       = useState(false);

  // ── Geocode a place name → { lat, lng }
  const geocode = async (place) => {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`
    );
    const data = await res.json();
    if (!data.length) throw new Error(`Could not find: ${place}`);
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  };

  // ── Fetch stations from OpenChargeMap around route midpoint
  const fetchStations = useCallback(async () => {
    if (!source || !destination) return;
    try {
      setLoading(true);
      setError(null);

      const [src, dst] = await Promise.all([geocode(source), geocode(destination)]);
      setSourceCoords(src);
      setDestCoords(dst);

      const midLat = (src.lat + dst.lat) / 2;
      const midLng = (src.lng + dst.lng) / 2;

      const res  = await fetch(
        `https://api.openchargemap.io/v3/poi/?latitude=${midLat}&longitude=${midLng}&distance=50&key=3e3b739e-9a3e-4b18-bf1a-0e9f1d5418bb`
      );
      if (!res.ok) throw new Error('Failed to fetch stations');
      const data = await res.json();

      // Only keep stations that have valid coordinates
      setStations(data.filter(
        (s) => s.AddressInfo?.Latitude && s.AddressInfo?.Longitude
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [source, destination]);

  useEffect(() => { fetchStations(); }, [fetchStations]);

  // Scroll the selected card into view
  useEffect(() => {
    if (!selectedStationId) return;
    const el = document.getElementById(`station-card-${selectedStationId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedStationId]);

  const handleStationClick = useCallback((id) => {
    setSelectedStationId((prev) => (prev === id ? null : id));
  }, []);

  // ── Connector tags
  const ConnectorTags = ({ connections }) => {
    if (!connections?.length) {
      return <span style={{ fontSize: '11px', color: '#888888' }}>No connector info</span>;
    }
    const unique = [...new Set(connections.map((c) => c.ConnectionType?.Title).filter(Boolean))];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        {unique.map((title, i) => (
          <span
            key={i}
            style={{
              background: 'rgba(0,200,150,0.07)',
              border: '1px solid rgba(0,200,150,0.18)',
              borderRadius: '99px',
              fontSize: '10.5px',
              color: '#00a87e',
              padding: '2px 9px',
              fontWeight: '600',
            }}
          >
            {title}
          </span>
        ))}
      </div>
    );
  };

  // ── Station card
  const StationCard = ({ station }) => {
    const isSelected = station.ID === selectedStationId;
    return (
      <div
        id={`station-card-${station.ID}`}
        onClick={() => handleStationClick(station.ID)}
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid #f0f0ee',
          cursor: 'pointer',
          background: isSelected ? 'rgba(0,200,150,0.04)' : '#ffffff',
          borderLeft: isSelected ? '2.5px solid #00C896' : '2.5px solid transparent',
          transition: 'all 0.15s ease',
          position: 'relative',
        }}
      >
        {/* Station name */}
        <div style={{
          fontSize: '13px',
          fontWeight: '600',
          color: isSelected ? '#00a87e' : '#111111',
          marginBottom: '5px',
          letterSpacing: '-0.2px',
          lineHeight: 1.3,
          transition: 'color 0.15s',
        }}>
          {station.AddressInfo?.Title || 'Unnamed Station'}
        </div>

        {/* Address */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '5px',
          marginBottom: '10px',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="#888888" strokeWidth="2" strokeLinecap="round"
            strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span style={{ fontSize: '11.5px', color: '#666666', lineHeight: 1.45 }}>
            {[station.AddressInfo?.AddressLine1, station.AddressInfo?.Town]
              .filter(Boolean).join(', ')}
          </span>
        </div>

        {/* Connectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="#00C896" strokeWidth="2.5" strokeLinecap="round"
            strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <ConnectorTags connections={station.Connections} />
        </div>

        {/* Navigate button — shows on selected */}
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const lat = station.AddressInfo?.Latitude;
              const lng = station.AddressInfo?.Longitude;
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
            }}
            style={{
              marginTop: '12px',
              width: '100%',
              height: '34px',
              background: '#111111',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
            Navigate
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{
          width: '340px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRight: '1px solid #e5e5e5',
          overflow: 'hidden',
        }}>

          {/* Panel header */}
          <div style={{
            padding: '16px 18px 14px',
            borderBottom: '1px solid #e5e5e5',
            flexShrink: 0,
          }}>
            {/* Back button */}
            <button
              onClick={() => navigate('/')}
              onMouseEnter={() => setBackHovered(true)}
              onMouseLeave={() => setBackHovered(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: backHovered ? '#00a87e' : '#888888',
                fontSize: '12px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: 0,
                marginBottom: '14px',
                cursor: 'pointer',
                transform: backHovered ? 'translateX(-2px)' : 'translateX(0)',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to search
            </button>

            {/* Route summary */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px',
              flexWrap: 'wrap',
            }}>
              <span style={{
                fontSize: '12px', fontWeight: '600', color: '#111111',
                background: '#f7f7f5', border: '1px solid #e5e5e5',
                borderRadius: '6px', padding: '2px 8px',
                maxWidth: '120px', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {source}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="#cccccc" strokeWidth="2" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
              <span style={{
                fontSize: '12px', fontWeight: '600', color: '#111111',
                background: '#f7f7f5', border: '1px solid #e5e5e5',
                borderRadius: '6px', padding: '2px 8px',
                maxWidth: '120px', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {destination}
              </span>
            </div>

            {/* Station count */}
            <div style={{ fontSize: '11.5px', color: '#888888', marginTop: '6px' }}>
              {loading ? 'Finding stations…' : error ? 'Error loading stations' : `${stations.length} stations found`}
            </div>
          </div>

          {/* Station list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>

            {/* Loading skeletons */}
            {loading && (
              <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={{
                    height: '80px',
                    background: '#f7f7f5',
                    borderRadius: '8px',
                    animation: 'pulse 1.6s ease-in-out infinite',
                  }} />
                ))}
                <style>{`
                  @keyframes pulse {
                    0%, 100% { opacity: 0.5; }
                    50%       { opacity: 0.9; }
                  }
                `}</style>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div style={{
                margin: '16px', padding: '14px 16px',
                background: 'rgba(239,68,68,0.04)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: '10px',
                fontSize: '12.5px', color: '#c53030',
              }}>
                {error}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && stations.length === 0 && (
              <div style={{
                padding: '48px 24px',
                textAlign: 'center',
                fontSize: '13px',
                color: '#888888',
              }}>
                No stations found along this route.
              </div>
            )}

            {/* Cards */}
            {!loading && !error && stations.map((station) => (
              <StationCard key={station.ID} station={station} />
            ))}
          </div>
        </div>

        {/* ── RIGHT — MAP ── */}
        <div style={{ flex: 1, position: 'relative' }}>
          <MapPanel
            sourceCoords={sourceCoords}
            destCoords={destCoords}
            stations={stations}
            selectedStationId={selectedStationId}
            onStationClick={handleStationClick}
          />

          {/* No coords yet overlay */}
          {!sourceCoords && !loading && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#f7f7f5',
              fontSize: '13px', color: '#888888',
            }}>
              Loading map…
            </div>
          )}
        </div>

      </div>
    </div>
  );
}