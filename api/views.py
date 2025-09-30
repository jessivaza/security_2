# api/views.py
from django.core.mail import send_mail
from django.http import JsonResponse
from django.conf import settings
from django.utils.timezone import now, timedelta
from django.db.models import Count
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import serializers
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth.hashers import check_password
import jwt
import logging

from .models import (
    Usuario,
    DetalleAlerta,
    RolUsuario,
    Administrador,
)

log = logging.getLogger(__name__)

# ============ Helpers ============

def _get_validated_token(request):
    jwt_auth = JWTAuthentication()
    header = jwt_auth.get_header(request)
    raw = jwt_auth.get_raw_token(header)
    return jwt_auth.get_validated_token(raw)

def _email_domain(email: str) -> str:
    return (email or "").split("@")[-1].lower()

def _role_from_email(email: str) -> str:
    return "admin" if _email_domain(email) == "admin.com" else "user"

def _password_field_name() -> str:
    # Tu modelo usa atributo 'password' (columna DB 'contra'), pero mantenemos robusto:
    names = {f.name.lower() for f in Usuario._meta.fields}
    for cand in ("password", "contra", "contrasena"):
        if cand in names:
            return cand
    return "password"

# ============ Registrar incidente ============

@api_view(['POST'])
def registrar_incidente(request):
    required = ["idUsuario", "Descripcion", "NombreIncidente", "Ubicacion", "idEscalaIncidencia"]
    for f in required:
        if f not in request.data:
            return Response({"error": f"{f} es requerido"}, status=400)
    try:
        detalle = DetalleAlerta.objects.create(
            idUsuario_id=request.data["idUsuario"],
            idEscalaIncidencia_id=request.data["idEscalaIncidencia"],
            Descripcion=request.data["Descripcion"],
            NombreIncidente=request.data["NombreIncidente"],
            Ubicacion=request.data["Ubicacion"],
        )
        return Response({"message": "Incidente registrado correctamente", "id": detalle.pk})
    except Usuario.DoesNotExist:
        return Response({"error": "Usuario no encontrado"}, status=404)
    except Exception as e:
        log.exception("registrar_incidente error")
        return Response({"error": str(e)}, status=500)

# ============ Registro (crea RolUsuario/Administrador si @admin.com) ============

@api_view(['POST'])
@permission_classes([AllowAny])
def registro(request):
    """
    Crea Usuario con create_user(correo, contra, nombre=...).
    Si correo termina en @admin.com:
      - Crea RolUsuario (NombreRol='Administrador') enlazado al Usuario
      - Crea Administrador enlazado a ese RolUsuario
    Si no:
      - Crea RolUsuario (NombreRol='Usuario')
    """
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

        with transaction.atomic():
            # Usa tu Manager: setea hash en 'password' (columna DB 'contra')
            usuario = Usuario.objects.create_user(
                correo=correo,
                contra=contra,
                nombre=nombre,
            )

            if _email_domain(correo) == "admin.com":
                rol = RolUsuario.objects.create(
                    idUsuario=usuario,
                    NombreRol="Administrador",
                    Descripcion="Rol asignado automáticamente por dominio @admin.com",
                )
                Administrador.objects.get_or_create(
                    idRolUsuario=rol,
                    defaults={"Nombre": nombre, "Apellido": ""},
                )
            else:
                RolUsuario.objects.create(
                    idUsuario=usuario,
                    NombreRol="Usuario",
                    Descripcion="Rol asignado automáticamente",
                )

        return Response({"message": "Usuario registrado correctamente", "id": usuario.idUsuario}, status=201)
    except Exception as e:
        log.exception("registro error")
        return Response({"error": str(e)}, status=500)

# ============ Reset password (tu modelo Usuario) ============

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
        return JsonResponse({"message": "Correo enviado correctamente"})
    except Exception as e:
        log.exception("enviar_correo error")
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def Cambio_Contrasena(request, token):
    try:
        data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        id_usuario = data.get("idUsuario")
        usuario = Usuario.objects.get(idUsuario=id_usuario)

        new_password = (request.data.get("password") or '').strip()
        if not new_password:
            return JsonResponse({"error": "Nueva contraseña requerida"}, status=400)

        # AbstractBaseUser → usa set_password
        usuario.set_password(new_password)
        usuario.save()
        return JsonResponse({"message": "Contraseña cambiada con éxito"})
    except Usuario.DoesNotExist:
        return JsonResponse({"error": "Usuario no encontrado"}, status=404)
    except Exception as e:
        log.exception("Cambio_Contrasena error")
        return JsonResponse({"error": str(e)}, status=500)

# ============ Perfil / Dash ============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    try:
        vt = _get_validated_token(request)
        return JsonResponse({
            "idUsuario": vt.get("idUsuario"),
            "username": vt.get("username"),
            "email": vt.get("email"),
            "role": vt.get("role", "user"),
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=401)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashUsuario(request):
    try:
        vt = _get_validated_token(request)
        id_usuario = vt.get("idUsuario")
        usuario = Usuario.objects.get(idUsuario=id_usuario)
        return JsonResponse({
            "message": "Bienvenido al Dashboard de Usuario",
            "user": {
                "id": usuario.idUsuario,
                "username": usuario.nombre,
                "email": usuario.correo,
            }
        })
    except Usuario.DoesNotExist:
        return JsonResponse({"error": "Usuario no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=401)

# ============ Resumen (ejemplo) ============

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def resumen(request):
    try:
        vt = _get_validated_token(request)
        id_usuario = vt.get("idUsuario")

        niveles_incidencia = (
            DetalleAlerta.objects
            .filter(idUsuario_id=id_usuario)
            .values("idEscalaIncidencia__Descripcion")
            .annotate(total=Count("idEscalaIncidencia"))
        )

        desde = now().date() - timedelta(days=7)
        evolucion_reportes = (
            DetalleAlerta.objects
            .filter(idUsuario_id=id_usuario, FechaHora__date__gte=desde)
            .values("FechaHora__date")
            .annotate(cantidad=Count("idAlerta"))
            .order_by("FechaHora__date")
        )

        return Response({
            "niveles_incidencia": list(niveles_incidencia),
            "evolucion_reportes": [
                {"fecha": r["FechaHora__date"], "cantidad": r["cantidad"]}
                for r in evolucion_reportes
            ]
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)

# ============ LOGIN: rol según tabla Administrador ============

class MyTokenObtainPairSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        try:
            username = attrs.get("username")
            password = attrs.get("password")

            # Autenticación por "nombre" (tu front envía username=nombre)
            usuario = Usuario.objects.filter(nombre=username).first()
            if not usuario:
                raise serializers.ValidationError("Usuario o contraseña incorrectos")

            # Valida password (hashed en atributo 'password' → columna contra)
            pwd_attr = _password_field_name()
            hashed = getattr(usuario, pwd_attr, "") or ""
            if not check_password(password, hashed):
                raise serializers.ValidationError("Usuario o contraseña incorrectos")

            # Rol: si tiene registro en Administrador (vía su RolUsuario) ⇒ admin
            es_admin = Administrador.objects.filter(idRolUsuario__idUsuario=usuario).exists()
            role = "admin" if es_admin else _role_from_email(usuario.correo)

            # Crea tokens con claims útiles para el front
            refresh = RefreshToken()
            refresh["idUsuario"] = usuario.idUsuario
            refresh["username"] = usuario.nombre
            refresh["email"] = usuario.correo
            refresh["role"] = role

            access = refresh.access_token

            return {
                "refresh": str(refresh),
                "access": str(access),
                "idUsuario": usuario.idUsuario,
                "username": usuario.nombre,
                "email": usuario.correo,
                "role": role,
            }
        except serializers.ValidationError:
            raise
        except Exception as e:
            log.exception("login error")
            raise serializers.ValidationError("No se pudo procesar el inicio de sesión")

class MyTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = MyTokenObtainPairSerializer
