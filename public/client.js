let mydiv = document.createElement('div');
mydiv.id = 'usernameDiv'

let myForm = document.createElement('form')
myForm.id = 'usernameForm'
myForm.innerHTML = '<input id="usernameInput" autocomplete="on" placeholder="Choisir un pseudo" /><button>CHOISIR</button>'

mydiv.appendChild(myForm)
document.body.appendChild(mydiv);

myForm.addEventListener('submit', function(e){                      //this is triggered when the user click on "CHOISIR"
    e.preventDefault()
    let uin = document.querySelector("#usernameInput")
    if(!uin.value) return;
    myForm.style.display = 'none'
    let csocket = new CSocket(io());

    let username = uin.value
    csocket.emit(EVENTS.CHAT.USER_JOINED, username);                               //sending the newUser event to the server, with the username as parameter
    csocket.on(EVENTS.CHAT.USER_JOINED, (timestamp, name) => {                                //catching the newUser event, triggered by the server when a new user joins the chat
        let item = document.createElement('li');
        item.textContent = name + " a rejoint le chat ! ";
        item.innerHTML += "&#128075;"
        item.innerHTML += String(timestamp);
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    })

    csocket.on(EVENTS.CHAT.MESSAGE, (timestamp, username, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
        receive_message(timestamp, username, msg)
    })
    
    csocket.on(EVENTS.CHAT.USER_LEFT, (timestamp, username) => {                   //catching the new_message event, triggered by the server when a user sends a message
        let item = document.createElement('li');
        item.textContent = username + " a quitté le chat ! ";
        item.innerHTML += "&#128078;"
        item.innerHTML += String(timestamp);
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    });
    
    let form = document.querySelector('#message_form');
    let messages = document.querySelector('#messages');
    let input = document.querySelector('#send_message');
    
    form.addEventListener('submit', function(e) {                   //this is triggered when the user click on "Send"
        e.preventDefault();
        if (input.value) {
            csocket.emit(EVENTS.CHAT.MESSAGE, username, input.value);     //sending the send_message event to the server, with the username and the message as parameters
            input.value = '';
        }
    });
    
})


let receive_message = (timestamp, username, msg) => {
    let item = document.createElement('li');
    item.textContent = username + " : " + msg;
    let d = new Date(timestamp);
    item.innerHTML += "<span class=\"timestamp\">"+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"</span>";
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
}