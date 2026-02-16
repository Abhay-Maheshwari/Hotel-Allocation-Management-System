import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { fileURLToPath } from 'url';

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

const DATA_FILE = path.resolve(__dirname, '../../shaadi_data.json');

async function seedFirestore() {
    try {
        const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
        const hotelsData = JSON.parse(rawData);

        // Test with first hotel, first room only
        const hotel = hotelsData[0]; // The Park
        console.log(`Testing seed for ${hotel.name} with 1 room only.`);

        const minimalData = {
            name: hotel.name,
            rooms: [hotel.rooms[0]]
        };

        console.log("Payload:", JSON.stringify(minimalData, null, 2));

        const hotelRef = doc(db, "hotels", "TEST_HOTEL");

        await setDoc(hotelRef, minimalData);
        console.log("Success! Minimal data uploaded.");

        process.exit(0);

    } catch (error) {
        console.error("Error seeding:", error);
        process.exit(1);
    }
}

seedFirestore();
