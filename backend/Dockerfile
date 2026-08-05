FROM node:20-bullseye

# Install compilers and runtimes for the code sandbox (Host Mode)
RUN apt-get update && apt-get install -y \
    g++ \
    gcc \
    python3 \
    golang \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and generate Prisma client
COPY . .
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose the API port
EXPOSE 5000

# Ensure host mode is enforced since Docker-in-Docker is restricted on Render
ENV MODE=host
ENV PORT=5000

# Start the Node.js server
CMD ["npm", "run", "start"]
