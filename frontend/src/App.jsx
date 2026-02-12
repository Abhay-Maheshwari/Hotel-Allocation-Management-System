import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import HotelView from './components/HotelView';
import './index.css';
import { db } from './firebase';
import { collection, onSnapshot, writeBatch, doc } from 'firebase/firestore';

function App() {
    const [hotels, setHotels] = useState([]);
    const [selectedHotelName, setSelectedHotelName] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [initialFilter, setInitialFilter] = useState('');

    useEffect(() => {
        // Real-time listener
        const unsubscribe = onSnapshot(collection(db, "hotels"), (snapshot) => {
            const hotelsData = snapshot.docs
                .map(doc => doc.data())
                .filter(h => h && h.name); // Ensure hotel has a name

            // Sort hotels
            hotelsData.sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                }
                return a.name.localeCompare(b.name);
            });

            setHotels(hotelsData);
            setLoading(false);

            // Set initial selection if none
            if (!selectedHotelName && hotelsData.length > 0) {
                // Try to keep selection if possible, or select first
                // logic moved inside effect, need to be careful about resetting selection
                // Actually, we only want to set this ONCE if it's null.
                // But this effect runs on every update.
                // We can check if selectedHotelName is null inside the setState callback or just rely on the outer state
            }
        }, (err) => {
            console.error("Error fetching hotels:", err);
            setError("Failed to load data. Please ensure you have configured Firebase.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Effect to set initial selection once data is loaded
    useEffect(() => {
        if (!loading && hotels.length > 0 && !selectedHotelName) {
            setSelectedHotelName(hotels[0].name);
        }
    }, [loading, hotels, selectedHotelName]);


    const selectedHotel = hotels.find(h => h.name === selectedHotelName);

    const handleGlobalSearchSelect = (hotelName, filterTerm) => {
        setSelectedHotelName(hotelName);
        setInitialFilter(filterTerm);
    };

    const handleReorder = async (newHotelOrder) => {
        // newHotelOrder is an array of hotel objects in the new order
        try {
            const batch = writeBatch(db);
            newHotelOrder.forEach((hotel, index) => {
                const hotelRef = doc(db, "hotels", hotel.name);
                batch.update(hotelRef, { order: index });
            });
            await batch.commit();
        } catch (error) {
            console.error("Failed to save order:", error);
        }
    };

    const handleMigrate = async () => {
        if (confirm("This will overwrite your Firebase data with the local JSON file. Continue?")) {
            const { migrateData } = await import('./utils/migrateData');
            await migrateData();
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen bg-gray-100">Loading Hotels...</div>;

    // Show error but also valid UI if we have partial data? No, full block if error.
    if (error) return (
        <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-600 gap-4">
            <div>Error: {error}</div>
            <button onClick={handleMigrate} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Run First-Time Migration
            </button>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar
                hotels={hotels}
                selectedHotel={selectedHotelName}
                onSelectHotel={setSelectedHotelName}
                onGlobalSearchSelect={handleGlobalSearchSelect}
                onReorder={handleReorder}
            />
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <HotelView
                    hotel={selectedHotel}
                    initialFilter={initialFilter}
                    onClearInitialFilter={() => setInitialFilter('')}
                />
                {/* Hidden migration trigger for dev/admin use */}
                <button
                    onClick={handleMigrate}
                    className="absolute bottom-2 right-2 opacity-10 hover:opacity-100 bg-gray-800 text-white text-xs px-2 py-1 rounded"
                    title="Reset Data from JSON"
                >
                    Reset Data
                </button>
            </main>
        </div>
    );
}

export default App;
