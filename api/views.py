from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
import jwt
from django.conf import settings

from rest_framework.response import Response
from rest_framework import status
from .models import DetalleAlerta
from .serializer import DetalleAlertaSerializer

# Endpoint para registrar incidente
@api_view(['POST'])
def registrar_incidente(request):
    serializer = DetalleAlertaSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Incidente registrado correctamente'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 🔹 Registrar usuario
@api_view(['POST'])
def registro(request):
    try:
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "El usuario ya existe"}, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse({"error": "El correo ya está registrado"}, status=400)

        user = User.objects.create(
            username=username,
            email=email,
            password=make_password(password)
        )
        return JsonResponse({"message": "Usuario registrado correctamente"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# 🔹 Enviar correo de restablecimiento
@api_view(['POST'])
def enviar_correo(request):
    try:
        email = request.data.get('email')
        user = User.objects.filter(email=email).first()
        if not user:
            return JsonResponse({"error": "El correo no está registrado"}, status=400)

        # Generar token JWT
        token = jwt.encode({"user_id": user.id}, settings.SECRET_KEY, algorithm="HS256")

        reset_url = f"http://localhost:5173/reset-password/{token}"  # URL del frontend
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


# 🔹 Obtener información del usuario logueado
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return JsonResponse({
        "id": request.user.id,
        "username": request.user.username,
        "email": request.user.email
    })
