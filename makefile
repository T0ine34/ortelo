test: server-test client-test

server-test: 
	node test/server.js

client-test:
	node test/client.js

build-image:
	docker build -t s3a01 .