# creating a base image of node
FROM node:20-alpine

# Sets working directory inside container.
WORKDIR /app

# Copy package files (package.json, package-lock.json)
COPY package*.json ./

# installing dependecy exact version (exluding dev dependencies)
RUN npm ci --only=production

# Copies files from local machine → container.
COPY . .

# metdata or documentation layer
EXPOSE 8000

# Runs when container starts.
CMD ["npm", "run", "dev"]