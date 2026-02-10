import requests
import json

BASE_URL = "http://127.0.0.1:8000"
HOTEL_NAME = "The Park"
ROOM_NUMBER = "102.0"
TAG = "TestTag"

def test_tags():
    # 1. Add Tag
    print(f"Adding tag '{TAG}' to room {ROOM_NUMBER}...")
    url = f"{BASE_URL}/api/rooms/{HOTEL_NAME}/{ROOM_NUMBER}/tags"
    response = requests.post(url, params={"tag": TAG})
    if response.status_code == 200:
        print("Success:", response.json())
    else:
        print("Failed:", response.status_code, response.text)

    # 2. Verify Tag persisted
    print("Verifying tag in hotel data...")
    response = requests.get(f"{BASE_URL}/api/hotels/{HOTEL_NAME}")
    if response.status_code == 200:
        hotel = response.json()
        room = next((r for r in hotel['rooms'] if r['room_number'] == ROOM_NUMBER), None)
        if room and TAG in room.get('tags', []):
            print("Tag found in room:", room['tags'])
        else:
            print("Tag NOT found in room:", room.get('tags'))
    else:
         print("Failed to fetch hotel:", response.status_code)

    # 3. Remove Tag
    print(f"Removing tag '{TAG}'...")
    url = f"{BASE_URL}/api/rooms/{HOTEL_NAME}/{ROOM_NUMBER}/tags/{TAG}"
    response = requests.delete(url)
    if response.status_code == 200:
        print("Success:", response.json())
    else:
        print("Failed:", response.status_code, response.text)

if __name__ == "__main__":
    test_tags()
