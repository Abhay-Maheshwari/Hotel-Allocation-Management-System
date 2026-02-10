import requests

try:
    response = requests.post("http://localhost:8000/api/reset")
    if response.status_code == 200:
        print("Database reset successfully.")
    else:
        print(f"Failed to reset database: {response.status_code} - {response.text}")
except Exception as e:
    print(f"Error: {e}")
