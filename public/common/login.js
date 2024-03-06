import { cookies } from "./modules/cookies/main.js";
emailjs.init("Oy9a9uSnZvDAnliA0");

document.addEventListener('DOMContentLoaded', function () {

    // Event listener for login form
    document.querySelector('#login-form').addEventListener('submit', (event) => {
        event.preventDefault();

        const username = document.querySelector('#username').value;
        const password = document.querySelector('#password').value;

        fetch(`/login`, {
            method: "POST",
            body: JSON.stringify({
                username, password
            }),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then(response => response.json())
            .then(data => {
                if(data.success) {
                    cookies.set("username", username, 1);
                    console.info("username set to " + username + " for 1 hour");
                    localStorage.setItem("token", data.token);
                    this.location.href = "/";
                } else {
                    if (data.message && data.message.includes("erreur")) {
                        const seconds = data.message.split(':')[1];
                        alert(`Trop de tentatives, veuillez réessayer dans ${seconds} secondes`);
                    } else {
                        alert("Nom d'utilisateur ou mot de passe incorrect");
                    }
                }
            })
            .catch(error => console.error('Can not retrieve data from login', error));

    });

    // Event listener for sign up form
    document.querySelector('#signup-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const user_label = document.querySelector('label[for="signup_username"]');
        const username  = document.querySelector('#signup_username').value;
        const password  = document.querySelector('#signup_password').value;
        const password2 = document.querySelector('#confirm_password').value;
        const email     = document.querySelector('#email').value;
        if(password !== password2) {
            alert('Les mots de passe ne sont pas les mêmes');
            return;
        }

        fetch(`/register`, {
            method: "POST",
            body: JSON.stringify({
                username, password, email
            }),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then(response => response.json())
            .then(data => {
                if(data.created == true) {

                    const templateParams = {
                        to_mail: email,
                        from_name: 'Ortello',
                        message: `${data.host_url}/${data.email_url}`,
                        to_name: username
                    };


                    emailjs.send('gmail', 'register_confirmation', templateParams)
                        .then(function(response) {
                            console.log('SUCCESS!', response.status, response.text);
                        }, function(error) {
                            console.log('FAILED...', error);
                        });

                    cookies.set("username", username, 1); //save the username for 1 hour
                    console.info("username set to " + username +" for 1 hour");

                    this.location.href = "/";
                } else {
                    const errorElement = document.querySelector('#error_message');
                    errorElement.innerHTML = `<p style="color: red;">${data.reason}</p>`;
                    errorElement.style.display = 'block';
                }

            })
            .catch(error => console.error('Can not retrieve data from register', error));
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
    document.querySelector("#login").style.display = "block";
    document.querySelector("#register").style.display = "none";
    document.querySelector("#forgot-password").style.display = "none";
}

function showSignup() {
    document.querySelector("#register").style.display = "block";
    document.querySelector("#login").style.display = "none";
    document.querySelector("#forgot-password").style.display = "none";
}

function showForgotPassword() {
    document.querySelector("#forgot-password").style.display = "block";
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