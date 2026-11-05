FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html ./index.html
COPY vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY src ./src
COPY public ./public

ENV VITE_API_BASE_URL=http://localhost:8000
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
