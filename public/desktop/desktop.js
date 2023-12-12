
// Fonction pour afficher le formulaire de réinitialisation de mot de passe
function showForgotPassword() {
    // Récupérer la section de mot de passe oublié
    const forgotPasswordSection = document.querySelector("#forgot_password_form");

    // Afficher ou masquer la section en fonction de son état actuel
    if (forgotPasswordSection.style.display === "block") {
        // Si la section est déjà affichée, la masquer
        forgotPasswordSection.style.display = "none";
    } else {
        // Sinon, l'afficher
        forgotPasswordSection.style.display = "block";
        document.querySelector("#login_section").style.display = "none";
        document.querySelector("#signup_section").style.display = "none";
    }
}


function sendResetEmail() {
    // Récupérer la valeur de l'adresse e-mail
    const emailInput = document.querySelector('#forgot_email').value;

    // Afficher la confirmation
    const confirmationMessage = document.createElement('p');
    confirmationMessage.textContent = `Un e-mail de réinitialisation a été envoyé à ${emailInput}. Veuillez vérifier votre boîte de réception.`;

    // Ajouter le message de confirmation à la section de mot de passe oublié
    const forgotPasswordSection = document.querySelector("#forgot_password_form");
    forgotPasswordSection.innerHTML = '';
    forgotPasswordSection.appendChild(confirmationMessage);
}


