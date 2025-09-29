from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api import views
from .views import MyTokenObtainPairView


urlpatterns = [
    
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('registro', views.registro, name='registro'),
    path('enviar-correo', views.enviar_correo, name='enviar_correo'),
    path('cambio-contrasena/<str:token>', views.Cambio_Contrasena, name='cambio_contrasena'),
    path('me', views.me, name='me'),
    path("resumen/", views.resumen, name="resumen"),
    path('mis-reportes/', views.mis_reportes, name='mis_reportes'),
    path('perfilUsuario/', views.perfilUsuario, name='perfilUsuario'),
]