#! /bin/bash

echo "deploying API...."
cd api
pwd

echo "building image..."
docker build -t pampers-portal-api .
echo "tagging image..."
docker tag pampers-portal-api npatel20acr.azurecr.io/pampers-portal-api
echo "push image to azure container registry"
docker push npatel20acr.azurecr.io/pampers-portal-api
echo "api deployment: done.."
