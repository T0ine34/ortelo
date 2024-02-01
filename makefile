ifeq ($(OS),Windows_NT)
	PYTHON = python
else
	PYTHON = python3
endif

all: image

test: server-test client-test

image: test build-image

server-test: 
	node test/server.js

client-test:
	node test/client.js

build-image:
	docker build -t s3a01 .

run-image:
	docker run -d -p 80:3000 -v s3a01_data:/data s3a01/main:latest


clear_games: #delete all .game files in public/commmon/games witch they are not a folder with the same name in game/
	$(PYTHON) building/game-clear.py


games: game/* clear_games #build all games
	$(PYTHON) building/game-assemble.py game

# generic rule for all games
%: game/%/*
	$(PYTHON) building/game-assemble.py --game game/$@