from django.urls import path
from .views import CalculateRiskView, GetCSRFTokenView, GetExplanationView, CalculatePortfolioAnalysisView, GetPortfolioAnalysisView



urlpatterns = [
    path('calculate-risk/', CalculateRiskView.as_view(), name='calculate-risk'),   
    path('get-csrf-token/', GetCSRFTokenView.as_view(), name='get-csrf-token'),
    path('get-explanation/', GetExplanationView.as_view(), name='get-explanation'),
    path('calculate-portfolio-analysis/', CalculatePortfolioAnalysisView.as_view(), name='calculate-portfolio-analysis'),
    path('get-portfolio-analysis/', GetPortfolioAnalysisView.as_view(), name='get-portfolio-analysis')

]
