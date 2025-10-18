FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p app/routes/uploads

# Expose port
EXPOSE 8000

# Start the application
CMD ["node", "server.js"]