# api/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    MyTokenObtainPairView,
    registro,
    me,
    resumen,
    mis_reportes,            # 👈 nuevo
    registrar_incidente,     # 👈 actualizado
    enviar_correo,
    Cambio_Contrasena,
)

urlpatterns = [
    path('login',   MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh', TokenRefreshView.as_view(),       name='token_refresh'),

    path('registro', registro, name='registro'),

    path('me', me, name='me'),
    path('resumen',  resumen, name='resumen'),
    path('resumen/', resumen, name='resumen_slash'),

    path('mis-reportes',  mis_reportes, name='mis_reportes'),
    path('mis-reportes/', mis_reportes, name='mis_reportes_slash'),

    path('registrar-incidente',  registrar_incidente, name='registrar_incidente'),
    path('registrar-incidente/', registrar_incidente, name='registrar_incidente_slash'),

    path('enviar-correo', enviar_correo, name='enviar_correo'),
    path('reset-password/<str:token>', Cambio_Contrasena, name='cambio_contrasena'),
]
