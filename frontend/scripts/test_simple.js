import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
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

async function testSimple() {
    try {
        console.log("Testing simple write to hotels_v2/test");
        const docRef = doc(db, "hotels_v2", "test");
        await setDoc(docRef, { name: "Test", created: new Date().toISOString() });
        console.log("Success hotels_v2");
    } catch (e) {
        console.error("Failed hotels_v2:", e);
    }

    try {
        console.log("Testing simple write to hotels/TEST_SIMPLE");
        const docRef = doc(db, "hotels", "TEST_SIMPLE");
        await setDoc(docRef, { name: "Test" });
        console.log("Success hotels");
    } catch (e) {
        console.error("Failed hotels:", e);
    }

    process.exit(0);
}

testSimple();
