function showLogin() {
    // Display the login form
    document.querySelector("#login_section").style.display = "block";

    // Hide the other sections (sign-up and password reset)
    document.querySelector("#signup_section").style.display = "none";
    document.querySelector("#forgot_password_section").style.display = "none";
}

function showSignup() {
    // Display the sign-up form
    document.querySelector("#signup_section").style.display = "block";

    // Hide the other sections (login and password reset)
    document.querySelector("#login_section").style.display = "none";
    document.querySelector("#forgot_password_section").style.display = "none";
}


// Function to display the password reset form
function showForgotPassword() {
    // Get the password reset section
    const forgotPasswordSection = document.querySelector("#forgot_password_section");

    // Show or hide the section based on its current state
    if (forgotPasswordSection.style.display === "block") {
        // If the section is already displayed, hide it
        forgotPasswordSection.style.display = "none";
    } else {
        // Otherwise, display it and hide the login and signup sections
        forgotPasswordSection.style.display = "block";
        document.querySelector("#login_section").style.display = "none";
        document.querySelector("#signup_section").style.display = "none";
    }
}

// Function to show or hide the password when creating an account
document.querySelector("#show_signup_password").addEventListener('click', function () {
    const passwordInput = document.querySelector('#signup_password');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        this.textContent = 'Masquer';
    } else {
        passwordInput.type = 'password';
        this.textContent = 'Afficher';
    }
});

document.querySelector("#show_login_password").addEventListener('click', function () {
    const loginPasswordInput = document.querySelector('#password');
    if (loginPasswordInput.type === 'password') {
        loginPasswordInput.type = 'text';
        this.textContent = 'Masquer';
    } else {
        loginPasswordInput.type = 'password';
        this.textContent = 'Afficher';
    }
});

// Function to show or hide the password confirmation field when creating an account
document.querySelector("#show_confirm_password").addEventListener('click', function () {
    const confirmPasswordInput = document.querySelector('#confirm_password');
    if (confirmPasswordInput.type === 'password') {
        confirmPasswordInput.type = 'text';
        this.textContent = 'Masquer';
    } else {
        confirmPasswordInput.type = 'password';
        this.textContent = 'Afficher';
    }
});

// Function to send the password reset email
function sendResetEmail() {
    // Get the value of the email address
    const emailInput = document.querySelector('#forgot_email').value;

    // Display the confirmation message
    const confirmationMessage = document.createElement('p');
    confirmationMessage.textContent = `A password reset email has been sent to ${emailInput}. Please check your inbox.`;

    // Add the confirmation message to the password reset section
    const forgotPasswordSection = document.querySelector("#forgot_password_form");
    forgotPasswordSection.innerHTML = '';
    forgotPasswordSection.appendChild(confirmationMessage);
}
