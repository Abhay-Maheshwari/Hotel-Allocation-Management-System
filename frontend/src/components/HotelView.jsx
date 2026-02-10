import React, { useState, useMemo } from 'react';
import { User, UserMinus, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';

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

const HotelView = ({ hotel, onUpdate, initialFilter, onClearInitialFilter }) => {
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

    if (!hotel) return <div className="p-8 text-gray-500">Select a hotel to view rooms</div>;

    const roomTypes = useMemo(() => {
        const types = new Set(hotel.rooms.map(r => r.room_type).filter(Boolean));
        return ['All', ...Array.from(types).sort()];
    }, [hotel.rooms]);

    const filteredRooms = useMemo(() => {
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
    }, [hotel.rooms, searchTerm, filterType, sortOrder]);

    const handleUnassign = async (roomNumber, occupantName) => {
        try {
            await axios.post(`http://127.0.0.1:8000/api/rooms/${hotel.name}/${roomNumber}/unassign?occupant_name=${encodeURIComponent(occupantName)}`);
            onUpdate();
        } catch (error) {
            console.error("Failed to unassign", error);
            alert("Failed to remove occupant");
        }
    };

    const handleAssign = async (roomNumber) => {
        const name = prompt("Enter guest name:");
        if (!name) return;

        try {
            await axios.post(`http://127.0.0.1:8000/api/rooms/${hotel.name}/${roomNumber}/assign`, { name });
            onUpdate();
        } catch (error) {
            console.error("Failed to assign", error);
            alert("Failed to assign occupant");
        }
    };

    const handleAddRoom = async (e) => {
        e.preventDefault();
        if (!newRoomNumber) return;
        try {
            await axios.post(`http://127.0.0.1:8000/api/rooms/${hotel.name}/add`, {
                room_number: newRoomNumber,
                room_type: newRoomType || null,
                occupants: []
            });
            setNewRoomNumber('');
            setNewRoomType('');
            setIsAddingRoom(false);
            onUpdate();
        } catch (error) {
            console.error("Failed to add room", error);
            alert(error.response?.data?.detail || "Failed to add room");
        }
    };

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
                                    onClick={() => {
                                        if (window.confirm(`Are you sure you want to delete Room ${room.room_number}?`)) {
                                            axios.delete(`http://127.0.0.1:8000/api/rooms/${hotel.name}/${room.room_number}`)
                                                .then(() => onUpdate())
                                                .catch(err => alert("Failed to delete room"));
                                        }
                                    }}
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
                                                    onClick={() => axios.delete(`http://127.0.0.1:8000/api/rooms/${hotel.name}/${room.room_number}/tags/${tag}`).then(onUpdate)}
                                                    className="hover:text-red-600"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))}
                                        <button
                                            onClick={() => {
                                                const tag = prompt("Enter tag:");
                                                if (tag) {
                                                    axios.post(`http://127.0.0.1:8000/api/rooms/${hotel.name}/${room.room_number}/tags?tag=${encodeURIComponent(tag)}`)
                                                        .then(onUpdate)
                                                        .catch(() => alert("Failed to add tag"));
                                                }
                                            }}
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
