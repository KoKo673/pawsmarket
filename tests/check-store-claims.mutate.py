# -*- coding: utf-8 -*-
"""Mutation harness for scripts/check-store-claims.mjs.

A gate that has never been seen to fail is not a gate — it is a line that
prints "ok". This restores each of the original violations one at a time and
asserts the scanner exits 1, then asserts the clean tree exits 0.

Run:  python -I tests/check-store-claims.mutate.py     (from the repo root)
      -I so nothing on sys.path from elsewhere can shadow stdlib.

Every case below was written after the scanner had already FAILED to catch it,
which is the only reason this file exists. The `\b` bug alone made the gate
silently pass two real mutations.
"""
import io
import os
import pathlib
import shutil
import subprocess
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


def find_node():
    """Resolved the way gate.sh resolves it, so this runs on any machine."""
    env = os.environ.get("NODE_BIN")
    if env:
        return env
    root = pathlib.Path(__file__).resolve().parent.parent
    for cand in (root.parent / ".tools" / "node" / "node.exe",
                 root.parent / ".tools" / "node" / "node"):
        if cand.exists():
            return str(cand)
    import shutil
    return shutil.which("node")


CASES = [
    # (name, file, pattern to replace, replacement, expected exit)
    #
    # The Hero patterns are anchored on the RENDERED expression, not the words
    # alone: «مرکز خدمات در تهران» also appears inside the explanation comment,
    # so a bare replace hit both and the harness reported "pattern not found"
    # after the first case restored the file.
    ("hero count -> فروشگاه واقعی تهران",
     "src/components/home/Hero.tsx",
     "${faDigits(realStores)} مرکز خدمات در تهران",
     "${faDigits(realStores)} فروشگاه واقعی تهران", 1),
    # A BARE PLURAL: no count in front, no seek verb after. Neither of the other
    # two rules sees it, and with only those rules this string passed clean.
    ("hero plural -> فروشگاه‌های واقعی تهران",
     "src/components/home/Hero.tsx",
     ": 'مراکز خدمات دامپزشکی تهران'}",
     ": 'فروشگاه‌های واقعی تهران'}", 1),
    ("footer seek -> ...فروشگاه‌ها را پیدا کنید",
     "src/components/layout/Footer.tsx",
     "از یک فروشگاه، با قیمت روز.",
     "و فروشگاه‌ها را همان‌جا پیدا کنید.", 1),
    ("badge back as rendered text",
     "src/components/home/ProductRail.tsx",
     '<h2 className="text-2xl',
     "<span>موجودی خود پازمارکت</span>\n          <h2 className=\"text-2xl", 1),
    # must stay ALLOWED — these are true statements, and a gate that fails on
    # them gets ignored. Each was an actual false positive on the first run of
    # the plural rule, which flagged all three at once.
    #
    # The replacement is deliberately a NO-OP for the text but a real WRITE, so
    # the scanner runs against the file exactly as committed: what is asserted
    # is that the current wording does NOT fail, not that the file changed.
    ("BookingPage classifies one listing as a shop (allowed)",
     "src/pages/BookingPage.tsx",
     "در حال اصلاح اطلاعات فروشگاه‌ها هستیم",
     "در حال اصلاح اطلاعات فروشگاه‌ها هستیم", 0),
    ("CtaBanner addresses shops as an AUDIENCE (allowed)",
     "src/components/home/CtaBanner.tsx",
     "برای مالکان، پرورش‌دهندگان و فروشگاه‌های محلی",
     "برای مالکان، پرورش‌دهندگان و فروشگاه‌های محلی", 0),
    ("FilterSidebar names a map CATEGORY (allowed)",
     "src/components/explore/FilterSidebar.tsx",
     "خدمات و فروشگاه‌ها",
     "خدمات و فروشگاه‌ها", 0),
]


def main():
    node = find_node()
    if not node:
        print("no node runtime found; set NODE_BIN")
        return 2
    root = pathlib.Path(__file__).resolve().parent.parent
    fails = []
    for name, rel, old, new, want in CASES:
        p = root / rel
        orig = p.read_text(encoding="utf-8")
        if old not in orig:
            print(f"STALE  {name}: pattern not present — update the harness")
            fails.append(name)
            continue
        mutated = orig.replace(old, new)
        if old not in orig:
            print(f"STALE  {name}: pattern not present — update the harness")
            fails.append(name)
            continue
        # An "allowed" case re-writes identical text on purpose; only a
        # violation case that changes nothing is stale.
        if mutated == orig and want != 0:
            print(f"STALE  {name}: replacement equals original")
            fails.append(name)
            continue
        p.write_text(mutated, encoding="utf-8")
        try:
            r = subprocess.run([node, "scripts/check-store-claims.mjs"], cwd=root,
                               capture_output=True, text=True, encoding="utf-8")
        finally:
            p.write_text(orig, encoding="utf-8")  # restore even if the run throws
        got = r.returncode
        ok = got == want
        print(f"{'PASS' if ok else 'FAIL'}  {name}: exit={got} want={want}")
        for line in [l.strip() for l in (r.stdout + r.stderr).strip().splitlines()][-2:]:
            print("        " + line)
        if not ok:
            fails.append(name)

    clean = subprocess.run([node, "scripts/check-store-claims.mjs"], cwd=root,
                           capture_output=True, text=True, encoding="utf-8")
    print("\nclean tree: exit=%d (%s)" % (clean.returncode,
                                          (clean.stdout + clean.stderr).strip().splitlines()[-1]))
    total = len(CASES) + 1
    print("%d/%d behaved as required" % (total - len(fails) - (clean.returncode != 0), total))
    return 1 if fails or clean.returncode != 0 else 0


if __name__ == "__main__":
    sys.exit(main())
