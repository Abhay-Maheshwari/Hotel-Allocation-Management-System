import pandas as pd

EXCEL_FILE = 'Shaadi(1).xlsx'
HOTEL_SHEETS = ['The Park', 'Aanandam', 'Express 11', 'Tawa', 'Platinum']

def scan_col1():
    try:
        xl = pd.ExcelFile(EXCEL_FILE)
        unique_vals = set()
        
        for sheet in HOTEL_SHEETS:
            if sheet not in xl.sheet_names: continue
            df = xl.parse(sheet, header=None)
            rows = df.values.tolist()
            for row in rows:
                if len(row) > 1:
                    val = str(row[1]).strip()
                    if val and val != 'nan':
                        unique_vals.add(val)
        
        print("Unique values in Col 1:")
        for v in sorted(list(unique_vals)):
            print(v)
            
    except Exception as e:
        print(f"Error: {e}")

scan_col1()
