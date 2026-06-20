import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

// Firebase Web SDK client config. All values are public (NEXT_PUBLIC_*) and come
// from the Firebase console.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

// getAuth() validates the API key and touches browser-only persistence, which
// breaks static-export prerender on the server (NEXT_PUBLIC_* env is absent
// there). The auth code paths only run in the browser (effects / event
// handlers), so resolve the Auth instance lazily on first use instead of at
// import time. Cached so init happens at most once.
let authInstance: Auth | null = null;
export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
}

export const googleProvider = new GoogleAuthProvider();
