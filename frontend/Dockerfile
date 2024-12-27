FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps flag to avoid conflicts
RUN npm install --legacy-peer-deps

# Copy the rest of the code
COPY . .

# Set permissions for node_modules
RUN chown -R node:node /app/node_modules

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "dev"]