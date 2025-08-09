from django.urls import path

from .views import (DocumentUploadView, EmailSummaryView, LoginView,
                    SignupView, UserProfileView)

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('upload/', DocumentUploadView.as_view(), name='upload'),
    path('email-summary/', EmailSummaryView.as_view(), name='email-summary'),
    path('profile/', UserProfileView.as_view(), name='profile'),
] 