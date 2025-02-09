from arch import arch_model
import numpy as np

def get_forecast_volatility(ret):
    returns_array = ret.to_numpy() * 100

    garch_model = arch_model(returns_array, vol='GARCH', p=1, q=1)
    garch_result = garch_model.fit(disp="off")

    forecast_volatility = np.sqrt(garch_result.forecast(start = 0).variance.iloc[-1,0])/100
    return forecast_volatility