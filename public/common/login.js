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
            .then(response => response.text())
            .then(data => {

                if(data == "true") {
                    cookies.set("username", username, 1); //save the username for 1 hour
                    console.info("username set to " + username +" for 1 hour");

                    this.location.href = "/";
                } else {
                    if (data.includes("erreur")) {
                        const seconds = data.split(':')[1];
                        alert(`Trop de tentatives, veuillez réessayer dans ${seconds} secondes`);
                    } else {
                        alert("Nom d'utilisateur ou mot de passe incorrect");
                    }
                }

            })
            .catch(error => console.error('Can not retrieve data from login', error));
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

        if (!checkPasswordStrength(password).startsWith("Extremely difficult")) {
            alert('Le mot de passe ne respecte pas les critères de sécurité.');
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
    } else if (strength === 2) {
        strengthElement.textContent = "Moyen. " + tips;
        strengthElement.style.color = "black";
        strengthElement.style.backgroundColor = "orangeyellow";
    } else if (strength === 3) {
        strengthElement.textContent = "Fort. " + tips;
        strengthElement.style.color = "black";
        strengthElement.style.backgroundColor = "yellowgreen";
    } else {
        strengthElement.textContent = "Très fort. " + tips;
        strengthElement.style.color = "black";
        strengthElement.style.backgroundColor = "green";
    }

    return strengthElement.textContent;
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