import { cookies } from "../modules/cookies/main.js";
import { registerPlayer } from "../login/main.js";

// EmailJS configuration for sending emails
emailjs.init("Oy9a9uSnZvDAnliA0");

// Get the user code given in the url parameters
function getUrlParams(url) {
    const params = {};
    const urlSearchParams = new URLSearchParams(url.split('?')[1]);
    for (const [key, value] of urlSearchParams.entries()) {
        params[key] = value;
    }
    return params;
}
const redirectUrl = window.location.href;
const urlParams = getUrlParams(redirectUrl);


let token;
// Get the access token for us, the bearer
fetch('/getAccessToken', { 

    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'code=' + urlParams.code

}).then(response => response.json())
.then(data => {

    token = data.access_token; 

}).then(() => {

    // Get the information about the user (trying to login/signup) with the access token
    fetch('https://graph.microsoft.com/v1.0/me', { method: 'GET', headers: {'Authorization': `Bearer ${token}` } })
    .then(response => response.json())
    .then(async (data) => {
        let username = data.givenName.split(" ")[0];
        const email = data.mail;
        const playerExistsResponse = await fetch(`/status/${email}`);
        const playerExistsData = await playerExistsResponse.json();

        if(playerExistsData.success == true) {
            const username = playerExistsData.username;

            const loginResponse = await fetch(`/login`, {
                method: "POST",
                body: JSON.stringify({
                    username, password:undefined, hasIdp:true, idpName:"Microsoft"
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            })
            const loginData = await loginResponse.json();
            if(loginData.logged == true) cookies.set("playerid", loginData.identifier, 1);
        
        } else {
            const registerData = await registerPlayer(emailjs, username, null, email, true, "Microsoft");
            if(registerData.success == true) {
                cookies.set("playerid", registerData.playerId, 1);
            } else {
                console.error("Error when registering player");
            }

        }
        
        window.location.href = "/";


    }) .catch(error => { console.error('Error:', error); });
});