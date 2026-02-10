import pandas as pd
from typing import List
from models import Hotel, Room, Occupant

def parse_excel(file_path: str) -> List[Hotel]:
    hotels = []
    try:
        xl = pd.ExcelFile(file_path)
        
        # Define sheet processing logic
        # Sheet 1: The Park & Sheet 2: Park Empty (Assumed Header at index 1)
        # Sheet 3: Aanandam & Sheet 4: Tawa (Assumed No Header, Data starts row 0)
        
        # 1. The Park
        if 'The Park' in xl.sheet_names:
            df = pd.read_excel(file_path, sheet_name='The Park', header=1)
            # Inspect columns to find Room Number and Occupants
            # Based on analysis: 'Unnamed: 0' seems to be room number
            # 'Member 1', 'Member 2', etc. are occupants
            hotel = Hotel(name='The Park')
            for index, row in df.iterrows():
                room_no = str(row.iloc[0]) if pd.notna(row.iloc[0]) else None
                if room_no and room_no.lower() != 'nan':
                    occupants = []
                    # Assuming columns 2 onwards (index 2) might be members, need to check column names from analysis
                    # Analysis showed: Unnamed: 0, First Floor, Member 1, Member 2...
                    # So col 0 = Room No (implied), Col 2+ = Members
                    
                    # specific logic for 'The Park' based on "Member" columns
                    # Member columns are at indices 2, 3, 4, 5 based on "First 5 rows" output
                    # Columns: Unnamed: 0, First Floor, Member 1, Member 2, Member 3, Member 4
                    member_indices = [2, 3, 4, 5]
                    for i in member_indices:
                        if i < len(row) and pd.notna(row.iloc[i]):
                            occupants.append(Occupant(name=str(row.iloc[i])))
                    
                    hotel.rooms.append(Room(room_number=room_no, occupants=occupants, room_type=str(row.iloc[1]) if pd.notna(row.iloc[1]) else None))
            hotels.append(hotel)

        # 2. Platinum
        if 'Platinum' in xl.sheet_names:
            df = pd.read_excel(file_path, sheet_name='Platinum', header=None)
            hotel = Hotel(name='Platinum')
            for index, row in df.iterrows():
                room_no = str(row.iloc[0]) if pd.notna(row.iloc[0]) else None
                # Check if room_no looks valid (not nan and maybe numeric or string)
                if room_no and room_no.lower() != 'nan':
                    occupants = []
                    # Column 1 is occupant info
                    if len(row) > 1 and pd.notna(row.iloc[1]):
                        occupants.append(Occupant(name=str(row.iloc[1])))
                        
                    hotel.rooms.append(Room(room_number=room_no, occupants=occupants))
            hotels.append(hotel)

        # 3. Aanandam - No header assumed, data starts row 0?
        # Analysis showed: 301, Kavita, Lucky... as header? 
        # Actually analysis showed headers like "301", "Kavita" which implies the first row WAS treated as header by pandas default.
        # If we read with header=None, we get correct data?
        # Let's read header=None for Aanandam and Tawa
        
        if 'Aanandam' in xl.sheet_names:
            df = pd.read_excel(file_path, sheet_name='Aanandam', header=None)
            hotel = Hotel(name='Anandam')
            # Row 0 seems to be room 301.
            # Col 0 = Room Num. Rest = Occupants
            for index, row in df.iterrows():
                room_no = str(row.iloc[0]) if pd.notna(row.iloc[0]) else None
                if room_no:
                     occupants = []
                     for i in range(1, len(row)):
                         if pd.notna(row.iloc[i]):
                             occupants.append(Occupant(name=str(row.iloc[i])))
                     hotel.rooms.append(Room(room_number=room_no, occupants=occupants))
            hotels.append(hotel)

        if 'Tawa' in xl.sheet_names:
            df = pd.read_excel(file_path, sheet_name='Tawa', header=None)
            hotel = Hotel(name='Tawa')
             # Col 0 = Room Num. Rest = Occupants
            for index, row in df.iterrows():
                room_no = str(row.iloc[0]) if pd.notna(row.iloc[0]) else None
                if room_no:
                     occupants = []
                     for i in range(1, len(row)):
                         if pd.notna(row.iloc[i]):
                             occupants.append(Occupant(name=str(row.iloc[i])))
                     hotel.rooms.append(Room(room_number=room_no, occupants=occupants))
            hotels.append(hotel)

    except Exception as e:
        print(f"Error parsing Excel: {e}")
        return []
        
    return hotels
