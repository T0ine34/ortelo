const io = require('socket.io-client');
const SERVER_URL = 'http://localhost:3000';
//const SERVER_URL = '192.168.76.59:3000'; // Server URL

const USER_COUNT = 5; // Number of users to simulate
const MESSAGES_TO_SEND = 5;

const simulateUser = (userId) => {
    const socket = io(SERVER_URL);
    const username = `Lila_${userId}`;

    socket.on('connect', () => {
        console.log(`Utilisateur ${username} est en train de se connecter.`);

        // Simulate choosing a nickname
        socket.emit('newUser', username);

        socket.on('newUser', (name) => {
            console.log(`Notification: ${name} a rejoint le chat!`);
        });
        socket.on('new_message', (username, message) => {
            console.log(`Message reçu de ${username}: ${message}`);
        });

        // Simulate sending several messages
        for (let i = 0; i < MESSAGES_TO_SEND; i++) {
            socket.emit('send_message', username, `Message_${i}`);
        }
    });
};

for (let i = 0; i < USER_COUNT; i++) {
    simulateUser(i);
}

