all: image

test: server-test client-test

image: test build-image

server-test: 
	node test/server.js

client-test:
	node test/client.js

html-test:
	python test/html_checker.py

build-image:
	docker build -t s3a01 .

run-image:
	docker run -d -p 80:3000 -v s3a01_data:/data s3a01/main:latest