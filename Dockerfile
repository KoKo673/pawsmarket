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
# 1.30.7, not 1.27. The reason is the 2026 advisory batch, but NOT for the
# reason an earlier commit of mine claimed — that commit said CVE-2026-125283
# (`alias` + `try_files`) applied to us. It does not. F5's own wording is
# "try_files and alias directives WITH A MAP VARIABLE … regular expression
# captures in map and try_files". This config has `alias /var/www/media/`
# (a literal) and `try_files $uri =404` (no map, no captures), so the
# precondition is absent. Checked 2026-11-20: neither of our two `map` blocks
# feeds any alias/try_files/root.
#
# The HTTP/2 CVEs (123007, 123633) also cannot reach this server: origin
# listens on port 80 with no TLS and no `http2`, so HTTP/2 terminates at
# ArvanCloud's edge. Verified with `nginx -T` and a direct HTTP/1.1 request.
#
# What DOES justify the move: 1.27 is an unsupported branch. nginx.org lists
# 1.26.3 / 1.28.3 / 1.30.7 / 1.31.9 as current — 1.27.x has no release since,
# and F5's advisories carry "versions which have reached End of Technical
# Support (EoTS) are not evaluated". So 1.27.5 will not be evaluated against
# the next CVE either — it is not known-safe, it is unexamined. That is a
# better reason to leave it than any single CVE we can name.
#
# The FULL version, not `1.30-alpine`. Measured on the VPS 2026-11-20: the
# floating tag on the only reachable mirror resolves to nginx/1.30.6, one
# patch short of 1.30.7. A floating tag that looks patched is worse than one
# that is visibly old, because it reports success.
FROM nginx:1.30.7-alpine AS serve

# The config replaces the stock one. It is copied before the site so a config
# change does not invalidate the cached copy of dist/.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-main.conf /etc/nginx/nginx.conf
# The ArvanCloud edge list, included by nginx-main.conf. Deliberately not in
# conf.d/: that directory is glob-included, and this file holds `geo`, which
# is http-scope — pulling it in from both places defines the variable twice
# and nginx refuses to start. A config that does not start looks exactly like
# a site that is down.
COPY arvan-edge-ips.conf /etc/nginx/arvan-edge-ips.conf

# ── The assets directory is emptied first, on purpose ────────────────
#
# ── Measured 2026-11-23 ──────────────────────────────────────────────
# `COPY --from=build /app/dist /usr/share/nginx/html` MERGES into the
# base image's directory; it does not replace it. The nginx base already
# has that path (a 50x.html and index.html), so every build added its
# hashed chunks beside the previous ones instead of over them.
#
# The live container held 222 files for 72 distinct names — eight copies
# of SupportPage, eight of AdminSupportPage — all still served with
# `Cache-Control: immutable`, so a CDN keeps each dead version for a year.
#
# That is not only waste. A stale chunk that a cached index.html still
# names used to fall through to the SPA and get index.html with 200 — a
# module import that receives HTML, which reads as a blank screen.
#
# The removal is scoped to the site's own paths (`assets/` and the
# top-level bundles); nginx's stock error pages live elsewhere.
RUN rm -rf /usr/share/nginx/html/assets /usr/share/nginx/html/*.js \
           /usr/share/nginx/html/*.css
COPY --from=build /app/dist /usr/share/nginx/html

# nginx:alpine's entrypoint scripts already run as root and drop privileges for
# workers; nothing here needs to run as root at runtime.
EXPOSE 80

# The base image's CMD already starts nginx in the foreground. Declared here
# anyway so the container's behaviour is readable from this file without
# cross-referencing the image.
CMD ["nginx", "-g", "daemon off;"]
