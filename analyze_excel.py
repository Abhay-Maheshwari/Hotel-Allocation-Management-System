import pandas as pd
import os

file_path = 'd:\\Projects\\Shaadi\\Shaadi.xlsx'

try:
    xl = pd.ExcelFile(file_path)
    with open('d:\\Projects\\Shaadi\\analysis_result_platinum.txt', 'w', encoding='utf-8') as f:
        f.write(f"Sheet names: {xl.sheet_names}\n")

        # Analyze Platinum sheet
        if 'Platinum' in xl.sheet_names:
            sheet_name = 'Platinum'
            f.write(f"\n--- Analysis for sheet: {sheet_name} ---\n")
            df = pd.read_excel(file_path, sheet_name=sheet_name, nrows=5)
            f.write("Columns:\n")
            for col in df.columns:
                f.write(f"  - {col}\n")
            f.write("\nFirst 5 rows:\n")
            f.write(df.to_string())
            f.write("\n")
        
except Exception as e:
    print(f"Error reading Excel file: {e}")
