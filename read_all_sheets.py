import pandas as pd
file_path = 'Shaadi(1).xlsx'
try:
    xl = pd.ExcelFile(file_path)
    print(f"Sheet names: {xl.sheet_names}")
    for sheet in xl.sheet_names:
        print(f"\n--- Sheet: {sheet} ---")
        df = xl.parse(sheet)
        print(df.head().to_string())
        print("\nColumns:", df.columns.tolist())
except Exception as e:
    print(f"Error: {e}")
