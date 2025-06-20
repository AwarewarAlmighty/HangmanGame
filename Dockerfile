# Stage 1: Build the React application
FROM node:18-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Generate the production build, treating warnings as non-breaking.
RUN CI=false npm run build

# Generate the production build
RUN npm run build

# Stage 2: Serve the application from a lightweight web server
FROM nginx:1.27-alpine

# Copy the nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 to the outside world
EXPOSE 80

# Command to run nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]