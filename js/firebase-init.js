import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBrwxhCxatKrqyJxzRdhX2t54D7_-xQM18",
    authDomain: "sistema-ovos-distribuicao.firebaseapp.com",
    projectId: "sistema-ovos-distribuicao",
    storageBucket: "sistema-ovos-distribuicao.firebasestorage.app",
    messagingSenderId: "243415458017",
    appId: "1:243415458017:web:da9429e769a317f92097a0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
