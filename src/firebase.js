/*
Firebase Console Setup:
1. Go to console.firebase.google.com
2. Create a new project (or use existing one)
3. Add a Web app, copy the config object into firebaseConfig
4. In Authentication -> Sign-in method -> enable Email/Password
5. In Authentication -> Sign-in method -> enable Google, set project support email
6. In Authentication -> Settings -> Authorized domains -> add localhost and your Vercel domain (ev-station-finder.vercel.app)
*/

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

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
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
