import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import HotelView from './components/HotelView';
import './index.css';

function App() {
    const [hotels, setHotels] = useState([]);
    const [selectedHotelName, setSelectedHotelName] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [initialFilter, setInitialFilter] = useState('');

    const fetchHotels = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/hotels`);
            setHotels(response.data);
            if (!selectedHotelName && response.data.length > 0) {
                setSelectedHotelName(response.data[0].name);
            }
        } catch (error) {
            console.error("Error fetching hotels:", error);
            setError(error.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHotels();
    }, []);

    const selectedHotel = hotels.find(h => h.name === selectedHotelName);

    const handleGlobalSearchSelect = (hotelName, filterTerm) => {
        setSelectedHotelName(hotelName);
        setInitialFilter(filterTerm);
    };

    if (loading) return <div className="flex items-center justify-center h-screen bg-gray-100">Loading...</div>;
    if (error) return <div className="flex items-center justify-center h-screen bg-red-50 text-red-600">Error: {error}</div>;

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar
                hotels={hotels}
                selectedHotel={selectedHotelName}
                onSelectHotel={setSelectedHotelName}
                onGlobalSearchSelect={handleGlobalSearchSelect}
            />
            <main className="flex-1 flex flex-col overflow-hidden">
                <HotelView
                    hotel={selectedHotel}
                    onUpdate={fetchHotels}
                    initialFilter={initialFilter}
                    onClearInitialFilter={() => setInitialFilter('')}
                />
            </main>
        </div>
    );
}

export default App;
