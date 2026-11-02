ARG RUNTIME_IMAGE=quay.io/officialkango/queen-riam-runtime:latest
FROM ${RUNTIME_IMAGE}

WORKDIR /app

RUN git clone --depth 1 --single-branch --branch main \
        https://github.com/Dev-Kango/Queen-Riam.git /app && \
    rm -rf /app/.git /app/.env && \
    npm install --production --legacy-peer-deps --ignore-scripts && \
    npm rebuild sharp && \
    mkdir -p tmp session data

ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000

CMD ["node", "index.js"]
