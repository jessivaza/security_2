# api/views.py
from django.core.mail import send_mail
from django.http import JsonResponse
from django.conf import settings
from django.utils.timezone import now
from datetime import timedelta
from django.db.models import Count
from django.db import IntegrityError

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import serializers

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from django.utils import timezone
from django.db.models.functions import TruncDate
from django.db.models import Count, Max

from django.db import transaction
from django.contrib.auth.hashers import check_password
from .models import PerfilUsuario
import jwt

from .models import (
    Usuario,
    DetalleAlerta,
    RolUsuario,
    Administrador,
    EscalaAlerta,
)

# ----------------------- LOGIN -----------------------
class MyTokenObtainPairSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        # Autenticación por NOMBRE en tu tabla Usuario
        user = Usuario.objects.filter(nombre=username).first()
        if not user or not user.check_password(password):
            raise serializers.ValidationError("Usuario o contraseña incorrectos")

        # MUY IMPORTANTE: for_user -> agrega user_id al token (necesario para request.user)
        refresh = RefreshToken.for_user(user)

        # Claims extra que usa el front
        refresh["idUsuario"] = user.idUsuario
        refresh["username"]  = user.nombre
        refresh["email"]     = user.correo

        # Deducimos rol: si el usuario está enlazado a un Administrador
        es_admin = Administrador.objects.filter(idRolUsuario__idUsuario=user).exists()
        refresh["role"] = "admin" if es_admin else "user"

        return {
            "refresh": str(refresh),
            "access":  str(refresh.access_token),
            "idUsuario": user.idUsuario,
            "username":  user.nombre,
            "email":     user.correo,
            "role":      "admin" if es_admin else "user",
        }

class MyTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = MyTokenObtainPairSerializer


# --------------------- REGISTRO USUARIO ---------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def registro(request):
    try:
        nombre = (request.data.get('username') or '').strip()
        correo = (request.data.get('email') or '').strip().lower()
        contra = (request.data.get('password') or '').strip()

        if not nombre or not correo or not contra:
            return Response({"error": "username, email y password son requeridos"}, status=400)

        if Usuario.objects.filter(nombre__iexact=nombre).exists():
            return Response({"error": "El usuario ya existe"}, status=400)
        if Usuario.objects.filter(correo__iexact=correo).exists():
            return Response({"error": "El correo ya está registrado"}, status=400)

        # Tu manager create_user espera (correo, contra, **extra)
        user = Usuario.objects.create_user(correo=correo, contra=contra, nombre=nombre)

        # (opcional) crear rol 'Usuario'
        if not RolUsuario.objects.filter(idUsuario=user, NombreRol="Usuario").exists():
            RolUsuario.objects.create(idUsuario=user, NombreRol="Usuario", Descripcion="Rol por defecto")

        return Response({"message": "Usuario registrado correctamente", "idUsuario": user.idUsuario}, status=201)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


# ----------------------- PERFIL / ME -----------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user  # Cargado gracias a user_id en el token
    return JsonResponse({
        "idUsuario": getattr(u, "idUsuario", None),
        "username":  getattr(u, "nombre", ""),
        "email":     getattr(u, "correo", ""),
    })


# ----------------------- RESUMEN -----------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def resumen(request):
    u = request.user
    if not getattr(u, "idUsuario", None):
        return Response({"niveles_incidencia": [], "evolucion_reportes": []})

    # --- Fecha de "hoy" según TZ del proyecto
    hoy = timezone.localdate()  # respeta TIME_ZONE/USE_TZ

    # --- Última fecha de reporte del usuario (fecha, sin hora)
    ultimo = (
        DetalleAlerta.objects
        .filter(idUsuario_id=u.idUsuario)
        .annotate(d=TruncDate("FechaHora"))
        .aggregate(max_d=Max("d"))
        .get("max_d")
    )

    # --- Usar el mayor entre hoy y la última fecha con datos
    fin = max([d for d in (hoy, ultimo) if d is not None])
    inicio = fin - timedelta(days=6)

    # --- Pie: niveles por descripción (contar por pk, no por idAlerta)
    niveles_incidencia = (
        DetalleAlerta.objects
        .filter(idUsuario_id=u.idUsuario, FechaHora__date__gte=inicio, FechaHora__date__lte=fin)
        .values("idEscalaIncidencia__Descripcion")
        .annotate(total=Count("pk"))
    )

    # --- Serie diaria (contar por pk)
    por_dia = (
        DetalleAlerta.objects
        .filter(idUsuario_id=u.idUsuario, FechaHora__date__gte=inicio, FechaHora__date__lte=fin)
        .annotate(d=TruncDate("FechaHora"))
        .values("d")
        .annotate(cantidad=Count("pk"))
    )
    mapa = {r["d"]: r["cantidad"] for r in por_dia}

    dias = [inicio + timedelta(days=i) for i in range(7)]
    evolucion_reportes = [
        {"fecha": d.isoformat(), "cantidad": int(mapa.get(d, 0))}
        for d in dias
    ]

    return Response({
        "niveles_incidencia": list(niveles_incidencia),
        "evolucion_reportes": evolucion_reportes,
    })


# ---------- LISTAR MIS REPORTES ----------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mis_reportes(request):
    u = request.user
    qs = (
        DetalleAlerta.objects
        .filter(idUsuario_id=u.idUsuario)
        .order_by('-FechaHora')
    )
    data = []
    for r in qs:
        data.append({
            "idTipoIncidencia": r.idTipoIncidencia,
            "FechaHora": r.FechaHora,
            "Ubicacion": r.Ubicacion,
            "NombreIncidente": r.NombreIncidente,
            "Descripcion": r.Descripcion,
            "Escala": ESCALAS.get(r.Escala, ""),  # <<<<<< string directo
        })
    return Response(data)



# ---------- REGISTRAR INCIDENTE ----------
# api/views.py (arriba del archivo)
ESCALAS = {1: "Bajo", 2: "Medio", 3: "Alto"}
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def registrar_incidente(request):
    """
    Crea DetalleAlerta para el usuario autenticado.
    Body:
      Ubicacion (str), Descripcion (str, opcional),
      NombreIncidente (str), escala (1,2,3)
    """
    u = request.user

    Ubicacion = (request.data.get("Ubicacion") or "").strip()
    Descripcion = (request.data.get("Descripcion") or "").strip()
    NombreIncidente = (request.data.get("NombreIncidente") or "").strip()
    escala = request.data.get("escala")
    lat = request.data.get("Latitud")
    lon = request.data.get("Longitud")


    faltantes = []
    if not Ubicacion: faltantes.append("Ubicacion")
    if not NombreIncidente: faltantes.append("NombreIncidente")
    if not escala: faltantes.append("escala")
    if faltantes:
        return Response({"error": f"Faltan campos: {', '.join(faltantes)}"}, status=400)

    try:
        escala = int(escala)
        lat = float(lat)  #------- Añado latitud y longitud
        lon = float(lon)
    except ValueError:
        return Response({"error": "escala debe ser 1, 2 o 3 y lat/lon deben ser números"}, status=400)

    if escala not in ESCALAS:
        return Response({"error": "escala debe ser 1(Bajo), 2(Medio) o 3(Alto)"}, status=400)

    try:
        det = DetalleAlerta.objects.create(
            Ubicacion=Ubicacion,
            Descripcion=Descripcion,
            NombreIncidente=NombreIncidente,
            Escala=escala,      # <<<<<< usamos el enum (sin BD extra)
            idUsuario=u,
            Latitud=lat,
            Longitud=lon
        )
        return Response({
            "message": "Incidente registrado",
            "registro": {
                "idTipoIncidencia": det.idTipoIncidencia,
                "FechaHora": det.FechaHora,
                "Ubicacion": det.Ubicacion,
                "NombreIncidente": det.NombreIncidente,
                "Descripcion": det.Descripcion,
                "Escala": ESCALAS.get(det.Escala, ""),
                "Latitud": det.Latitud,
                "Longitud": det.Longitud
            }
        }, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


# ------------------ RESET PASSWORD (opcional) -------------
@api_view(['POST'])
@permission_classes([AllowAny])
def enviar_correo(request):
    try:
        email = (request.data.get('email') or '').strip().lower()
        usuario = Usuario.objects.filter(correo__iexact=email).first()
        if not usuario:
            return JsonResponse({"error": "El correo no está registrado"}, status=400)

        token = jwt.encode({"idUsuario": usuario.idUsuario}, settings.SECRET_KEY, algorithm="HS256")
        reset_url = f"http://localhost:5173/reset-password/{token}"

        send_mail(
            'Restablecer contraseña',
            f'Haz clic en el siguiente enlace para restablecer tu contraseña:\n{reset_url}',
            getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@tuapp.com"),
            [email],
            fail_silently=False,
        )
        return JsonResponse({"message": "Correo enviado"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def Cambio_Contrasena(request, token):
    try:
        data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        id_usuario = data.get("idUsuario")
        usuario = Usuario.objects.get(idUsuario=id_usuario)
        new_password = (request.data.get("password") or "").strip()
        if not new_password:
            return JsonResponse({"error": "Nueva contraseña requerida"}, status=400)
        usuario.set_password(new_password)
        usuario.save()
        return JsonResponse({"message": "Contraseña cambiada con éxito"})
    except Usuario.DoesNotExist:
        return JsonResponse({"error": "Usuario no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# --- PERFIL: GET y PATCH (actualizar nombre/telefono/contacto) ---
@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def perfil_usuario(request):
    u = request.user
    perfil, _ = PerfilUsuario.objects.get_or_create(usuario=u)

    if request.method == 'GET':
        return Response({
            "idUsuario": getattr(u, "idUsuario", None),
            "nombre": u.nombre,
            "email": u.correo,
            "telefono": perfil.telefono,
            "activo": u.is_active,
            "ultimo_acceso": getattr(u, "last_login", None),
            "contacto_emergencia": {
                "nombre": perfil.contacto_emergencia_nombre,
                "telefono": perfil.contacto_emergencia_telefono
            },
            "preferencias": perfil.preferencias or {},
        })

    # PATCH
    data = request.data
    nombre = data.get("nombre")
    telefono = data.get("telefono")
    ce_nom = data.get("contacto_emergencia_nombre")
    ce_tel = data.get("contacto_emergencia_telefono")

    with transaction.atomic():
        if nombre is not None:
            u.nombre = str(nombre).strip()
            u.save(update_fields=["nombre"])
        if telefono is not None:
            perfil.telefono = str(telefono).strip()
        if ce_nom is not None:
            perfil.contacto_emergencia_nombre = str(ce_nom).strip()
        if ce_tel is not None:
            perfil.contacto_emergencia_telefono = str(ce_tel).strip()
        perfil.save()

    return Response({"message": "Perfil actualizado"})


# --- CAMBIAR CONTRASEÑA del usuario autenticado ---
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cambiar_password(request):
    u = request.user
    actual = (request.data.get("actual") or "").strip()
    nueva = (request.data.get("nueva") or "").strip()

    if not check_password(actual, u.password):
        return Response({"error": "Contraseña actual incorrecta"}, status=400)
    if len(nueva) < 6:
        return Response({"error": "La nueva contraseña debe tener al menos 6 caracteres"}, status=400)

    u.set_password(nueva)
    u.save()
    return Response({"message": "Contraseña actualizada"})