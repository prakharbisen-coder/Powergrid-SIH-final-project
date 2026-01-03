// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAHe8u1W2mdCYkVs7TPSruchO5sFTTTmOc",
  authDomain: "fir-for-login-81d60.firebaseapp.com",
  projectId: "fir-for-login-81d60",
  storageBucket: "fir-for-login-81d60.firebasestorage.app",
  messagingSenderId: "598980176738",
  appId: "1:598980176738:web:73d81d808fb555d42cda3b",
  measurementId: "G-4G4GNLVBGH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Auth exports for use across the app
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Optional export if you later want to use analytics elsewhere
export { analytics };