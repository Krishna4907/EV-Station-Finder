/**
 * PlaceSuggestions
 * Dropdown shown below a search input.
 * - When query is empty: shows recent searches (last 5 routes)
 * - When query has 2+ chars: shows Photon autocomplete results
 */
export default function PlaceSuggestions({
  suggestions,      // autocomplete results from usePlaceAutocomplete
  recentSearches,   // array of { source, destination, timestamp }
  loading,          // autocomplete loading state
  query,            // current input value
  onSelect,         // (label: string) => void  — called when suggestion picked
  onSelectRecent,   // ({ source, destination }) => void — called for recent route
  inputType,        // 'source' | 'destination' — for coloring the dot
}) {
  const showRecent  = (!query || query.trim().length < 2) && recentSearches?.length > 0;
  const showResults = query?.trim().length >= 2;

  if (!showRecent && !showResults && !loading) return null;

  const accentColor = inputType === 'source' ? '#00C896' : '#3b82f6';

  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 6px)',
      left: 0, right: 0,
      background: '#ffffff',
      border: '1px solid #e5e5e5',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      zIndex: 999,
      overflow: 'hidden',
    }}>

      {/* Loading state */}
      {loading && (
        <div style={{
          padding: '12px 16px',
          fontSize: '12px', color: '#888888',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <div style={{
            width: '12px', height: '12px', borderRadius: '50%',
            border: '1.5px solid #e5e5e5',
            borderTopColor: accentColor,
            animation: 'spin 0.7s linear infinite',
          }} />
          Searching places…
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Autocomplete results */}
      {!loading && showResults && suggestions.length === 0 && (
        <div style={{ padding: '12px 16px', fontSize: '12px', color: '#888888' }}>
          No places found for "{query}"
        </div>
      )}

      {!loading && showResults && suggestions.map((s, i) => (
        <div
          key={i}
          onMouseDown={(e) => { e.preventDefault(); onSelect(s.label); }}
          style={{
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: '10px',
            cursor: 'pointer',
            borderBottom: i < suggestions.length - 1 ? '1px solid #f5f5f5' : 'none',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f7f7f5'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {/* Location dot */}
          <div style={{
            width: '7px', height: '7px',
            borderRadius: '50%',
            background: accentColor,
            flexShrink: 0,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '13px', fontWeight: '500', color: '#111111',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {s.name}
            </div>
            <div style={{
              fontSize: '11px', color: '#888888', marginTop: '1px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {s.label}
            </div>
          </div>
        </div>
      ))}

      {/* Recent searches */}
      {showRecent && (
        <>
          <div style={{
            padding: '8px 16px 4px',
            fontSize: '10px', fontWeight: '600', color: '#aaaaaa',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Recent searches
          </div>
          {recentSearches.slice(0, 5).map((r, i) => (
            <div
              key={i}
              onMouseDown={(e) => { e.preventDefault(); onSelectRecent(r); }}
              style={{
                padding: '10px 16px',
                display: 'flex', alignItems: 'center', gap: '10px',
                cursor: 'pointer',
                borderBottom: i < recentSearches.length - 1 ? '1px solid #f5f5f5' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f7f7f5'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Clock icon */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="#cccccc" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '12.5px', color: '#111111',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  overflow: 'hidden',
                }}>
                  <span style={{
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: '120px',
                  }}>
                    {r.source}
                  </span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="#cccccc" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                  <span style={{
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: '120px',
                  }}>
                    {r.destination}
                  </span>
                </div>
              </div>
              {/* Arrow */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="#cccccc" strokeWidth="2" style={{ flexShrink: 0 }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          ))}
        </>
      )}
    </div>
  );
}