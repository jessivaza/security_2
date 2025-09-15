from .models import Usuario
from .serializer import RegistroSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.utils.crypto import get_random_string
from django.core.cache import cache
from django.core.mail import send_mail
from rest_framework import status
from django.contrib.auth.hashers import make_password 
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['POST'])
def registro(request):
    serializer = RegistroSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Usuario registrado exitosamente."}, status=201)
    return Response(serializer.errors, status=400)

@api_view(['POST'])
def enviar_correo(request):
    token = get_random_string(length=32)
    asunto = "Recuperación de contraseña"
    mensaje= f"Hola, haz clic en este enlace para recuperar tu contraseña: token= {token}"
    destinatario = request.data.get('correo')
    remitente ='allisonvillalobospena@gmail.com'

    if not destinatario:
        return Response({"error": "Correo requerido"}, status=400)
    elif not User.objects.filter(email=destinatario).exists():
        return Response({"error": "Este correo no registrado"}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        user=User.objects.get(email=destinatario)
        cache.set(token, user.id, timeout=3600)  # El token expira en 1 hora
        send_mail(
            asunto,
            mensaje,
            remitente,
            [destinatario],
            fail_silently=False,
        )
        return Response({"message": "Correo enviado exitosamente."})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
@api_view(['POST'])
def Cambio_Contrasena(request, token):
    password = request.data.get('password')
    user_id = cache.get(token)
    if user_id:
        user = User.objects.get(id=user_id)
        user.password = make_password(password)
        user.save()
        cache.delete(token)  # Elimina el token después de usarlo
        return Response({"message": "Contraseña restablecida exitosamente."})
    else:
        return Response({"error": "Hubo un error."}, status=status.HTTP_404_NOT_FOUND)
        

@api_view(['GET'])
@permission_classes([IsAuthenticated])  # Permitir acceso sin autenticación
def me(request):
    user = request.user
    user_data = {
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
    }
    return Response(user_data)