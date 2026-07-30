FROM node:22-alpine AS web-build
WORKDIR /build
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# for production
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY api/package*.json ./
RUN npm ci --omit=dev
COPY api/src ./src
COPY --from=web-build /build/dist ./public
EXPOSE 3000
USER node
CMD ["node", "src/index.js"]
