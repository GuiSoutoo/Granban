import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {

  apiKey: "AIzaSyBKxwD6KhqPMi-IZLKAYPD9sJdsZmBvD18",

  authDomain: "granban-c3f62.firebaseapp.com",

  projectId: "granban-c3f62",

  storageBucket: "granban-c3f62.firebasestorage.app",

  messagingSenderId: "1008978199792",

  appId: "1:1008978199792:web:99b181ed4730c4f95cee35"

};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); 
const auth = getAuth(app);   

export { db, auth };
    