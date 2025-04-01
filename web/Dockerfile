FROM node:alpine AS builder
WORKDIR /app
COPY ./package*.json ./
RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python && \
  npm install --quiet node-gyp -g &&\
  npm install --quiet && \
  apk del native-deps
RUN npm i --force
COPY . .
RUN npm run build
FROM nginx

## Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

## copy over the artifacts in dist folder to default nginx public folder
COPY --from=builder /app/dist/ /usr/share/nginx/html
## override default conf with custom one
COPY ./config/nginx-custom.conf /etc/nginx/conf.d/default.conf

# docker build -t pampers-portal-web -f Dockerfile.staging . 
# docker run -p 8080:80 pampers-portal-web
