FROM node:16-alpine

# update packages
RUN apk update
RUN apk add git

COPY . ./app

# create root application folder
WORKDIR /app

RUN yarn

CMD [ "node", "yarn start" ]