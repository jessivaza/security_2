from django.shortcuts import render, redirect
from django.contrib import messages
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from django.urls import reverse
from .models import Usuario

def login_view(request):
    if request.method == 'POST':
        correo = (request.POST.get('usuario') or "").strip().lower()
        contra = (request.POST.get('contra') or "").strip()

        try:
            user = Usuario.objects.get(correo=correo, contra=contra)
            # Guardar sesión
            request.session['usuario'] = user.correo
            request.session['nombre'] = user.nombre
            messages.success(request, f'Bienvenido {user.nombre}')
            return redirect('dashboard')  # asegúrate que exista esta ruta
        except Usuario.DoesNotExist:
            messages.error(request, 'Correo o contraseña incorrectos.')
            return redirect('login')

    return render(request, 'login.html')


def registro(request):
    if request.method == "POST":
        nombre = (request.POST.get("nombre") or "").strip()
        correo = (request.POST.get("correo") or "").strip().lower()
        contra = (request.POST.get("contra") or "").strip()
        contra_confirm = (request.POST.get("contra_confirm") or "").strip()

        # Validación de contraseñas
        if contra != contra_confirm:
            messages.error(request, "Las contraseñas no coinciden.")
            return redirect('registro')

        # Validación de correo duplicado
        if Usuario.objects.filter(correo=correo).exists():
            messages.warning(request, "El correo ya está registrado.")
            return redirect('login')

        # Guardar SIN encriptar
        Usuario.objects.create(nombre=nombre, correo=correo, contra=contra)

        # Autologin (guarda en sesión)
        request.session['usuario'] = correo
        request.session['nombre'] = nombre
        messages.success(request, f"Usuario registrado. Bienvenido {nombre}")
        return redirect('dashboard')

    return render(request, "login.html")


def dashboard_view(request):
    if not request.session.get('usuario'):
        return redirect('login')
    return render(request, "dashboard.html", {
        "usuario": request.session.get('nombre') or request.session.get('usuario')
    })

def logout_view(request):
    request.session.flush()
    return redirect('login')

def restablecer_view(request):
    if request.method == "POST":
        correo = request.POST.get("email").strip().lower()
        usuario = Usuario.objects.filter(correo=correo).first()

        if usuario:
            # Generamos token temporal
            token = get_random_string(32)

            # Guardamos el token en sesión (puedes crear un campo en la BD si quieres persistirlo)
            request.session['reset_token'] = token
            request.session['reset_email'] = correo

            # URL de confirmación
            reset_url = request.build_absolute_uri(
                reverse('password_reset_confirm') + f'?token={token}&email={correo}'
            )

            # Enviar correo
            send_mail(
                'Restablecimiento de contraseña',
                f'Hola, para restablecer tu contraseña entra aquí:\n{reset_url}',
                'allisonvillalobospena@gmail.com',
                [correo],
                fail_silently=False,
            )

            messages.success(request, 'Se ha enviado un enlace a tu correo.')
        else:
            messages.error(request, 'El correo no está registrado.')

    return render(request, "restablecer.html")


# 2. Vista para confirmar nueva contraseña
def contrarestablecida_view(request):
    token = request.GET.get('token')
    correo = request.GET.get('email')

    # Validamos que el token coincida con el guardado en sesión
    if request.session.get('reset_token') != token or request.session.get('reset_email') != correo:
        messages.error(request, "El enlace no es válido o expiró.")
        return redirect('restablecer')

    usuario = Usuario.objects.filter(correo=correo).first()
    if not usuario:
        messages.error(request, "El correo no está registrado.")
        return redirect('restablecer')

    if request.method == "POST":
        nueva_contra = request.POST.get("new_password1")
        confirmar_contra = request.POST.get("new_password2")

        if nueva_contra != confirmar_contra:
            messages.error(request, "Las contraseñas no coinciden.")
        elif len(nueva_contra) < 8:
            messages.error(request, "La contraseña debe tener al menos 8 caracteres.")
        else:
            # ✅ Guardamos la nueva contraseña en la base de datos
            usuario.contra = nueva_contra
            usuario.save()

            # Limpiamos la sesión
            request.session.pop('reset_token', None)
            request.session.pop('reset_email', None)

            messages.success(request, "Contraseña restablecida correctamente.")
            return redirect('login')

    return render(request, "restablecer.html", {"correo": correo, "token": token})