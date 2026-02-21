// arquivo para chamadas de API das paginas login/register 

const api_base = '/api/v1';
const loginform = document.getElementById('login-form');
const registerform = document.getElementById('register-form');
const apiStatus = document.getElementById('api-status');


//-----------------------funções------------------------------

// indicador de status da API
async function checkApiHealth() {
    if (!apiStatus) return;

    try {
        const res = await fetch(`${api_base}/health`);
        const data = await res.json();
        if (data.status === 'UP') {
            apiStatus.textContent = 'Online';
            apiStatus.className = 'status-indicator online';
        }
    } catch (err) {
        apiStatus.textContent = 'Offline';
        apiStatus.className = 'status-indicator offline';
    }
}


async function login(email, password) {
    try {
        const res = await fetch(`${api_base}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('token', data.token);
            window.location.href = 'tickets.html';
        } else {
            showToast('Email ou senha incorretos', 'error');
        }
    } catch (err) {
        showToast('Erro de rede', 'error');
    }
}



async function registerUser(name, email, password) {
    try {
        const res = await fetch(`${api_base}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('token', data.token);
            window.location.href = '/index.html';
        } else {
            showToast('Email ou senha incorretos', 'error');
        }
    } catch (err) {
        showToast('Erro de rede', 'error');
    }
}

//--------------------eventos-----------------------------------

if (registerform) {
    registerform.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        await registerUser(name, email, password);
    });
}

if (loginform) {
    loginform.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        await login(email, password);
    });
}



checkApiHealth();//trazer status da API 
setInterval(checkApiHealth, 10000);//intervalo de monitoramento da API
