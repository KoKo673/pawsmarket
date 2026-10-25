# Frontend image: compile the SPA with Node, serve it with nginx.
#
# Two stages, and the split is the whole point. The build needs Node, a few
# hundred megabytes of dev dependencies, and TypeScript; the result needs none
# of that — it is a directory of static files. Copying only `dist/` across
# keeps the shipped image around 50MB instead of over a gigabyte, and leaves the
# toolchain out of what runs in production.
#
# Build with an explicit mode:
#
#   docker build --build-arg BUILT_FOR=production -t pawsmarket-frontend .
#
# and .env.production supplies VITE_BASE, VITE_HASH_ROUTER and
# VITE_API_BASE_URL. See the note on that file: for a single-domain VPS
# deployment the API base is empty (same origin) and the hash router is off.

# ── Stage 1: build ─────────────────────────────────────────────────
# node:22, not alpine. The build pulls native binaries — rolldown (vite's
# bundler) and oxlint — and each ships a musl build that is absent from a
# cached dependency tree often enough that `npm ci` on alpine becomes a
# coin flip. The build stage's size does not reach production anyway.
FROM node:22 AS build

# Explicit WORKDIR, and it is not decoration. The node images have no WORKDIR
# set, so `COPY` and `RUN` land in `/` — the build then writes `/dist` while
# the second stage copies `/app/dist`, and the failure reads as "dist not
# found" rather than as "you never said where to work". Measured: `npm run
# build` reported success in 4.1s and produced `/dist/assets/...`, and the
# image build died at the COPY with no hint as to why.
WORKDIR /app

# `npm ci`, not `npm ci --omit=dev`: the build needs TypeScript, vite and the
# React plugin, all of which are devDependencies. Pruning them here would
# produce an image that cannot compile the app it is supposed to serve.
#
# `--no-audit --no-fund` exist to keep the build log readable; they change
# nothing about the output.
#
# NPM_REGISTRY exists because the VPS cannot reach registry.npmjs.org at all:
# measured from the server, every request to it timed out at 15-25s, and the
# build died with ECONNRESET partway through `npm ci`. registry.npmmirror.com
# answered the same request in 2.1s. The default stays npmjs so a build
# anywhere else is unaffected; the VPS passes the mirror explicitly. The
# lockfile's `resolved` URLs point at npmjs, so npm still needs to rewrite
# them — `npm config set registry` in the same layer does that.
ARG NPM_REGISTRY=https://registry.npmjs.org
COPY package.json package-lock.json ./
RUN npm config set registry "$NPM_REGISTRY" \
 && npm ci --no-audit --no-fund

# Everything else, minus what .dockerignore removes. Copied after npm ci on
# purpose: dependencies change far less often than source, so this keeps the
# expensive layer cached across ordinary code edits.
COPY . .

# Vite reads .env.production for mode=production and bakes the values into the
# bundle, so an argument is not strictly needed — but making the target
# explicit documents that this image is built for one deployment shape and
# would need a different .env for another.
ARG BUILT_FOR=production
ENV VITE_BUILD_TARGET=$BUILT_FOR

# `npm run build` is `tsc -b && vite build`: a type error fails the build
# rather than shipping a bundle that only fails at runtime.
RUN npm run build

# ── Stage 2: serve ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS serve

# The config replaces the stock one. It is copied before the site so a config
# change does not invalidate the cached copy of dist/.
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

# nginx:alpine's entrypoint scripts already run as root and drop privileges for
# workers; nothing here needs to run as root at runtime.
EXPOSE 80

# The base image's CMD already starts nginx in the foreground. Declared here
# anyway so the container's behaviour is readable from this file without
# cross-referencing the image.
CMD ["nginx", "-g", "daemon off;"]
