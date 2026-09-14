FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

RUN mkdir -p /app/uploads/resources/pdfs \
    /app/uploads/resources/videos \
    /app/uploads/resources/audios \
    /app/uploads/resources/images \
    /app/uploads/resources/others

COPY . .

EXPOSE 3003

CMD ["npm", "start"]
