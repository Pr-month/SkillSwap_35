# --- Этап 1: Сборка ---
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package.json и lock
COPY package*.json ./

# Устанавливаем зависимости строго по lock-файлу
RUN npm ci

# Копируем исходники
COPY . .

# Собираем NestJS
RUN npm run build


# --- Этап 2: Финальный образ ---
FROM node:20-alpine AS runner

# Production-окружение
ENV NODE_ENV=production

WORKDIR /app

# Копируем только необходимое для запуска
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Создаём non-root пользователя
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

USER appuser

# Порт NestJS
EXPOSE 3000

# Запуск backend
CMD ["node", "dist/main.js"]
