# this dockerfile is used to build the deployment image for the server
# please note the produced image will not be in debug mode, and will not contain tests files

FROM alpine:3.18

# Install dependencies
RUN apk add nodejs npm

# Install python3 to run database update script
RUN apk add --no-cache python3
RUN apk add --no-cache py3-pip
RUN pip3 install json5

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY database/ database/
COPY json_structures/ json_structures/
COPY server_modules/ server_modules/
COPY public/ public/
COPY package.deploy.json ./package.json
COPY server.deploy.config ./server.config
COPY server.js .
COPY launcher.js .
COPY building/database.py ./building/database.py
COPY building/config.py ./building/config.py

# Install app dependencies
RUN npm install

RUN node obfusc.js

# Expose port
EXPOSE 3000

# Start server
CMD [ "node", "launcher.js" ]
