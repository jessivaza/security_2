# api/urls.py
from django.urls import path
from django.db import transaction
from rest_framework_simplejwt.views import TokenRefreshView
from .views import HeatmapAlertView
from .views import (
    MyTokenObtainPairView,
    registro,
    me,
    resumen,
    mis_reportes,
    registrar_incidente,
    enviar_correo,
    Cambio_Contrasena,
    perfil_usuario,
    cambiar_password,
    # Dashboard views
    dashboard_stats,
    emergency_personnel,
    recent_activities,
    historial_incidentes,  # <-- ya existente
    # Nuevas vistas de Gestión
    gestion_list_incidentes,
    gestion_update_incidente,
)

urlpatterns = [
    path('login',   MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh', TokenRefreshView.as_view(),       name='token_refresh'),

    path('registro', registro, name='registro'),
    path('me/', me, name='me'),
    path('me', me, name='me'),
    path('resumen',  resumen, name='resumen'),
    path('resumen/', resumen, name='resumen_slash'),

    path('mis-reportes',  mis_reportes, name='mis_reportes'),
    path('mis-reportes/', mis_reportes, name='mis_reportes_slash'),

    path('registrar-incidente',  registrar_incidente, name='registrar_incidente'),
    path('registrar-incidente/', registrar_incidente, name='registrar_incidente_slash'),

    path('enviar-correo', enviar_correo, name='enviar_correo'),
    path('reset-password/<str:token>', Cambio_Contrasena, name='cambio_contrasena'),

    path('perfil-usuario/', perfil_usuario, name='perfil_usuario'),
    path('cambiar-password/', cambiar_password, name='cambiar_password'),

    # Nuevas URLs para dashboard dinámico 
    path('dashboard/stats/', dashboard_stats, name='dashboard_stats'),
    path('dashboard/personnel/', emergency_personnel, name='emergency_personnel'),
    path('dashboard/activities/', recent_activities, name='recent_activities'),
    # path('dashboard/locations/', incidents_by_location, name='incidents_by_location'),  # Comentado - función no existe aún
    # Historial (ya existente)
    path('historial/incidentes/', historial_incidentes, name='historial_incidentes'),
    
    #========PATH PARA EL MAPA DE CALOR EN TIEMPO REAL==============================
    path("alertas/heatmap", HeatmapAlertView.as_view(), name="heatmap-alertas"),

    # ---------------- NUEVAS RUTAS PARA GESTIÓN ----------------
    # GET listado para Gestión
    path('gestion/incidentes/', gestion_list_incidentes, name='gestion_list_incidentes'),
    # PATCH actualización de estado
    path('gestion/incidentes/<int:id>/', gestion_update_incidente, name='gestion_update_incidente'),
]
