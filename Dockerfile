FROM node:14.10.1

# Create and change to the app directory.
WORKDIR /app

COPY package*.json ./

RUN npm install

# Copy local code to the container image.
COPY . ./

CMD ["npm", "run", "startDev"]
