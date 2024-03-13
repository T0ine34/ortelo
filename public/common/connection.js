import { loginPlayer, registerPlayer } from "./login/main.js";
emailjs.init("Oy9a9uSnZvDAnliA0");

// Event listener for the login with google button
document.querySelector('.login-google-button').addEventListener('click', async () => {
    try {
        const redirect_uri = await fetch('/redirectUri');
        const redirect_uri_data = await redirect_uri.json();
        console.log(redirect_uri_data);

        // Google Identity Provider configuration
        const config = {
            authority: 'https://accounts.google.com',
            client_id: '51873909339-6n41as7geb9le4cg77m3l18e88pv51j7.apps.googleusercontent.com',
            redirect_uri: redirect_uri_data.redirect_uri,
            response_type: 'id_token token',
            scope: 'openid profile email',
        };

        // Create a UserManager instance with the configuration
        const userManager = new Oidc.UserManager(config);

        // Redirect the user to the Google Identity Provider for authentication
        const signIn = await userManager.signinRedirect();
    } catch (error) {
        console.error('Error when opening login with google popup:', error);
    }
});


document.addEventListener('DOMContentLoaded', function () {

    // Event listener for login form
    document.querySelector('#login-form').addEventListener('submit', (event) => {
        event.preventDefault();

        const username = document.querySelector('#username').value;
        const password = document.querySelector('#password').value;

        loginPlayer(username, password);
    });

    // Event listener for sign up form

    document.querySelector('#signup_password').addEventListener('input', (e) => {
       checkPasswordStrength(e.target.value);
    })

    document.querySelector('#signup_username').addEventListener('input', (e) => {
        validateUsername(e.target.value);  
        
    })
    
    
    document.querySelector('#signup-form').addEventListener('submit', (event) => {
        event.preventDefault();

        const username  = document.querySelector('#signup_username').value;
        const password  = document.querySelector('#signup_password').value;
        const password2 = document.querySelector('#confirm_password').value;
        const email     = document.querySelector('#email').value;

        
        if(password !== password2) {
            alert('Les mots de passe ne sont pas les mêmes');
            return;
        }

        if (!checkPasswordStrength(password).includes("Fort")) {
            alert('Le mot de passe ne respecte pas les critères de sécurité.');
            return;
        }

        registerPlayer(emailjs, username, password, email);
    });

    document.querySelector('#forgot-password button').addEventListener('submit', sendResetEmail);
    document.querySelector('#showSignup').addEventListener('click', showSignup);
    document.querySelectorAll('.showLogin').forEach( (button) => button.addEventListener('click', showLogin));
    document.querySelector('#showForgotPassword').addEventListener('click', showForgotPassword);


    // Event listeners for toggling password visibility
    document.querySelector('#show_login_password').addEventListener('click', () => togglePasswordVisibility('#password', '#show_login_password'));
    document.querySelector('#show_signup_password').addEventListener('click', () => togglePasswordVisibility('#signup_password', '#show_signup_password'));
    document.querySelector('#show_confirm_password').addEventListener('click', () => togglePasswordVisibility('#confirm_password', '#show_confirm_password'));
});

function showLogin() {
    document.querySelector("#login").style.display = "flex";
    document.querySelector("#register").style.display = "none";
    document.querySelector("#forgot-password").style.display = "none";
}

function showSignup() {
    document.querySelector("#register").style.display = "flex";
    document.querySelector("#login").style.display = "none";
    document.querySelector("#forgot-password").style.display = "none";
}

function showForgotPassword() {
    document.querySelector("#forgot-password").style.display = "flex";
    document.querySelector("#login").style.display = "none";
    document.querySelector("#register").style.display = "none";
}

function togglePasswordVisibility(passwordFieldId, toggleButtonId) {
    const passwordInput = document.querySelector(passwordFieldId);
    const toggleButton = document.querySelector(toggleButtonId);
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.textContent = 'Masquer';
    } else {
        passwordInput.type = 'password';
        toggleButton.textContent = 'Afficher';
    }
}

function sendResetEmail() {
    const emailInput = document.querySelector('#forgot_email').value;
    // Implement the fetch call to your password reset endpoint
    // After you send the email, you can display the confirmation message
    const confirmationMessage = `A password reset email has been sent to ${emailInput}. Please check your inbox.`;
    alert(confirmationMessage); // For now, we just show an alert. You can improve this.
}



function checkPasswordStrength(password) {
    var strength = 0;
    var tips = "";

    if (password.length < 8) {
        tips += "Le mot de passe doit etre plus long. ";
    } else {
        strength += 1;
    }

    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) {
        strength += 1;
    } else {
        tips += "Utilisez des minuscules et des majuscules. ";
    }

    if (password.match(/\d/)) {
        strength += 1;
    } else {
        tips += "Ajoutez au moins un chiffre. ";
    }

    if (password.match(/[^a-zA-Z\d]/)) {
        strength += 1;
    } else {
        tips += "Ajoutez au moins un caractère spécial . ";
    }

    const strengthElement = document.getElementById("password-strength-indicator");
    if (strength < 2) {
        strengthElement.textContent = "Faible. " + tips;
        strengthElement.style.color = "black";
        strengthElement.style.backgroundColor = "orangered";
        return "Faible";
    } else if (strength === 2) {
        strengthElement.textContent = "Moyen. " + tips;
        strengthElement.style.color = "black";
        strengthElement.style.backgroundColor = "orangeyellow";
        return "Moyen";
    } else if (strength === 3) {
        strengthElement.textContent = "Fort. " + tips;
        strengthElement.style.color = "black";
        strengthElement.style.backgroundColor = "yellowgreen";
        return "Fort";
    } else {
        strengthElement.textContent = "Très fort. " + tips;
        strengthElement.style.color = "black";
        strengthElement.style.backgroundColor = "green";
        return "Très Fort";
    }

}


function validateUsername(username) {
    
    var isValid = true;
    var validationMessage = "";


    if (username.length < 4) {
        isValid = false;
        validationMessage += "L'identifiant doit contenir au moins 4 caractères. ";
    }

  
    if (!/^[a-zA-Z0-9\-]+$/.test(username)) {
        isValid = false; 
        validationMessage += "L'identifiant ne peut contenir que des lettres, des chiffres et des tirets. ";
    }

    
    const validationElement = document.getElementById("username-validate-indicator");
    if (isValid) {
        validationElement.textContent = "Identifiant valide.";
        validationElement.style.color = "black";
        validationElement.style.backgroundColor = "green"
    } else {
        validationElement.textContent = "Identifiant invalide. " + validationMessage;
        validationElement.style.color = "black";
        validationElement.style.backgroundColor = "red"
    }

    return isValid;
}