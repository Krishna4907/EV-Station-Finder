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
      alert("Yo, you gotta fill both Source and Destination. Don't make me guess.");
      return;
    }

    try {
      await addDoc(collection(db, "searchLogs"), {
        source: source.trim(),
        destination: destination.trim(),
        timestamp: serverTimestamp(),
      });
      // Seriously, this should work. Unless the internet's dead.
      console.log("Search logged successfully. Nice.");
    } catch (err) {
      console.log("Ugh. Couldn't log your search:", err);
    }

    navigate(
      `/station-details?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(
        destination
      )}`
    );
  };

  return (
    <div className={styles.formContainer}>
      <input
        type="text"
        placeholder="Enter Source"
        value={source}
        onChange={(e) => setSource(e.target.value)}
        className={styles.input}
        autoComplete="off"
      />
      <input
        type="text"
        placeholder="Enter Destination"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        className={styles.input}
        autoComplete="off"
      />
      <button className={styles.searchBtn} onClick={handleSearch}>
        Search 🔎
      </button>
    </div>
  );
}
