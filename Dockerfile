FROM node:14.10.1

# Create and change to the app directory.
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

CMD ["npm", "run", "start"]
