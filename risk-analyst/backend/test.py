from flask import Flask, request, jsonify
import yfinance as yf
import numpy as np
from flask_cors import CORS
from scipy.stats import norm
import pandas as pd

def get_sp500_companies():
    sp500 = yf.Ticker("^GSPC")

    sp500_constituents = sp500.history(period = "1d").index

    sp500_tickers = sp500_constituents.tolist()

    return sp500_tickers

stocks = get_sp500_companies()
print(stocks)

