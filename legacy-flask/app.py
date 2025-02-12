from flask import Flask, request, jsonify
import yfinance as yf
import numpy as np
from flask_cors import CORS
from scipy.stats import norm
import pandas as pd
import openai
from arch import arch_model

app = Flask(__name__)
CORS(app)
#returns = stock_data['Close'].pct_change().dropna()

def get_forecast_volatility( ret ):
    returns_array = ret.to_numpy() * 100

    garch_model = arch_model(returns_array, vol='GARCH', p=1, q=1)
    garch_result = garch_model.fit(disp="off")

    forecast_volatility = np.sqrt(garch_result.forecast(start = 0).variance.iloc[-1,0])/100
    return forecast_volatility



@app.route('/post-response',methods=['POST'])
def post_response():
    messages = [{"role": "system", "content": "You are a tennis pairing expert."}]

@app.route('/get-graph',methods=['GET'])
def get_graph():
    return jsonify({'message': 'Graph received'})
    

@app.route('/get-companies', methods = ['GET'])
def get_companies():
    try:
        companies = get_sp500_companies()  # Call the function to get S&P 500 companies
        return jsonify(companies)
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/calculate-risk', methods=['POST'])
def calculate_risk():
    try:
        # Get JSON data from the request
        data = request.json
        stock_symbol = data.get('symbol')
        scaling_factor = data.get('scaling_factor', 1)
        principle_fund = data.get('principle_fund', 1)

        # Fetch stock data for the past year
        stock_data = yf.download(stock_symbol, period='1y')

        # Calculate daily returns
        returns = stock_data['Close'].pct_change().dropna()

        # Calculate standard deviation (volatility)
        volatility = get_forecast_volatility(returns)

        #volatility2 = np.std(returns)
        # Calculate the number of trading days
        trading_days = len(stock_data)

        # Calculate the scaling factor
        scaling_factor = np.sqrt(trading_days)

        log_returns = np.log(stock_data['Close'] / stock_data['Close'].shift(1).dropna())
        mu_log = log_returns.mean()
        sigma_log = log_returns.std()

        mu_annual_log = (mu_log * trading_days).iloc[0]
        sigma_annual_log = (sigma_log * np.sqrt(trading_days)).iloc[0]

        S0 = stock_data['Close'].iloc[-1]
        dt = 1/trading_days

       # yearly_returns_log = log_returns.mean() * trading_days
        #volatility_sigma = np.log(1 + volatility)

        num_simulations = 10000

        #print(trading_days)
        #print(S0)    

        price_paths = np.zeros((trading_days, num_simulations))
    
        price_paths[0] = S0
        
    
        for t in range(1, trading_days):
            z = np.random.standard_normal(num_simulations)
            #print(f"price_paths[{t}] shape before assignment:", price_paths[t].shape)
            
            #price_paths[t] = price_paths[t-1] * np.exp(mu_annual_log - 0.5 * sigma_annual_log**2) * dt + sigma_annual_log * np.sqrt(dt) * z
            result = (price_paths[t-1] * np.exp(mu_annual_log - 0.5 * sigma_annual_log**2) * dt +
            sigma_annual_log * np.sqrt(dt) * z)
            print("Result shape:", result.shape)
            price_paths[t] = result



        simulated_final_prices = price_paths[-1] #Final prices of all simulations
        percentile_5 = np.percentile(simulated_final_prices, 5) #5% worst-case scenario

        result_worst_5 = float(percentile_5)

        max_loss = float(principle_fund - percentile_5)

        # Calculate the mean return and adjust for trading days
        mu = returns.mean() * trading_days

        # Calculate risk to principal (%)
        risk = float(volatility * scaling_factor)

        # Calculate N
        N = float((risk - mu) / volatility)

        # Ensure N is within a valid range for probability
        N = N/100

        # Calculate the z-score
        z = norm.ppf((1 + N) / 2)

        # Calculate max and min returns
        max_return = mu + (z * volatility)
        min_return = mu - (z * volatility)

        # Calculate max return in dollars
        max_return_dollar =float( max_return * principle_fund)
        # Calculate max loss
        max_loss = float(min_return * principle_fund)
        



        # Return the risk as a JSON response
        return jsonify({'risk': risk, 'max_return_dollar': max_return_dollar, 'max_loss': max_loss, 'N': N, 'z': z,'5% worst-case scnario': result_worst_5})

    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
