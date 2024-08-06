FROM node

WORKDIR /app/Gateway

COPY package.json .

RUN npm install

COPY . .

EXPOSE 8000

CMD ["npm", "start"]

