#!/bin/bash
echo "Pushing container image to registry.tko-aly.fi"
echo $DEPLOY_PASSWORD | docker login registry.tko-aly.fi -u $DEPLOY_USERNAME --password-stdin
docker build . -t eventbird-tg
docker tag eventbird-tg:latest registry.tko-aly.fi/eventbird-tg:latest
docker push registry.tko-aly.fi/eventbird-tg:latest