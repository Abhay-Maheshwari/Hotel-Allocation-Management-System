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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

    if (loading) return <div className="flex items-center justify-center h-screen bg-gray-100">Loading Hotels...</div>;

    // Show error but also valid UI if we have partial data? No, full block if error.
    if (error) return (
        <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-600 gap-4">
            <div>Error: {error}</div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans relative transition-colors duration-200">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 z-20 flex justify-between items-center shadow-sm">
                <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Shaadi Planner</h1>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            <Sidebar
                hotels={hotels}
                selectedHotel={selectedHotelName}
                onSelectHotel={(name) => {
                    setSelectedHotelName(name);
                    setIsSidebarOpen(false); // Close sidebar on mobile when selecting
                }}
                onGlobalSearchSelect={handleGlobalSearchSelect}
                onReorder={handleReorder}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <main className="flex-1 flex flex-col overflow-hidden relative pt-16 md:pt-0">
                <HotelView
                    hotel={selectedHotel}
                    initialFilter={initialFilter}
                    onClearInitialFilter={() => setInitialFilter('')}
                />
            </main>
        </div>
    );
}

export default App;
