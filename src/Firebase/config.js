import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAI_Qr4Avvoqu2kbZIh83UdF8LBOHaYwpw",
  authDomain: "ev--station-finder.firebaseapp.com",
  projectId: "ev--station-finder",
  storageBucket: "ev--station-finder.firebasestorage.app",
  messagingSenderId: "21170533017",
  appId: "1:21170533017:web:73a89e969a3122f5e7fe08",
  measurementId: "G-WZ2DZBSK9G"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
