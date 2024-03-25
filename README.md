# SAE-S3.A.01-2023-sujet02


## Description

This project is a part of the SAE-S3.A.01-2023 course at IUT AIX-MARSEILLE. It is a web application that allows students to play online together. We have a some games avaliable, and we can add more games in the future.

## Documentation

the documentation is available in [here](https://etulab.univ-amu.fr/sae-s3.a.01-2023/sae-s3.a.01-2023-sujet02/-/wikis)

### Technologies used


- [Node.js](https://nodejs.org/en/)
- [Express](https://expressjs.com/) for the http server
- [Socket.io](https://socket.io/)   for the websocket server
- [SqLite](https://www.sqlite.org/index.html) for the database
- [JSDoc](https://jsdoc.app/) for the documentation
- [Docker](https://www.docker.com/) for the deployment
- [Bcrypt](https://www.npmjs.com/package/bcrypt) for the password encryption
- [unit-test](https://www.npmjs.com/package/unit-test) for the tests
- [Selenium](https://www.selenium.dev/) for the end-to-end tests



## Installation

### Install the server

#### Using node.js

To install the server, you need to :
- get the latest release
- extract the files
- run `npm install` in the root folder
- run `npm run start` in the root folder
- that's it, the server is running on port 3000

#### Using docker_cli

A docker image is avaliable on docker hub. To install the server, you need to :
- run `docker pull s3a01/main:latest` to get the image
- run `docker run -p 3000:3000 -v s3a01-data:/data s3a01/main:latest` to run the image
> you can change the port 3000 to any port you want, this is the port the client will connect to
- that's it, the server is running on port 3000

#### Using docker desktop

A docker image is avaliable on docker hub. To install the server, you need to :
- search for the image `s3a01/main:latest` on docker hub
- run the image, paying attention to:
    - redirect the port 3000 to a port on your machine (the client will connect to this port)
    - mount a volume to the `/data` folder (this is where the database will be stored)
- that's it, the server is running on the port you chose


---
### Create documentation

#### HTML documentation
To create the documentation, you need to run the following command in the root folder :

`npx jsdoc -c jsdoc.config`

> Note that jsdoc was installed with the `npm install` command, so you don't need to install it again.

Then,
the documentation will be created in the `./docs` folder as an aggregate of html files.


#### Markdown documentation

To create the documentation in markdown, you need to run the following command in the root folder :

`make doc`

> You need to have `make` installed on your machine to run this command.

Then,
the documentation will be created in the `./mdDocs` folder as an aggregate of markdown files, including the README.md file.

## Run the tests
To run the tests, you need to run the `make test` command in the root folder.

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
| index.html
│
├───┐ scripts
|   |   main.js
│   
├───┐ images
|   │   sprite1.png
|   │   sprite2.png
|   |   icon.png
|
├───┐ sounds
|   |   music.mp3
|
└───┐ stylesheets
    |   style.css
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


## Contributing
The people that worked in this project are : </br>
Antoine BUIREY - Product Owner </br>
Lila BRANDON - Scrum Master </br>
Tom DIEZ - Developper </br>
Jébril BOUFROUR - Developper </br>
Tanguy HORARD - Developper </br>

Everyone that participated in the project is following a computer science bachelor focused on application creation and project management.

## Project status
Currently in development, we are working on the first release.