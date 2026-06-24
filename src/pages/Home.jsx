import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import CarProfileModal from '../components/CarProfileModal';
import PlaceSuggestions from '../components/PlaceSuggestions';
import { usePlaceAutocomplete } from '../hooks/usePlaceAutocomplete';

export default function Home() {
  const [source, setSource]           = useState('');
  const [destination, setDestination] = useState('');
  const [sourceFocused, setSourceFocused]   = useState(false);
  const [destFocused, setDestFocused]       = useState(false);
  const [swapHovered, setSwapHovered]       = useState(false);
  const [btnHovered, setBtnHovered]         = useState(false);
  const [carBtnHovered, setCarBtnHovered]   = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const { user } = useAuth();
  const [carModalOpen, setCarModalOpen] = useState(false);
  const [savedCar, setSavedCar]         = useState(null);
  const [batteryPercent, setBatteryPercent] = useState(80);
  const [recentSearches, setRecentSearches] = useState([]);

  const navigate = useNavigate();

  // Autocomplete hooks — debounced, only fires when 2+ chars
  const { suggestions: sourceSuggestions, loading: sourceLoading } =
    usePlaceAutocomplete(sourceFocused ? source : '');
  const { suggestions: destSuggestions, loading: destLoading } =
    usePlaceAutocomplete(destFocused ? destination : '');

  // Refs to detect outside clicks and close dropdowns
  const sourceWrapRef = useRef(null);
  const destWrapRef   = useRef(null);

  const handleSwap = () => {
    setSource(destination);
    setDestination(source);
  };

  // Save search to Firestore + navigate
  const handleSearch = async () => {
    if (!source.trim() || !destination.trim()) return;

    // Save to Firestore search history (non-blocking)
    if (user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            searchHistory: arrayUnion({
              source: source.trim(),
              destination: destination.trim(),
              timestamp: Date.now(),
            }),
          },
          { merge: true }
        );
        // Update local state immediately so it shows on next focus
        setRecentSearches((prev) => {
          const updated = [
            { source: source.trim(), destination: destination.trim(), timestamp: Date.now() },
            ...prev.filter(
              (r) => !(r.source === source.trim() && r.destination === destination.trim())
            ),
          ].slice(0, 5);
          return updated;
        });
      } catch (err) {
        // silently ignore — search should still work
      }
    }

    const batteryParam = savedCar ? `&battery=${batteryPercent}` : '';
    navigate(
      `/map?source=${encodeURIComponent(source.trim())}&destination=${encodeURIComponent(destination.trim())}${batteryParam}`
    );
  };

  // Load saved car + search history from Firestore on mount
  useEffect(() => {
    if (!user) return;
    const loadUserData = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (!snap.exists()) return;
        const data = snap.data();

        // Load car
        if (data.carId) {
          const { EV_CARS } = await import('../data/evCars');
          const car = EV_CARS.find(c => c.id === data.carId);
          if (car) setSavedCar(car);
        }

        // Load search history — sort by most recent, take last 5
        if (data.searchHistory?.length) {
          const sorted = [...data.searchHistory]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);
          setRecentSearches(sorted);
        }
      } catch (err) {
        // ignore
      }
    };
    loadUserData();
  }, [user]);

  // Handle selecting an autocomplete suggestion
  const handleSourceSelect = (label) => {
    setSource(label);
    setSourceFocused(false);
  };

  const handleDestSelect = (label) => {
    setDestination(label);
    setDestFocused(false);
  };

  // Handle selecting a recent search — fills both inputs
  const handleRecentSelect = (recent) => {
    setSource(recent.source);
    setDestination(recent.destination);
    setSourceFocused(false);
    setDestFocused(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Navbar />

      {/* Background blur */}
      <div style={{
        position: 'absolute', top: '35%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '450px', height: '450px',
        background: 'radial-gradient(circle, rgba(0, 180, 136, 0.04) 0%, rgba(2, 132, 199, 0.02) 60%, transparent 100%)',
        borderRadius: '50%', filter: 'blur(50px)',
        zIndex: 0, pointerEvents: 'none',
      }} />

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', minHeight: 'calc(100vh - 64px)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          fontSize: '11px', fontWeight: '700', letterSpacing: '0.12em',
          color: 'var(--teal)', textTransform: 'uppercase',
          textAlign: 'center', marginBottom: '14px',
        }}>
          ⚡ Trip Planner
        </div>

        <h1 className="font-display" style={{
          fontSize: '34px', fontWeight: '800', textAlign: 'center',
          letterSpacing: '-0.8px', color: 'var(--ink)',
          marginBottom: '8px', lineHeight: 1.25,
        }}>
          Where are you driving today?
        </h1>

        <p style={{
          fontSize: '13.5px', color: 'var(--ink3)', textAlign: 'center',
          marginBottom: '36px', maxWidth: '380px',
        }}>
          Find optimized charging stations along your route based on live availability and distance.
        </p>

        {/* Plan Form Card */}
        <div className="glass-panel" style={{
          width: '100%', maxWidth: '460px', borderRadius: '16px', padding: '24px',
          boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.01)',
          transition: 'all 0.3s ease',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>

            {/* ── Source Input ── */}
            <div ref={sourceWrapRef} style={{ position: 'relative' }}>
              <div style={{
                border: sourceFocused ? '1px solid var(--teal)' : '1px solid rgba(0, 0, 0, 0.08)',
                background: '#ffffff', borderRadius: '10px',
                padding: '4px 14px', display: 'flex', alignItems: 'center',
                height: '48px',
                boxShadow: sourceFocused ? '0 0 0 3px rgba(0, 180, 136, 0.06)' : 'none',
                transition: 'all 0.2s ease',
              }}>
                <div style={{
                  width: '8px', height: '8px', background: 'var(--teal)',
                  borderRadius: '50%', boxShadow: '0 0 6px rgba(0, 180, 136, 0.4)',
                  flexShrink: 0,
                }} />
                <input
                  type="text"
                  placeholder="Starting point"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  onFocus={() => setSourceFocused(true)}
                  onBlur={() => setTimeout(() => setSourceFocused(false), 150)}
                  style={{
                    border: 'none', outline: 'none', background: 'transparent',
                    flex: 1, fontSize: '13.5px', color: 'var(--ink)',
                    padding: '0 14px', height: '100%',
                  }}
                />
                {/* Clear button */}
                {source && (
                  <button
                    onMouseDown={(e) => { e.preventDefault(); setSource(''); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#cccccc', fontSize: '16px', padding: '0 2px',
                      lineHeight: 1, flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Source suggestions dropdown */}
              {sourceFocused && (
                <PlaceSuggestions
                  suggestions={sourceSuggestions}
                  recentSearches={recentSearches}
                  loading={sourceLoading}
                  query={source}
                  onSelect={handleSourceSelect}
                  onSelectRecent={(r) => { setSource(r.source); setSourceFocused(false); }}
                  inputType="source"
                />
              )}
            </div>

            {/* Swap button */}
            <div style={{ position: 'relative', height: '1px', zIndex: 10 }}>
              <button
                onClick={handleSwap}
                onMouseEnter={() => setSwapHovered(true)}
                onMouseLeave={() => setSwapHovered(false)}
                style={{
                  position: 'absolute', top: '50%', right: '24px',
                  transform: `translateY(-50%) rotate(${swapHovered ? '180deg' : '0deg'}) scale(${swapHovered ? '1.08' : '1'})`,
                  width: '32px', height: '32px', background: '#ffffff',
                  border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2">
                  <path d="M16 3v14M16 3l3 3M16 3l-3 3M8 21V7M8 21l-3-3M8 21l3-3" />
                </svg>
              </button>
            </div>

            {/* ── Destination Input ── */}
            <div ref={destWrapRef} style={{ position: 'relative' }}>
              <div style={{
                border: destFocused ? '1px solid var(--accent-blue)' : '1px solid rgba(0, 0, 0, 0.08)',
                background: '#ffffff', borderRadius: '10px',
                padding: '4px 14px', display: 'flex', alignItems: 'center',
                height: '48px',
                boxShadow: destFocused ? '0 0 0 3px rgba(2, 132, 199, 0.06)' : 'none',
                transition: 'all 0.2s ease',
              }}>
                <div style={{
                  width: '8px', height: '8px', background: 'var(--accent-blue)',
                  borderRadius: '50%', boxShadow: '0 0 6px rgba(2, 132, 199, 0.4)',
                  flexShrink: 0,
                }} />
                <input
                  type="text"
                  placeholder="Destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onFocus={() => setDestFocused(true)}
                  onBlur={() => setTimeout(() => setDestFocused(false), 150)}
                  style={{
                    border: 'none', outline: 'none', background: 'transparent',
                    flex: 1, fontSize: '13.5px', color: 'var(--ink)',
                    padding: '0 14px', height: '100%',
                  }}
                />
                {destination && (
                  <button
                    onMouseDown={(e) => { e.preventDefault(); setDestination(''); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#cccccc', fontSize: '16px', padding: '0 2px',
                      lineHeight: 1, flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Destination suggestions dropdown */}
              {destFocused && (
                <PlaceSuggestions
                  suggestions={destSuggestions}
                  recentSearches={recentSearches}
                  loading={destLoading}
                  query={destination}
                  onSelect={handleDestSelect}
                  onSelectRecent={(r) => { setDestination(r.destination); setDestFocused(false); }}
                  inputType="destination"
                />
              )}
            </div>
          </div>

          {/* Battery slider */}
          {savedCar && (
            <>
              <div style={{ height: '16px' }} />
              <div style={{
                background: 'rgba(0, 180, 136, 0.01)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '10px', padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--ink2)', fontWeight: '500' }}>
                    Current battery
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--teal)', letterSpacing: '-0.3px' }}>
                    {batteryPercent}%
                  </span>
                </div>
                <input
                  type="range" min="5" max="100" step="5"
                  value={batteryPercent}
                  onChange={(e) => setBatteryPercent(Number(e.target.value))}
                  style={{
                    width: '100%', height: '5px', borderRadius: '99px',
                    background: `linear-gradient(to right, var(--teal) ${batteryPercent}%, #e5e5e5 ${batteryPercent}%)`,
                    outline: 'none', accentColor: 'var(--teal)', cursor: 'pointer',
                  }}
                />
                <div style={{ fontSize: '10.5px', color: 'var(--ink3)', marginTop: '6px' }}>
                  ~{Math.round((batteryPercent / 100) * savedCar.range_km)} km of range available
                </div>
              </div>
            </>
          )}

          <div style={{ height: '20px' }} />

          {/* Car info bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '8px', background: 'rgba(0, 180, 136, 0.01)',
            border: '1px dashed rgba(0, 0, 0, 0.08)',
            borderRadius: '8px', padding: '10px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={savedCar ? 'var(--teal)' : 'var(--ink3)'}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="10" rx="2" ry="2"/>
                <circle cx="6" cy="17" r="2"/>
                <circle cx="18" cy="17" r="2"/>
              </svg>
              <span style={{ fontSize: '11.5px', color: savedCar ? 'var(--ink)' : 'var(--ink3)', fontWeight: savedCar ? '500' : '400' }}>
                {savedCar ? `${savedCar.name} · ${savedCar.range_km} km range` : 'Smart estimates based on your EV model'}
              </span>
            </div>
            <button
              onClick={() => setCarModalOpen(true)}
              onMouseEnter={() => setCarBtnHovered(true)}
              onMouseLeave={() => setCarBtnHovered(false)}
              style={{
                background: 'transparent',
                color: carBtnHovered ? 'var(--ink)' : 'var(--teal)',
                fontSize: '11.5px', fontWeight: '600', padding: 0,
                display: 'flex', alignItems: 'center', gap: '2px',
                transition: 'color 0.2s ease',
              }}
            >
              {savedCar ? 'Change' : 'Add car'} <span>→</span>
            </button>
          </div>

          <div style={{ height: '20px' }} />

          {/* Search button */}
          <button
            onClick={handleSearch}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{
              width: '100%', height: '46px',
              background: 'var(--ink)', color: '#ffffff',
              borderRadius: '10px', fontSize: '14px', fontWeight: '600',
              boxShadow: btnHovered ? '0 4px 15px rgba(15, 23, 42, 0.15)' : 'none',
              transform: btnHovered ? 'translateY(-1px)' : 'translateY(0)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Find charging stops
          </button>
        </div>

        {/* Benefits Grid */}
        <div style={{
          display: 'flex', flexDirection: 'row', gap: '16px',
          marginTop: '48px', justifyContent: 'center',
          flexWrap: 'wrap', maxWidth: '600px',
        }}>
          {[
            {
              id: 'feature-1', title: 'Smart Routes',
              desc: 'Optimized charging stops along routes',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>,
            },
            {
              id: 'feature-2', title: 'Live Info',
              desc: 'Real-time charging status & availability',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
            },
            {
              id: 'feature-3', title: 'Time Estimates',
              desc: 'Calculated durations per charge range',
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
            },
          ].map((feat) => (
            <div
              key={feat.id}
              onMouseEnter={() => setHoveredFeature(feat.id)}
              onMouseLeave={() => setHoveredFeature(null)}
              style={{
                flex: '1 1 170px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '8px', padding: '20px 16px',
                borderRadius: '12px', background: '#ffffff',
                border: hoveredFeature === feat.id ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(0, 0, 0, 0.04)',
                transform: hoveredFeature === feat.id ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: hoveredFeature === feat.id ? '0 8px 20px -8px rgba(0, 0, 0, 0.08)' : '0 2px 8px -4px rgba(0,0,0,0.02)',
                transition: 'all 0.25s ease', cursor: 'default',
              }}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: hoveredFeature === feat.id ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '4px', transition: 'all 0.25s ease',
              }}>
                {feat.icon}
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)' }}>
                {feat.title}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--ink3)', textAlign: 'center', lineHeight: 1.45 }}>
                {feat.desc}
              </span>
            </div>
          ))}
        </div>
      </main>

      {carModalOpen && (
        <CarProfileModal
          onClose={() => setCarModalOpen(false)}
          onSaved={(car) => setSavedCar(car)}
        />
      )}
    </div>
  );
}