import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from frontend/.env
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

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
        if (!fs.existsSync(DATA_FILE)) {
            console.error(`Data file not found at ${DATA_FILE}`);
            process.exit(1);
        }

        const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
        const hotelsData = JSON.parse(rawData);

        console.log(`Found ${hotelsData.length} hotels to seed.`);

        // Step 1: Clear existing data
        console.log("Clearing existing 'hotels' collection...");
        const hotelsCol = collection(db, "hotels");
        const snapshot = await getDocs(hotelsCol);

        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log(`Deleted ${snapshot.size} existing documents.`);

        // Step 2: Seed new data
        for (const hotel of hotelsData) {
            console.log(`Seeding hotel: ${hotel.name} with ${hotel.rooms.length} rooms...`);

            // Validate essential fields
            if (!hotel.name) {
                console.error("Skipping hotel with missing name");
                continue;
            }

            const hotelRef = doc(db, "hotels", hotel.name);

            // Ensure data is clean (no undefineds)
            const cleanHotel = JSON.parse(JSON.stringify({
                name: hotel.name,
                rooms: hotel.rooms,
                order: 0 // Default order, can be updated by app later
            }));

            // Set document (overwrite since we cleared it, but explicit set is good)
            await setDoc(hotelRef, cleanHotel);
            console.log(`  - Done ${hotel.name}`);
        }

        console.log("Seeding process finished successfully.");
        process.exit(0);

    } catch (error) {
        console.error("Error seeding Firestore:", error);
        process.exit(1);
    }
}

seedFirestore();
