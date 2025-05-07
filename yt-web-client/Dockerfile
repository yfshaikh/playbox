# Stage 1: Build stage
FROM node:18 AS builder

# Accept build-time environment variables
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG MUX_TOKEN_ID
ARG MUX_TOKEN_SECRET

# Inject them as real env vars (optional for consistency)
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV MUX_TOKEN_ID=$MUX_TOKEN_ID
ENV MUX_TOKEN_SECRET=$MUX_TOKEN_SECRET

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 🔥 Build will fail if env vars are missing here
RUN npm run build


# Stage 2: Production stage
FROM node:18
WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000

CMD ["npm", "start"]
