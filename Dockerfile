FROM oven/bun:1 AS builder

WORKDIR /app

ARG EXPO_PUBLIC_API_URL=http://localhost:3000
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN bunx expo export -p web

FROM oven/bun:1 AS runtime

WORKDIR /app

COPY --from=builder /app/package.json /app/bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/types ./types
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/constants ./constants
COPY --from=builder /app/contexts ./contexts

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "backend/hono.ts"]
