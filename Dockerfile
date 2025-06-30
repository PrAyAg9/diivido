# Use Node.js LTS version
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install all dependencies
RUN npm ci

# Copy backend source code
COPY backend/ .

# Build the TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["npm", "start"]
