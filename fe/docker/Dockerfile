# build stage
FROM node:16-alpine as build-stage

ARG GITHUB_TOKEN
ENV GITHUB_TOKEN $GITHUB_TOKEN

WORKDIR /app

COPY package*.json ./
#COPY .npmrc ./

RUN npm install

COPY . .
RUN npm run copy-blinkid-sdk-ui
RUN npm run copy-blinkid-sdk-resources
RUN source docker/env-build.sh && npm run build

# production stage
FROM nginx:mainline-alpine as production-stage

ARG PORT
ENV PORT=${PORT:-8000}
## copy template over
COPY docker/nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY --from=build-stage /app/dist/index.html /usr/share/nginx/html/index.html.template
COPY docker/env-setup.sh /docker-entrypoint.d/40-env-setup.sh

RUN envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
RUN echo "$(cat /etc/nginx/conf.d/default.conf)"

EXPOSE ${PORT}
CMD ["nginx", "-g", "daemon off;"]

