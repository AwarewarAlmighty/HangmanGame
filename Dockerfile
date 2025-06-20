# Stage 1: Build the Expo for Web application
FROM node:18-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies reliably
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Run the build script we added to package.json
# This will execute "expo export -p web" and create a 'dist' folder
RUN npm run build

# Stage 2: Serve the application from a lightweight web server
FROM nginx:1.27-alpine

# Copy the nginx configuration file
# This file is still needed for single-page app routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# --- IMPORTANT CHANGE HERE ---
# Copy the build output from the 'dist' directory (Expo's output folder)
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 to the outside world
EXPOSE 80

# Command to run nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]