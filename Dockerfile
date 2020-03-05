FROM node:12-alpine

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python

WORKDIR /app
COPY yarn.lock ./
COPY package.json ./
RUN yarn --dev

COPY services ./services
COPY index.js ./
COPY translations.js ./

CMD ["yarn", "start"]
