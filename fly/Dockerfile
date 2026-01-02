# Build Caddy with Souin cache plugin
FROM caddy:2-builder AS builder

RUN xcaddy build \
    --with github.com/darkweak/souin/plugins/caddy

# Runtime image
FROM caddy:2-alpine

COPY --from=builder /usr/bin/caddy /usr/bin/caddy
COPY Caddyfile /etc/caddy/Caddyfile
