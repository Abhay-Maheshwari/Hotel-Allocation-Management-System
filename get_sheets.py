import pandas as pd
file_path = 'Shaadi(1).xlsx'
try:
    xl = pd.ExcelFile(file_path)
    print(f"Sheet names: {xl.sheet_names}")
except Exception as e:
    print(e)
