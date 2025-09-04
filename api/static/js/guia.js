function startTourAnimado() {
    const policia = document.getElementById('policia');
    const dialogo = document.getElementById('dialogo');

    policia.style.display = 'block';
    dialogo.style.display = 'block';
    dialogo.innerText = "Paso 1: Aquí está tu barra lateral con las secciones principales.";

    // Después de 4 segundos, cambiar mensaje y resaltar otro elemento
    setTimeout(() => {
        dialogo.innerText = "Paso 2: Haz clic en Alertas para revisar tus notificaciones.";
    }, 4000);

    setTimeout(() => {
        dialogo.innerText = "Paso 3: Aquí ves tu actividad reciente.";
    }, 8000);

    // Terminar tour
    setTimeout(() => {
        dialogo.innerText = "¡Tour finalizado!";
        setTimeout(() => {
            policia.style.display = 'none';
            dialogo.style.display = 'none';
        }, 2000);
    }, 12000);
}
