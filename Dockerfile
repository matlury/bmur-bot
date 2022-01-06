FROM public.ecr.aws/lambda/nodejs:14

RUN npm install -g yarn

WORKDIR /app
COPY yarn.lock ./
COPY package.json ./
COPY tsconfig.json ./
RUN yarn

COPY src ./src

RUN yarn build

CMD ["/app/build/index.handler"]
