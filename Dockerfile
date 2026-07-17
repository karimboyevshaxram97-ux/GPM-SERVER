FROM node:22-bookworm-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
# npm ci talab qiladigan qat'iy lock-fayl mosligi Windows'da generatsiya
# qilingan lock bilan Linux konteyner o'rtasida platformaga xos optional
# bog'liqliklar (masalan sharp/@emnapi/@opentelemetry) tufayli buziladi —
# npm install shu holatlarda joriy platforma uchun to'g'ri qaror qabul qiladi.
RUN npm install

FROM deps AS build

WORKDIR /app

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY apps ./apps

RUN npm run build:all && npm prune --omit=dev

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT_API=3007

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

RUN mkdir -p /app/uploads

EXPOSE 3007

CMD ["node", "dist/apps/gmp-api/main.js"]
