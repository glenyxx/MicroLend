# Stage 1: Build the React app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Build for production — outputs to /app/dist
RUN npm run build

# Stage 2: Serve with Nginx
# We don't need Node.js to serve a built React app — Nginx is much lighter
FROM nginx:alpine
# Copy built files to Nginx's web root
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy our Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]