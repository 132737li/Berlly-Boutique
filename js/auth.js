/* =====================================================
   Berlly Boutique - Authentification
   ===================================================== */

const USERS_KEY = 'berlly_users';
const CURRENT_USER_KEY = 'berlly_current_user';
const RESET_EMAIL_KEY = 'berlly_reset_email';


/* =====================================================
   UTILITAIRES
   ===================================================== */

function getUsers() {

    const data = localStorage.getItem(USERS_KEY);

    return data ? JSON.parse(data) : [];
}


function saveUsers(users) {

    localStorage.setItem(
        USERS_KEY,
        JSON.stringify(users)
    );
}


/* =====================================================
   AFFICHER / CACHER MOT DE PASSE
   ===================================================== */

function togglePassword(inputId, button) {

    const input = document.getElementById(inputId);

    if (!input) return;

    if (input.type === 'password') {

        input.type = 'text';

        button.textContent = '🙈';

    } else {

        input.type = 'password';

        button.textContent = '👁';
    }
}


/* =====================================================
   GÉNÉRATEUR DE MOT DE PASSE
   ===================================================== */

function generatePassword(inputId) {

    const input = document.getElementById(inputId);

    if (!input) return;

    const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
        'abcdefghijklmnopqrstuvwxyz' +
        '0123456789' +
        '!@#$%^&*()_+-=[]{}';

    let password = '';

    for (let i = 0; i < 16; i++) {

        const index =
            Math.floor(Math.random() * characters.length);

        password += characters[index];
    }

    input.value = password;

    input.type = 'text';

    checkPasswordStrength(input);

    setTimeout(() => {

        input.type = 'password';

    }, 3000);
}


/* =====================================================
   FORCE DU MOT DE PASSE
   ===================================================== */

function checkPasswordStrength(input) {

    if (!input) return;

    const password = input.value;

    let score = 0;

    if (password.length >= 8) {
        score++;
    }

    if (password.length >= 12) {
        score++;
    }

    if (/[A-Z]/.test(password)) {
        score++;
    }

    if (/[a-z]/.test(password)) {
        score++;
    }

    if (/[0-9]/.test(password)) {
        score++;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
        score++;
    }

    let bar = null;
    let text = null;

    if (input.id === 'register-password') {

        bar = document.getElementById('strength-bar');
        text = document.getElementById('strength-text');

    } else if (input.id === 'reset-password') {

        bar = document.getElementById('reset-strength-bar');
        text = document.getElementById('reset-strength-text');
    }

    if (!bar || !text) return;


    if (password.length === 0) {

        bar.style.width = '0%';
        text.textContent = 'Force du mot de passe';

    } else if (score <= 2) {

        bar.style.width = '30%';
        text.textContent = 'Mot de passe faible';

    } else if (score <= 4) {

        bar.style.width = '65%';
        text.textContent = 'Mot de passe moyen';

    } else {

        bar.style.width = '100%';
        text.textContent = 'Mot de passe fort 🔐';
    }
}

/* =====================================================
   INSCRIPTION (connectée au backend)
   ===================================================== */

async function handleRegister(event) {

    event.preventDefault();

    const name =
        document.getElementById('register-name')
        .value.trim();

    const email =
        document.getElementById('register-email')
        .value.trim()
        .toLowerCase();

    const phone =
        document.getElementById('register-phone')
        .value.trim();

    const password =
        document.getElementById('register-password')
        .value;

    const confirm =
        document.getElementById('register-confirm')
        .value;

    const message =
        document.getElementById('register-message');


    if (password !== confirm) {

        message.textContent =
            'Les mots de passe ne correspondent pas.';

        return;
    }


    if (password.length < 8) {

        message.textContent =
            'Le mot de passe doit contenir au moins 8 caractères.';

        return;
    }

    message.textContent = 'Création du compte en cours...';

    try {

        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nom: name,
                email: email,
                motDePasse: password,
                role: 'utilisateur'
            })
        });

        const data = await response.json();

        if (!response.ok) {

            message.textContent =
                data.message || 'Erreur lors de la création du compte.';

            return;
        }

        message.textContent =
            'Compte créé avec succès ! Connexion...';

        // Connexion automatique juste après l'inscription
        const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                motDePasse: password
            })
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok) {

            localStorage.setItem('berlly_token', loginData.token);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(loginData.utilisateur));

        }

        setTimeout(() => {

            window.location.href = 'profil.html';

        }, 1000);

    } catch (err) {

        message.textContent =
            'Impossible de contacter le serveur. Vérifie que le backend est démarré.';

        console.error(err);
    }
}
/* =====================================================
   CONNEXION (connectée au backend)
   ===================================================== */

const API_BASE_URL = 'http://localhost:5000';

async function handleLogin(event) {

    event.preventDefault();

    const email =
        document.getElementById('login-email')
        .value.trim()
        .toLowerCase();

    const password =
        document.getElementById('login-password')
        .value;

    const message =
        document.getElementById('login-message');

    message.textContent = 'Connexion en cours...';

    try {

        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                motDePasse: password
            })
        });

        const data = await response.json();

        if (!response.ok) {

            message.textContent =
                data.message || 'Adresse e-mail ou mot de passe incorrect.';

            return;
        }

        // On stocke le token et les infos utilisateur
        localStorage.setItem('berlly_token', data.token);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.utilisateur));

        message.textContent = 'Connexion réussie !';

        setTimeout(() => {

            if (data.utilisateur.role === 'admin') {
                window.location.href = 'admin/dashboard.html';
            } else {
                window.location.href = 'profil.html';
            }

        }, 700);

    } catch (err) {

        message.textContent =
            'Impossible de contacter le serveur. Vérifie que le backend est démarré.';

        console.error(err);
    }
}


/* =====================================================
   MOT DE PASSE OUBLIÉ
   ===================================================== */

function handleForgotPassword(event) {

    event.preventDefault();


    const email =
        document.getElementById('forgot-email')
        .value.trim()
        .toLowerCase();

    const message =
        document.getElementById('forgot-message');


    const users = getUsers();


    const user =
        users.find(user => user.email === email);


    if (!user) {

        message.textContent =
            'Aucun compte trouvé avec cette adresse e-mail.';

        return;
    }


    /*
       Pour notre version locale de démonstration,
       on mémorise l'adresse e-mail à réinitialiser.
    */

    localStorage.setItem(
        RESET_EMAIL_KEY,
        email
    );


    message.textContent =
        'Adresse trouvée. Vous pouvez créer un nouveau mot de passe.';


    setTimeout(() => {

        window.location.href =
            'nouveau-mot-de-passe.html';

    }, 1000);
}


/* =====================================================
   NOUVEAU MOT DE PASSE
   ===================================================== */

function handleResetPassword(event) {

    event.preventDefault();


    const password =
        document.getElementById('reset-password')
        .value;

    const confirm =
        document.getElementById('reset-confirm')
        .value;

    const message =
        document.getElementById('reset-message');


    const email =
        localStorage.getItem(RESET_EMAIL_KEY);


    if (!email) {

        message.textContent =
            'Aucune demande de réinitialisation trouvée.';

        return;
    }


    if (password.length < 8) {

        message.textContent =
            'Le mot de passe doit contenir au moins 8 caractères.';

        return;
    }


    if (password !== confirm) {

        message.textContent =
            'Les mots de passe ne correspondent pas.';

        return;
    }


    const users = getUsers();


    const index =
        users.findIndex(
            user => user.email === email
        );


    if (index === -1) {

        message.textContent =
            'Utilisateur introuvable.';

        return;
    }


    users[index].password = password;


    saveUsers(users);


    localStorage.removeItem(
        RESET_EMAIL_KEY
    );


    message.textContent =
        'Mot de passe modifié avec succès !';


    setTimeout(() => {

        window.location.href =
            'connexion.html';

    }, 1200);
}


/* =====================================================
   PROFIL
   ===================================================== */

function loadProfile() {

    const data =
        localStorage.getItem(CURRENT_USER_KEY);


    if (!data) {

        window.location.href =
            'connexion.html';

        return;
    }


    const user = JSON.parse(data);


    const name =
        document.getElementById('profile-name');

    const email =
        document.getElementById('profile-email');

    const phone =
        document.getElementById('profile-phone');


    if (name) {
        name.value = user.name || '';
    }

    if (email) {
        email.value = user.email || '';
    }

    if (phone) {
        phone.value = user.phone || '';
    }
}


/* =====================================================
   MODIFICATION DU PROFIL
   ===================================================== */

function handleProfileUpdate(event) {

    event.preventDefault();


    const data =
        localStorage.getItem(CURRENT_USER_KEY);


    if (!data) {

        window.location.href =
            'connexion.html';

        return;
    }


    const currentUser =
        JSON.parse(data);


    const name =
        document.getElementById('profile-name')
        .value.trim();

    const phone =
        document.getElementById('profile-phone')
        .value.trim();

    const message =
        document.getElementById('profile-message');


    const users = getUsers();


    const index =
        users.findIndex(
            user => user.id === currentUser.id
        );


    if (index === -1) {

        message.textContent =
            'Utilisateur introuvable.';

        return;
    }


    users[index].name = name;

    users[index].phone = phone;


    saveUsers(users);


    localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(users[index])
    );


    message.textContent =
        'Profil mis à jour avec succès !';
}


/* =====================================================
   DÉCONNEXION
   ===================================================== */

function logout() {

    localStorage.removeItem(
        CURRENT_USER_KEY
    );

    window.location.href =
        'connexion.html';
}


/* =====================================================
   INITIALISATION
   ===================================================== */

document.addEventListener(
    'DOMContentLoaded',
    () => {


        /* Inscription */

        const registerForm =
            document.getElementById('register-form');

        if (registerForm) {

            registerForm.addEventListener(
                'submit',
                handleRegister
            );
        }


        /* Connexion */

        const loginForm =
            document.getElementById('login-form');

        if (loginForm) {

            loginForm.addEventListener(
                'submit',
                handleLogin
            );
        }


        /* Mot de passe oublié */

        const forgotForm =
            document.getElementById('forgot-form');

        if (forgotForm) {

            forgotForm.addEventListener(
                'submit',
                handleForgotPassword
            );
        }


        /* Nouveau mot de passe */

        const resetForm =
            document.getElementById('reset-form');

        if (resetForm) {

            resetForm.addEventListener(
                'submit',
                handleResetPassword
            );
        }


        /* Profil */

        const profileForm =
            document.getElementById('profile-form');

        if (profileForm) {

            loadProfile();

            profileForm.addEventListener(
                'submit',
                handleProfileUpdate
            );
        }


        /* Surveillance du mot de passe */

        const registerPassword =
            document.getElementById('register-password');

        if (registerPassword) {

            registerPassword.addEventListener(
                'input',
                () => checkPasswordStrength(
                    registerPassword
                )
            );
        }


        const resetPassword =
            document.getElementById('reset-password');

        if (resetPassword) {

            resetPassword.addEventListener(
                'input',
                () => checkPasswordStrength(
                    resetPassword
                )
            );
        }

    }
);