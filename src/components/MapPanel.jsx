import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon broken in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom pin SVG icons
const createSourceIcon = () => L.divIcon({
  className: '',
  html: `
    <div style="
      width:14px; height:14px;
      background:#111111;
      border-radius:50%;
      border:2.5px solid #ffffff;
      box-shadow:0 0 0 1.5px #111111, 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const createDestIcon = () => L.divIcon({
  className: '',
  html: `
    <div style="
      width:14px; height:14px;
      background:#00C896;
      border-radius:50%;
      border:2.5px solid #ffffff;
      box-shadow:0 0 0 1.5px #00C896, 0 2px 6px rgba(0,200,150,0.4);
    "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const createStationIcon = (isSelected) => L.divIcon({
  className: '',
  html: `
    <div style="
      width:${isSelected ? 32 : 26}px;
      height:${isSelected ? 32 : 26}px;
      background:${isSelected ? '#111111' : '#ffffff'};
      border-radius:50%;
      border:2px solid ${isSelected ? '#111111' : '#e5e5e5'};
      box-shadow:${isSelected
        ? '0 0 0 3px rgba(0,200,150,0.2), 0 4px 12px rgba(0,0,0,0.2)'
        : '0 2px 6px rgba(0,0,0,0.12)'};
      display:flex; align-items:center; justify-content:center;
      transition:all 0.2s;
    ">
      <svg width="${isSelected ? 14 : 12}" height="${isSelected ? 14 : 12}"
        viewBox="0 0 24 24" fill="none"
        stroke="${isSelected ? '#00C896' : '#888888'}"
        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    </div>`,
  iconSize: [isSelected ? 32 : 26, isSelected ? 32 : 26],
  iconAnchor: [isSelected ? 16 : 13, isSelected ? 16 : 13],
});

export default function MapPanel({
  sourceCoords,
  destCoords,
  stations,
  selectedStationId,
  onStationClick,
}) {
  const mapRef       = useRef(null);
  const mapInstance  = useRef(null);
  const markersRef   = useRef({});
  const routeLineRef = useRef(null);

  // Init map once
  useEffect(() => {
    if (mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    // Custom zoom control — bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  // Draw route + source/dest markers whenever coords change
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !sourceCoords || !destCoords) return;

    // Remove old route
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
    }

    // Draw straight route line (upgrade to OSRM later for real roads)
    const latlngs = [
      [sourceCoords.lat, sourceCoords.lng],
      [destCoords.lat, destCoords.lng],
    ];

    routeLineRef.current = L.polyline(latlngs, {
      color: '#111111',
      weight: 2.5,
      opacity: 0.6,
      dashArray: '6 4',
    }).addTo(map);

    // Source marker
    L.marker([sourceCoords.lat, sourceCoords.lng], { icon: createSourceIcon() })
      .addTo(map)
      .bindTooltip('Start', {
        permanent: false,
        direction: 'top',
        className: 'map-tooltip',
        offset: [0, -10],
      });

    // Destination marker
    L.marker([destCoords.lat, destCoords.lng], { icon: createDestIcon() })
      .addTo(map)
      .bindTooltip('Destination', {
        permanent: false,
        direction: 'top',
        className: 'map-tooltip',
        offset: [0, -10],
      });

    // Fit map to show full route
    map.fitBounds(
      L.latLngBounds(latlngs).pad(0.25),
      { animate: true, duration: 0.8 }
    );
  }, [sourceCoords, destCoords]);

  // Add/update station markers
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Remove old station markers
    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};

    stations.forEach((station) => {
      const lat = station.AddressInfo?.Latitude;
      const lng = station.AddressInfo?.Longitude;
      if (!lat || !lng) return;

      const isSelected = station.ID === selectedStationId;
      const marker = L.marker([lat, lng], {
        icon: createStationIcon(isSelected),
        zIndexOffset: isSelected ? 1000 : 0,
      }).addTo(map);

      marker.bindTooltip(
        station.AddressInfo?.Title || 'Station',
        {
          permanent: false,
          direction: 'top',
          className: 'map-tooltip',
          offset: [0, -14],
        }
      );

      marker.on('click', () => onStationClick(station.ID));
      markersRef.current[station.ID] = marker;
    });
  }, [stations, selectedStationId, onStationClick]);

  // Pan to selected station
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !selectedStationId) return;

    const station = stations.find((s) => s.ID === selectedStationId);
    const lat = station?.AddressInfo?.Latitude;
    const lng = station?.AddressInfo?.Longitude;
    if (!lat || !lng) return;

    map.panTo([lat, lng], { animate: true, duration: 0.5 });
  }, [selectedStationId, stations]);

  return (
    <>
      <style>{`
        .map-tooltip {
          background: #111111 !important;
          color: #ffffff !important;
          border: none !important;
          border-radius: 6px !important;
          font-size: 11px !important;
          font-weight: 500 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          padding: 4px 8px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
          white-space: nowrap !important;
        }
        .map-tooltip::before {
          border-top-color: #111111 !important;
        }
        .leaflet-control-zoom {
          border: 1px solid #e5e5e5 !important;
          border-radius: 8px !important;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06) !important;
        }
        .leaflet-control-zoom a {
          color: #444444 !important;
          font-size: 16px !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f7f7f5 !important;
          color: #111111 !important;
        }
        .leaflet-control-attribution {
          font-size: 9px !important;
          color: #aaaaaa !important;
          background: rgba(255,255,255,0.8) !important;
        }
      `}</style>

      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          background: '#f7f7f5',
        }}
      />
    </>
  );
}