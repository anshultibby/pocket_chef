FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies with legacy peer deps (might help with RC versions)
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 3000

# Use npx to ensure we're using the local installation
CMD ["npx", "next", "dev", "-p", "3000"]