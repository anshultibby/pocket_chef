FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies with explicit installation of postcss and tailwind
RUN npm cache clean --force && \
    npm install -g postcss postcss-cli && \
    npm install --no-cache

# Copy configuration files specifically
COPY postcss.config.js .
COPY tailwind.config.js .
COPY tsconfig.json .
COPY next.config.ts .

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]