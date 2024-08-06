FROM node

WORKDIR /app/Authentication

COPY package.json .

RUN npm install

COPY . .

EXPOSE 8002

CMD ["npm", "start"]

