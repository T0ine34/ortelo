# this dockerfile is used to build the deployment image for the server
# please note the produced image will not be in debug mode, and will not contain tests files

FROM alpine:3.18

# Install dependencies
RUN apk add nodejs npm

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY database/ database/
COPY game/ game/
COPY json_structures/ json_structures/
COPY server_modules/ server_modules/
COPY public/ public/
COPY package.deploy.json ./package.json
COPY server.deploy.config ./server.config
COPY server.js .

RUN npm install

# Expose port
EXPOSE 3000

# Start server
CMD [ "npm", "start" ]

# Build image
# docker build -t <image-name> .

# Run container
# docker run -p 3000:3000 <image-name>

# Run container in background
# docker run -d -p 3000:3000 <image-name>

# Run container in background with name
# docker run -d -p 3000:3000 --name <container-name> <image-name>

# Stop container
# docker stop <container-name>