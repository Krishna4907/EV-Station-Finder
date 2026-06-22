import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import MapPanel from '../components/MapPanel';
import StationDetailDrawer from '../components/StationDetailDrawer';
import { planTrip } from '../utils/tripPlanner';

export default function MapView() {
  const location     = useLocation();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const params       = new URLSearchParams(location.search);
  const source       = params.get('source')      || '';
  const destination  = params.get('destination') || '';
  const batteryParam = params.get('battery');

  const [stations,          setStations]          = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(null);
  const [sourceCoords,      setSourceCoords]      = useState(null);
  const [destCoords,        setDestCoords]        = useState(null);
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [backHovered,       setBackHovered]       = useState(false);
  const [savedCar,          setSavedCar]          = useState(null);
  const [tripPlan,          setTripPlan]          = useState(null);
  const [detailStation,     setDetailStation]     = useState(null);

  // ── Geocode
  const geocode = async (place) => {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`
    );
    const data = await res.json();
    if (!data.length) throw new Error(`Could not find: ${place}`);
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  };

  // ── Haversine
  const haversineKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };

  // ── Load saved car
  useEffect(() => {
    if (!user) return;
    const loadCar = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists() && snap.data().carId) {
          const { EV_CARS } = await import('../data/evCars');
          const car = EV_CARS.find(c => c.id === snap.data().carId);
          if (car) setSavedCar(car);
        }
      } catch (err) { /* no car saved */ }
    };
    loadCar();
  }, [user]);

  // ── Fetch stations along entire route
  const fetchStations = useCallback(async () => {
    if (!source || !destination) return;
    try {
      setLoading(true);
      setError(null);

      const [src, dst] = await Promise.all([geocode(source), geocode(destination)]);
      setSourceCoords(src);
      setDestCoords(dst);

      const totalDistanceKm = haversineKm(src.lat, src.lng, dst.lat, dst.lng);
      const numSamples     = totalDistanceKm > 600 ? 7 : totalDistanceKm > 300 ? 5 : 3;
      const searchRadiusKm = totalDistanceKm > 600 ? 60 : totalDistanceKm > 300 ? 50 : 40;

      const samplePoints = [];
      for (let i = 0; i < numSamples; i++) {
        const fraction = i / (numSamples - 1);
        samplePoints.push({
          lat: src.lat + (dst.lat - src.lat) * fraction,
          lng: src.lng + (dst.lng - src.lng) * fraction,
        });
      }

      const results = await Promise.all(
        samplePoints.map((p) =>
          fetch(
            `https://api.openchargemap.io/v3/poi/?latitude=${p.lat}&longitude=${p.lng}&distance=${searchRadiusKm}&maxresults=100&key=3e3b739e-9a3e-4b18-bf1a-0e9f1d5418bb`
          )
            .then((res) => (res.ok ? res.json() : []))
            .catch(() => [])
        )
      );

      const merged = new Map();
      results.flat().forEach((station) => {
        if (station.AddressInfo?.Latitude && station.AddressInfo?.Longitude) {
          merged.set(station.ID, station);
        }
      });

      const allStations = Array.from(merged.values());
      if (allStations.length === 0) {
        setError(
          `No charging stations found within ${searchRadiusKm}km of this route. ` +
          `Try a route closer to major highways, or check back later.`
        );
      }
      setStations(allStations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [source, destination]);

  useEffect(() => { fetchStations(); }, [fetchStations]);

  // ── Trip planner
  useEffect(() => {
    if (!sourceCoords || !destCoords || stations.length === 0) return;
    if (!savedCar || !batteryParam) { setTripPlan(null); return; }
    const battery = Number(batteryParam);
    if (isNaN(battery)) return;
    const plan = planTrip(sourceCoords, destCoords, stations, savedCar, battery);
    setTripPlan(plan);
  }, [sourceCoords, destCoords, stations, savedCar, batteryParam]);

  const suggestedStopIds = new Set(
    (tripPlan?.suggestedStops || []).map((s) => s.station.ID)
  );

  // Scroll selected card into view
  useEffect(() => {
    if (!selectedStationId) return;
    const el = document.getElementById(`station-card-${selectedStationId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedStationId]);

  // ── Card click — just selects, does NOT open drawer
  const handleStationClick = (id) => {
    setSelectedStationId((prev) => (prev === id ? null : id));
    // close drawer if clicking a different card
    setDetailStation((prev) => (prev?.ID === id ? prev : null));
  };

  // ── "View details" button click — opens drawer
  const handleOpenDrawer = (station) => {
    setSelectedStationId(station.ID);
    setDetailStation(station);
  };

  // ── Connector tags
  const ConnectorTags = ({ connections }) => {
    if (!connections?.length) {
      return <span style={{ fontSize: '11px', color: '#888888' }}>No connector info</span>;
    }
    const unique = [...new Set(connections.map((c) => c.ConnectionType?.Title).filter(Boolean))];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        {unique.map((title, i) => (
          <span key={i} style={{
            background: 'rgba(0,200,150,0.07)',
            border: '1px solid rgba(0,200,150,0.18)',
            borderRadius: '99px', fontSize: '10.5px',
            color: '#00a87e', padding: '2px 9px', fontWeight: '600',
          }}>
            {title}
          </span>
        ))}
      </div>
    );
  };

  // ── Trip summary banner
  const TripSummaryBanner = () => {
    if (!tripPlan) return null;
    return (
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid #e5e5e5',
        background: tripPlan.needsStops ? 'rgba(0,200,150,0.04)' : 'rgba(34,197,94,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={tripPlan.needsStops ? '#00a87e' : '#22c55e'}
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, marginTop: '1px' }}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#111111', marginBottom: '2px' }}>
              {tripPlan.needsStops
                ? `${tripPlan.suggestedStops.length} charging stop${tripPlan.suggestedStops.length !== 1 ? 's' : ''} suggested`
                : 'No charging stops needed'}
            </div>
            <div style={{ fontSize: '11px', color: '#666666', lineHeight: 1.5 }}>
              {tripPlan.message}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Station card
  const StationCard = ({ station }) => {
    const isSelected  = station.ID === selectedStationId;
    const isSuggested = suggestedStopIds.has(station.ID);
    const stopInfo    = tripPlan?.suggestedStops.find(s => s.station.ID === station.ID);

    return (
      <div
        id={`station-card-${station.ID}`}
        onClick={() => handleStationClick(station.ID)}
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid #f0f0ee',
          cursor: 'pointer',
          background: isSelected ? 'rgba(0,200,150,0.04)' : isSuggested ? 'rgba(0,200,150,0.015)' : '#ffffff',
          borderLeft: isSelected ? '2.5px solid #00C896' : isSuggested ? '2.5px solid rgba(0,200,150,0.4)' : '2.5px solid transparent',
          transition: 'all 0.15s ease',
          position: 'relative',
        }}
      >
        {/* Suggested badge */}
        {isSuggested && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: '#111111', color: '#ffffff',
            fontSize: '10px', fontWeight: '600',
            padding: '3px 8px', borderRadius: '6px', marginBottom: '8px',
          }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Suggested Stop · Arrive ~{stopInfo?.arrivalPercent}%
          </div>
        )}

        {/* Name */}
        <div style={{
          fontSize: '13px', fontWeight: '600',
          color: isSelected ? '#00a87e' : '#111111',
          marginBottom: '5px', letterSpacing: '-0.2px', lineHeight: 1.3,
          transition: 'color 0.15s',
        }}>
          {station.AddressInfo?.Title || 'Unnamed Station'}
        </div>

        {/* Address */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', marginBottom: '10px' }}>
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

        {/* View details button — only when selected */}
        {isSelected && (
          <button
            onClick={(e) => {
  e.stopPropagation();
  console.log('clicked:', station.AddressInfo?.Title);
  handleOpenDrawer(station);
}}
            style={{
              marginTop: '10px', width: '100%', height: '32px',
              background: 'transparent',
              border: '1px solid rgba(0,200,150,0.3)',
              borderRadius: '7px', cursor: 'pointer',
              fontSize: '11.5px', fontWeight: '500', color: '#00a87e',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            View details & charging estimate
          </button>
        )}
      </div>
    );
  };

  // Sort: suggested first
  const sortedStations = [...stations].sort((a, b) => {
    const aS = suggestedStopIds.has(a.ID);
    const bS = suggestedStopIds.has(b.ID);
    if (aS && !bS) return -1;
    if (!aS && bS) return 1;
    return 0;
  });

  const detailStopInfo = tripPlan?.suggestedStops.find(
    s => s.station.ID === detailStation?.ID
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{
          width: '340px', flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          background: '#ffffff',
          borderRight: '1px solid #e5e5e5',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid #e5e5e5', flexShrink: 0 }}>
            <button
              onClick={() => navigate('/')}
              onMouseEnter={() => setBackHovered(true)}
              onMouseLeave={() => setBackHovered(false)}
              style={{
                background: 'transparent', border: 'none',
                color: backHovered ? '#00a87e' : '#888888',
                fontSize: '12px', fontWeight: '500',
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: 0, marginBottom: '14px', cursor: 'pointer',
                transform: backHovered ? 'translateX(-2px)' : 'translateX(0)',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to search
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
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

            <div style={{ fontSize: '11.5px', color: '#888888', marginTop: '6px' }}>
              {loading ? 'Finding stations…' : error ? 'Error loading stations' : `${stations.length} stations found`}
              {tripPlan && !loading && ` · ${tripPlan.totalDistanceKm} km trip`}
            </div>
          </div>

          {!loading && <TripSummaryBanner />}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading && (
              <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={{
                    height: '80px', background: '#f7f7f5',
                    borderRadius: '8px', animation: 'pulse 1.6s ease-in-out infinite',
                  }} />
                ))}
                <style>{`@keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:.9} }`}</style>
              </div>
            )}

            {!loading && error && (
              <div style={{
                margin: '16px', padding: '14px 16px',
                background: 'rgba(239,68,68,0.04)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: '10px', fontSize: '12.5px', color: '#c53030',
              }}>
                {error}
              </div>
            )}

            {!loading && !error && stations.length === 0 && (
              <div style={{ padding: '48px 24px', textAlign: 'center', fontSize: '13px', color: '#888888' }}>
                No stations found along this route.
              </div>
            )}

            {!loading && !error && sortedStations.map((station) => (
              <StationCard key={station.ID} station={station} />
            ))}
          </div>
        </div>

        {/* ── RIGHT — MAP ── */}
        <div style={{ flex: 1, position: 'relative', zIndex: 0 }}>
          <MapPanel
            sourceCoords={sourceCoords}
            destCoords={destCoords}
            stations={stations}
            selectedStationId={selectedStationId}
            suggestedStopIds={suggestedStopIds}
            onStationClick={handleStationClick}
          />

          {!sourceCoords && !loading && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#f7f7f5', fontSize: '13px', color: '#888888',
            }}>
              Loading map…
            </div>
          )}

          {detailStation && (
            <StationDetailDrawer
              station={detailStation}
              savedCar={savedCar}
              arrivalPercent={detailStopInfo?.arrivalPercent}
              isSuggested={suggestedStopIds.has(detailStation.ID)}
              onClose={() => {
                setDetailStation(null);
                setSelectedStationId(null);
              }}
            />
          )}
        </div>

      </div>
    </div>
  );
}