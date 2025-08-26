# Base image with Node.js
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy source code
COPY . .

# Expose the server port (adjust if needed)
EXPOSE 3000

# Start the server
CMD ["node", "api/index.js"]
