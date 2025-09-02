// scripts.js

function switchTab(tab) {
    const userContent = document.querySelector('.user-content');
    const adminContent = document.querySelector('.admin-content');
    const userTab = document.querySelector('.tab-btn:nth-child(1)');
    const adminTab = document.querySelector('.tab-btn:nth-child(2)');
    const submitButton = document.querySelector('.login-btn');

    if (tab === 'user') {
        userContent.style.display = 'block';
        adminContent.style.display = 'none';
        userTab.classList.add('active');
        adminTab.classList.remove('active');
        submitButton.textContent = 'Iniciar Sesión';
    } else {
        userContent.style.display = 'none';
        adminContent.style.display = 'block';
        userTab.classList.remove('active');
        adminTab.classList.add('active');
        submitButton.textContent = 'Crear cuenta';
    }
}

// Inicializa la vista por defecto como "Usuario"
window.onload = () => switchTab('user');
