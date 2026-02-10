from pydantic import BaseModel
from typing import List, Optional

class Occupant(BaseModel):
    name: str

class Room(BaseModel):
    room_number: str
    room_type: Optional[str] = None
    occupants: List[Occupant] = []
    tags: List[str] = []
    max_occupancy: Optional[int] = None

class Hotel(BaseModel):
    name: str
    rooms: List[Room] = []
