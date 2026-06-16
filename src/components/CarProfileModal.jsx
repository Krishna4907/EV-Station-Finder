import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';
import { EV_CARS_BY_BRAND, EV_CARS } from '../data/evCars';

export default function CarProfileModal({ onClose, onSaved }) {
  const { user } = useAuth();
  const [selectedCarId, setSelectedCarId] = useState('');
  const [saving, setSaving]               = useState(false);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [dropdownOpen, setDropdownOpen]   = useState(false);

  const selectedCar = EV_CARS.find(c => c.id === selectedCarId) || null;

  // Load existing saved car from Firestore
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists() && snap.data().carId) {
          setSelectedCarId(snap.data().carId);
        }
      } catch (e) {
        // silently ignore — user just hasn't set a car yet
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // Save to Firestore
  const handleSave = async () => {
    if (!selectedCarId) { setError('Please select a car first.'); return; }
    setSaving(true);
    setError('');
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { carId: selectedCarId, carName: selectedCar.name, updatedAt: new Date() },
        { merge: true }
      );
      onSaved(selectedCar);
      onClose();
    } catch (e) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e5e5e5',
        width: '100%',
        maxWidth: '420px',
        padding: '28px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        position: 'relative',
      }}>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: '#f7f7f5', border: '1px solid #e5e5e5',
            borderRadius: '8px', width: '28px', height: '28px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#888888', fontSize: '14px',
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em',
            color: '#00a87e', textTransform: 'uppercase', marginBottom: '8px',
          }}>
            Car Profile
          </div>
          <h2 style={{
            fontSize: '18px', fontWeight: '700', color: '#111111',
            letterSpacing: '-0.3px', marginBottom: '4px',
          }}>
            {selectedCarId ? 'Update your car' : 'Add your EV'}
          </h2>
          <p style={{ fontSize: '12.5px', color: '#888888', lineHeight: 1.5 }}>
            Saved once — used to calculate charging stops and time estimates.
          </p>
        </div>

        {loading ? (
          <div style={{
            height: '48px', background: '#f7f7f5',
            borderRadius: '10px', animation: 'pulse 1.5s infinite',
          }}>
            <style>{`@keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:.9} }`}</style>
          </div>
        ) : (
          <>
            {/* Custom dropdown */}
            <div style={{ marginBottom: '16px', position: 'relative' }}>
              <label style={{
                display: 'block', fontSize: '11.5px', fontWeight: '500',
                color: '#444444', marginBottom: '6px',
              }}>
                Select your EV model
              </label>

              {/* Trigger */}
              <button
                onClick={() => setDropdownOpen(o => !o)}
                style={{
                  width: '100%', height: '44px',
                  background: '#ffffff',
                  border: dropdownOpen ? '1px solid #00C896' : '1px solid #e5e5e5',
                  borderRadius: '10px',
                  padding: '0 14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: selectedCar ? '#111111' : '#888888',
                  transition: 'border-color 0.15s',
                }}
              >
                <span>{selectedCar ? selectedCar.name : 'Choose your car…'}</span>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#888888" strokeWidth="2" strokeLinecap="round"
                  style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {/* Dropdown list */}
              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                  background: '#ffffff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  zIndex: 100,
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}>
                  {EV_CARS_BY_BRAND.map((group) => (
                    <div key={group.brand}>
                      {/* Brand group label */}
                      <div style={{
                        padding: '8px 14px 4px',
                        fontSize: '10px', fontWeight: '600',
                        color: '#aaaaaa', letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        position: 'sticky', top: 0,
                        background: '#ffffff',
                        borderBottom: '1px solid #f5f5f5',
                      }}>
                        {group.brand}
                      </div>

                      {/* Car options */}
                      {group.cars.map((car) => (
                        <div
                          key={car.id}
                          onClick={() => { setSelectedCarId(car.id); setDropdownOpen(false); setError(''); }}
                          style={{
                            padding: '10px 14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            cursor: 'pointer',
                            background: selectedCarId === car.id ? 'rgba(0,200,150,0.06)' : 'transparent',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = selectedCarId === car.id ? 'rgba(0,200,150,0.06)' : '#f7f7f5'}
                          onMouseLeave={e => e.currentTarget.style.background = selectedCarId === car.id ? 'rgba(0,200,150,0.06)' : 'transparent'}
                        >
                          <span style={{
                            fontSize: '13px',
                            color: selectedCarId === car.id ? '#00a87e' : '#111111',
                            fontWeight: selectedCarId === car.id ? '600' : '400',
                          }}>
                            {car.name}
                          </span>
                          <span style={{ fontSize: '11px', color: '#aaaaaa' }}>
                            {car.range_km} km
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected car stats */}
            {selectedCar && (
              <div style={{
                background: 'rgba(0,200,150,0.04)',
                border: '1px solid rgba(0,200,150,0.15)',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
              }}>
                {[
                  { label: 'Range',     value: `${selectedCar.range_km} km` },
                  { label: 'Battery',   value: `${selectedCar.battery_kwh} kWh` },
                  { label: 'Connector', value: selectedCar.connector },
                ].map(({ label, value }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#111111', letterSpacing: '-0.3px' }}>
                      {value}
                    </div>
                    <div style={{ fontSize: '10px', color: '#888888', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '12px' }}>
                {error}
              </p>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, height: '42px',
                  background: 'transparent',
                  border: '1px solid #e5e5e5',
                  borderRadius: '10px',
                  fontSize: '13px', fontWeight: '500', color: '#444444',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !selectedCarId}
                style={{
                  flex: 2, height: '42px',
                  background: saving || !selectedCarId ? '#cccccc' : '#111111',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px', fontWeight: '600', color: '#ffffff',
                  cursor: saving || !selectedCarId ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {saving ? 'Saving…' : 'Save car'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}