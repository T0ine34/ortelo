const io = require('socket.io-client');
const SERVER_URL = '192.168.76.59:3000'; //l'URL du serveur

const USER_COUNT = 10; // Nombre d'utilisateurs à simuler
const MESSAGES_TO_SEND = 5; // Nombre de messages que chaque utilisateur enverra

for (let i = 0; i < USER_COUNT; i++) {
  // Dimulation d'un utilisateur qui se connecte
  const socket = io(SERVER_URL);

  socket.on('connect', () => {
    console.log(`Utilisateur ${i} connecté avec l'ID ${socket.id}`);

    for (let j = 0; j < MESSAGES_TO_SEND; j++) {
      // Envoyer un message
      socket.emit('sendMessage', `Utilisateur ${i}: Message ${j}`);
    }
  });

  // Écouter les messages reçus et les afficher
  socket.on('receiveMessage', (message) => {
    console.log(`Utilisateur ${i} a reçu: ${message}`);
  });
}
