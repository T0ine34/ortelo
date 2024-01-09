test: server-test client-test

server-test: 
	node test/server.js

client-test:
	node test/client.js