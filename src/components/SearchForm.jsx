import styles from './SearchForm.module.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../Firebase/config.js';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export default function SearchForm() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const navigate = useNavigate();

  const handleSearch = async () => { 
    if (!source || !destination) {
      alert("Please enter Source and Destination");
      return;
    }

    try {
      await addDoc(collection(db, "searchLogs"), {
        source: source.trim(),
        destination: destination.trim(),
        timestamp: serverTimestamp(),
      });
      console.log("Search logged successfully.");
    } catch (err) {
      console.log("Error logging search:", err);
    }

    navigate(`/station-details?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}`);
  };

  return (
    <div className={styles.form}>
      <input
        type="text"
        placeholder="Enter Source"
        value={source}
        onChange={(e) => setSource(e.target.value)}
      />
      <input
        type="text"
        placeholder="Enter Destination"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
      />
      <button onClick={handleSearch}>Search 🔎</button>
    </div>
  );
}
