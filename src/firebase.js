import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

// Your project keys — safe to be public, Firestore Security Rules do the
// actual access control (see config/firestore.rules).
const firebaseConfig = {
  apiKey: "AIzaSyD9JPq4Jvv-xzBfbOHblsIrZaBMKhqUqCo",
  authDomain: "gen-lang-client-0171325067.firebaseapp.com",
  projectId: "gen-lang-client-0171325067",
  storageBucket: "gen-lang-client-0171325067.firebasestorage.app",
  messagingSenderId: "622645427555",
  appId: "1:622645427555:web:587fc350980e0c7cde6756",
  measurementId: "G-HK4TXMT83W",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Students: signed in anonymously so they can read sessions/write their own
// participant + attempt docs, per Firestore rules.
export const ensureAuth = async () => {
  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.error("Error signing in anonymously:", error);
  }
};

// Admins: real email/password sign-in. This is what Firestore rules check
// (sign_in_provider === "password") to grant access to the quiz bank and
// session controls. Create admin accounts in the Firebase console under
// Authentication > Users, or via the Firebase CLI — there is no self-signup
// flow here on purpose.
export async function adminSignIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function adminSignOut() {
  await signOut(auth);
  // Re-establish an anonymous session so student flows keep working right away.
  await ensureAuth();
}

export function isAdminUser(user) {
  return !!user && user.providerData.some((p) => p.providerId === "password");
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
