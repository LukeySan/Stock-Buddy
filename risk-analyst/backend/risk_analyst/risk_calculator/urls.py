from django.urls import path
from .views import CalculateRiskView, GetCSRFTokenView, GetExplanationView



urlpatterns = [
    path('calculate-risk/', CalculateRiskView.as_view(), name='calculate-risk'),   
    path('get-csrf-token/', GetCSRFTokenView.as_view(), name='get-csrf-token'),
    path('get-explanation/', GetExplanationView.as_view(), name='get-explanation'),


]
