import { cookies } from "./modules/cookies/main.js";

document.addEventListener('DOMContentLoaded', function () {
    
    // Event listener for login form
    document.querySelector('#login_form').addEventListener('submit', (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        fetch(`/login/${username}/${password}`)
            .then(response => response.text())
            .then(data => {  

                if(data == "true") {
                    cookies.set("username", username, 1); //save the username for 1 hour
                    console.info("username set to " + username +" for 1 hour");

                    this.location.href = "/";
                } else {
                    alert("Nom d'utilisateur ou mot de passe incorrect");
                }

            })
            .catch(error => console.error('Can not retrieve data from login', error));
    });

    // Event listener for sign up form
    document.querySelector('#signup_form').addEventListener('submit', (event) => {
        event.preventDefault();

        const username  = document.getElementById('signup_username').value;
        const password  = document.getElementById('signup_password').value;
        const password2 = document.getElementById('confirm_password').value;
        const email     = document.getElementById('email').value;
        if(password !== password2) {
            alert('Les mots de passe ne sont pas les mêmes');
            return;
        }

        fetch(`/register/${username}/${password}/${email}`)
            .then(response => response.text())
            .then(data => {  

                if(data == "true") {
                    cookies.set("username", username, 1); //save the username for 1 hour
                    console.info("username set to " + username +" for 1 hour");

                    this.location.href = "/";
                }

            })
            .catch(error => console.error('Can not retrieve data from login', error));
    });

    document.querySelector('#forgot_password_form button').addEventListener('click', sendResetEmail);

    document.querySelector('#showSignup').addEventListener('click', showSignup);
    document.querySelector('#showLogin').addEventListener('click', showLogin);
    document.querySelectorAll('.forgot-password-button').forEach(button => {
        button.addEventListener('click', showForgotPassword);
    });


    // Event listeners for toggling password visibility
    document.querySelector('#show_login_password').addEventListener('click', () => togglePasswordVisibility('#password'));
    document.querySelector('#show_signup_password').addEventListener('click', () => togglePasswordVisibility('#signup_password'));
    document.querySelector('#show_confirm_password').addEventListener('click', () => togglePasswordVisibility('#confirm_password'));
});

function showLogin() {
    document.querySelector("#login_section").style.display = "block";
    document.querySelector("#signup_section").style.display = "none";
    document.querySelector("#forgot_password_section").style.display = "none";
}

function showSignup() {
    document.querySelector("#signup_section").style.display = "block";
    document.querySelector("#login_section").style.display = "none";
    document.querySelector("#forgot_password_section").style.display = "none";
}

function showForgotPassword() {
    document.querySelector("#forgot_password_section").style.display = "block";
    document.querySelector("#login_section").style.display = "none";
    document.querySelector("#signup_section").style.display = "none";
}

function togglePasswordVisibility(passwordFieldId) {
    const passwordInput = document.querySelector(passwordFieldId);
    const toggleButton = passwordInput.nextElementSibling.children[0]; // Assumes button is the first child of the input-group-append
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
