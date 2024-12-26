FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies including postcss and tailwind
RUN npm cache clean --force && \
    npm install --no-cache postcss postcss-loader tailwindcss autoprefixer && \
    npm install --no-cache

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]