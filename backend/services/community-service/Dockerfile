FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache postgresql-client

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN mkdir -p uploads

EXPOSE 3002

CMD ["npm", "start"]
