import { cookies } from "../modules/cookies/main.js";

// IdP configuration
const config = {
    authority: 'https://accounts.google.com',
    client_id: '51873909339-6n41as7geb9le4cg77m3l18e88pv51j7.apps.googleusercontent.com',
    redirect_uri: 'http://localhost:3000/identityprovider_login/oidcredirect.html',
    response_type: 'id_token token',
    scope: 'openid profile email',
};

const userManager = new Oidc.UserManager(config);
userManager.signinRedirectCallback().then((user) => {
    if (user) {
        cookies.set("username", user.profile.name, 1);
        location.href = "/";
    }
}).catch((error) => {
    console.error('Erreur lors de la récupération des informations de l\'utilisateur:', error);
});