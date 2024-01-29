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

games: game/*
	$(PYTHON) building/game-assemble.py game

reversi: game/reversi/*
	$(PYTHON) building/game-assemble.py --game game/reversi

morpion: game/morpion/*
	$(PYTHON) building/game-assemble.py --game game/morpion