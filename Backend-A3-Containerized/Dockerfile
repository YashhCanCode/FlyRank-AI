# Image for the Node.js API service.
FROM node:20-alpine

WORKDIR /app

# Install dependencies first so this layer is cached unless package files change.
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the application source.
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
