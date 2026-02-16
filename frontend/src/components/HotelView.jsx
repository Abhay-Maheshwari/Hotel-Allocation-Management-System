import React, { useState, useMemo } from 'react';
import { User, UserMinus, Plus, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

// Function to generate a consistent color from a string
const getRoomTypeBase = (str) => {
    if (!str) return 'default';
    const lowStr = str.toLowerCase();
    if (lowStr === 'standard') return 'deluxe';
    return lowStr;
};

const getPremiumColor = (type) => {
    const t = getRoomTypeBase(type);
    if (t.includes('suite')) return { h: 45, s: 80, l: 50 }; // Gold
    if (t.includes('penthouse')) return { h: 280, s: 70, l: 50 }; // Purple
    if (t.includes('executive')) return { h: 170, s: 70, l: 45 }; // Teal
    if (t.includes('family')) return { h: 200, s: 70, l: 50 }; // Blue
    if (t.includes('deluxe')) return { h: 25, s: 70, l: 55 }; // Orange/Tan
    return null;
};

const stringToColor = (str) => {
    const type = getRoomTypeBase(str);
    if (type === 'default') return '#ffffff';

    const premium = getPremiumColor(type);
    if (premium) return `hsl(${premium.h}, ${premium.s}%, 92%)`;

    let hash = 0;
    for (let i = 0; i < type.length; i++) {
        hash = type.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 92%)`; // Deepened pastel
};

const stringToBorderColor = (str) => {
    const type = getRoomTypeBase(str);
    if (type === 'default') return '#4f46e5';

    const premium = getPremiumColor(type);
    if (premium) return `hsl(${premium.h}, ${premium.s}%, ${premium.l}%)`;

    let hash = 0;
    for (let i = 0; i < type.length; i++) {
        hash = type.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 60%)`; // Radiant vibrant color
};

const HotelView = ({ hotel, initialFilter, onClearInitialFilter }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [sortOrder, setSortOrder] = useState('asc');
    const [isAddingRoom, setIsAddingRoom] = useState(false);
    const [newRoomNumber, setNewRoomNumber] = useState('');
    const [newRoomType, setNewRoomType] = useState('');

    React.useEffect(() => {
        if (initialFilter) {
            setSearchTerm(initialFilter);
            if (onClearInitialFilter) {
                onClearInitialFilter();
            }
        }
    }, [initialFilter, onClearInitialFilter]);

    // Move hooks to top level to avoid "Rendered more hooks" error
    const roomTypes = useMemo(() => {
        if (!hotel) return ['All'];
        const types = new Set(hotel.rooms.map(r => r.room_type).filter(Boolean));
        return ['All', ...Array.from(types).sort()];
    }, [hotel]);

    // Use hotel.rooms directly, it's already live data
    const filteredRooms = useMemo(() => {
        if (!hotel) return [];
        let result = hotel.rooms.filter(room => {
            const matchesSearch =
                room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                room.occupants.some(occ => occ.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (room.tags && room.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
            const matchesType = filterType === 'All' || room.room_type === filterType;
            return matchesSearch && matchesType;
        });

        return result.sort((a, b) => {
            const numA = parseFloat(a.room_number);
            const numB = parseFloat(b.room_number);

            if (!isNaN(numA) && !isNaN(numB)) {
                return sortOrder === 'asc' ? numA - numB : numB - numA;
            }
            return sortOrder === 'asc'
                ? a.room_number.localeCompare(b.room_number, undefined, { numeric: true })
                : b.room_number.localeCompare(a.room_number, undefined, { numeric: true });
        });
    }, [hotel, searchTerm, filterType, sortOrder]);

    if (!hotel) return <div className="p-8 text-gray-500">Select a hotel to view rooms</div>;

    const handleUpdateRoom = async (roomNumber, updateFn) => {
        try {
            const hotelRef = doc(db, "hotels", hotel.name);
            // We need to update the specific room in the rooms array.
            // Firestore array manipulation is tricky for object updates.
            // Simplest way for this array structure: Read whole array, modify, write back.
            // Since we have 'hotel' prop which is live data, we can clone it.
            // CAUTION: 'hotel' prop might be stale if we don't use the latest Snapshot? 
            // Actually 'hotel' prop IS from the snapshot.

            // A safer approach for concurrency is 'runTransaction', but for family app simpler is ok.
            // Let's use the current 'hotel.rooms' and modify it.

            const updatedRooms = hotel.rooms.map(r => {
                if (r.room_number === roomNumber) {
                    return updateFn(r);
                }
                return r;
            });

            await updateDoc(hotelRef, { rooms: updatedRooms });

        } catch (error) {
            console.error("Failed to update room", error);
            alert("Failed to update: " + error.message);
        }
    };


    const handleUnassign = async (roomNumber, occupantName) => {
        handleUpdateRoom(roomNumber, (room) => ({
            ...room,
            occupants: room.occupants.filter(o => o.name !== occupantName)
        }));
    };

    const handleAssign = async (roomNumber) => {
        const name = prompt("Enter guest name:");
        if (!name) return;
        handleUpdateRoom(roomNumber, (room) => ({
            ...room,
            occupants: [...room.occupants, { name }]
        }));
    };

    const handleAddRoom = async (e) => {
        e.preventDefault();
        if (!newRoomNumber) return;

        try {
            const hotelRef = doc(db, "hotels", hotel.name);
            const newRoom = {
                room_number: newRoomNumber,
                room_type: newRoomType || null,
                occupants: [],
                max_occupancy: null,
                tags: []
            };

            await updateDoc(hotelRef, {
                rooms: arrayUnion(newRoom)
            });

            setNewRoomNumber('');
            setNewRoomType('');
            setIsAddingRoom(false);
        } catch (error) {
            console.error("Failed to add room", error);
            alert("Failed to add room: " + error.message);
        }
    };

    const handleDeleteRoom = async (roomNumber) => {
        if (window.confirm(`Are you sure you want to delete Room ${roomNumber}?`)) {
            try {
                const hotelRef = doc(db, "hotels", hotel.name);
                // We need to find the exact object to remove it with arrayRemove.
                // But arrayRemove needs the EXACT object. If it changed (e.g. someone added a guest),
                // our local 'room' object might not match if we construct it manually.
                // We should use the existing 'hotel.rooms' to find it and filter it out.

                const updatedRooms = hotel.rooms.filter(r => r.room_number !== roomNumber);
                await updateDoc(hotelRef, { rooms: updatedRooms });

            } catch (err) {
                console.error("Failed to delete", err);
                alert("Failed to delete room");
            }
        }
    };

    const handleAddTag = async (roomNumber) => {
        const tag = prompt("Enter tag:");
        if (tag) {
            handleUpdateRoom(roomNumber, (room) => ({
                ...room,
                tags: [...(room.tags || []), tag]
            }));
        }
    }

    const handleRemoveTag = async (roomNumber, tag) => {
        handleUpdateRoom(roomNumber, (room) => ({
            ...room,
            tags: (room.tags || []).filter(t => t !== tag)
        }));
    }


    return (
        <div className="p-6 h-screen overflow-y-auto bg-gray-100 dark:bg-gray-900 flex-1 transition-colors duration-200">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors">
                        {hotel.name} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({hotel.rooms.length} rooms)</span>
                    </h2>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="flex-1 md:flex-none justify-center bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg border border-indigo-200 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-1"
                        >
                            Sort {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                        <button
                            onClick={() => setIsAddingRoom(!isAddingRoom)}
                            className="flex-1 md:flex-none justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Plus size={18} /> Add Room
                        </button>
                    </div>
                </div>

                {isAddingRoom && (
                    <form onSubmit={handleAddRoom} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-indigo-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-end transition-colors">
                        <div className="w-full md:w-auto">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Room Number</label>
                            <input
                                type="text"
                                value={newRoomNumber}
                                onChange={e => setNewRoomNumber(e.target.value)}
                                className="border dark:border-gray-600 rounded px-3 py-2 text-sm w-full md:w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                placeholder="e.g. 505"
                                required
                            />
                        </div>
                        <div className="w-full md:w-auto">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Room Type</label>
                            <input
                                type="text"
                                value={newRoomType}
                                onChange={e => setNewRoomType(e.target.value)}
                                className="border dark:border-gray-600 rounded px-3 py-2 text-sm w-full md:w-48 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                placeholder="e.g. Suite"
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button type="submit" className="flex-1 md:flex-none bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors">Save</button>
                            <button type="button" onClick={() => setIsAddingRoom(false)} className="flex-1 md:flex-none bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                        </div>
                    </form>
                )}

                <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                    <input
                        type="text"
                        placeholder="Search room or guest..."
                        className="border dark:border-gray-600 rounded px-3 py-2 text-sm w-full md:flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                        className="border dark:border-gray-600 rounded px-3 py-2 text-sm w-full md:w-auto bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        {roomTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredRooms.map((room) => {
                    const bgColor = stringToColor(room.room_type || 'default');
                    const borderColor = stringToBorderColor(room.room_type || 'default');
                    // In dark mode, we might want to override the pastel color or mute it.
                    // Let's use a subtle overlay or just the pastel color with dark text? 
                    // Actually, pastel colors look bad in dark mode usually.
                    // Let's make the card dark in dark mode, and use the color as a border or accent.
                    // OR, keep the pastel but use high opacity overlay. 

                    // For now, let's keep the card structure but handle the background manually.
                    // We can use the 'style' for light mode, and a class for dark.
                    // But inline style overrides classes.

                    return (
                        <div key={room.room_number} className="relative group">
                            {/* Card Container - using a trick: separate div for background color in light mode */}
                            <div
                                className={`rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden flex flex-col h-full bg-white dark:bg-gray-800 transition-colors`}
                                style={{
                                    borderTopWidth: '12px',
                                    borderTopStyle: 'solid',
                                    // In light mode, borderTopColor should be transparent or same as border? 
                                    // Actually, let's only apply the color in dark mode via style, or use a class for light mode reset.
                                    // But inline styles override classes. 
                                    // Let's use a CSS variable or conditional logic.
                                    borderTopColor: borderColor
                                }}
                            >
                                {/* We need to hide this border in light mode. 
                                {/* Top Color Bar */}
                                <div className="h-3 w-full shrink-0" style={{ backgroundColor: borderColor }}></div>

                                {/* Light Mode Background Layer - hidden in dark mode */}
                                <div className="absolute inset-0 dark:hidden opacity-90 pointer-events-none" style={{ backgroundColor: bgColor }}></div>

                                {/* Content */}
                                <div className="relative z-10 flex flex-col flex-1">
                                    <div className="bg-white/50 dark:bg-gray-700/50 px-4 py-3 border-b border-black/5 dark:border-white/5 flex justify-between items-center backdrop-blur-sm">
                                        <div>
                                            <span className="font-bold text-lg text-gray-800 dark:text-gray-100">Room {room.room_number}</span>
                                            {room.room_type && (
                                                <div
                                                    className="text-xs text-gray-700 dark:text-gray-200 font-bold uppercase tracking-wider bg-white/60 dark:bg-black/30 px-2 py-0.5 rounded-sm inline-block mt-1 ml-2"
                                                >
                                                    {room.room_type}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center">
                                            <button
                                                onClick={() => handleAssign(room.room_number)}
                                                className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1 rounded-full hover:bg-white/80 dark:hover:bg-gray-600"
                                                title="Add Occupant"
                                            >
                                                <Plus size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRoom(room.room_number)}
                                                className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 ml-1"
                                                title="Delete Room"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 flex-1">
                                        {room.occupants.length === 0 ? (
                                            <div className="text-gray-400 dark:text-gray-500 text-sm italic py-2 text-center">Empty</div>
                                        ) : (
                                            <ul className="space-y-2">
                                                {room.occupants.map((occ, idx) => (
                                                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 group/item bg-white/40 dark:bg-gray-700/50 p-1.5 rounded-md border border-transparent dark:border-gray-600">
                                                        <User size={14} className="text-gray-600 dark:text-gray-400" />
                                                        <span className="flex-1 truncate font-medium">{occ.name}</span>
                                                        <button
                                                            onClick={() => handleUnassign(room.room_number, occ.name)}
                                                            className="opacity-0 group-hover/item:opacity-100 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-opacity"
                                                            title="Remove"
                                                        >
                                                            <UserMinus size={14} />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {/* Tags Section */}
                                        <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
                                            <div className="flex flex-wrap gap-2">
                                                {room.tags && room.tags.map((tag, idx) => (
                                                    <span key={idx} className="bg-white/60 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full flex items-center gap-1 border border-black/5 dark:border-gray-600">
                                                        {tag}
                                                        <button
                                                            onClick={() => handleRemoveTag(room.room_number, tag)}
                                                            className="hover:text-red-600 dark:hover:text-red-400 ml-1"
                                                        >
                                                            &times;
                                                        </button>
                                                    </span>
                                                ))}
                                                <button
                                                    onClick={() => handleAddTag(room.room_number)}
                                                    className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs bg-white/40 dark:bg-gray-800 hover:bg-white/80 dark:hover:bg-gray-700 px-2 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-600 transition-colors"
                                                >
                                                    + Tag
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div >
    );
};

export default HotelView;
