FROM node:18-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps flag
RUN npm install --legacy-peer-deps

# Rebuild the source code only when needed
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set permissions for node_modules
RUN chown -R node:node /app/node_modules

# Expose port
EXPOSE 3000

# Set default env var for LOCAL_IP (can be overridden by docker-compose)
ENV NEXT_PUBLIC_LOCAL_IP=localhost

# Start the app in dev mode
CMD ["npm", "run", "dev"]