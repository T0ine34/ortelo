ifeq ($(OS),Windows_NT)
	PYTHON = python
else
	PYTHON = python3
endif

all:
	@echo Usage:
	@echo 	make test		- run the server and client tests
	@echo 	make image		- build the docker image
	@echo 	make run-image 		- run the docker image
	@echo 	make server-test 	- run the server tests
	@echo 	make client-test 	- run the client tests
	@echo 	make end-to-end-test 	- run the end-to-end tests
	@echo 	make games		- build all games
	@echo 	make clear_games 	- delete all .game files in public/commmon/games witch they are not a folder with the same name in game/
	@echo 	make game_name 		- build a specific game
	@echo 	make doc		- generate the documentation

test: server-test client-test

image: test build-image

server-test: 
	node test/server.js

client-test:
	node test/client.js

html-test:
	$(PYTHON) test/html-tests.py public

end-to-end-test:
	$(PYTHON) test/end-to-end.py

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

doc:
	$(PYTHON) building/doc.py