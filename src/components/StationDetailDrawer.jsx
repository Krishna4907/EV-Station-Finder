import {
  estimateChargingMinutes,
  estimateCostINR,
  formatDuration,
  getBestChargerKw,
  getChargerSpeedLabel,
} from '../utils/chargingEstimate';

export default function StationDetailDrawer({
  station,
  savedCar,
  arrivalPercent,
  isSuggested,
  onClose,
}) {
  if (!station) return null;

  const info        = station.AddressInfo;
  const connections = station.Connections || [];

  const connectorTypes = [...new Set(
    connections.map((c) => c.ConnectionType?.Title).filter(Boolean)
  )];

  const bestKw     = getBestChargerKw(connections);
  const speedLabel = getChargerSpeedLabel(bestKw);

  const powerLevels = [...new Set(
    connections.map((c) => c.PowerKW).filter((p) => p > 0)
  )].sort((a, b) => b - a);

  const currentSOC   = arrivalPercent ?? 20;
  const chargingMins = savedCar && bestKw
    ? estimateChargingMinutes(currentSOC, 80, savedCar.battery_kwh, bestKw)
    : null;
  const cost = savedCar && bestKw
    ? estimateCostINR(currentSOC, 80, savedCar.battery_kwh, bestKw)
    : null;

  const totalConnectors = connections.length;
  const usageTypes = [...new Set(
    connections.map((c) => c.UsageType?.Title).filter(Boolean)
  )];
  const hours = info?.AccessComments || null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.08)',
          zIndex: 1000,
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0,
        width: '320px',
        background: '#ffffff',
        borderLeft: '1px solid #e5e5e5',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
      }}>

        {/* HEADER */}
        <div style={{
          padding: '18px 18px 14px',
          borderBottom: '1px solid #e5e5e5',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              {isSuggested && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  background: '#111111', color: '#ffffff',
                  fontSize: '10px', fontWeight: '600',
                  padding: '2px 7px', borderRadius: '5px', marginBottom: '8px',
                }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  Suggested Stop
                </div>
              )}
              <div style={{
                fontSize: '14px', fontWeight: '700',
                color: '#111111', lineHeight: 1.3, letterSpacing: '-0.3px',
              }}>
                {info?.Title || 'Unnamed Station'}
              </div>
              <div style={{ fontSize: '11.5px', color: '#888888', marginTop: '4px', lineHeight: 1.45 }}>
                {[info?.AddressLine1, info?.Town, info?.StateOrProvince].filter(Boolean).join(', ')}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '28px', height: '28px', flexShrink: 0,
                background: '#f7f7f5', border: '1px solid #e5e5e5',
                borderRadius: '8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', color: '#888888',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* SMART ESTIMATE */}
          {savedCar && bestKw ? (
            <div style={{
              margin: '14px 16px',
              background: 'rgba(0,200,150,0.04)',
              border: '1px solid rgba(0,200,150,0.18)',
              borderRadius: '10px',
              padding: '14px 16px',
            }}>
              <div style={{
                fontSize: '10px', fontWeight: '600', color: '#00a87e',
                letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px',
              }}>
                ⚡ Smart estimate · {savedCar.name}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div style={{ background: '#ffffff', borderRadius: '8px', padding: '10px 12px', border: '1px solid #f0f0ee' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#111111', letterSpacing: '-0.4px' }}>
                    {formatDuration(chargingMins)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#888888', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Charge time
                  </div>
                </div>
                <div style={{ background: '#ffffff', borderRadius: '8px', padding: '10px 12px', border: '1px solid #f0f0ee' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#111111', letterSpacing: '-0.4px' }}>
                    {cost ? (cost.min === 0 ? 'Free?' : `₹${cost.min}–${cost.max}`) : '—'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#888888', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Est. cost
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#666666', lineHeight: 1.5 }}>
                Arriving at ~{currentSOC}% → charging to 80% at {bestKw} kW
                {arrivalPercent === undefined && (
                  <span style={{ color: '#aaaaaa' }}> (set battery % on home for accurate estimate)</span>
                )}
              </div>
            </div>
          ) : !savedCar ? (
            <div style={{
              margin: '14px 16px',
              background: '#f7f7f5', border: '1px dashed #e5e5e5',
              borderRadius: '10px', padding: '12px 14px',
              fontSize: '12px', color: '#888888', lineHeight: 1.5,
            }}>
              Add your car on the home screen to see charging time and cost estimates.
            </div>
          ) : null}

          {/* CHARGER INFO */}
          <div style={{ padding: '0 16px 14px' }}>
            <div style={{
              fontSize: '11px', fontWeight: '600', color: '#aaaaaa',
              letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px',
            }}>
              Charger info
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', color: '#666666' }}>Speed</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: '600',
                    background: bestKw >= 50 ? 'rgba(0,200,150,0.08)' : '#f7f7f5',
                    color: bestKw >= 50 ? '#00a87e' : '#444444',
                    border: `1px solid ${bestKw >= 50 ? 'rgba(0,200,150,0.2)' : '#e5e5e5'}`,
                    borderRadius: '5px', padding: '2px 7px',
                  }}>
                    {speedLabel}
                  </span>
                  <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#111111' }}>
                    {bestKw ? `${bestKw} kW` : '—'}
                  </span>
                </div>
              </div>

              {powerLevels.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', color: '#666666' }}>Power levels</span>
                  <span style={{ fontSize: '12.5px', color: '#111111', fontWeight: '500' }}>
                    {powerLevels.map(p => `${p} kW`).join(', ')}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', color: '#666666' }}>Total connectors</span>
                <span style={{ fontSize: '12.5px', color: '#111111', fontWeight: '600' }}>
                  {totalConnectors}
                </span>
              </div>

              {connectorTypes.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '12.5px', color: '#666666', flexShrink: 0 }}>Connectors</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'flex-end' }}>
                    {connectorTypes.map((type, i) => (
                      <span key={i} style={{
                        fontSize: '10.5px', fontWeight: '600',
                        background: savedCar?.connector === type ? 'rgba(0,200,150,0.08)' : '#f7f7f5',
                        color: savedCar?.connector === type ? '#00a87e' : '#444444',
                        border: `1px solid ${savedCar?.connector === type ? 'rgba(0,200,150,0.2)' : '#e5e5e5'}`,
                        borderRadius: '5px', padding: '2px 7px',
                      }}>
                        {type}{savedCar?.connector === type ? ' ✓' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {usageTypes.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', color: '#666666' }}>Access</span>
                  <span style={{ fontSize: '12.5px', color: '#111111', fontWeight: '500' }}>
                    {usageTypes.join(', ')}
                  </span>
                </div>
              )}

              {hours && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '12.5px', color: '#666666', flexShrink: 0 }}>Hours</span>
                  <span style={{ fontSize: '12px', color: '#111111', textAlign: 'right', lineHeight: 1.4 }}>
                    {hours}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div style={{ height: '1px', background: '#f0f0ee', margin: '0 16px' }} />

          {/* LOCATION */}
          <div style={{ padding: '14px 16px' }}>
            <div style={{
              fontSize: '11px', fontWeight: '600', color: '#aaaaaa',
              letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px',
            }}>
              Location
            </div>
            <div style={{ fontSize: '12.5px', color: '#444444', lineHeight: 1.6, marginBottom: '8px' }}>
              {[info?.AddressLine1, info?.AddressLine2, info?.Town, info?.StateOrProvince, info?.Postcode]
                .filter(Boolean).join(', ')}
            </div>
            {info?.Latitude && info?.Longitude && (
              <div style={{ fontSize: '11px', color: '#aaaaaa' }}>
                {Number(info.Latitude).toFixed(5)}, {Number(info.Longitude).toFixed(5)}
              </div>
            )}
          </div>

          {station.OperatorInfo?.Title && (
            <>
              <div style={{ height: '1px', background: '#f0f0ee', margin: '0 16px' }} />
              <div style={{ padding: '14px 16px' }}>
                <div style={{
                  fontSize: '11px', fontWeight: '600', color: '#aaaaaa',
                  letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px',
                }}>
                  Operator
                </div>
                <div style={{ fontSize: '12.5px', color: '#444444' }}>
                  {station.OperatorInfo.Title}
                </div>
                {station.OperatorInfo?.WebsiteURL && (
                  <a
                    href={station.OperatorInfo.WebsiteURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '12px', color: '#00a87e', marginTop: '4px', display: 'block' }}
                  >
                    {station.OperatorInfo.WebsiteURL}
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid #e5e5e5',
          flexShrink: 0,
          display: 'flex',
          gap: '8px',
        }}>
          <button
            onClick={() => {
              const lat = info?.Latitude;
              const lng = info?.Longitude;
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
            }}
            style={{
              flex: 1, height: '40px',
              background: '#111111', color: '#ffffff',
              border: 'none', borderRadius: '8px',
              fontSize: '13px', fontWeight: '500',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
            Navigate
          </button>
          <button
            onClick={onClose}
            style={{
              height: '40px', padding: '0 14px',
              background: 'transparent',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              fontSize: '13px', color: '#444444',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>

      </div>
    </>
  );
}