FROM browserless/chrome:latest

USER root  # ← Dòng này là mấu chốt

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]