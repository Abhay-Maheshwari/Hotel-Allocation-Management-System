import React, { useState, useMemo } from 'react';
import { Home, Users, Download, Upload, Search, BedDouble, Tag } from 'lucide-react';
import axios from 'axios';

const Sidebar = ({ hotels, selectedHotel, onSelectHotel, onGlobalSearchSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredResults = useMemo(() => {
        if (!searchTerm) return [];
        const lowerTerm = searchTerm.toLowerCase();
        const results = [];

        hotels.forEach(hotel => {
            // Check Hotel Name
            if (hotel.name.toLowerCase().includes(lowerTerm)) {
                results.push({ type: 'hotel', data: hotel, hotelName: hotel.name });
            }

            hotel.rooms.forEach(room => {
                // Check Room Number
                if (room.room_number.toLowerCase().includes(lowerTerm)) {
                    results.push({ type: 'room', data: room, hotelName: hotel.name });
                }

                // Check Room Type
                if (room.room_type && room.room_type.toLowerCase().includes(lowerTerm)) {
                    // Avoid duplicates if both room number and type match, or just add distinct entry?
                    // Let's add distinct entry for clarity or maybe just one entry per room.
                    // For now, simple list.
                    if (!results.some(r => r.type === 'room' && r.data.room_number === room.room_number && r.hotelName === hotel.name)) {
                        results.push({ type: 'room', data: room, hotelName: hotel.name, match: 'type' });
                    }
                }

                // Check Tags
                if (room.tags && room.tags.some(tag => tag.toLowerCase().includes(lowerTerm))) {
                    if (!results.some(r => r.type === 'room' && r.data.room_number === room.room_number && r.hotelName === hotel.name)) {
                        results.push({ type: 'room', data: room, hotelName: hotel.name, match: 'tag' });
                    }
                }

                // Check Occupants
                room.occupants.forEach(occ => {
                    if (occ.name.toLowerCase().includes(lowerTerm)) {
                        results.push({ type: 'occupant', data: occ, room: room, hotelName: hotel.name });
                    }
                });
            });
        });

        return results;
    }, [hotels, searchTerm]);

    const handleSearchResultClick = (result) => {
        if (result.type === 'hotel') {
            onSelectHotel(result.hotelName);
        } else if (result.type === 'room') {
            // Pass room number to filter
            if (onGlobalSearchSelect) {
                onGlobalSearchSelect(result.hotelName, result.data.room_number);
            } else {
                onSelectHotel(result.hotelName);
            }
        } else if (result.type === 'occupant') {
            // Pass occupant name to filter
            if (onGlobalSearchSelect) {
                onGlobalSearchSelect(result.hotelName, result.data.name);
            } else {
                onSelectHotel(result.hotelName);
            }
        }
        // Optional: clear search after selection? Maybe not, user might want to see other results.
    };

    return (
        <div className="w-64 bg-gray-900 text-white h-screen flex flex-col">
            <div className="p-4 border-b border-gray-800">
                <h1 className="text-xl font-bold mb-4">Shaadi Planner</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-gray-800 text-white pl-9 pr-3 py-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                {searchTerm ? (
                    <div>
                        <div className="px-4 mb-2 text-xs text-gray-400 uppercase">Search Results ({filteredResults.length})</div>
                        {filteredResults.length === 0 && <div className="px-4 text-sm text-gray-500">No matches found</div>}
                        <ul>
                            {filteredResults.map((result, idx) => (
                                <li key={idx}>
                                    <button
                                        onClick={() => handleSearchResultClick(result)}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors flex flex-col gap-0.5"
                                    >
                                        <div className="flex items-center gap-2 text-indigo-300 font-medium text-sm">
                                            {result.type === 'hotel' && <Home size={14} />}
                                            {result.type === 'room' && <BedDouble size={14} />}
                                            {result.type === 'occupant' && <Users size={14} />}

                                            <span>
                                                {result.type === 'hotel' && result.data.name}
                                                {result.type === 'room' && `Room ${result.data.room_number}`}
                                                {result.type === 'occupant' && result.data.name}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 pl-6">
                                            {result.type === 'occupant' && `in Room ${result.room.room_number} (${result.hotelName})`}
                                            {result.type === 'room' && `${result.hotelName} ${result.data.room_type ? `• ${result.data.room_type}` : ''}`}
                                            {result.type === 'hotel' && `${result.data.rooms.length} rooms`}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <>
                        <div className="px-4 mb-2 text-xs text-gray-400 uppercase">Hotels</div>
                        <ul>
                            {hotels.map((hotel) => (
                                <li key={hotel.name}>
                                    <button
                                        onClick={() => onSelectHotel(hotel.name)}
                                        className={`w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-gray-800 transition-colors ${selectedHotel === hotel.name ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                                            }`}
                                    >
                                        <Home size={16} />
                                        <span>{hotel.name}</span>
                                        <span className="ml-auto text-xs bg-gray-700 px-2 py-0.5 rounded-full">
                                            {hotel.rooms.length}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>

            <div className="p-4 border-t border-gray-800 flex flex-col gap-2">
                <button
                    onClick={() => {
                        // Export/Download feature removed from backend as per hosting plan
                        alert("Download feature is temporarily disabled for cloud hosting transition.");
                    }}
                    className="w-full flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors opacity-50 cursor-not-allowed"
                    title="Download Data (Disabled)"
                    disabled
                >
                    <Download size={16} />
                    <span>Download Data</span>
                </button>
                <label className="w-full flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors cursor-not-allowed opacity-50 justify-center" title="Import Data (Disabled)">
                    <Upload size={16} />
                    <span>Import Data</span>
                    <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        disabled
                        onChange={() => alert("Import feature is temporarily disabled for cloud hosting transition.")}
                    />
                </label>
            </div>
        </div>
    );
};

export default Sidebar;
