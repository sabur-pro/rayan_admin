# build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# runtime stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
RUN npm ci --production --legacy-peer-deps

# Добавляем установку typescript в runtime stage, используя флаг, чтобы избежать ERESOLVE ошибки при запуске.
# Next.js пытается установить его динамически, если не находит, и падает из-за конфликта зависимостей.
RUN npm install --save-exact --save-dev typescript --legacy-peer-deps

EXPOSE 3000
CMD ["npm", "run", "start", "--", "-p", "3000", "-H", "0.0.0.0"]
