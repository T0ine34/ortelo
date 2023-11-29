# SAE-S3.A.01-2023-sujet02


## Description
This project is a part of the SAE-S3.A.01-2023 course at IUT AIX-MARSEILLE. It is a web application that allows students to play online together. We have a some games avaliable, and we can add more games in the future. The application is made with Socket.io, Node.js, Express and SqLite.


## Installation
To isntall the server, you need to :
- get the lastest release
- extract the files
- run `npm install` in the root folder
- run `npx nodemon server.js` in the root folder
- that's it, the server is running on port 3000

To connect to it as a client, you need to :
- go to the server's ip address on port 3000
- that's it, you are connected to the server

### Create documentation
To create the documentation, you need to run the following command in the root folder :

`npx jsdoc -c jsdoc.config`

> Note that jsdoc was installed with the `npm install` command, so you don't need to install it again.

Then,
the documentation will be created in the `./docs` folder as an aggregate of html files.

## Add a game
To add a game, you need to :
- Download it from lastest release ***not avaliable for now***
- Put it into `./games` folder
- Restart the server

## Create a new game
To create a new game, you need to :
- Create a folder which will contain all your game's files
- Add all your game's files (e.g index.html, script.js) </br>
Now your folder should approximately look like this:
```
game
|   index.html
│
└───scripts
|   |   main.js
│   
└───images
|   │   sprite1.png
|   │   sprite2.png
|   |   icon.png
|
└───sounds
|   |   music.mp3
|
└───stylesheets
|   |   style.css
```
- Inside your game folder, make a file named index.json and edit it so it looks like this :
```json
{
    "name": "YourGameName",
    "version": "0.0.1",
    "description": "Your Description Here",
    "mainscript": "yourmainscript.js",
    "html": "yourhtmlfile.html",
    "css": "yourstylesheet.css"
}
```

### How to put images or sounds ?
- simply add this in your index.json :
```json
"images":{
    "icon":"images/icon.png",
    "sprite1" : "images/sprite1.png",
    "sprite2" : "images/sprite2.png"
},
"sounds":{
    "music" : "sounds/music.mp3"
}
```

Final result: 
```json
{
    "name": "YourGameName",
    "version": "0.0.1",
    "description": "Your Description Here",
    "mainscript": "yourmainscript.js",
    "html": "yourhtmlfile.html",
    "css": "yourstylesheet.css",
    "images":{
    "icon":"images/icon.png",
    "sprite1" : "images/sprite1.png",
    "sprite2" : "images/sprite2.png"
    },
    "sounds":{
        "music" : "sounds/music.mp3"
    }
}
```

- Zip every files in one archive named yourgamename.game </br>
Note that the archive should not contain your parent folder (game) </br> But should contain index.json and every other files/folders INSIDE the parent folder


## Support
If you are having issues, please let us know by opening an issue in the repository or contact us at
`antoine.buirey@etu.univ-amu.fr`

## Contributing
As this project is a school project, we don't accept any contribution. But you can fork the project and do whatever you want with it.

## Project status
Currently in development, we are working on the first release.