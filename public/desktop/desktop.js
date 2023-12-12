// Function to display the password reset form
function showForgotPassword() {
    // Get the password reset section
    const forgotPasswordSection = document.querySelector("#forgot_password_form");

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
