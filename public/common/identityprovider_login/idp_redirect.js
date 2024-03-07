import { cookies } from "../modules/cookies/main.js";
import { registerPlayer } from "../login/main.js";

// EmailJS configuration for sending emails
emailjs.init("Oy9a9uSnZvDAnliA0");

// IdP configuration
const config = {
    authority: 'https://accounts.google.com',
    client_id: '51873909339-6n41as7geb9le4cg77m3l18e88pv51j7.apps.googleusercontent.com',
    redirect_uri: '/identityprovider_login/oidcredirect.html',
    response_type: 'id_token token',
    scope: 'openid profile email',
};

const userManager = new Oidc.UserManager(config);

userManager.signinRedirectCallback().then(async (user) => {
    if (user) {
        let username = user.profile.name.split(" ")[0];
        const playerExistsResponse = await fetch(`/status/${username}`);
        const playerExistsData = await playerExistsResponse.json();
        if(playerExistsData.success == true) {
            
            const playeridResponse = await fetch(`/getId/${username}`);
            console.log(playeridResponse);
            const playeridData = await playeridResponse.json();
            console.log(playeridData);
            cookies.set("playerid", playeridData.identifier, 1);
        
        } else {
            const registerData = await registerPlayer(emailjs, username, null, user.profile.email, true);
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