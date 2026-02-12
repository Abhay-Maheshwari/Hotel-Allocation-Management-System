import React, { useState, useMemo } from 'react';
import { User, UserMinus, Plus, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

// Function to generate a consistent color from a string
const stringToColor = (str) => {
    if (!str) return '#ffffff'; // Default white for no type
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Use HSL for better pastel colors
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 90%)`; // Pastel background
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
        <div className="p-6 h-screen overflow-y-auto bg-gray-100 flex-1">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">{hotel.name} <span className="text-sm font-normal text-gray-500">({hotel.rooms.length} rooms)</span></h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="bg-white text-indigo-600 px-4 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition text-sm font-medium flex items-center gap-1"
                        >
                            Sort {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                        <button
                            onClick={() => setIsAddingRoom(!isAddingRoom)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                        >
                            <Plus size={18} /> Add Room
                        </button>
                    </div>
                </div>

                {isAddingRoom && (
                    <form onSubmit={handleAddRoom} className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 flex gap-4 items-end">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Room Number</label>
                            <input
                                type="text"
                                value={newRoomNumber}
                                onChange={e => setNewRoomNumber(e.target.value)}
                                className="border rounded px-3 py-2 text-sm w-32"
                                placeholder="e.g. 505"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Room Type</label>
                            <input
                                type="text"
                                value={newRoomType}
                                onChange={e => setNewRoomType(e.target.value)}
                                className="border rounded px-3 py-2 text-sm w-48"
                                placeholder="e.g. Suite"
                            />
                        </div>
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">Save</button>
                        <button type="button" onClick={() => setIsAddingRoom(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300">Cancel</button>
                    </form>
                )}

                <div className="flex gap-4 items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                    <input
                        type="text"
                        placeholder="Search room or guest..."
                        className="border rounded px-3 py-2 text-sm flex-1"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                        className="border rounded px-3 py-2 text-sm bg-white"
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
                    const borderColor = room.room_type ? 'border-gray-300' : 'border-gray-200';

                    return (
                        <div key={room.room_number} className={`rounded-lg shadow-sm border ${borderColor} overflow-hidden flex flex-col`} style={{ backgroundColor: bgColor }}>
                            <div className="bg-white/50 px-4 py-3 border-b border-black/5 flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-lg text-gray-800">Room {room.room_number}</span>
                                    {room.room_type && <div className="text-xs text-gray-700 font-bold uppercase tracking-wider bg-white/60 px-2 py-0.5 rounded-sm inline-block mt-1">{room.room_type}</div>}
                                </div>
                                <button
                                    onClick={() => handleAssign(room.room_number)}
                                    className="text-gray-500 hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-white/80"
                                    title="Add Occupant"
                                >
                                    <Plus size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeleteRoom(room.room_number)}
                                    className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50 ml-1"
                                    title="Delete Room"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="p-4 flex-1">
                                {room.occupants.length === 0 ? (
                                    <div className="text-gray-400 text-sm italic py-2 text-center">Empty</div>
                                ) : (
                                    <ul className="space-y-2">
                                        {room.occupants.map((occ, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-800 group bg-white/40 p-1.5 rounded-md">
                                                <User size={14} className="text-gray-600" />
                                                <span className="flex-1 truncate font-medium">{occ.name}</span>
                                                <button
                                                    onClick={() => handleUnassign(room.room_number, occ.name)}
                                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                                                    title="Remove"
                                                >
                                                    <UserMinus size={14} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {/* Tags Section */}
                                <div className="mt-4 pt-3 border-t border-black/5">
                                    <div className="flex flex-wrap gap-2">
                                        {room.tags && room.tags.map((tag, idx) => (
                                            <span key={idx} className="bg-white/60 text-gray-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 border border-black/5">
                                                {tag}
                                                <button
                                                    onClick={() => handleRemoveTag(room.room_number, tag)}
                                                    className="hover:text-red-600"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))}
                                        <button
                                            onClick={() => handleAddTag(room.room_number)}
                                            className="text-gray-400 hover:text-indigo-600 text-xs bg-white/40 hover:bg-white/80 px-2 py-1 rounded-full border border-dashed border-gray-300 transition-colors"
                                        >
                                            + Tag
                                        </button>
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
