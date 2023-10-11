FROM node:lts-alpine
RUN npm i -g pnpm
ENV APP_NAME="Simple Directory Observer"

WORKDIR /app

COPY . .

RUN pnpm install
RUN pnpm build

CMD ["pnpm", "start"]