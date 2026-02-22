import pandas as pd
file_path = 'Shaadi(1).xlsx'
try:
    xl = pd.ExcelFile(file_path)
    sheet_name = 'The Park' # One of the hotel sheets
    print(f"\n--- Sheet: {sheet_name} ---")
    df = xl.parse(sheet_name)
    print(df.head().to_string())
    print("\nColumns:", df.columns.tolist())
except Exception as e:
    print(f"Error: {e}")
