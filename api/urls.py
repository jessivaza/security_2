from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    MyTokenObtainPairView, registro, enviar_correo, Cambio_Contrasena,
    registrar_incidente, me, dashUsuario, resumen
)

urlpatterns = [
    # Auth
    path('login',   MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh', TokenRefreshView.as_view(),       name='token_refresh'),

    # Registro + reset
    path('registro', registro, name='registro'),
    path('enviar-correo', enviar_correo, name='enviar_correo'),
    path('reset-password/<str:token>', Cambio_Contrasena, name='cambio_contrasena'),

    # App
    path('registrar-incidente', registrar_incidente, name='registrar_incidente'),
    path('me', me, name='me'),
    path('dashUsuario', dashUsuario, name='dashUsuario'),
    path('resumen', resumen, name='resumen'),
]