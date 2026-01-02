#!/usr/bin/env python3
"""
Commission Data Import Utility

This script processes Excel and CSV files containing commission data
and outputs JSON format suitable for the Commission Dashboard.

Supports the format from your December 2025 Personal.xlsx file structure.
"""

import pandas as pd
import json
import numpy as np
from datetime import datetime, timedelta
import argparse
import sys
from pathlib import Path

class CommissionDataProcessor:
    def __init__(self):
        self.raw_data = {}
        self.processed_data = {
            "summary": {},
            "teamMembers": [],
            "revenueStreams": [],
            "monthlyTrends": [],
            "rawTransactions": []
        }
        
        # Color mapping for revenue sources
        self.source_colors = {
            'AT&T Mobility': '#FF6B6B',
            'AT&T Residual': '#4ECDC4',
            'T-Mobile': '#45B7D1',
            'AT&T Wireline': '#96CEB4',
            'GetWireless': '#FFA07A',
            'SNET': '#DDA0DD',
            'Verizon': '#FFB347',
            'Sprint': '#98FB98'
        }

    def load_excel_file(self, file_path):
        """Load Excel file with multiple sheets"""
        try:
            # Read all sheets
            sheets = pd.read_excel(file_path, sheet_name=None)
            print(f"Found {len(sheets)} sheets: {list(sheets.keys())}")
            
            for sheet_name, df in sheets.items():
                self.raw_data[sheet_name] = df
                print(f"  {sheet_name}: {len(df)} rows, {len(df.columns)} columns")
            
            return True
            
        except Exception as e:
            print(f"Error loading Excel file: {e}")
            return False

    def load_csv_file(self, file_path):
        """Load CSV file"""
        try:
            df = pd.read_csv(file_path)
            sheet_name = Path(file_path).stem
            self.raw_data[sheet_name] = df
            print(f"Loaded CSV: {len(df)} rows, {len(df.columns)} columns")
            return True
            
        except Exception as e:
            print(f"Error loading CSV file: {e}")
            return False

    def process_at_t_mobility_detail(self, df):
        """Process AT&T Mobility Detail sheet"""
        transactions = []
        
        for _, row in df.iterrows():
            if pd.notna(row.get('Commission', 0)):
                transaction = {
                    "id": str(row.get('TransactionID', f'mob_{len(transactions)}')),
                    "source": "AT&T Mobility",
                    "customerName": str(row.get('Customer Name', 'Unknown')),
                    "commission": float(row.get('Commission', 0)),
                    "date": self._parse_date(row.get('Completion Date')),
                    "productType": str(row.get('Product Name', 'Mobile')),
                    "transactionType": str(row.get('Sales Motion', 'New')),
                    "compensationCycle": str(row.get('Compensation Cycle', '')),
                    "salesPerson": self._extract_salesperson(row),
                    "customerSegment": str(row.get('Customer Segment', 'Business')),
                    "mrc": float(row.get('MRC', 0)) if pd.notna(row.get('MRC')) else 0
                }
                transactions.append(transaction)
        
        return transactions

    def process_at_t_residual_detail(self, df):
        """Process AT&T Residual Detail sheet"""
        transactions = []
        
        for _, row in df.iterrows():
            if pd.notna(row.get('Commission', 0)):
                transaction = {
                    "id": str(row.get('TransactionID', f'res_{len(transactions)}')),
                    "source": "AT&T Residual",
                    "customerName": str(row.get('Customer Name', 'Unknown')),
                    "commission": float(row.get('Commission', 0)),
                    "date": self._parse_date(row.get('Bill Date')),
                    "productType": str(row.get('Product Name', 'Residual')),
                    "transactionType": "Residual",
                    "compensationCycle": str(row.get('Compensation Cycle', '')),
                    "salesPerson": self._extract_salesperson(row),
                    "customerSegment": str(row.get('Customer Segment', 'Business')),
                    "mrc": float(row.get('MRC', 0)) if pd.notna(row.get('MRC')) else 0
                }
                transactions.append(transaction)
        
        return transactions

    def process_tmobile_getwireless(self, df):
        """Process T-Mobile GetWireless sheet"""
        transactions = []
        
        for _, row in df.iterrows():
            if pd.notna(row.get('TotalComp', 0)):
                transaction = {
                    "id": str(row.get('DisputeKey', f'tmob_{len(transactions)}')),
                    "source": "T-Mobile",
                    "customerName": str(row.get('CustomerName', 'Unknown')),
                    "commission": float(row.get('TotalComp', 0)),
                    "date": self._parse_date(row.get('TransactionDate')),
                    "productType": str(row.get('ProductType', 'Mobile')),
                    "transactionType": str(row.get('ActivityType', 'New')),
                    "compensationCycle": str(row.get('Month', '')),
                    "salesPerson": self._extract_salesperson_tmobile(row),
                    "serviceNumber": str(row.get('ServiceNumber', '')),
                    "mrc": float(row.get('TotalMRC', 0)) if pd.notna(row.get('TotalMRC')) else 0
                }
                transactions.append(transaction)
        
        return transactions

    def process_snet_deals(self, df):
        """Process SNET sheet"""
        transactions = []
        
        # Skip header rows and find actual data
        for idx, row in df.iterrows():
            if pd.notna(row.get('Deal Amount', 0)) and str(row.get('Deal Amount')).replace('.', '').isdigit():
                transaction = {
                    "id": f'snet_{len(transactions)}',
                    "source": "SNET",
                    "customerName": str(row.get('Deal', 'SNET Deal')),
                    "commission": float(row.get('Deal Amount', 0)),
                    "date": self._parse_date(row.get('Demo Date')),
                    "productType": "SNET Service",
                    "transactionType": "New Deal",
                    "bonus": float(row.get('Bonus Amount', 0)) if pd.notna(row.get('Bonus Amount')) else 0,
                    "salesPerson": "Team" # SNET appears to be team-based
                }
                transactions.append(transaction)
        
        return transactions

    def _extract_salesperson(self, row):
        """Extract salesperson from AT&T data using SPID or other identifiers"""
        # Map SPIDs or other identifiers to salespeople
        spid_mapping = {
            # Add your actual SPID to salesperson mapping here
            # This is based on your summary data showing Judd, Sal, Deonte, Jon
        }
        
        spid = row.get('SPID', '')
        if spid in spid_mapping:
            return spid_mapping[spid]
        
        # Default assignment logic - you may need to customize this
        # based on your actual business rules
        customer_name = str(row.get('Customer Name', ''))
        if 'ANDERSON' in customer_name.upper():
            return 'Judd'  # Based on your summary showing Anderson University IT under Judd
        
        return 'Unknown'

    def _extract_salesperson_tmobile(self, row):
        """Extract salesperson from T-Mobile data"""
        # T-Mobile data might have different identifiers
        contract_holder = row.get('ContractHolderName', '')
        if pd.notna(contract_holder):
            return str(contract_holder)
        
        return 'Team'

    def _parse_date(self, date_value):
        """Parse various date formats"""
        if pd.isna(date_value):
            return None
        
        try:
            if isinstance(date_value, str):
                # Try common date formats
                for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S']:
                    try:
                        return datetime.strptime(date_value, fmt).isoformat()
                    except ValueError:
                        continue
            elif hasattr(date_value, 'isoformat'):
                return date_value.isoformat()
            
            return str(date_value)
        except:
            return None

    def aggregate_data(self, transactions):
        """Aggregate transaction data into dashboard format"""
        # Calculate summary metrics
        total_commission = sum(t['commission'] for t in transactions)
        unique_customers = len(set(t['customerName'] for t in transactions if t['customerName'] != 'Unknown'))
        
        # Aggregate by team members
        team_data = {}
        for transaction in transactions:
            salesperson = transaction['salesPerson']
            if salesperson not in team_data:
                team_data[salesperson] = {
                    'name': salesperson,
                    'upfront': 0,
                    'residual': 0,
                    'wireline': 0,
                    'total': 0,
                    'customers': set(),
                    'deals': 0
                }
            
            team_data[salesperson]['total'] += transaction['commission']
            team_data[salesperson]['deals'] += 1
            team_data[salesperson]['customers'].add(transaction['customerName'])
            
            # Categorize commission type
            if 'residual' in transaction['transactionType'].lower():
                team_data[salesperson]['residual'] += transaction['commission']
            elif 'wireline' in transaction['source'].lower():
                team_data[salesperson]['wireline'] += transaction['commission']
            else:
                team_data[salesperson]['upfront'] += transaction['commission']

        # Convert to final format
        team_members = []
        for member_data in team_data.values():
            team_members.append({
                'name': member_data['name'],
                'upfront': round(member_data['upfront'], 2),
                'residual': round(member_data['residual'], 2),
                'wireline': round(member_data['wireline'], 2),
                'total': round(member_data['total'], 2),
                'customers': len(member_data['customers']),
                'conversionRate': min(0.8, max(0.4, 0.6 + (member_data['deals'] * 0.01))),  # Mock conversion rate
                'deals': member_data['deals']
            })

        # Aggregate by revenue streams
        revenue_streams = {}
        for transaction in transactions:
            source = transaction['source']
            if source not in revenue_streams:
                revenue_streams[source] = {
                    'name': source,
                    'value': 0,
                    'deals': 0,
                    'color': self.source_colors.get(source, '#' + format(hash(source) % 16777216, '06x'))
                }
            
            revenue_streams[source]['value'] += transaction['commission']
            revenue_streams[source]['deals'] += 1

        # Calculate averages
        for stream in revenue_streams.values():
            stream['avgDeal'] = round(stream['value'] / stream['deals'], 2) if stream['deals'] > 0 else 0
            stream['value'] = round(stream['value'], 2)

        # Generate monthly trends (mock data based on current month)
        monthly_trends = self._generate_monthly_trends(transactions)

        # Build final summary
        summary = {
            'totalCommissions': round(total_commission, 2),
            'totalCustomers': unique_customers,
            'totalTransactions': len(transactions),
            'avgCommissionPerDeal': round(total_commission / len(transactions), 2) if transactions else 0,
            'upfrontCommissions': round(sum(m['upfront'] for m in team_members), 2),
            'residualCommissions': round(sum(m['residual'] for m in team_members), 2),
            'wirelineCommissions': round(sum(m['wireline'] for m in team_members), 2)
        }

        self.processed_data = {
            'summary': summary,
            'teamMembers': sorted(team_members, key=lambda x: x['total'], reverse=True),
            'revenueStreams': list(revenue_streams.values()),
            'monthlyTrends': monthly_trends,
            'rawTransactions': transactions,
            'lastUpdated': datetime.now().isoformat(),
            'dataSource': 'imported'
        }

    def _generate_monthly_trends(self, transactions):
        """Generate monthly trend data"""
        # Group transactions by month
        monthly_data = {}
        for transaction in transactions:
            if transaction['date']:
                try:
                    month_key = datetime.fromisoformat(transaction['date']).strftime('%Y-%m')
                    if month_key not in monthly_data:
                        monthly_data[month_key] = {'total': 0, 'upfront': 0, 'residual': 0}
                    
                    monthly_data[month_key]['total'] += transaction['commission']
                    
                    if 'residual' in transaction['transactionType'].lower():
                        monthly_data[month_key]['residual'] += transaction['commission']
                    else:
                        monthly_data[month_key]['upfront'] += transaction['commission']
                except:
                    continue

        # Convert to dashboard format
        trends = []
        for month, data in sorted(monthly_data.items()):
            try:
                month_name = datetime.strptime(month, '%Y-%m').strftime('%b')
                trends.append({
                    'month': month_name,
                    'total': round(data['total'], 2),
                    'upfront': round(data['upfront'], 2),
                    'residual': round(data['residual'], 2)
                })
            except:
                continue

        return trends

    def process_all_data(self):
        """Process all loaded data sheets"""
        all_transactions = []
        
        # Process each type of data sheet
        if 'AT&T Mobility Detail' in self.raw_data:
            transactions = self.process_at_t_mobility_detail(self.raw_data['AT&T Mobility Detail'])
            all_transactions.extend(transactions)
            print(f"Processed {len(transactions)} AT&T Mobility transactions")

        if 'AT&T Residual Detail' in self.raw_data:
            transactions = self.process_at_t_residual_detail(self.raw_data['AT&T Residual Detail'])
            all_transactions.extend(transactions)
            print(f"Processed {len(transactions)} AT&T Residual transactions")

        if 'T-Mobile GetWireless' in self.raw_data:
            transactions = self.process_tmobile_getwireless(self.raw_data['T-Mobile GetWireless'])
            all_transactions.extend(transactions)
            print(f"Processed {len(transactions)} T-Mobile transactions")

        if 'SNET' in self.raw_data:
            transactions = self.process_snet_deals(self.raw_data['SNET'])
            all_transactions.extend(transactions)
            print(f"Processed {len(transactions)} SNET deals")

        # Handle single CSV files
        for sheet_name, df in self.raw_data.items():
            if sheet_name not in ['AT&T Mobility Detail', 'AT&T Residual Detail', 'T-Mobile GetWireless', 'SNET']:
                transactions = self.process_generic_csv(df, sheet_name)
                all_transactions.extend(transactions)
                print(f"Processed {len(transactions)} transactions from {sheet_name}")

        print(f"\nTotal transactions processed: {len(all_transactions)}")
        
        # Aggregate all data
        if all_transactions:
            self.aggregate_data(all_transactions)
            return True
        
        return False

    def process_generic_csv(self, df, source_name):
        """Process generic CSV format"""
        transactions = []
        
        # Try to map common column names
        column_mapping = {
            'commission': ['commission', 'amount', 'total', 'value', 'commission_amount'],
            'customer': ['customer', 'customer_name', 'client', 'account'],
            'date': ['date', 'transaction_date', 'completion_date', 'sale_date'],
            'salesperson': ['salesperson', 'sales_person', 'agent', 'rep', 'seller'],
            'product': ['product', 'product_name', 'service', 'type']
        }
        
        # Find matching columns
        mapped_columns = {}
        for field, possible_names in column_mapping.items():
            for col in df.columns:
                if col.lower().strip() in [name.lower() for name in possible_names]:
                    mapped_columns[field] = col
                    break

        for idx, row in df.iterrows():
            commission_col = mapped_columns.get('commission')
            if commission_col and pd.notna(row.get(commission_col, 0)):
                transaction = {
                    "id": f'{source_name.lower()}_{idx}',
                    "source": source_name,
                    "customerName": str(row.get(mapped_columns.get('customer', ''), 'Unknown')),
                    "commission": float(row.get(commission_col, 0)),
                    "date": self._parse_date(row.get(mapped_columns.get('date', ''))),
                    "productType": str(row.get(mapped_columns.get('product', ''), 'Service')),
                    "transactionType": "New",
                    "salesPerson": str(row.get(mapped_columns.get('salesperson', ''), 'Unknown'))
                }
                transactions.append(transaction)
        
        return transactions

    def export_json(self, output_file):
        """Export processed data as JSON"""
        try:
            with open(output_file, 'w') as f:
                json.dump(self.processed_data, f, indent=2, default=str)
            print(f"Data exported to {output_file}")
            return True
        except Exception as e:
            print(f"Error exporting JSON: {e}")
            return False

    def print_summary(self):
        """Print processing summary"""
        if not self.processed_data['summary']:
            print("No data processed yet.")
            return
        
        summary = self.processed_data['summary']
        print(f"\n=== PROCESSING SUMMARY ===")
        print(f"Total Commissions: ${summary['totalCommissions']:,.2f}")
        print(f"Total Transactions: {summary['totalTransactions']:,}")
        print(f"Unique Customers: {summary['totalCustomers']:,}")
        print(f"Average Deal Value: ${summary['avgCommissionPerDeal']:,.2f}")
        
        print(f"\nRevenue Breakdown:")
        print(f"  Upfront: ${summary['upfrontCommissions']:,.2f}")
        print(f"  Residual: ${summary['residualCommissions']:,.2f}")
        print(f"  Wireline: ${summary['wirelineCommissions']:,.2f}")
        
        print(f"\nTop Performers:")
        for i, member in enumerate(self.processed_data['teamMembers'][:3]):
            print(f"  {i+1}. {member['name']}: ${member['total']:,.2f}")


def main():
    parser = argparse.ArgumentParser(description='Process commission data files')
    parser.add_argument('input_file', help='Input Excel or CSV file')
    parser.add_argument('-o', '--output', default='commission_data.json', help='Output JSON file')
    parser.add_argument('-v', '--verbose', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    if not Path(args.input_file).exists():
        print(f"Error: Input file '{args.input_file}' not found")
        sys.exit(1)
    
    processor = CommissionDataProcessor()
    
    # Load data
    file_extension = Path(args.input_file).suffix.lower()
    if file_extension in ['.xlsx', '.xls']:
        success = processor.load_excel_file(args.input_file)
    elif file_extension == '.csv':
        success = processor.load_csv_file(args.input_file)
    else:
        print(f"Error: Unsupported file format '{file_extension}'")
        sys.exit(1)
    
    if not success:
        sys.exit(1)
    
    # Process data
    if processor.process_all_data():
        processor.print_summary()
        
        # Export results
        if processor.export_json(args.output):
            print(f"\nSuccess! Import this file into your commission dashboard.")
        else:
            sys.exit(1)
    else:
        print("No data could be processed from the input file.")
        sys.exit(1)


if __name__ == '__main__':
    main()
