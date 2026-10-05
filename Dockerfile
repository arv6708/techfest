FROM node:22-bookworm-slim AS base
WORKDIR /app

# Install native compilation dependencies for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy all source files
COPY . .

# Ensure no host/Windows build artifacts exist
RUN rm -rf node_modules .next data/*.db-shm data/*.db-wal

# Clean install and rebuild native dependencies for Linux x64
RUN npm ci
RUN npm rebuild better-sqlite3 --build-from-source

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Standalone mode requires static files, public directory, and native modules
RUN cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
RUN cp -r node_modules/better-sqlite3 .next/standalone/node_modules/

# Configure database persistence, networking and port
ENV DATA_DIR="/app/data"
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000

CMD ["node", ".next/standalone/server.js"]

