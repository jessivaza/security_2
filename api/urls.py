from rest_framework_simplejwt.views import (
    TokenObtainPairView,
)
from django.urls import path
from api import views
urlpatterns = [

    path('login', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh', TokenObtainPairView.as_view(), name='token_refresh'),
    path('registro', views.registro, name='registro'),
    path('enviar-correo', views.enviar_correo, name='enviar_correo'),
    path('cambio-contrasena/<str:token>', views.Cambio_Contrasena, name='cambio_contrasena'),
    path('me', views.me, name='me'),  # Nueva ruta para obtener información del usuario autenticado

]