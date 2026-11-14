#!/usr/bin/env bash
# Runs the CI gates on a machine that has no Node installed.
#
# ── Why this file exists ──────────────────────────────────────────
# Node is not installed on the operator's Windows machine. That meant
# `npm run check:routes` and `npm run check:skills` — the two gates that
# guard the highest-cost failure modes in this project — could only ever
# run in CI. "It passes in CI" is not the same as "it passes here": a
# route can be added to App.tsx and nginx locally, pushed, and only be
# discovered as broken after the push. The whole point of a gate is to
# fail before that.
#
# So they run in `node:22-slim` instead. Same major version CI pins, so
# the results cannot diverge. The image is local already (it is also
# what the frontend build uses).
#
# Usage:
#   bash scripts/gate.sh            # both gates
#   bash scripts/gate.sh routes     # just one
#   bash scripts/gate.sh skills
#
# Exit code is the first gate's failure, so it drops into a pre-push
# hook or a `make check` unchanged.

set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# The skill audit reads the sibling backend repo for its digit-map
# check, so the MOUNT has to be the parent, not this repo. Mounting
# only this repo made that check silently report "skipped".
PARENT="$(cd "$REPO/.." && pwd)"
NAME="$(basename "$REPO")"
IMAGE="${NODE_IMAGE:-node:22-slim}"

if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
    echo "gate: pulling $IMAGE (first run only)" >&2
    docker pull "$IMAGE" >/dev/null || {
        echo "gate: cannot pull $IMAGE — is Docker running?" >&2
        exit 2
    }
fi

run_gate() {
    local script="$1" name="$2"
    echo "── $name"
    # -v: mount the parent so ../pawsmarket-serverdash is visible.
    # MSYS_NO_PATHCONV keeps Git Bash from rewriting /w into C:/w on Windows.
    MSYS_NO_PATHCONV=1 docker run --rm \
        -v "$PARENT:/w" \
        -w "/w/$NAME" \
        "$IMAGE" node "$script"
    return $?
}

want="${1:-all}"
rc=0

if [ "$want" = "all" ] || [ "$want" = "routes" ]; then
    run_gate scripts/check-route-parity.mjs "Route parity (App.tsx ↔ nginx)" || rc=$?
fi

if [ "$want" = "all" ] || [ "$want" = "skills" ]; then
    run_gate scripts/skill-audit.mjs "Skill checklist audit" || rc=$?
fi

if [ "$rc" -eq 0 ]; then
    echo "gate: all checks passed"
else
    echo "gate: FAILED (exit $rc)" >&2
fi
exit "$rc"
