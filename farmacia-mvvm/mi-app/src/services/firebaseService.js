import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA-6bgs5rs7Qqiq__lfc2YjDleIWcH73WY",
  authDomain: "farmacia-cloud.firebaseapp.com",
  projectId: "farmacia-cloud",
  storageBucket: "farmacia-cloud.firebasestorage.app",
  messagingSenderId: '871999365397',
  appId: "1:871999365397:web:3e993e09686b2d9240491c",
  measurementId: "G-YLKC46PY7K"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function guardarPruebaCloud({ mensaje, usuario, modulo }) {
  const docRef = await addDoc(collection(db, 'pruebas_cloud'), {
    mensaje,
    usuario,
    modulo,
    fecha: serverTimestamp(),
  });

  return docRef.id;
}

export async function leerPruebasCloud() {
  const q = query(collection(db, 'pruebas_cloud'), orderBy('fecha', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}