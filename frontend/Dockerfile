FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps flag to avoid conflicts
RUN npm install --legacy-peer-deps

# Copy the rest of the code
COPY . .

# Build the app to verify all dependencies are present
RUN npm run build

# Set permissions for node_modules
RUN chown -R node:node /app/node_modules

# Expose port
EXPOSE 3000

# Start the app in dev mode
CMD ["sh", "-c", "npm install --legacy-peer-deps && npm run dev"]