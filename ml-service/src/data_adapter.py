import pandas as pd
import io
import re
from datetime import datetime
from typing import Dict, List, Any, Optional

class DataAdapter:
    def __init__(self):
        self.required_columns = ['Date', 'Description', 'Amount', 'Type']
        self.type_mapping = {
            # English
            'income': 'INCOME', 'revenue': 'INCOME', 'deposit': 'INCOME',
            'expense': 'EXPENSE', 'cost': 'EXPENSE', 'withdrawal': 'EXPENSE',
            # Korean
            '입금': 'INCOME', '수입': 'INCOME',
            '출금': 'EXPENSE', '지출': 'EXPENSE',
            # Japanese
            '入金': 'INCOME', '収入': 'INCOME',
            '出金': 'EXPENSE', '支出': 'EXPENSE',
            # Chinese
            '收入': 'INCOME', '存入': 'INCOME',
            '支出': 'EXPENSE', '取出': 'EXPENSE',
            # Spanish
            'ingreso': 'INCOME', 'depósito': 'INCOME',
            'gasto': 'EXPENSE', 'retiro': 'EXPENSE'
        }

    def normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize column names to standard format"""
        # Map common column names
        col_map = {
            'date': 'Date', '날짜': 'Date', '日付': 'Date', '日期': 'Date', 'fecha': 'Date',
            'description': 'Description', 'desc': 'Description', 'memo': 'Description', 
            '적요': 'Description', '摘要': 'Description', 'descripción': 'Description',
            'amount': 'Amount', 'amt': 'Amount', '금액': 'Amount', '金額': 'Amount', 'monto': 'Amount',
            'type': 'Type', 'category': 'Type', '구분': 'Type', '種別': 'Type', '类型': 'Type', 'tipo': 'Type',
            'deposit': 'Deposit', '입금액': 'Deposit', '入金金額': 'Deposit', '收入金额': 'Deposit', 'depósito': 'Deposit',
            'withdrawal': 'Withdrawal', '출금액': 'Withdrawal', '出金金額': 'Withdrawal', '支出金额': 'Withdrawal', 'retiro': 'Withdrawal'
        }
        
        df.columns = [col_map.get(c.lower().strip(), c) for c in df.columns]
        return df

    def merge_split_amount_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle bank format where Deposit and Withdrawal are separate columns"""
        if 'Amount' in df.columns:
            return df
            
        if 'Deposit' in df.columns and 'Withdrawal' in df.columns:
            # Fill NaNs with 0
            df['Deposit'] = pd.to_numeric(df['Deposit'], errors='coerce').fillna(0)
            df['Withdrawal'] = pd.to_numeric(df['Withdrawal'], errors='coerce').fillna(0)
            
            # Calculate net amount (Deposit is positive, Withdrawal is negative)
            df['Amount'] = df['Deposit'] - df['Withdrawal']
            
            # Determine Type based on which column had value
            df['Type'] = df.apply(lambda x: 'INCOME' if x['Deposit'] > 0 else 'EXPENSE', axis=1)
            
            # Drop original split columns
            df = df.drop(columns=['Deposit', 'Withdrawal'])
            
        return df

    def normalize_types(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize transaction types to INCOME/EXPENSE"""
        if 'Type' not in df.columns:
            # If no Type column, infer from Amount sign
            if 'Amount' in df.columns:
                df['Type'] = df['Amount'].apply(lambda x: 'INCOME' if x >= 0 else 'EXPENSE')
            else:
                df['Type'] = 'EXPENSE' # Default fallback
            return df

        df['Type'] = df['Type'].astype(str).str.lower().str.strip()
        df['Type'] = df['Type'].map(lambda x: self.type_mapping.get(x, 'EXPENSE')) # Default to EXPENSE if unknown
        return df

    def clean_data(self, file_content: bytes, filename: str) -> pd.DataFrame:
        try:
            if filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(file_content))
            elif filename.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(io.BytesIO(file_content))
            else:
                raise ValueError("Unsupported file format")

            # 1. Normalize Columns
            df = self.normalize_columns(df)
            
            # 2. Handle Split Columns (Deposit/Withdrawal)
            df = self.merge_split_amount_columns(df)
            
            # 3. Ensure Required Columns Exist (or create placeholders)
            for col in ['Date', 'Description', 'Amount']:
                if col not in df.columns:
                    if col == 'Date':
                        df['Date'] = datetime.now()
                    elif col == 'Description':
                        df['Description'] = 'Unknown Transaction'
                    elif col == 'Amount':
                        df['Amount'] = 0.0

            # 4. Normalize Types
            df = self.normalize_types(df)
            
            # 5. Clean Amounts (remove currency symbols if string)
            if df['Amount'].dtype == 'object':
                df['Amount'] = df['Amount'].astype(str).str.replace(r'[^\d.-]', '', regex=True)
                df['Amount'] = pd.to_numeric(df['Amount'], errors='coerce').fillna(0)

            # 6. Filter to standard schema
            return df[['Date', 'Description', 'Amount', 'Type']]

        except Exception as e:
            print(f"Error cleaning data: {e}")
            raise e

    def analyze_financials(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate key metrics from cleaned data"""
        total_income = df[df['Type'] == 'INCOME']['Amount'].sum()
        total_expense = df[df['Type'] == 'EXPENSE']['Amount'].abs().sum()
        
        # Estimate Burn Rate (Average monthly expense)
        # For simplicity, just use total expense if only 1 month, or average
        burn_rate = total_expense # Simplified for demo
        
        # Estimate ARR (Annualized Recurring Revenue)
        # Simplified: Total Income * 12 (if 1 month data)
        arr = total_income * 12 
        
        return {
            "initial_cash": float(total_income - total_expense), # Net cash flow as proxy for initial cash addition
            "burn_rate": float(burn_rate),
            "arr": float(arr),
            "transactions": df.to_dict(orient='records')
        }
