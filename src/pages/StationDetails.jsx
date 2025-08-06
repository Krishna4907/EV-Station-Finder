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

  useEffect(() => {
    if (!source || !destination) return;
    fetchStations(source, destination);
    // Not waiting around for incomplete info, ya know?
  }, [source, destination]);

  const fetchStations = async (source, destination) => {
    try {
      setLoading(true);

      const sourceCoords = await geocodeLocation(source);
      const destinationCoords = await geocodeLocation(destination);

      // Math time! Splitting the diff between two points
      const centerLat = (sourceCoords.lat + destinationCoords.lat) / 2;
      const centerLng = (sourceCoords.lng + destinationCoords.lng) / 2;

      const response = await fetch(
        `https://api.openchargemap.io/v3/poi/?latitude=${centerLat}&longitude=${centerLng}&distance=50&key=3e3b739e-9a3e-4b18-bf1a-0e9f1d5418bb`
      );

      const data = await response.json();
      setStations(data);
    } catch (error) {
      console.error("Error fetching stations:", error);
      // Might as well shout into the void
    } finally {
      setLoading(false);
    }
  };

  const geocodeLocation = async (place) => {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(place)}&key=4cb6812086c648d9a35f126f21d279f7`
    );

    if (!response.ok) {
      throw new Error(`Could not geocode location: ${place}`);
    }

    const data = await response.json();

    if (data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry;
      return { lat, lng };
    } else {
      throw new Error(`Could not geocode location: ${place}`);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>
        Charging Stations between {source} and {destination} 📍
      </h2>
      {loading ? (
        <p>Loading...</p>
      ) : stations.length === 0 ? (
        <p>No stations found. Womp womp.</p>
      ) : (
        stations.map((station) => (
          <div key={station.ID} className={styles.stationCard}>
            <div className={styles.stationTitle}>
              {station.AddressInfo.Title || 'Unnamed Station'}
            </div>
            <p className={styles.address}>
              📍 {station.AddressInfo.AddressLine1}, {station.AddressInfo.Town}
            </p>
            {/* Yeah, distance is commented out, keepin' it for later */}
            {station.AddressInfo.Distance && (
              <p className={styles.info}>
                {/* Distance: {station.AddressInfo.Distance.toFixed(1)} km */}
              </p>
            )}
            <p className={styles.info}>
              🔌 Plug Types:{" "}
              {station.Connections?.map((conn) => conn.ConnectionType?.Title).join(", ") || "N/A"}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

export default StationDetails;