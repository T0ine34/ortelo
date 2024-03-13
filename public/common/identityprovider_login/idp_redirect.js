import { cookies } from "../modules/cookies/main.js";
import { registerPlayer } from "../login/main.js";

// EmailJS configuration for sending emails
emailjs.init("Oy9a9uSnZvDAnliA0");

const getConfig = async () => {
    const redirect_uri = await fetch('/redirectUri');
    const redirect_uri_data = await redirect_uri.json();
    return redirect_uri_data;

}

const redirect_uri = getConfig().redirect_uri;

// IdP configuration
const config = {
    authority: 'https://accounts.google.com',
    client_id: '51873909339-6n41as7geb9le4cg77m3l18e88pv51j7.apps.googleusercontent.com',
    redirect_uri: redirect_uri,
    response_type: 'id_token token',
    scope: 'openid profile email',
};

const userManager = new Oidc.UserManager(config);

userManager.signinRedirectCallback().then(async (user) => {
    if (user) {
        let email = user.profile.email;
        const playerExistsResponse = await fetch(`/status/${email}`);
        const playerExistsData = await playerExistsResponse.json();
        if(playerExistsData.success == true) {
            const username = playerExistsData.username;
            
            const loginResponse = await fetch(`/login`, {
                method: "POST",
                body: JSON.stringify({
                    username, password:undefined, hasIdp:true, idpName:"Google"
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            })
            const loginData = await loginResponse.json();
            if(loginData.logged == true) cookies.set("playerid", loginData.identifier, 1);
        
        } else {

            const registerData = await registerPlayer(emailjs, user.profile.name.split(" ")[0], null, user.profile.email, true, "Google");

            if(registerData.success == true) {
                cookies.set("playerid", registerData.playerId, 1);
            } else {
                console.error("Error when registering player");
            }
        }

        window.location.href = "/";
        
    }
}).catch((error) => {
    console.error('Error when gathering user information:', error);
});