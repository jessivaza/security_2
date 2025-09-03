from django.shortcuts import render, redirect
from django.contrib import messages
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
        correo = request.POST.get("correo")
        # Aquí luego puedes agregar la lógica para enviar un correo o token
        print("Correo ingresado:", correo)
    return render(request, "restablecer.html")