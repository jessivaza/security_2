from django.shortcuts import render, redirect
from django.contrib import messages
from .models import Usua
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login as auth_login

def login_view(request):
    if request.method == "POST":
        usuario_input = request.POST.get("usuario")
        password_input = request.POST.get("password")

        try:
            # Busca usuario en la BD
            user = Usua.objects.get(correo=usuario_input, contrasena=password_input)
            # Guardar sesión manualmente
            request.session['usuario'] = user.correo
            return redirect('dashboard')
        except Usua.DoesNotExist:
            messages.error(request, "Usuario o contraseña incorrectos")

    return render(request, "login.html")


def dashboard_view(request):
    usuario = request.session.get('usuario')  # Usuario logueado
    if not usuario:
        return redirect('login')
    return render(request, "dashboard.html", {"usuario": usuario})

def logout_view(request):
    request.session.flush()  # Elimina toda la sesión
    return redirect('login')


def restablecer_view(request):
    if request.method == "POST":
        email = request.POST.get("correo")
        # Lógica para restablecer la contraseña
    return render(request, 'restablecer.html')

