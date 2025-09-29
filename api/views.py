from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from django.db.models import Count
from django.db.models.functions import TruncDate
import jwt
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.utils.timezone import now, timedelta
from .models import DetalleAlerta, PerfilUsuario
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Usuario, DetalleAlerta
from .serializer import DetalleAlertaSerializer


# 🔹 Registrar incidente
@api_view(['POST'])
def registrar_incidente(request):
    required_fields = ["idUsuario", "Descripcion", "NombreIncidente", "Ubicacion", "idEscalaIncidencia"]
    for field in required_fields:
        if field not in request.data:
            return Response({"error": f"{field} es requerido"}, status=400)

    try:
        detalle = DetalleAlerta.objects.create(
            idUsuario_id=request.data["idUsuario"],
            idEscalaIncidencia_id=request.data["idEscalaIncidencia"],
            Descripcion=request.data["Descripcion"],
            NombreIncidente=request.data["NombreIncidente"],
            Ubicacion=request.data["Ubicacion"]
        )
        return Response({"message": "Incidente registrado correctamente", "id": detalle.idTipoIncidencia})

    except Usuario.DoesNotExist:
        return Response({"error": "Usuario no encontrado"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


# 🔹 Registrar usuario
@api_view(['POST'])
@permission_classes([AllowAny])
def registro(request):
    try:
        nombre = request.data.get('username', '').strip()
        correo = request.data.get('email', '').strip()
        contra = request.data.get('password', '').strip()

        if Usuario.objects.filter(nombre__iexact=nombre).exists():
            return Response({"error": "El usuario ya existe"}, status=400)
        if Usuario.objects.filter(correo__iexact=correo).exists():
            return Response({"error": "El correo ya está registrado"}, status=400)

        usuario = Usuario.objects.create_user(
            correo=correo,
            contra=contra,
            nombre=nombre
        )

        # Crear perfil asociado automáticamente
        PerfilUsuario.objects.create(usuario=usuario)

        return Response({"message": "Usuario registrado correctamente", "id": usuario.idUsuario})

    except Exception as e:
        return Response({"error": str(e)}, status=500)




# 🔹 Enviar correo de restablecimiento
@api_view(['POST'])
def enviar_correo(request):
    try:
        email = request.data.get('email')
        user = User.objects.filter(email=email).first()
        if not user:
            return JsonResponse({"error": "El correo no está registrado"}, status=400)

        token = jwt.encode({"user_id": user.id}, settings.SECRET_KEY, algorithm="HS256")
        reset_url = f"http://localhost:5173/reset-password/{token}"

        send_mail(
            'Restablecer contraseña',
            f'Haz clic en el siguiente enlace para restablecer tu contraseña: {reset_url}',
            'tu_correo@gmail.com',
            [email],
            fail_silently=False,
        )
        return JsonResponse({"message": "Correo enviado correctamente"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# 🔹 Cambiar contraseña con token
@api_view(['POST'])
def Cambio_Contrasena(request, token):
    try:
        data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user = User.objects.get(id=data["user_id"])
        new_password = request.data.get("password")
        user.password = make_password(new_password)
        user.save()
        return JsonResponse({"message": "Contraseña cambiada con éxito"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# 🔹 Información del usuario logueado
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    jwt_auth = JWTAuthentication()
    header = jwt_auth.get_header(request)
    raw_token = jwt_auth.get_raw_token(header)
    validated_token = jwt_auth.get_validated_token(raw_token)

    id_usuario = validated_token.get("idUsuario")
    usuario = Usuario.objects.get(idUsuario=id_usuario)

    return JsonResponse({
        "id": usuario.idUsuario,
        "username": usuario.nombre,
        "email": usuario.correo
    })


# 🔹 Dashboard de usuario
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashUsuario(request):
    jwt_auth = JWTAuthentication()
    header = jwt_auth.get_header(request)
    raw_token = jwt_auth.get_raw_token(header)
    validated_token = jwt_auth.get_validated_token(raw_token)

    id_usuario = validated_token.get("idUsuario")
    usuario = Usuario.objects.get(idUsuario=id_usuario)

    return JsonResponse({
        "message": "Bienvenido al Dashboard de Usuario",
        "user": {
            "id": usuario.idUsuario,
            "username": usuario.nombre,
            "email": usuario.correo
        }
    })


# 🔹 Resumen con estadísticas, últimas alertas y evolución

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def resumen(request):
    # ✅ Extraer el usuario desde el token JWT
    jwt_auth = JWTAuthentication()
    header = jwt_auth.get_header(request)
    raw_token = jwt_auth.get_raw_token(header)
    validated_token = jwt_auth.get_validated_token(raw_token)

    id_usuario = validated_token.get("user_id")  # <- este nombre sí existe en tu token
    usuario = Usuario.objects.filter(idUsuario=id_usuario).first()

    if not usuario:
        return Response({"error": "Usuario no encontrado"}, status=404)

    # ✅ Estadísticas de incidencias por nivel
    niveles_incidencia = (
        DetalleAlerta.objects
        .filter(idUsuario=usuario)
        .values("idEscalaIncidencia__Descripcion")
        .annotate(total=Count("idEscalaIncidencia"))
    )

    # ✅ Evolución de reportes últimos 7 días
    ultimos_dias = now().date() - timedelta(days=7)
    evolucion_reportes = (
        DetalleAlerta.objects
        .filter(idUsuario=usuario, FechaHora__date__gte=ultimos_dias)
        .values("FechaHora__date")
        .annotate(cantidad=Count("idTipoIncidencia"))  # Ajusta este campo si tu PK se llama distinto
        .order_by("FechaHora__date")
    )

    return Response({
        "niveles_incidencia": list(niveles_incidencia),
        "evolucion_reportes": [
            {"fecha": r["FechaHora__date"], "cantidad": r["cantidad"]}
            for r in evolucion_reportes
        ]
    })


class MyTokenObtainPairSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        usuario = Usuario.objects.filter(nombre=username).first()
        if not usuario or not check_password(password, usuario.password):
            raise serializers.ValidationError("Usuario o contraseña incorrectos")

        # Generar tokens JWT sin depender del modelo User
        refresh = RefreshToken()
        refresh["user_id"] = usuario.idUsuario
        refresh["username"] = usuario.nombre
        refresh["email"] = usuario.correo

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "idUsuario": usuario.idUsuario,
            "username": usuario.nombre,
            "email": usuario.correo,
        }


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def perfilUsuario(request):
    user = request.user  # DRF automáticamente obtiene el usuario desde el token
    perfil = getattr(user, "perfil", None)

    return JsonResponse({
        "nombre": user.nombre,
        "email": user.correo,
        "telefono": perfil.telefono if perfil else "No hay número registrado",
        "ultimo_acceso": user.fecha_creacion.isoformat(),
        "contacto_emergencia": {
            "nombre": perfil.contacto_emergencia_nombre if perfil else "No registrado",
            "telefono": perfil.contacto_emergencia_telefono if perfil else "No registrado",
        },
        "preferencias": perfil.preferencias if perfil else {},
        "activo": user.is_active
    })


