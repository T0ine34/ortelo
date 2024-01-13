const express = require('express');
const http = require('http');
const socketIO = require('socket.io');



const app = express();
app.use(express.static('public'));
const server = http.createServer(app);
const io = socketIO(server);


class ReversiGame {}