import pandas as pd
import json
import math

# Define file paths
EXCEL_FILE = 'Shaadi(4).xlsx'
OUTPUT_FILE = 'shaadi_data.json'

# Define the sheets to process (Hotels)
HOTEL_SHEETS = ['The Park', 'Aanandam', 'Express 11', 'Tawa', 'Platinum']

# Known room types from scan
KNOWN_ROOM_TYPES = {
    "Deluxe", "Dormitory", "Executive", "Family", "Luxurious Suite",
    "Penthouse Block A B", "Split Deluxe", "Suite", "Tent", "Standard",
    "Super Deluxe", "Separate Bedded"
}

# Floor-section header keywords (rows to skip)
FLOOR_HEADERS = {"first floor", "second floor", "third floor", "fourth floor",
                 "fifth floor", "sixth floor", "seventh floor", "ground floor",
                 "basement", "top floor"}


def clean_value(val):
    if val is None:
        return None
    s = str(val).strip()
    if s == '' or s.lower() == 'nan':
        return None
    return s


def is_numeric_str(s):
    try:
        float(s)
        return True
    except (ValueError, TypeError):
        return False


def process_excel():
    all_hotels = []

    try:
        xl = pd.ExcelFile(EXCEL_FILE)

        for sheet_name in HOTEL_SHEETS:
            if sheet_name not in xl.sheet_names:
                print(f"Warning: Sheet '{sheet_name}' not found in Excel file.")
                continue

            print(f"Processing sheet: {sheet_name}")
            df = xl.parse(sheet_name, header=None)

            hotel_data = {
                "name": sheet_name,
                "rooms": []
            }

            rows = df.values.tolist()

            for row in rows:
                col0 = clean_value(row[0]) if len(row) > 0 else None

                # Skip rows with no value in col0 (floor headers, empty rows)
                if col0 is None:
                    continue

                # Skip totals/summary rows: if col0 looks like a plain number
                # with all subsequent non-null cells also being numbers
                col1 = clean_value(row[1]) if len(row) > 1 else None

                # Skip obvious floor-header rows (col0 is null handled above,
                # but also handle: col1 is a floor keyword)
                if col1 and col1.lower() in FLOOR_HEADERS:
                    continue

                # Skip pure total rows like ["64", None, None, ..., "152", "153"]
                # These have no room type and no occupant names
                if is_numeric_str(col0) and col1 is None:
                    continue

                # Determine room_number
                room_num_str = col0
                # Normalize ".0" endings from float conversion
                if room_num_str.endswith('.0'):
                    room_num_str = room_num_str[:-2]

                # Determine room type
                if col1 and col1 in KNOWN_ROOM_TYPES:
                    room_type = col1
                    occupants_start_idx = 2
                else:
                    room_type = "Standard"
                    occupants_start_idx = 1  # col1 is first occupant name

                # Extract occupants — skip last 2 columns (count columns)
                # The count columns appear only when there are 7+ cols total (room, type, occ1..4, count, count)
                # Safely ignore trailing numeric-only columns
                raw_occ = []
                for i in range(occupants_start_idx, len(row)):
                    val = clean_value(row[i])
                    if val is None:
                        continue
                    # Skip if it's a pure number (likely a count column)
                    if is_numeric_str(val):
                        continue
                    raw_occ.append(val)

                occupants = [{"name": n} for n in raw_occ]

                room_data = {
                    "room_number": room_num_str,
                    "room_type": room_type,
                    "occupants": occupants,
                    "tags": [],
                    "max_occupancy": len(occupants) if occupants else 2
                }

                hotel_data["rooms"].append(room_data)

            all_hotels.append(hotel_data)
            print(f"  - Found {len(hotel_data['rooms'])} rooms.")

        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_hotels, f, indent=2, ensure_ascii=False)

        print(f"\nSuccessfully converted data to {OUTPUT_FILE}")

    except Exception as e:
        import traceback
        print(f"Error processing Excel: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    process_excel()
