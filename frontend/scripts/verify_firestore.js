import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import 'dotenv/config';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verify() {
    try {
        const hotelName = "The Park";
        const docRef = doc(db, "hotels", hotelName);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log("Document data:", JSON.stringify(docSnap.data(), null, 2).substring(0, 500) + "...");
            console.log("Verification Successful: Found hotel 'The Park'");
        } else {
            console.log("No such document!");
        }
        process.exit(0);
    } catch (error) {
        console.error("Error verifying:", error);
        process.exit(1);
    }
}

verify();
