ARG NODE_VERSION=19
FROM node:${NODE_VERSION}-alpine

RUN apk add --no-cache git

RUN mkdir /app && adduser -u 1005 -D user && chown 1005 /app
WORKDIR /app
COPY --chown=1005 . /app
USER 1005

ENV NODE_ENV=development
RUN npm install

CMD npm start
