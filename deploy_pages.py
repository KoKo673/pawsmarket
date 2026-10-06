# -*- coding: utf-8 -*-
"""
Deploy dist/ to the gh-pages branch (files at repo ROOT, matching the layout
GitHub Pages serves at /pawsmarket/).

Uses a temporary index so the working tree and index of the current branch are
never touched:

  1. create a temp index seeded from the current gh-pages HEAD
  2. `git add` dist's contents into it
  3. `git commit-tree` → new commit
  4. `git update-ref refs/heads/gh-pages <new> <old>`

Run:  python deploy_pages.py [--dry-run]
"""
import os
import subprocess
import sys

REPO = os.path.dirname(os.path.abspath(__file__))
BRANCH = "gh-pages"


def git(*args, env=None):
    r = subprocess.run(["git", "-C", REPO, *args], capture_output=True,
                       env=env)
    if r.returncode != 0:
        raise SystemExit(r.stderr.decode("utf-8", "replace"))
    return r.stdout.decode("utf-8", "replace").strip()


def main():
    dry = "--dry-run" in sys.argv
    dist = os.path.join(REPO, "dist")
    if not os.path.isfile(os.path.join(dist, "index.html")):
        raise SystemExit("dist/index.html missing — run npm run build first")

    old = git("rev-parse", "--verify", f"refs/heads/{BRANCH}")
    print(f"{BRANCH} head: {old[:10]}")

    idx = os.path.join(REPO, ".git", "deploy-pages.index")
    env = dict(os.environ, GIT_INDEX_FILE=idx)
    if os.path.exists(idx):
        os.remove(idx)

    # seed the temp index empty, then add dist's contents as repo-root paths
    git("read-tree", "--empty", env=env)
    subprocess.run(
        ["git", "-C", REPO, "add", "-A", "--", "."],
        env=dict(env,
                 GIT_WORK_TREE=dist,
                 GIT_DIR=os.path.join(REPO, ".git"),
                 GIT_INDEX_FILE=idx),
        capture_output=True, check=True)

    tree = git("write-tree", env=env)
    parent = old
    msg = "Deploy: city-wide Tehran catalog (212 stores / 775 products), verified photos, Persian-only names"
    commit = git("commit-tree", tree, "-p", parent, "-m", msg, env=env)

    files = git("ls-tree", "-r", "--name-only", commit).splitlines()
    print(f"new commit {commit[:10]}  files: {len(files)}")
    for f in files[:8]:
        print("   ", f)
    if any(f.startswith("dist/") for f in files):
        raise SystemExit("ERROR: files still nested under dist/")

    if dry:
        print("\n--dry-run: not updating the branch")
    else:
        git("update-ref", f"refs/heads/{BRANCH}", commit, old)
        print(f"\nupdated {BRANCH}: {old[:10]} -> {commit[:10]}")
        print("push with: git push origin gh-pages")
    os.remove(idx)


if __name__ == "__main__":
    main()