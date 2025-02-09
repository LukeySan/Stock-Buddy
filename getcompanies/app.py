import yfinance as yf
import pandas as pd
import json

def fetch_sp500_companies():
    # Fetch the S&P 500 companies from Wikipedia
    url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
    tables = pd.read_html(url)
    sp500_df = tables[0]  # The first table contains the S&P 500 companies
    return sp500_df[['Symbol', 'Security']]  # Return only the Symbol and Company columns

def create_json_file(filename):
    # Fetch the S&P 500 companies
    sp500_companies = fetch_sp500_companies()
    
    # Convert the DataFrame to a list of dictionaries
    companies_list = sp500_companies.to_dict(orient='records')
    
    # Write the list to a JSON file
    with open(filename, 'w') as json_file:
        json.dump(companies_list, json_file, indent=4)

if __name__ == "__main__":
    create_json_file('sp500_companies.json')
    print("JSON file created successfully: sp500_companies.json")