import { CSocket, EVENTS } from "./modules/events/main.js";
import { cookies } from "./modules/cookies/main.js";

const MAX_HISTORY_SIZE = 100;


let username;
if(cookies.exists("username")){
    username = cookies.get("username");
    console.info("username read from cookies : " + username);
}
else{
    console.info("username not found in cookies");
    while (username == null || username == "" || !username.trim().length || username.length > 16) {
        username = prompt("Enter your username (can not be longer than 16 characters)");
    }
}
cookies.set("username", username, 1); //save the username for 1 hour
console.info("username set to " + username +" for 1 hour");

let csocket = new CSocket(io());
csocket.emit(EVENTS.MISC.USERNAME, Date.now(), username);                               //sending the newUser event to the server, with the username as parameter
fetchGames();

csocket.on(EVENTS.CHAT.USER_JOINED, (timestamp, name) => {                                //catching the newUser event, triggered by the server when a new user joins the chat
    // let item = document.createElement('li');
    // item.textContent = name + " a rejoint le chat ! ";
    // item.innerHTML += "&#128075;";
    // item.innerHTML += format_date(timestamp);
    // messages.appendChild(item);
    // window.scrollTo(0, document.body.scrollHeight);
    receive_message(timestamp, name, "a rejoint le chat ! &#128075;"); //&#128075; = emoji "person raising hand"
});

csocket.on(EVENTS.CHAT.MESSAGE, (timestamp, _username, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
    receive_message(timestamp, _username, msg);
});

csocket.on(EVENTS.CHAT.USER_LEFT, (timestamp, _username) => {                   //catching the new_message event, triggered by the server when a user sends a message
    // let item = document.createElement('li');
    // item.textContent = username + " a quitté le chat ! ";
    // item.innerHTML += "&#128078;";
    // let d = new Date(timestamp);
    // item.innerHTML += format_date(timestamp);
    // messages.appendChild(item);
    // window.scrollTo(0, document.body.scrollHeight);
    receive_message(timestamp, _username, "a quitté le chat ! &#128078;"); //&#128078; = emoji "person leaving"
});

csocket.on(EVENTS.SYSTEM.ERROR, (timestamp, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
    // let item = document.createElement('li');
    // item.textContent = "Erreur : " + msg;
    // let d = new Date(timestamp);
    // item.innerHTML += format_date(timestamp);
    // messages.appendChild(item);
    // window.scrollTo(0, document.body.scrollHeight);
    receive_message(timestamp, "Error", msg);
});

csocket.on(EVENTS.SYSTEM.WARNING, (timestamp, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
    // let item = document.createElement('li');
    // item.textContent = "Warning : " + msg;
    // let d = new Date(timestamp);
    // item.innerHTML += format_date(timestamp);
    // messages.appendChild(item);
    // window.scrollTo(0, document.body.scrollHeight);
    receive_message(timestamp, "Warning", msg);
});


csocket.on(EVENTS.SYSTEM.BROADCAST, (timestamp, msg) => {              //catching the new_message event, triggered by the server when a user sends a message
    // let item = document.createElement('li');
    // item.textContent = "Broadcast : " + msg;
    // let d = new Date(timestamp);
    // item.innerHTML += format_date(timestamp);
    // messages.appendChild(item);
    // window.scrollTo(0, document.body.scrollHeight);
    receive_message(timestamp, "General Information", msg);
});

csocket.on(EVENTS.SYSTEM.INFO, (timestamp, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
    // let item = document.createElement('li');
    // item.textContent = "Info : " + msg;
    // let d = new Date(timestamp);
    // item.innerHTML += format_date(timestamp);
    // messages.appendChild(item);
    // window.scrollTo(0, document.body.scrollHeight);
    receive_message(timestamp, "Information", msg);
});


let form = document.querySelector('#message_form');
let messages = document.querySelector('#messages');
let input = document.querySelector('#send_message');

let history = [];
let history_index = 0;

function history_up(){
    if(history_index > 0){
        history_index--;
        input.value = history[history_index];
    }
}
function history_down(){
    if(history_index < history.length){
        history_index++;
        if(history_index == history.length){
            input.value = "";
        }
        else{
            input.value = history[history_index];
        }
    }
}

input.addEventListener('keydown', function(e) {
    if(e.keyCode == 38){ //arrow up
        history_up();
    }
    else if(e.keyCode == 40){ //arrow down
        history_down();
    }
});

form.addEventListener('submit', function(e) {                   //this is triggered when the user click on "Send"
    e.preventDefault();
    if (input.value){
        csocket.emit(EVENTS.CHAT.MESSAGE, Date.now(), username, input.value);     //sending the send_message event to the server, with the username and the message as parameters
        history.push(input.value);
        history_index = history.length;

        while(history.length > MAX_HISTORY_SIZE){
            history.shift(); //remove the first element
        }
        
        input.value = '';
    }
});

function format_number(number, min_length){
    let str = number.toString();
    while(str.length < min_length){
        str = "0" + str;
    }
    return str;
}

function format_date(timestamp){
    let d = new Date(timestamp);
    return format_number(d.getHours(), 2)+":"+format_number(d.getMinutes(), 2)+":"+format_number(d.getSeconds(), 2);
}

function format_message(timestamp, _username, msg){
    let item = document.createElement('li');
    let sender = document.createElement('span');
    sender.textContent = _username;
    sender.classList.add('username');
    item.appendChild(sender);
    let message = document.createElement('div');
    message.textContent = msg;
    message.classList.add('message');
    item.appendChild(message);
    let date = document.createElement('span');
    date.textContent = format_date(timestamp);
    date.classList.add('date');
    item.appendChild(date);
    item.classList.add('message_item');
    if(_username == username){
        item.classList.add('me');
    }
    else{
        item.classList.add('other');
    }
    return item;
}

let receive_message = (timestamp, username, msg) => {
    let item = format_message(timestamp, username, msg);
    messages.appendChild(item);
    item.scrollIntoView(); 
}

function fetchGames() {
    fetch('/games-info')
        .then(response => response.json())
        .then(games => {
            const gamesListContainer = document.getElementById('games_container');
            gamesListContainer.innerHTML = '';

            games.forEach(game => {
                const gameElement = document.createElement('div');
                gameElement.innerHTML = `<h3>${game.name}</h3>
                                         <img src="${game.icon}" alt="${game.name}" onerror="this.src='/assets/images/default_game_icon.png'">`;
                gamesListContainer.appendChild(gameElement);
            });
        })
        .catch(error => {
            console.error('Erreur lors du chargement des jeux:', error);
        });
}