# Stage 1: Build
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Pass the API URL as a build argument if needed, 
# but usually it's better to use Vercel envs for static builds.
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
# Copy build files from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
