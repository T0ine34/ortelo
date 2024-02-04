import { CSocket, EVENTS } from "./modules/events/main.js";
import { cookies } from "./modules/cookies/main.js";

// Required to put data in user's clipboard.
new ClipboardJS('.urlShareButton');

// Defines the maximum size for chat history
const MAX_HISTORY_SIZE = 100;

/*
    Checks if the user is already logged.
    If the user is not logged, they will be redirected to the login page.
*/
let username;
if(cookies.exists("username")){
    username = cookies.get("username");
    console.info("username read from cookies : " + username);
} else {
    console.info("username not found in cookies");
    location.href = "connection.html"; // Will redirect user to log in page
}

/*
    Defines the socket associated to the current user.
    This allows communication between the server and the user.
*/
let csocket = window.csocket = new CSocket(io());


/*
    Client sends a message to the server
    Telling the username taken.
*/
csocket.emit(EVENTS.MISC.USERNAME, Date.now(), username);  


/*
    Client listens for the event of a user joining the chat.
    Then sends a join message in chat.
*/
csocket.on(EVENTS.CHAT.USER_JOIN, (timestamp, name) => {                                //catching the newUser event, triggered by the server when a new user joins the chat
    receive_message(timestamp, "Information", name + " a rejoint le chat !"); //&#128075; = emoji "person raising hand"
});


/*
    Client listens for the event of a user sending a message
    Then sends it to the chat list.
*/
csocket.on(EVENTS.CHAT.MESSAGE, (timestamp, _username, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
    receive_message(timestamp, _username, msg);
});

csocket.on(EVENTS.CHAT.SERVER_MESSAGE, (timestamp, msg) => {                           //catching the new_message event, triggered by the server when a user sends a message
    receive_server_message(timestamp, msg);
});

csocket.on(EVENTS.ROOM.USER_JOINED, (timestamp, _roomname, _username) => {                   //catching the new_message event, triggered by the server when a user sends a message
    if(_roomname == "general"){
        receive_message(timestamp, "Information", _username + " a rejoint le chat !");
    }
    else{
        receive_message(timestamp, "Information", _username + " a rejoint la partie !");
    }
});

/*
    Client listens for the event of a user leaving the chat
    Then sends a leave message in chat.
*/
csocket.on(EVENTS.CHAT.USER_LEFT, (timestamp, _username) => {                   //catching the new_message event, triggered by the server when a user sends a message
    receive_message(timestamp, "Information", _username + " a quitté le chat !"); //&#128078; = emoji "person leaving"
});


/*
    Client listens for the event of a system error
    Then sends the error message in chat.
*/
csocket.on(EVENTS.SYSTEM.ERROR, (timestamp, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
    receive_message(timestamp, "Error", msg);
});


/*
    Client listens for the event of a system warning
    Then sends the warning message in chat.
*/
csocket.on(EVENTS.SYSTEM.WARNING, (timestamp, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
    receive_message(timestamp, "Warning", msg);
});


/*
    Client listens for the event of a broadcast message
    Then sends the broadcast message in chat.
*/
csocket.on(EVENTS.SYSTEM.BROADCAST, (timestamp, msg) => {              //catching the new_message event, triggered by the server when a user sends a message
    receive_message(timestamp, "General Information", msg);
});


/*
    Client listens for the event of a system info
    Then sends the info message in chat.
*/
csocket.on(EVENTS.SYSTEM.INFO, (timestamp, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
    receive_message(timestamp, "Information", msg);
    mayjoinroom();
});


// Gets the form elements to send a message in chat.
let form = document.querySelector('#message_form');
let messages = document.querySelector('#messages');
let input = document.querySelector('#sendMessage');


// Defines an empty array of chat history.
let history = [];
let history_index = 0;


// Sets the message input to the previously sent message.
function history_up(){
    if(history_index > 0){
        history_index--;
        input.value = history[history_index];
    }
}


// Sets the message input to the next sent message.
function history_down(){
    if(history_index < history.length){
        history_index++;
        if(history_index == history.length){
            input.value = "";
        } else{
            input.value = history[history_index];
        }
    }
}


// Listens to the key event when writing in message input.
input.addEventListener('keydown', function(e) {
    if(e.keyCode == 38){ //arrow up
        history_up();
    }
    else if(e.keyCode == 40){ //arrow down
        history_down();
    }
});


/*
    Listens for the message form submit action.
    This will be triggered when the user clicks on the send button.
*/
form.addEventListener('submit', function(e) {
    e.preventDefault();
    // Checks if the message input is empty or not.
    if (input.value){
        /* 
            Client tells the server that they sent a message (EVENTS.CHAT.MESSAGE), 
            at the current date, with the username and the message content.
        */
        csocket.emit(EVENTS.CHAT.MESSAGE, Date.now(), username, input.value);
        
        // Adds sent message to the chat history.
        history.push(input.value);
        history_index = history.length;

        /*
            Removes first element of chat history if current size
            is higher than the maximum size.
        */
        while(history.length > MAX_HISTORY_SIZE){
            history.shift();
        }

        // Clears message input.
        input.value = '';
    }
});


/*
    Converts a number into a string representation.
    Minimum length will be the number of 0 added before.
    Example: number = 15, min_length = 4
        Output: 0015
*/
function format_number(number, min_length){
    let str = number.toString();
    while(str.length < min_length){
        str = "0" + str;
    }
    return str;
}


/*
    Converts a timestamp to a string representation.
    Example: timestamp = 1705411105
        Output: 14:18:25
*/
function format_date(timestamp){
    let d = new Date(timestamp);
    return format_number(d.getHours(), 2)+":"+format_number(d.getMinutes(), 2)+":"+format_number(d.getSeconds(), 2);
}


/* 
    Formats a received message to its <li> tag representation
    Example: timestamp = 1705411439, _username = Lila, msg = "Bonjour"
        Output: <li class="message_item me">
        <span class="username">Lila</span>
        <div class="message">Bonjour</div>
        <span class="date>14:23:59</span>
        </li>
*/
function format_message(timestamp, _username, msg){
    // Creates the four elements needed for our formatted message
    let item = document.createElement('li');
    let sender = document.createElement('span');
    let message = document.createElement('div');
    let date = document.createElement('span');
    
    // Adds "message_item" the <li> tag class list.
    item.classList.add('message_item');

    // Sets the sender span text to the username
    // Sets the sender span class to "username" then appends the sender span to our <li> tag
    sender.textContent = _username;
    sender.classList.add('username');
    item.appendChild(sender);
    
    // Sets the content of the message div
    // Sets the message div class to "message" then appends the message div to the <li> tag
    if (_username == "Système"){
        message.innerHTML = msg;
    } else{
        message.textContent = msg;
    }
    message.classList.add('message');
    item.appendChild(message);

    // Sets the date span content to formatted timestamp
    // Sets class for date span to "date" and appends the date span to the <li> tag
    date.textContent = format_date(timestamp);
    date.classList.add('date');
    item.appendChild(date);

    // Adds class "me" or "other" to the <li> tag depending on whether username is same as users or not.
    if(_username == username){
        item.classList.add('me');
    } else{
        item.classList.add('other');
    }
    return item;
}


/*
    Formats the received message data
    then adds it to the messages list and scrolls the view to the bottom.
*/
let receive_message = (timestamp, username, msg) => {
    let item = format_message(timestamp, username, msg);
    messages.appendChild(item);
    item.scrollIntoView();
}

let receive_server_message = (timestamp, msg) => {
    let item = format_message(timestamp, "Système", msg);
    messages.appendChild(item);
    item.scrollIntoView();
}


// Clears the chat.
function clearChat() {
    messages.innerHTML = '';
    let chatTitle = document.querySelector('.title');
    if (chatTitle) {
        chatTitle.textContent = 'Discussion du jeu';
    }
}


/**
 * Fetches game information and populates the game container.
 * Sends a GET request to '/games-info' with query parameters for 'name' and 'icon'.
 * On success, each game is displayed in the 'gamesContainer' element.
 * Each game item is clickable and triggers the PlayGame function.
 */
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
        console.error('Erreur lors du chargement des jeux: ', error);
    });
}


/**
 * Initiates the process to play a game.
 * Clears the chat, fetches the game details (HTML, CSS, JS), and sets up the game UI.
 * Starts the game by making a request to '/game-start' and sets up the room waiting UI.
 *
 * @param {string} name - The name of the game to be played.
 */
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
        .then(async startData => {

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

            let urlQrCode = document.querySelector('#roomUrlQrCode');
            let qrResponse = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=%22${shareUrl}%22&format=svg`);
            if(qrResponse.ok) {
                let responseText = await qrResponse.text();
                urlQrCode.innerHTML = responseText;
            } 

            roomWaitContainer.style.display = 'flex';
            waitingScreen.style.display = 'block';
            shareButton.style.display = 'inline-block';
            roomUrlbrute.style.display = 'block';
            urlQrCode.style.display = 'flex';

            new ClipboardJS('.urlShareButton', {
                text: function () {
                    return shareUrl;
                }
            });

            shareButton.addEventListener('click', function () {
                this.classList.add('clicked');
                let originalText = this.textContent;
                this.textContent = 'Copié!';
                setTimeout(() => {
                    this.classList.remove('clicked');
                    this.textContent = originalText;
                }, 1000);
            });
            csocket.on(EVENTS.GAME.START, (timestamp) => {
                if (timestamp) {
                    fetch(`/game-wait/${startData.roomUrl}`)
                        .then(gameLaunchResponse => gameLaunchResponse.json())
                        .then(gameLaunchData => {
                            if (gameLaunchData.message.includes("started successfully")) {
                                roomWaitContainer.style.display = 'none';
                                waitingScreen.style.display = 'none';
                                shareButton.style.display = 'none';
                                roomUrlbrute.style.display = 'none';
                            }
                        });
                }
            });
        })
}


/**
 * Loads the game UI into the games container.
 * Decodes and injects HTML, CSS, and JS for the game.
 *
 * @param {object} game - An object containing the game's HTML, CSS, and JS data.
 */
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


/**
 * Joins a game room based on the URL parts provided.
 * Clears the chat and checks if the URL is valid for joining a game room.
 * On success, sets up the UI for the game room.
 *
 * @param {array} urlParts - The parts of the URL, split by '/'.
 */
async function joinGameRoom(urlParts) {
    if (urlParts.length >= 3 && urlParts[1] === 'game') {
        clearChat();
        const gameNameParts = urlParts[2].split("-");
        const gameKey = gameNameParts[0];
        const roomUrl = urlParts[2];

        const joinRoomResponse = await fetch(`/gameUrl/${roomUrl}/${username}`);
        const joinRoomData = await joinRoomResponse.json();
        if (joinRoomData.message.includes(("You are already in the room"))) {
            let htmlContent = '<html><body><h1>Error</h1><p>' + joinRoomData.message + '</p></body></html>';
            document.open();
            document.write(htmlContent);
            document.close();
        }
        if (!joinRoomData.message.includes('successfully')) {
            console.error(joinRoomData);
            return;
        }

        const checkRoomInterval = setInterval(async function (){
            const gameLaunchResponse = await fetch(`/game-wait/game/${roomUrl}`);
            const gameLaunchData = await gameLaunchResponse.json();

            if (gameLaunchData.message.includes("already running successfully")) {

                clearInterval(checkRoomInterval);

                const gameUIResponse = await fetch(`/games-info?${gameKey}=html,css,js`);
                const gameUIData = await gameUIResponse.json();
                loadGameUI(gameUIData);
            }
        }, 1000);
    }
}


/**
 * Checks if the user should be redirected to a game room.
 * If 'gameRedirect' data is present in localStorage, tries to join the game room.
 * Otherwise, fetches the games to populate the games list.
 */
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

// Listens to logout button click to remove user from cookies
/**
 * Adds an event listener to the logout button.
 * On click, deletes the 'username' cookie and redirects to the homepage.
 */
document.querySelector("#logout").addEventListener('click', () => {
    cookies.delete("username");
    window.location.href = "";
})
