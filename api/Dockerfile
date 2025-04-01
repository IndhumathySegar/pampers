FROM node:18-alpine

WORKDIR /backend

COPY ./package*.json ./

RUN npm i -g npm@8.19.3 && \
    npm install\
    && npm install typescript@4.3.2 -g

COPY . .

RUN tsc

ENV NODE_ENV=PROD

EXPOSE 7071

CMD ["npm", "start"]
