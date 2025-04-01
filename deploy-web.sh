#! /bin/bash

echo "deploying WEB...."
cd web
pwd

echo "building image..."
docker build -t pampers-portal-web -f Dockerfile.staging .
echo "tagging image..."
docker tag pampers-portal-web npatel20acr.azurecr.io/pampers-portal-web
echo "push image to azure container registry"
docker push npatel20acr.azurecr.io/pampers-portal-web
echo "Portal deployment: done.."
