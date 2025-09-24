from rest_framework import serializers
from django.contrib.auth.hashers import make_password, check_password
from .models import Usuario, DetalleAlerta


# 🔹 Registro de usuario (se guarda en la tabla Usuario)
class RegistroSerializer(serializers.ModelSerializer):
    contra = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ('idUsuario', 'nombre', 'correo', 'contra')

    def create(self, validated_data):
        validated_data['contra'] = make_password(validated_data['contra'])  # 🔐 Encriptar contraseña
        user = Usuario.objects.create(**validated_data)
        return user


# 🔹 Login (valida usuario con nombre y contra)
class LoginSerializer(serializers.Serializer):
    nombre = serializers.CharField()
    contra = serializers.CharField(write_only=True)

    def validate(self, data):
        nombre = data.get("nombre")
        contra = data.get("contra")

        try:
            usuario = Usuario.objects.get(nombre=nombre)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError("Usuario no encontrado")

        if not check_password(contra, usuario.contra):
            raise serializers.ValidationError("Contraseña incorrecta")

        # Retorna datos útiles del usuario
        return {
            "idUsuario": usuario.idUsuario,
            "nombre": usuario.nombre,
            "correo": usuario.correo,
        }


# 🔹 Serializador para DetalleAlerta
class DetalleAlertaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleAlerta
        fields = '__all__'