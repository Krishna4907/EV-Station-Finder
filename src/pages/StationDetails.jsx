import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './StationDetails.module.css';

function StationDetails() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const source = queryParams.get('source');
  const destination = queryParams.get('destination');

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!source || !destination) return;
    fetchStations(source, destination);
  }, [source, destination]);

  const fetchStations = async (source, destination) => {
    try {
      setLoading(true);
      setError(null);

      // Get coordinates for both locations
      const sourceCoords = await geocodeLocation(source);
      const destinationCoords = await geocodeLocation(destination);

      // Find center point
      const centerLat = (sourceCoords.lat + destinationCoords.lat) / 2;
      const centerLng = (sourceCoords.lng + destinationCoords.lng) / 2;

      // Fetch charging stations near center
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
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(place)}&key=26d9e4aef84e4560b9428ca45f998579`
    );

    if (!response.ok) {
      const msg = await response.text();
      console.error("OpenCage API error:", msg);
      throw new Error(`Could not geocode location: ${place}`);
    }

    const data = await response.json();

    if (!data.results.length) {
      throw new Error(`No results found for: ${place}`);
    }

    const { lat, lng } = data.results[0].geometry;
    return { lat, lng };
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>
        Charging Stations between {source} and {destination} 📍
      </h2>

      {loading && <p>Loading...</p>}

      {error && <p style={{ color: "red" }}>⚠ {error}</p>}

      {!loading && !error && stations.length === 0 && (
        <p>No stations found.</p>
      )}

      {!loading && !error && stations.map((station) => (
        <div key={station.ID} className={styles.stationCard}>
          <div className={styles.stationTitle}>
            {station.AddressInfo?.Title || 'Unnamed Station'}
          </div>

          <p className={styles.address}>
            📍 {station.AddressInfo?.AddressLine1}, {station.AddressInfo?.Town}
          </p>

          <p className={styles.info}>
            🔌 Plug Types:{" "}
            {station.Connections?.map(
              conn => conn.ConnectionType?.Title
            ).join(", ") || "N/A"}
          </p>
        </div>
      ))}
    </div>
  );
}

export default StationDetails;
