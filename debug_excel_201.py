import pandas as pd

EXCEL_FILE = 'Shaadi(1).xlsx'
HOTEL_SHEETS = ['The Park', 'Aanandam', 'Express 11', 'Tawa', 'Platinum']

def debug_room():
    try:
        xl = pd.ExcelFile(EXCEL_FILE)
        found = False
        for sheet in HOTEL_SHEETS:
            if sheet not in xl.sheet_names: continue
            
            df = xl.parse(sheet, header=None)
            rows = df.values.tolist()
            
            for i, row in enumerate(rows):
                # Check for 201 in first column
                col0 = str(row[0])
                if "201" in col0:
                    print(f"Found 201 in {sheet} at row {i}")
                    print(f"Row values: {row}")
                    found = True
        
        if not found:
            print("Room 201 not found in expected sheets.")
            
    except Exception as e:
        print(f"Error: {e}")

debug_room()
