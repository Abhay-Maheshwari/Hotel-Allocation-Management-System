import pandas as pd
import json

EXCEL_FILE = 'Shaadi(3).xlsx'
xl = pd.ExcelFile(EXCEL_FILE)
HOTEL_SHEETS = ['The Park', 'Aanandam', 'Express 11', 'Tawa', 'Platinum']

result = {}
for sheet in HOTEL_SHEETS:
    df = xl.parse(sheet, header=None)
    rows = []
    for row in df.values.tolist():
        clean = [str(x).strip() if str(x).strip() not in ('nan','') else None for x in row]
        # Trim trailing Nones
        while clean and clean[-1] is None:
            clean.pop()
        rows.append(clean)
    result[sheet] = rows

with open('excel_dump.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print("Done - written to excel_dump.json")
