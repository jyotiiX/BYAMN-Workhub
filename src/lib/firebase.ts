import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC_HlXmoehYF_d7LzZmudk2MQvMIXaDDkw",
  authDomain: "byamn-workhub.firebaseapp.com",
  databaseURL: "https://byamn-workhub-default-rtdb.firebaseio.com",
  projectId: "byamn-workhub",
  storageBucket: "byamn-workhub.firebasestorage.app",
  messagingSenderId: "536821955646",
  appId: "1:536821955646:web:29ca1c4764cb82b9ae656f",
  measurementId: "G-LCEDEVZWV2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;
