from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from models import Hotel, Room, Occupant
from excel_parser import parse_excel
import os
import json
import shutil
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI")
client = None
db = None
hotels_collection = None

def get_db_collection():
    global client, db, hotels_collection
    if not MONGO_URI:
        # Fallback for local dev without Mongo? Or just require it?
        # For now, if no MONGO_URI, we might fail or warn.
        print("WARNING: MONGO_URI not set. Database operations will fail.")
        return None
    
    if client is None:
        client = MongoClient(MONGO_URI)
        db = client.get_database("shaadi_db") # Default DB name
        hotels_collection = db.get_collection("hotels")
    return hotels_collection

@app.on_event("startup")
def startup_event():
    coll = get_db_collection()
    if coll is not None:
        # Check if DB is empty
        if coll.count_documents({}) == 0:
            print("Database empty. Seeding from Excel...")
            excel_path = "../Shaadi.xlsx"
            if os.path.exists(excel_path):
                hotels = parse_excel(excel_path)
                # Convert Pydantic models to dicts for Mongo
                hotels_data = [h.dict() for h in hotels]
                if hotels_data:
                    coll.insert_many(hotels_data)
                print("Seeding complete.")
            else:
                print("Excel file not found for seeding.")
    else:
        print("No MongoDB connection.")

@app.get("/api/hotels", response_model=List[Hotel])
def get_hotels():
    coll = get_db_collection()
    if coll is None: return []
    # Exclude _id from result or map it? Pydantic ignores extra fields by default but we must ensure we return clean data.
    # Mongo adds _id. We can exclude it in projection.
    hotels = list(coll.find({}, {"_id": 0})) 
    return hotels

@app.get("/api/hotels/{hotel_name}", response_model=Hotel)
def get_hotel(hotel_name: str):
    coll = get_db_collection()
    hotel = coll.find_one({"name": hotel_name}, {"_id": 0})
    if hotel:
        return hotel
    raise HTTPException(status_code=404, detail="Hotel not found")

@app.post("/api/rooms/{hotel_name}/add")
def add_room(hotel_name: str, room: Room):
    coll = get_db_collection()
    if coll is None: raise HTTPException(status_code=500, detail="Database not available")
    
    # Check if hotel exists
    hotel = coll.find_one({"name": hotel_name})
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
        
    # Check if room already exists
    if any(r['room_number'] == room.room_number for r in hotel.get('rooms', [])):
        raise HTTPException(status_code=400, detail="Room already exists")
    
    # Add room
    coll.update_one(
        {"name": hotel_name},
        {"$push": {"rooms": room.dict()}}
    )
    return {"message": "Room added", "room": room}

@app.delete("/api/rooms/{hotel_name}/{room_number}")
def delete_room(hotel_name: str, room_number: str):
    coll = get_db_collection()
    if coll is None: raise HTTPException(status_code=500, detail="Database not available")

    result = coll.update_one(
        {"name": hotel_name},
        {"$pull": {"rooms": {"room_number": room_number}}}
    )
    
    if result.modified_count == 0:
         raise HTTPException(status_code=404, detail="Room or Hotel not found")
         
    return {"message": f"Room {room_number} deleted"}

@app.post("/api/rooms/{hotel_name}/{room_number}/assign")
def assign_occupant(hotel_name: str, room_number: str, occupant: Occupant):
    coll = get_db_collection()
    if coll is None: raise HTTPException(status_code=500, detail="Database not available")

    # Update specific room's occupants
    result = coll.update_one(
        {"name": hotel_name, "rooms.room_number": room_number},
        {"$push": {"rooms.$.occupants": occupant.dict()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
        
    return {"message": "Occupant assigned"}

@app.post("/api/rooms/{hotel_name}/{room_number}/unassign")
def unassign_occupant(hotel_name: str, room_number: str, occupant_name: str):
    coll = get_db_collection()
    if coll is None: raise HTTPException(status_code=500, detail="Database not available")

    result = coll.update_one(
        {"name": hotel_name, "rooms.room_number": room_number},
        {"$pull": {"rooms.$.occupants": {"name": occupant_name}}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    if result.modified_count == 0:
         raise HTTPException(status_code=404, detail="Occupant not found in room")

    return {"message": "Occupant unassigned"}

@app.post("/api/rooms/{hotel_name}/{room_number}/tags")
def add_tag(hotel_name: str, room_number: str, tag: str):
    coll = get_db_collection()
    if coll is None: raise HTTPException(status_code=500, detail="Database not available")

    # Check if tag exists first to avoid duplicates if needed, or use $addToSet
    result = coll.update_one(
        {"name": hotel_name, "rooms.room_number": room_number},
        {"$addToSet": {"rooms.$.tags": tag}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
        
    return {"message": "Tag added"}

@app.delete("/api/rooms/{hotel_name}/{room_number}/tags/{tag}")
def delete_tag(hotel_name: str, room_number: str, tag: str):
    coll = get_db_collection()
    if coll is None: raise HTTPException(status_code=500, detail="Database not available")

    result = coll.update_one(
        {"name": hotel_name, "rooms.room_number": room_number},
        {"$pull": {"rooms.$.tags": tag}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
        
    return {"message": "Tag removed"}

@app.post("/api/reset")
def reset_db():
    """Resets the DB by re-reading the Excel file."""
    coll = get_db_collection()
    if coll is None: raise HTTPException(status_code=500, detail="Database not available")
    
    excel_path = "../Shaadi.xlsx"
    if os.path.exists(excel_path):
        coll.delete_many({}) # Clear all
        hotels = parse_excel(excel_path)
        hotels_data = [h.dict() for h in hotels]
        if hotels_data:
            coll.insert_many(hotels_data)
        return {"message": "Database reset from Excel"}
    raise HTTPException(status_code=404, detail="Excel file not found")

