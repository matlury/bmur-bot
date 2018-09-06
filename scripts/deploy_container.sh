#!/bin/bash
echo "Pushing container image to registry.tko-aly.fi"
docker login registry.tko-aly.fi -username=$DEPLOY_USERNAME --password=$DEPLOY_PASSWORD
docker build . -t eventbird-tg
docker tag eventbird-tg:latest registry.tko-aly.fi/eventbird-tg:latest
docker push registry.tko-aly.fi/eventbird-tg:latest