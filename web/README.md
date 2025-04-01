# Metronic Angular

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.7.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build:
### Run below command to build based on environment

#### prod
Run `npm run build`

#### QA
Run `npm run build:qa`

#### staging
Run `npm run build:staging`

#### steps for deployment

1. build image
`
docker build -t pampers-portal-v2-web -f Dockerfile.staging .
`

2. tag the image
`
docker tag pampers-portal-v2-web npatel20acr.azurecr.io/pampers-portal-v2-web
`

3. push image to azure container registry
`
docker push npatel20acr.azurecr.io/pampers-portal-v2-web
`
cypress refs

1. https://www.cypress.io/blog/2017/11/28/testing-vue-web-application-with-vuex-data-store-and-rest-backend/#api-testing
2. https://github.com/cypress-io/cypress-realworld-app/blob/develop/cypress/global.d.ts
3. https://crazytesting.pl/30-days-with-cypress-day19-user-role-based-api-tests/
4. https://www.codota.com/code/javascript/functions/cypress/add
5. 