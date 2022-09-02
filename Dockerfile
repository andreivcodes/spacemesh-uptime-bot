FROM node:16-alpine

# update packages
RUN apk update

COPY . ./app

# create root application folder
WORKDIR /app

RUN yarn

CMD [ "yarn", "start" ]