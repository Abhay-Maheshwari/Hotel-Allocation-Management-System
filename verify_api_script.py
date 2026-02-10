import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_get_hotels():
    print("Testing GET /hotels...")
    try:
        response = requests.get(f"{BASE_URL}/hotels")
        if response.status_code == 200:
            hotels = response.json()
            print(f"Success: Retrieved {len(hotels)} hotels.")
            if len(hotels) > 0:
                print(f"Sample hotel: {hotels[0]['name']}")
                return hotels[0]['name']
    except Exception as e:
        print(f"Failed: {e}")
    return None

def get_first_room(hotel_name):
    print(f"Fetching rooms for {hotel_name}...")
    try:
        response = requests.get(f"{BASE_URL}/hotels/{hotel_name}")
        if response.status_code == 200:
            hotel = response.json()
            if hotel['rooms']:
                first_room = hotel['rooms'][0]['room_number']
                print(f"Found room: {first_room}")
                return first_room
    except Exception as e:
        print(f"Failed to get rooms: {e}")
    return None

def test_assign(hotel_name, room_number):
    print(f"\nTesting ASSIGN for {hotel_name} Room {room_number}...")
    try:
        response = requests.post(
            f"{BASE_URL}/rooms/{hotel_name}/{room_number}/assign",
            json={"name": "Test Guest Auto"}
        )
        if response.status_code == 200:
            print("Success: Assign response:", response.json())
        else:
            print(f"Failed: Status {response.status_code}, {response.text}")
    except Exception as e:
        print(f"Failed: {e}")

def test_unassign(hotel_name, room_number):
    print(f"\nTesting UNASSIGN for {hotel_name} Room {room_number}...")
    try:
        response = requests.post(
            f"{BASE_URL}/rooms/{hotel_name}/{room_number}/unassign",
            params={"occupant_name": "Test Guest Auto"}
        )
        if response.status_code == 200:
            print("Success: Unassign response:", response.json())
        else:
            print(f"Failed: Status {response.status_code}, {response.text}")
    except Exception as e:
        print(f"Failed: {e}")

def test_cors():
    print("\nTesting CORS headers...")
    try:
        response = requests.options(
            f"{BASE_URL}/hotels",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET"
            }
        )
        if 'access-control-allow-origin' in response.headers:
            print(f"Success: CORS header present: {response.headers['access-control-allow-origin']}")
        else:
            print("Failed: CORS header missing")
            print("Headers:", response.headers)
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    test_cors()
    hotel_name = test_get_hotels()
    if hotel_name:
        room_number = get_first_room(hotel_name)
        if room_number:
            # test_assign(hotel_name, room_number) # skip state mutation for now
            # test_unassign(hotel_name, room_number)
            pass
