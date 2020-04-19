FROM node:12-alpine

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python

WORKDIR /app
COPY yarn.lock ./
COPY package.json ./
RUN yarn --dev

COPY src ./
COPY migrations ./

CMD ["yarn", "start"]
