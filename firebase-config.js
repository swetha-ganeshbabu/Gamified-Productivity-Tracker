// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyApDYp7Ncik9jWeuqj4UYZdU7ZR39LCtpw",
    authDomain: "accountability-4329a.firebaseapp.com",
    projectId: "accountability-4329a",
    storageBucket: "accountability-4329a.firebasestorage.app",
    messagingSenderId: "382250497454",
    appId: "1:382250497454:web:6a3cfaf72b1ee26ea0043f",
    measurementId: "G-1HXZC8QMLY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database }; 