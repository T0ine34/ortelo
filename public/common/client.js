import { CSocket, EVENTS } from "./modules/events/main.js";
import { cookies } from "./modules/cookies/main.js";

new ClipboardJS('.urlShareButton');

const MAX_HISTORY_SIZE = 100;

let username;
if(cookies.exists("username")){
    username = cookies.get("username");
    console.info("username read from cookies : " + username);
} else {
    console.info("username not found in cookies");
    location.href = "connection.html"; // Will redirect user to log in page
}


let csocket = window.csocket = new CSocket(io());
csocket.emit(EVENTS.MISC.USERNAME, Date.now(), username);  

csocket.on(EVENTS.CHAT.USER_JOIN, (timestamp, name) => {                                //catching the newUser event, triggered by the server when a new user joins the chat
    receive_message(timestamp, "Information", name + " a rejoint le chat ! &#128075;"); //&#128075; = emoji "person raising hand"
});

csocket.on(EVENTS.CHAT.MESSAGE, (timestamp, _username, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
    receive_message(timestamp, _username, msg);
});

csocket.on(EVENTS.CHAT.USER_LEFT, (timestamp, _username) => {                   //catching the new_message event, triggered by the server when a user sends a message
    receive_message(timestamp, "Information", _username + " a quitté le chat ! &#128078;"); //&#128078; = emoji "person leaving"
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
    mayjoinroom();
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
    message.innerHTML = msg;
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
function clearChat() {
    messages.innerHTML = '';
    let chatTitle = document.querySelector('.title');
    if (chatTitle) {
        chatTitle.textContent = 'Discussion du jeu';
    }
}
function fetchGames() {
    fetch('/games-info?x=name,icon')
        .then(response => response.json())
        .then(games => {
            let gameContainer = document.querySelector('.gamesContainer');
            gameContainer.innerHTML = '';

            games.forEach((game, index) => {
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
    let container = document.querySelector('.gamesContainer');
    let roomWaitContainer = document.querySelector('.popup_wait_users');
    clearChat();

    fetch(`/games-info?${name}=html,css,js`)
        .then(gameResponse => gameResponse.json())
        .then(game => {

            const htmlString = new TextDecoder('utf-8').decode(new Uint8Array(game.html.data));
            const doc = new DOMParser().parseFromString(htmlString, 'text/html');
            doc.querySelectorAll('link[href], script[src]').forEach(el => el.remove());
            container.innerHTML = doc.body.innerHTML;

            container.appendChild(roomWaitContainer);

            const cssStyle = document.createElement('style');
            const cssData = new TextDecoder('utf-8').decode(new Uint8Array(game.css.data));
            cssStyle.innerHTML = `.x ${cssData}`;
            document.head.appendChild(cssStyle);

            let scriptContent = new TextDecoder('utf-8').decode(new Uint8Array(game.js.data));
            let scriptTag = document.createElement('script');
            scriptTag.textContent = scriptContent;
            window.username = username;
            document.body.appendChild(scriptTag);

            return fetch(`/game-start/${name}/${username}`);
        })
        .then(startResponse => startResponse.json())
        .then(startData => {

            let gamesContainer = document.querySelector('.gamesContainer');
            let menuBarExists = document.querySelector('.menubar') !== null;
            if (!menuBarExists) {
                gamesContainer.style.position = 'relative';
            }

            let roomWaitContainer = document.querySelector('.popup_wait_users');
            let shareButton = document.querySelector('.urlShareButton');
            let waitingScreen = document.querySelector('.waitingScreen');
            let roomUrlbrute = document.querySelector('.roomUrlbrute');

            let shareUrl = window.location.href + startData.roomUrl;

            roomUrlbrute.textContent = shareUrl;

            roomWaitContainer.style.display = 'flex';
            waitingScreen.style.display = 'block';
            shareButton.style.display = 'inline-block';
            roomUrlbrute.style.display = 'block';

            new ClipboardJS('.urlShareButton', {
                text: function() {
                    return shareUrl;
                }
            });

            shareButton.addEventListener('click', function() {
                this.classList.add('clicked');
                let originalText = this.textContent;
                this.textContent = 'Copié!';
                setTimeout(() => {
                    this.classList.remove('clicked');
                    this.textContent = originalText;
                }, 1000);
            });

            const checkRoomInterval = setInterval(function (){
                fetch(`/game-wait/${startData.roomUrl}`)
                    .then(gameLaunchResponse => gameLaunchResponse.json())
                    .then(gameLaunchData => {
                        if (gameLaunchData.message.includes("successfully")) {
                            clearInterval(checkRoomInterval);

                            roomWaitContainer.style.display = 'none';
                            waitingScreen.style.display = 'none';
                            shareButton.style.display = 'none';
                            roomUrlbrute.style.display = 'none';
                        }
                    });
            }, 1000);
        })
        .catch(error => console.error(`Erreur lors du chargement du ${name}:`, error));
}

function loadGameUI(game) {
    let container = document.querySelector('.gamesContainer');

    const htmlString = new TextDecoder('utf-8').decode(new Uint8Array(game.html.data));
    const doc = new DOMParser().parseFromString(htmlString, 'text/html');
    doc.querySelectorAll('link[href], script[src]').forEach(el => el.remove());
    container.innerHTML = doc.body.innerHTML;

    const cssStyle = document.createElement('style');
    const cssData = new TextDecoder('utf-8').decode(new Uint8Array(game.css.data));
    cssStyle.innerHTML = `.x ${cssData}`;
    document.head.appendChild(cssStyle);

    let scriptContent = new TextDecoder('utf-8').decode(new Uint8Array(game.js.data));
    let scriptTag = document.createElement('script');
    scriptTag.textContent = scriptContent;
    window.username = username;
    document.body.appendChild(scriptTag);
}

async function joinGameRoom(urlParts) {
    if (urlParts.length >= 3 && urlParts[1] === 'game') {
        clearChat();
        const gameNameParts = urlParts[2].split("-");
        const gameKey = gameNameParts[0];
        const roomUrl = urlParts[2];

        const joinRoomResponse = await fetch(`/gameUrl/${roomUrl}/${username}`);
        const joinRoomData = await joinRoomResponse.json();

        if (!joinRoomData.message.includes('successfully')) {
            console.error(joinRoomData);
            return;
        }

        const checkRoomInterval = setInterval(async function (){
            const gameLaunchResponse = await fetch(`/game-wait/game/${roomUrl}`);
            const gameLaunchData = await gameLaunchResponse.json();

            if (gameLaunchData.message.includes("successfully")) {

                clearInterval(checkRoomInterval);

                const gameUIResponse = await fetch(`/games-info?${gameKey}=html,css,js`);
                const gameUIData = await gameUIResponse.json();
                loadGameUI(gameUIData);
            }
        }, 1000);
    }
}

function mayjoinroom() {
    const gameRedirectData = localStorage.getItem('gameRedirect');
    if (gameRedirectData) {
        const urlParts = JSON.parse(gameRedirectData);
        joinGameRoom(urlParts);
        localStorage.removeItem('gameRedirect');
    } else {
        fetchGames();
    }
}

document.querySelector("#logout").addEventListener('click', () => {
    cookies.delete(username);
})
