from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api import views

urlpatterns = [
    path('login', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('registro', views.registro, name='registro'),
    path('enviar-correo', views.enviar_correo, name='enviar_correo'),
    path('cambio-contrasena/<str:token>', views.Cambio_Contrasena, name='cambio_contrasena'),
    path('me', views.me, name='me'),
    path('registrar-incidente/', views.registrar_incidente, name='registrar_incidente'),
]
