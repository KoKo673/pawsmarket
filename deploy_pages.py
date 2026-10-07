# -*- coding: utf-8 -*-
"""
Publish dist/ to the gh-pages branch (files at repo ROOT, which is what GitHub
Pages serves for a project site under /<repo>/).

Uses a temporary index so the working tree and the current branch are never
disturbed — a half-finished deploy cannot leave the checkout in a broken state.

Usage:  PYTHONIOENCODING=utf-8 python deploy_pages.py [--dry-run]
"""
import json
import os
import subprocess
import sys

REPO = os.path.dirname(os.path.abspath(__file__))
BRANCH = "gh-pages"


def git(*args, env=None):
    r = subprocess.run(["git", "-C", REPO, *args], capture_output=True, env=env)
    if r.returncode != 0:
        raise SystemExit(r.stderr.decode("utf-8", "replace"))
    return r.stdout.decode("utf-8", "replace").strip()


def main():
    dry = "--dry-run" in sys.argv
    dist = os.path.join(REPO, "dist")
    if not os.path.isfile(os.path.join(dist, "index.html")):
        raise SystemExit("dist/index.html missing — run `npm run build` first")

    old = git("rev-parse", "--verify", f"refs/heads/{BRANCH}")
    print(f"{BRANCH} head: {old[:10]}")

    idx = os.path.join(REPO, ".git", "deploy-pages.index")
    if os.path.exists(idx):
        os.remove(idx)
    env = dict(os.environ, GIT_INDEX_FILE=idx)

    # empty index, then add dist's contents as repo-root paths
    git("read-tree", "--empty", env=env)
    subprocess.run(
        ["git", "-C", REPO, "add", "-A", "--", "."],
        env=dict(env, GIT_WORK_TREE=dist,
                 GIT_DIR=os.path.join(REPO, ".git"), GIT_INDEX_FILE=idx),
        capture_output=True, check=True)

    tree = git("write-tree", env=env)
    msg = ("Deploy: Pages build pointed at the live Railway API "
           "(auth + pet profiles now work for visitors)")
    commit = git("commit-tree", tree, "-p", old, "-m", msg, env=env)

    files = git("ls-tree", "-r", "--name-only", commit).splitlines()
    print(f"new commit {commit[:10]}  files: {len(files)}")
    for f in files[:6]:
        print("   ", f)
    if any(f.startswith("dist/") for f in files):
        raise SystemExit("ERROR: files nested under dist/ — wrong layout for Pages")
    if not any(f == "index.html" for f in files):
        raise SystemExit("ERROR: index.html missing from the commit")

    if dry:
        print("\n--dry-run: branch not updated")
    else:
        git("update-ref", f"refs/heads/{BRANCH}", commit, old)
        print(f"\nupdated {BRANCH}: {old[:10]} -> {commit[:10]}")
        print("push with: git push origin gh-pages")
    os.remove(idx)


if __name__ == "__main__":
    main()