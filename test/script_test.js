const io = require('socket.io-client');
const SERVER_URL = 'http://localhost:3000';
//const SERVER_URL = '192.168.76.59:3000'; //L'URL du serveur

const USER_COUNT = 5; // Nombre d'utilisateurs à simuler
const MESSAGES_TO_SEND = 5;

const simulateUser = (userId) => {
    const socket = io(SERVER_URL);
    const username = `Lila_${userId}`;

    socket.on('connect', () => {
        console.log(`Utilisateur ${username} est en train de se connecter.`);

        // Simuler le choix d'un pseudo
        socket.emit('newUser', username);

        socket.on('newUser', (name) => {
            console.log(`Notification: ${name} a rejoint le chat!`);
        });

        
    });
};

for (let i = 0; i < USER_COUNT; i++) {
    simulateUser(i);
}

