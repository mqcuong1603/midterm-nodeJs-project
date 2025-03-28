FROM node:18-alpine as build
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Pass API URL as build argument - change to relative URL
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from 'build' stage
COPY --from=build /app/build /usr/share/nginx/html

# Add the custom nginx config
COPY frontend-nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]