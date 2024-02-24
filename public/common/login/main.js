import { cookies } from "../modules/cookies/main.js";

function loginPlayer(username, password) {
    fetch(`/login`, {
        method: "POST",
        body: JSON.stringify({
            username, password
        }),
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then(response => response.json())
    .then(data => {

        if(data.logged == true) {
            if(data.playerId){
                cookies.set("playerid", data.playerId, 1); //save the username for 1 hour
                console.info("connection cookie set for " + username +" for 1 hour");
            } else{
                console.error("no identifier found");
            }
            
            location.href = "/";
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
}

function registerPlayer(emailjs, username, password, email, hasIdp = false) {
    return new Promise((resolve, reject) => {
        fetch(`/register`, {
            method: "POST",
            body: JSON.stringify({
                username, password, email, hasIdp
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
                
                const playerId = data.playerId;
                
                emailjs.send('gmail', 'register_confirmation', templateParams)
                .then(function(response) {
                    console.log('SUCCESS!', response.status, response.text);
                }, function(error) {
                    console.log('FAILED...', error);
                });
                
                cookies.set("playerid", playerId, 1); //save the username for 1 hour
                console.info("cookie set for user " + username +" for 1 hour");
                
                resolve( {success: true, playerId: playerId} );
            }
            
        })
        .catch(error => console.error('Can not retrieve data from register', error));
    });
}


export { loginPlayer, registerPlayer };