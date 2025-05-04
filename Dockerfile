FROM cypress/browsers:node18.12.0-chrome107-ff107

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["node", "server.js"]