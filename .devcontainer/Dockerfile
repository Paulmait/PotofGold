# Use Node 16 for Expo/React Native compatibility
FROM mcr.microsoft.com/devcontainers/javascript-node:16

# Install Expo CLI globally
RUN npm install -g expo-cli

# Set working directory
WORKDIR /workspaces/potofgold

# Install dependencies (will run again in postCreateCommand)
COPY package.json package-lock.json* ./
RUN npm install || true

# Expose Expo ports
EXPOSE 19000 19001 19002
