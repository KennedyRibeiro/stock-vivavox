document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        // Limpar mensagens de erro
        errorMsg.textContent = '';

        if (username && password) {
            const credentials = btoa(`${username}:${password}`); // Codifica as credenciais para Base64

            fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    localStorage.setItem('auth', credentials); // Armazena as credenciais de autenticação básica
                    window.location.href = 'home.html'; // Redireciona para a página inicial
                } else {
                    errorMsg.textContent = data.message || 'Credenciais inválidas. Tente novamente.';
                }
            })
            .catch(error => {
                console.error('Erro ao fazer login:', error);
                errorMsg.textContent = 'Ocorreu um erro ao tentar fazer login. Tente novamente.';
            });
        } else {
            errorMsg.textContent = 'Por favor, preencha todos os campos.';
        }
    });
});