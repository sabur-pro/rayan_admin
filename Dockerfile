# build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
RUN OXIDE_VER=$(node -p "require('@tailwindcss/oxide/package.json').version") && npm install --no-save --legacy-peer-deps @tailwindcss/oxide-linux-x64-musl@$OXIDE_VER
COPY . .
RUN npm run build

# runtime stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
RUN npm ci --omit=dev --legacy-peer-deps
EXPOSE 3000
CMD ["npm", "start"]
