import json

DATA_FILE = 'shaadi_data.json'

def verify_201():
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for hotel in data:
            print(f"--- Hotel: {hotel['name']} ---")
            for room in hotel['rooms']:
                if room['room_number'] == '201':
                    print(json.dumps(room, indent=2))
                    
    except Exception as e:
        print(f"Error: {e}")

verify_201()
