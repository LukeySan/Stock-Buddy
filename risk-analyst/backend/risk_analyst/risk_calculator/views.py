from django.shortcuts import render
from django.http import JsonResponse
from django.views import View
from django.middleware.csrf import get_token
import json
import yfinance as yf
import numpy as np
from scipy.stats import norm
import pandas as pd
import openai
import risk_calculator.utils as util
from dotenv import load_dotenv
import os

load_dotenv()

#Define view functions or classes that handle HTTP requests.
openai.api_key = os.getenv("OPENAI_API_KEY")


# Create your views here.

class GetExplanationView(View):
    def post(self, request):
        try:
            messages = [{"role": "system", "content": " You are a professional value trading consultant bot that evaluates an investment takeaway based on the data provided in the prompt. The prompt will have data that includes a percent decimal risk of investing in that stock, the max return in dollars, max loss in dollars, the return percentage in the worst 5 percent of simulated cases, the stock symbol and the prinicple fund that the user inputed. In your response cannot be more than 300 words. Your response should be formatted as just one paragraph and you must not greet the user, or have any follow up questoins after your evaluation. You must not use any emojis in your response."}]
            
            prompt = "Evaluate an investment takeaway based on the data provided in this JSON data"
            data = json.loads(request.body)
            prompt += (f"""
            Stock Symbol: {data.get('stock_symbol')}
            Principle Fund: {data.get('principle_fund')}
            Risk: {data.get('risk')}
            Max Return: {data.get('max_return_dollar')}
            Max Loss: {data.get('max_loss_dollar')}
            5% Worst Case Scenario (Calculated from Monte Carlo Simulation): {data.get('5% worst-case scenario')}
            """)
            messages.append({"role": "user", "content": prompt})
          
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
   

class GetCSRFTokenView(View):
     def get(self, request):
        try:
            response = JsonResponse({'csrfToken': get_token(request)})
            response["Access-Control-Allow-Credentials"] = "true"
            return response
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

class CalculateRiskView(View):
       def post(self, request):
           try:
               data = json.loads(request.body)
               if data is not None:
                    stock_symbol = data.get('symbol')
                    print("Stock Symbol: ", stock_symbol)
                    principle_fund = data.get('principle_fund', 1)
                    print("Principle Fund: ", principle_fund)
               

               # Fetch stock data for the past year
               stock_data = yf.download(stock_symbol, period='1y')

               if stock_data.empty:
                   return JsonResponse({'error': 'No data found for the given stock symbol'}, status=404)

               # Calculate daily returns
               returns = stock_data['Close'].pct_change().dropna()
               
               log_returns = np.log(stock_data['Close'] / stock_data['Close'].shift(1).dropna())
               # Calculate volatility
               garch_volatility = util.get_forecast_volatility(returns)

               mu_log = log_returns.mean()
               sigma_log = garch_volatility
               trading_days = len(stock_data)
               mu_annual_log = (mu_log * trading_days).iloc[0]
               sigma_annual_log = (sigma_log * np.sqrt(trading_days))

               
               S0 = stock_data['Close'].iloc[-1]
               dt = 1/trading_days
               num_simulations = 10000

               price_paths = np.zeros((trading_days, num_simulations))
               price_paths[0] = S0

               for t in range(1, trading_days):
                   z = np.random.standard_normal(num_simulations)
                   price_paths[t] = price_paths[t-1] * np.exp(mu_annual_log - 0.5 * sigma_annual_log**2) * dt + sigma_annual_log * np.sqrt(dt) * z

               simulated_final_prices = price_paths[-1]
               percentile_5 = float(np.percentile(simulated_final_prices, 5) * 100)
               percentile_5 = round(percentile_5,2)

               max_loss = float(principle_fund - percentile_5)
               mu = returns.mean() * trading_days
               risk = float(garch_volatility * np.sqrt(trading_days))
               risk = round(risk,2)
               N = float((risk-mu)/garch_volatility)/100
               z_score = norm.ppf((1+N)/2)
               max_return = mu + (z_score * garch_volatility)
               min_return = mu - (z_score * garch_volatility)

               max_return_dollar = float(max_return * principle_fund)
               max_return_dollar = round(max_return_dollar,2)
               max_loss_dollar = float(min_return * principle_fund)
               max_loss_dollar = round(max_loss_dollar,2)

               print(percentile_5)

               response =  JsonResponse({
                'risk': risk,          
                'max_return_dollar': max_return_dollar, 
                'max_loss_dollar': max_loss_dollar,
                '5% worst-case scenario': percentile_5,
                })
               response["Access-Control-Allow-Credentials"] = "true"
               return response
           except Exception as e:
               return JsonResponse({'error': str(e)}, status=400)
