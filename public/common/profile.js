// Toggle between display and edit forms when the 'Edit' button is clicked

function toggleEditDisplay() {
    var displayForm = document.getElementById("Display-content");
    var editForm = document.getElementById("Edit-content");

    if(displayForm.style.display === "none") {
        displayForm.style.display = "block";
        editForm.style.display = "none";
        document.querySelector("#editButton").textContent = "Modifier";
    } else {
        displayForm.style.display = "none";
        editForm.style.display = "block";
        document.querySelector("#editButton").textContent = "Annuler";
    }
}

document.getElementById("editButton").addEventListener("click", toggleEditDisplay);

// Handle form submission for profile updates
document.getElementById("Edit-content").addEventListener("submit", function(event){
    event.preventDefault();

    // Validate the new password and its confirmation
    var newPassword = document.getElementById("passwordEdit").value;
    var confirmPassword = document.getElementById("confirmPasswordEdit").value;

    if(newPassword !== confirmPassword) {
        alert("Passwords do not match.");
        return; // Do not proceed if the passwords do not match
    }

    // TODO: Add code to send the updated data to the server...

    // Toggle the forms back to the display form after submission
    document.getElementById("Edit-content").style.display = "none";
    document.getElementById("Display-content").style.display = "block";
});

// Function to toggle password visibility
function togglePassword(buttonId, inputId) {
    var passwordInput = document.getElementById(inputId);
    var toggleButton = document.getElementById(buttonId);

    // Toggle the type attribute between 'password' and 'text' to show/hide password
    if(passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleButton.textContent = "Hide";
    } else {
        passwordInput.type = "password";
        toggleButton.textContent = "Show";
    }
}

// Attach event listeners for the password show/hide buttons
document.getElementById("showPassword").addEventListener("click", function() {
    togglePassword("showPassword", "passwordEdit");
    });
    
    document.getElementById("showConfirmPassword").addEventListener("click", function() {
    togglePassword("showConfirmPassword", "confirmPasswordEdit");
    });
    
    // Fetch user data and populate the display form when the page loads
    document.addEventListener('DOMContentLoaded', function() {
    // Make a GET request to the server for the user data
    fetch('/api/user', {
    method: 'GET',
    headers: {
    'Content-Type': 'application/json'
    },
    credentials: 'include' // Necessary for sessions or cookies
    })
    .then(response => {
    if (!response.ok) {
    throw new Error('Network error: ' + response.statusText);
    }
    return response.json();
    })
    .then(user => {
    // Populate the form fields with the user data
    document.getElementById("usernameDisplay").value = user.username;
    document.getElementById("emailDisplay").value = user.email;
    // Password should never be retrieved or displayed for security reasons
    })
    .catch(error => {
    console.error('Error fetching user data:', error);
    });
    });
