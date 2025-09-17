from rest_framework import serializers
from django.contrib.auth.models import User

class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user
from .models import DetalleAlerta

class DetalleAlertaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleAlerta
        fields = '__all__'