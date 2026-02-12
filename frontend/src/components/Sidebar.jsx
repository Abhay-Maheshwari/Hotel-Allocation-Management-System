import React, { useState, useMemo } from 'react';
import { Home, Users, Download, Upload, Search, BedDouble, Tag, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
const SortableHotelItem = ({ hotel, selectedHotel, onSelectHotel }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: hotel.name });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <li ref={setNodeRef} style={style} className="touch-none">
            <div
                className={`w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-gray-800 transition-colors group ${selectedHotel === hotel.name ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                    }`}
            >
                {/* Drag Handle */}
                <div {...attributes} {...listeners} className="cursor-grab text-gray-500 hover:text-gray-300">
                    <GripVertical size={16} />
                </div>

                {/* Clickable Area for Selection */}
                <button
                    onClick={() => onSelectHotel(hotel.name)}
                    className="flex-1 flex items-center gap-2 text-left"
                >
                    <Home size={16} />
                    <span className="truncate">{hotel.name}</span>
                    <span className="ml-auto text-xs bg-gray-700 px-2 py-0.5 rounded-full">
                        {hotel.rooms.length}
                    </span>
                </button>
            </div>
        </li>
    );
};

const Sidebar = ({ hotels, selectedHotel, onSelectHotel, onGlobalSearchSelect, onReorder, isOpen, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = hotels.findIndex((h) => h.name === active.id);
            const newIndex = hotels.findIndex((h) => h.name === over.id);

            const newOrder = arrayMove(hotels, oldIndex, newIndex);

            // Call parent with new order
            if (onReorder) {
                onReorder(newOrder);
            }
        }
    };

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
            if (onGlobalSearchSelect) onGlobalSearchSelect(result.hotelName, result.data.room_number);
            else onSelectHotel(result.hotelName);
        } else if (result.type === 'occupant') {
            if (onGlobalSearchSelect) onGlobalSearchSelect(result.hotelName, result.data.name);
            else onSelectHotel(result.hotelName);
        }
        // Close sidebar on mobile after selection
        if (onClose) onClose();
    };

    return (
        <div className={`
            fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col
            md:relative md:translate-x-0
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h1 className="text-xl font-bold">Shaadi Planner</h1>
                <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="px-4 pb-0 mb-4">
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
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={hotels.map(h => h.name)}
                                strategy={verticalListSortingStrategy}
                            >
                                <ul>
                                    {hotels.map((hotel) => (
                                        <SortableHotelItem
                                            key={hotel.name}
                                            hotel={hotel}
                                            selectedHotel={selectedHotel}
                                            onSelectHotel={onSelectHotel}
                                        />
                                    ))}
                                </ul>
                            </SortableContext>
                        </DndContext>
                    </>
                )}
            </div>

            <div className="p-4 border-t border-gray-800 flex flex-col gap-2">
                <button disabled className="w-full flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors opacity-50 cursor-not-allowed">
                    <Download size={16} /> <span>Download Data</span>
                </button>
                <button disabled className="w-full flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors cursor-not-allowed opacity-50 justify-center">
                    <Upload size={16} /> <span>Import Data</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
