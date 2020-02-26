FROM node:10.8-alpine

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python

RUN npm install --global yarn@1.7.0

WORKDIR /app
COPY yarn.lock ./
COPY package.json ./
RUN yarn --dev

COPY services ./services
COPY index.js ./
COPY translations.js ./

CMD ["yarn", "start"]
