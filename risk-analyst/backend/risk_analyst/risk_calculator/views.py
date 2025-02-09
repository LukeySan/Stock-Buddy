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

class GetPortfolioAnalysisView(View):
    def post(self, request):
        try:
            prompt = """ You are a professional value trading consultant bot specializing in investment risk analytics. Your task is to analyze an investment based on the following JSON data and provide an evaluation with clear, actionable insights. Your response should include: 1. Risk Analysis: Evaluate the portfolio's risk percentage and explain its implications. 2. Max Return & Max Loss: Clearly define the potential profit and downside. 3. Value at Risk (VaR): Estimate the expected loss in extreme conditions using the Monte Carlo 5% worst-case scenario. 4. Monte Carlo Interpretation: Explain what this scenario means in percentage terms and dynamically calculate the corresponding dollar loss based on the principal fund (note that the Monte Carlo value represents the amount left in the portfolio, not the amount lost). 5. Investor Suitability: Identify what type of investor would benefit most from this portfolio based on its risk/reward profile. 6. Risk Management Recommendations: Offer specific strategies (e.g., diversification, stop-loss orders, portfolio allocation adjustments) to manage potential losses. Your response must be concise (max 300 words), structured in one paragraph, and free from greetings or follow-up questions. Avoid vague statements and ensure your analysis is precise and actionable."""
            messages = [{"role": "system", "content": prompt}]
            portfolio = json.loads(request.body)
            prompt += (f"""
            Portfolio Composition and Weights:
            {', '.join([f'{ticker}: {weight*100:.1f}%' for ticker, weight in portfolio['weights'].items()])}
            
            Total Investment: ${portfolio['total_investment']:,.2f}
            
            Risk Analysis:
            - Portfolio Volatility: {portfolio['portfolio_risk']['Total Portfolio Volatility (Risk)']*100:.2f}%
            - 5% Worst Case Scenario: ${portfolio['portfolio_risk']['5% Worst Case Scenario (Monte Carlo)']:,.2f}
            - Potential Loss: ${portfolio['total_investment'] - portfolio['portfolio_risk']['5% Worst Case Scenario (Monte Carlo)']:,.2f}
            """)

            messages.append({"role": "user", "content": prompt})

            response = openai.ChatCompletion.create(
                model = "gpt-3.5-turbo",
                messages = messages,
                max_tokens = 300,
                temperature = 0.5
            )
            explanation = response["choices"][0]["message"]["content"].strip()
            return JsonResponse({'explanation': explanation})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
            

class GetExplanationView(View):
    def post(self, request):
        try:
            prompt = """You are a professional value trading consultant bot specializing in investment risk analytics. Your task is to analyze an investment based on the given data and provide an evaluation with clear, actionable insights.

Your response should include:
1. **Risk Analysis:** Evaluate the stock's risk percentage and explain its implications.
2. **Max Return & Max Loss:** Clearly define the potential profit and downside.
3. **Value at Risk (VaR):** Estimate the expected loss in extreme conditions using the Monte Carlo 5% worst-case scenario.
4. **Monte Carlo Interpretation:** Explain what this scenario means in **percentage terms** and dynamically calculate the **corresponding dollar loss** based on the principal fund.
5. **Investor Suitability:** Identify what type of investor would benefit most from this stock, based on the risk/reward profile.
6. **Risk Management Recommendations:** Offer specific strategies (e.g., diversification, stop-loss orders, portfolio allocation) to manage potential losses.

Your response must be **concise (max 300 words), structured in one paragraph, and free from greetings or follow-up questions**. Do not use any emojis. Ensure your analysis is precise and actionable, avoiding vague statements. In your response make sure you address the stock symbol by its company name."""
            messages = [{"role": "system", "content": prompt}]
            
            
            data = json.loads(request.body)
            prompt += (f"""
            Stock Symbol: {data.get('stock_symbol')}
            Principle Fund: {data.get('principle_fund')}
            Risk: {data.get('risk')}
            Max Return: {data.get('max_return_dollar')}
            Max Loss: {data.get('max_loss_dollar')}
            Company Name: {data.get('company_name')}
            5% Worst Case Scenario (Calculated from Monte Carlo Simulation): {data.get('5% worst-case scenario')}
            """)
            messages.append({"role": "user", "content": prompt})
            #TODO make sure to add name of stock company in the prompt so that it uses its company in the response instead of the symbol

            response = openai.ChatCompletion.create(
                model = "gpt-3.5-turbo",
                messages = messages,
                max_tokens = 300,
                temperature = 0.5
            )
            explanation = response["choices"][0]["message"]["content"].strip()
            return JsonResponse({'explanation': explanation})
          
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
        
class CalculatePortfolioAnalysisView(View):
    def post(self, request):
        try:
            portfolio= json.loads(request.body)

            #Extract tickeres and investments from the portfolio data
            tickers = list(portfolio.keys())
            investments = np.array(list(portfolio.values()))
            total_investment = np.sum(investments)

            #Computer portfolio weights based on investment amounts
            weights = investments / total_investment #Normalized weights
            portfolio_data = yf.download(tickers, period='1y')
            if portfolio_data.empty:
                return JsonResponse({'error': 'No data found for the given tickers'}, status=404)

            #Calculate daily log returns
            log_returns = np.log(portfolio_data['Close'] / portfolio_data['Close'].shift(1).dropna())
            log_returns = log_returns.dropna()

            if log_returns.empty:
                return JsonResponse({'error': 'Insufficient data for analysis'}, status=400)

            #Compute Volatility for each stock
            garch_volatilities = {}

            #for ticker in tickers:
                #garch_volatilities[ticker] = util.get_forecast_volatility(log_returns[ticker])

            for ticker in tickers:
                returns = log_returns[ticker].replace([np.inf, -np.inf], np.nan).dropna()
                if len(returns) < 2:  # Need at least 2 points for volatility
                    return JsonResponse({'error': f'Insufficient data for {ticker}'}, status=400)
                garch_volatilities[ticker] = util.get_forecast_volatility(returns)

            #Convert to NumPy array 
            volatilities = np.array([garch_volatilities[ticker] for ticker in tickers])
            # Check for valid volatilities
            if np.any(np.isnan(volatilities)) or np.any(np.isinf(volatilities)):
                return JsonResponse({'error': 'Invalid volatility calculations'}, status=400)

            #Compute Portfolio Volatility (Total Risk) using Covariance Matrix
            cov_matrix = log_returns.cov() * 252
            portfolio_variance = np.dot(weights.T, np.dot(cov_matrix, weights))
            portfolio_volatility = np.sqrt(portfolio_variance)
            
            #Monte Carlo Simulation for Portfolio Value
            num_simulations = 10000
            num_days = 252  # One trading year
            dt = 1/252  # Daily time step

            portfolio_values = np.zeros((num_days, num_simulations))
            portfolio_values[0] = total_investment

            # Annual to daily conversion for mean returns
            daily_returns_mean = log_returns.mean() * dt
            daily_volatilities = volatilities * np.sqrt(dt)

            corr_matrix = log_returns.corr()
            L = np.linalg.cholesky(corr_matrix)

            for t in range(1, num_days):
                z = np.random.standard_normal((len(tickers), num_simulations))
                correlated_z = np.dot(L, z)  # Apply correlations

                simulated_returns = np.exp(
                    (daily_returns_mean.values.reshape(-1, 1) - 0.5 * daily_volatilities.reshape(-1, 1)**2) + 
                    daily_volatilities.reshape(-1, 1) * correlated_z
                )
                weighted_returns = np.sum(weights.reshape(-1, 1) * simulated_returns, axis=0)
                portfolio_values[t] = portfolio_values[t-1] * weighted_returns

            #Compute Portfolio Monte Carlo 5% Worst Case
            percentile_5 = np.percentile(portfolio_values[-1], 5)

            portfolio_risk_results = pd.DataFrame({
                "Total Portfolio Volatility (Risk)": [portfolio_volatility],
                "5% Worst Case Scenario (Monte Carlo)": [percentile_5]
            })

            # Convert DataFrame to dictionary and return as JSON
            final_result = {
                "portfolio_risk": portfolio_risk_results.to_dict('records')[0],
                "total_investment": float(total_investment),
                "weights": {ticker: float(weight) for ticker, weight in zip(tickers, weights)}
            }

            return JsonResponse(final_result)

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
