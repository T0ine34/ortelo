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
    receive_message(timestamp, name, "a rejoint le chat ! &#128075;"); //&#128075; = emoji "person raising hand"
});

csocket.on(EVENTS.CHAT.MESSAGE, (timestamp, _username, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
    receive_message(timestamp, _username, msg);
});

csocket.on(EVENTS.CHAT.USER_LEFT, (timestamp, _username) => {                   //catching the new_message event, triggered by the server when a user sends a message
    receive_message(timestamp, _username, "a quitté le chat ! &#128078;"); //&#128078; = emoji "person leaving"
});

csocket.on(EVENTS.SYSTEM.ERROR, (timestamp, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
    receive_message(timestamp, "Error", msg);
});

csocket.on(EVENTS.SYSTEM.WARNING, (timestamp, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
    receive_message(timestamp, "Warning", msg);
});


csocket.on(EVENTS.SYSTEM.BROADCAST, (timestamp, msg) => {              //catching the new_message event, triggered by the server when a user sends a message
    receive_message(timestamp, "General Information", msg);
});

csocket.on(EVENTS.SYSTEM.INFO, (timestamp, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
    receive_message(timestamp, "Information", msg);
});


let form = document.querySelector('#message_form');
let messages = document.querySelector('#messages');
let input = document.querySelector('#sendMessage');

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
        csocket.emit(EVENTS.CHAT.MESSAGE, Date.now(), username, input.value);     //sending the sendMessage event to the server, with the username and the message as parameters
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
    fetch('/games-info?x=name,icon')
        .then(response => response.json())
        .then(games => {
            let gameContainer = document.querySelector('.gamesContainer');
            gameContainer.innerHTML = ''; // Erase the existing indicators

            games.forEach((game, index) => {
                // Create a new element for each game
                let Item = document.createElement('div');
                Item.addEventListener('click', () => PlayGame(game.name));
                Item.classList.add('GameItem');
                Item.innerHTML = `
                    <img src="${game.icon}" alt="${game.name}">
                    <h5>${game.name}</h5>`;

                gameContainer.appendChild(Item);
            });
        })
        .catch(error => {
            console.error('Erreur lors du chargement des jeux:', error);
        });
}
function PlayGame(name) {
    fetch(`/games-info?${name}=html,css,js`)
        .then(response => response.json())
        .then(game => {
            const container = document.querySelector('.gamesContainer');
            if (game.html) {
                const htmlString = new TextDecoder('utf-8').decode(new Uint8Array(game.html.data));
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlString, 'text/html');
                doc.querySelectorAll('link[href], script[src]').forEach(el => el.remove());
                container.innerHTML = doc.body.innerHTML;
            }

            if (game.css) {
                const cssStyle = document.createElement('style');
                const cssData = new TextDecoder('utf-8').decode(new Uint8Array(game.css.data));
                cssStyle.innerHTML = `.x ${cssData}`;
                document.head.appendChild(cssStyle);
            }

            if (game.js) {
                const scriptTag = document.createElement('script');
                scriptTag.textContent = new TextDecoder('utf-8').decode(new Uint8Array(game.js.data));
                container.appendChild(scriptTag);
            }
            fetch(`/game-start/${name}`)
        })
        .catch(error => {
            console.error(`Erreur lors du chargement du ${name}:`, error);
        });
}
