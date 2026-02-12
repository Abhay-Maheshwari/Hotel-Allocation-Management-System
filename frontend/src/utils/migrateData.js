import { db } from '../firebase';
import { collection, doc, setDoc, writeBatch } from "firebase/firestore";
import shaadiData from '../../../shaadi_data.json';

export const migrateData = async () => {
    try {
        console.log("Starting migration...");
        const batch = writeBatch(db);

        shaadiData.forEach((hotel) => {
            const hotelRef = doc(db, "hotels", hotel.name);
            batch.set(hotelRef, hotel);
        });

        await batch.commit();
        console.log("Migration completed successfully!");
        alert("Migration completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
        alert("Migration failed: " + error.message);
    }
};
