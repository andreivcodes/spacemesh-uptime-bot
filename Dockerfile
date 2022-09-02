FROM node:16-alpine

RUN apk update

COPY . ./app

WORKDIR /app

RUN yarn

CMD [ "yarn", "start" ]