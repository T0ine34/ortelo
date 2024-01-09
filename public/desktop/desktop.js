document.addEventListener('DOMContentLoaded', () => {
    // Event listeners for showing the respective forms
    document.querySelector('#login_section button[type="button"]').addEventListener('click', showSignup);
    document.querySelector('#signup_section button[type="button"]').addEventListener('click', showLogin);
    document.querySelectorAll('.forgot-password-button').forEach(button => {
        button.addEventListener('click', showForgotPassword);
    });

    // Event listeners for form submission
    document.querySelector('#login_form').addEventListener('submit', login);
    document.querySelector('#signup_form').addEventListener('submit', signUp);
    document.querySelector('#forgot_password_form button').addEventListener('click', sendResetEmail);

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

async function login(event) {
    event.preventDefault();
    const username = document.querySelector('#username').value;
    const password = document.querySelector('#password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            console.log('Login successful');
        } else {
            console.error('Login failed');
        }
    } catch (error) {
        console.error('Error during login', error);
    }
}

async function signUp(event) {
    event.preventDefault();
    const username = document.querySelector('#signup_username').value;
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#signup_password').value;
    const confirmPassword = document.querySelector('#confirm_password').value;

    if (password !== confirmPassword) {
        console.error('Passwords do not match.');
        return;
    }

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (data.success) {
            console.log('Signup successful');
        } else {
            console.error('Signup failed');
        }
    } catch (error) {
        console.error('Error during signup', error);
    }
}

function sendResetEmail() {
    const emailInput = document.querySelector('#forgot_email').value;
    // Implement the fetch call to your password reset endpoint
    // After you send the email, you can display the confirmation message
    const confirmationMessage = `A password reset email has been sent to ${emailInput}. Please check your inbox.`;
    alert(confirmationMessage); // For now, we just show an alert. You can improve this.
}
