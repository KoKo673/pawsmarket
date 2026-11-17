#!/usr/bin/env bash
# The project's gates, runnable on the operator's machine.
#
# ── The silent failure this replaces ──────────────────────────────
# This file used to open with "Node is not installed on the operator's
# Windows machine", and ran everything in `node:22-slim` because of it.
# That was wrong: Node has been at `.tools/node/node.exe` (v24.21.0,
# with npm) the whole time. Two months of gates and a10y audits were
# routed through Docker or deferred to CI over a binary that was on
# disk the entire time — and one of the scripts that was never run
# (`a11y_audit.mjs`) turned out to have been unparseable since the
# commit that removed its brand-colour exception.
#
# So: use the local Node when it exists, fall back to Docker when it
# does not. Both are checked, and the choice is printed, because "which
# runtime ran the gate" is exactly the fact that was assumed wrong.
#
# Usage:
#   bash scripts/gate.sh              # every gate
#   bash scripts/gate.sh routes
#   bash scripts/gate.sh skills
#   bash scripts/gate.sh lint
#   bash scripts/gate.sh types
#   bash scripts/gate.sh a11y         # needs a running server + Chrome
#
# Exit code is the first failure, so it drops into a pre-push hook.

set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# The skill audit reads the sibling backend repo for its digit-map check,
# so a Docker mount has to be the parent, not this repo. Mounting only
# this repo made that check silently report "skipped".
PARENT="$(cd "$REPO/.." && pwd)"
NAME="$(basename "$REPO")"
IMAGE="${NODE_IMAGE:-node:22-slim}"

# ── Pick a Node ───────────────────────────────────────────────────
# 1. NODE_BIN, for a caller that knows better.
# 2. .tools/node/node.exe in the parent dir — the one this project
#    ships with and the one playwright/vite/axe are installed against.
# 3. node on PATH.
# 4. Docker, last, because it cannot see the host's Chrome (a11y needs it).
NODE=""
if [ -n "${NODE_BIN:-}" ] && [ -x "$NODE_BIN" ]; then
    NODE="$NODE_BIN"
elif [ -x "$PARENT/.tools/node/node.exe" ]; then
    NODE="$PARENT/.tools/node/node.exe"
elif [ -x "$PARENT/.tools/node/node" ]; then
    NODE="$PARENT/.tools/node/node"
elif command -v node >/dev/null 2>&1; then
    NODE="$(command -v node)"
fi

run_node() {
    local script="$1" label="$2"
    echo "── $label"
    if [ -n "$NODE" ]; then
        ( cd "$REPO" && "$NODE" "$script" )
        return $?
    fi
    # Docker fallback. MSYS_NO_PATHCONV keeps Git Bash from rewriting /w.
    if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
        docker pull "$IMAGE" >/dev/null 2>&1 || {
            echo "gate: no Node and cannot pull $IMAGE" >&2; return 2; }
    fi
    MSYS_NO_PATHCONV=1 docker run --rm -v "$PARENT:/w" -w "/w/$NAME" \
        "$IMAGE" node "$script"
    return $?
}

want="${1:-all}"
rc=0
if [ -n "$NODE" ]; then
    echo "gate: runtime = $("$NODE" --version 2>/dev/null) ($NODE)"
else
    echo "gate: runtime = docker $IMAGE (no local node found)" >&2
fi

if [ "$want" = "all" ] || [ "$want" = "routes" ]; then
    run_node scripts/check-route-parity.mjs "Route parity (App.tsx ↔ nginx)" || rc=$?
fi

# Every .mjs under scripts/ must at least PARSE.
#
# a11y_audit.mjs shipped with a dangling object literal in the commit that
# removed its brand-colour exception, and nothing caught it: the file is not
# imported by anything, so the build never touched it, and the audit was
# simply never run. `node --check` is the cheapest possible guard and it
# would have failed on the first commit. Runs in the local runtime only —
# the parse is version-sensitive enough to want the real one.
if [ "$want" = "all" ] || [ "$want" = "parse" ]; then
    if [ -n "$NODE" ]; then
        echo "── scripts parse"
        bad=0
        for f in "$REPO"/scripts/*.mjs; do
            [ -e "$f" ] || continue
            "$NODE" --check "$f" 2>/dev/null || { echo "  PARSE FAIL: $(basename "$f")" >&2; bad=1; }
        done
        [ "$bad" -eq 0 ] && echo "  all script files parse" || rc=$?
    else
        echo "── scripts parse SKIPPED (no local node)" >&2
    fi
fi

if [ "$want" = "all" ] || [ "$want" = "skills" ]; then
    run_node scripts/skill-audit.mjs "Skill checklist audit" || rc=$?
fi

# Typecheck and lint need the local toolchain (node_modules), so they are
# only attempted when a real Node is present. Reporting "skipped" loudly
# is the point: a gate that silently vanishes teaches nothing.
if [ "$want" = "all" ] || [ "$want" = "types" ]; then
    if [ -n "$NODE" ] && [ -d "$REPO/node_modules" ]; then
        echo "── TypeScript"
        ( cd "$REPO" && "$NODE" node_modules/typescript/bin/tsc -b --noEmit ) || rc=$?
    else
        echo "── TypeScript SKIPPED (no local node_modules)" >&2
    fi
fi

if [ "$want" = "all" ] || [ "$want" = "lint" ]; then
    if [ -n "$NODE" ] && [ -d "$REPO/node_modules" ]; then
        echo "── oxlint"
        ( cd "$REPO" && "$NODE" node_modules/.bin/oxlint src 2>/dev/null \
            || "$NODE" node_modules/oxlint/bin/oxlint src ) || rc=$?
    else
        echo "── oxlint SKIPPED (no local node_modules)" >&2
    fi
fi

if [ "$want" = "a11y" ]; then
    if [ -z "$NODE" ]; then
        echo "gate: a11y needs a real Node and a Chrome install" >&2
        rc=2
    else
        echo "── axe (needs BASE_URL, default https://pawsmarket.ir)"
        ( cd "$REPO" && "$NODE" scripts/a11y_audit.mjs --base "${BASE_URL:-https://pawsmarket.ir}" ) || rc=$?
    fi
fi

# The behavioural audits. Each was written, committed, and then never run:
# map_audit was failing 2 of 10 cases against fixtures that had gone stale
# when catalog.json was deleted, and the failures went unnoticed because
# nothing executed them. They need a running app and Chrome, so they are a
# separate target rather than part of `all`.
#
# Exit 2 from contrast/tab-order means "a route needed a session token and
# was skipped", which is not a failure; 1 is.
if [ "$want" = "audit" ]; then
    if [ -z "$NODE" ]; then
        echo "gate: audit needs a real Node and a Chrome install" >&2
        rc=2
    else
        for s in contrast_audit tab_order_audit map_audit scroll_audit booking_guard_audit; do
            echo "── $s"
            ( cd "$REPO" && "$NODE" "scripts/$s.mjs" --base "${BASE_URL:-http://127.0.0.1:5174}" )
            sub=$?
            if [ "$sub" -eq 1 ]; then
                rc=1
            elif [ "$sub" -eq 2 ]; then
                echo "  ($s skipped some routes; not a failure)" >&2
            elif [ "$sub" -ne 0 ]; then
                echo "  ($s could not run: exit $sub)" >&2
                rc=1
            fi
        done
    fi
fi

# ── build ────────────────────────────────────────────────────────────
#
# This target did not exist until 2026-11-17, and its absence was itself a
# silent failure: `gate.sh build` printed "all checks passed" without
# running anything, because none of the `if [ "$want" = ... ]` blocks
# matched. A gate that reports success for work it did not do is worse
# than a missing gate — it was taken as proof of a deploy that never
# happened, and `dist/index.html` still held a five-day-old file.
if [ "$want" = "build" ]; then
    if [ -z "$NODE" ]; then
        echo "gate: build needs a real Node" >&2
        rc=2
    else
        echo "── Production build"
        ( cd "$REPO" && PATH="$(dirname "$NODE"):$PATH" npm run build )
        [ $? -ne 0 ] && rc=1
        # Prove fresh output exists rather than trusting the exit code of
        # a pipeline that could have no-opped.
        if [ "$rc" -eq 0 ] && [ ! -f "$REPO/dist/index.html" ]; then
            echo "  [FAIL] dist/index.html missing after a successful build" >&2
            rc=1
        fi
    fi
fi

# A named target that matched nothing is an error, not a pass.
if [ -n "$want" ] && [ "$want" != "all" ]; then
    case "$want" in
        routes|skills|lint|types|parse|a11y|audit|build) ;;
        *) echo "gate: unknown target '$want'" >&2; rc=2 ;;
    esac
fi

if [ "$rc" -eq 0 ]; then
    echo "gate: all checks passed"
else
    echo "gate: FAILED (exit $rc)" >&2
fi
exit "$rc"
