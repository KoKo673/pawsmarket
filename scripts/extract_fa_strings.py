# -*- coding: utf-8 -*-
"""Extract all Persian user-facing strings from src/ for copy review."""
import glob
import io
import os
import re

out = {}
patterns = glob.glob("src/**/*.tsx", recursive=True) + glob.glob("src/**/*.ts", recursive=True)
for f in patterns:
    if "__" in f:
        continue
    s = io.open(f, encoding="utf-8").read()
    strings = re.findall(r"[\"'`]([^\"'`\n]*[؀-ۿ][^\"'`\n]*)[\"'`]", s)
    strings = [t.strip() for t in strings if t.strip()]
    if strings:
        out[f.replace(os.sep, "/")] = list(dict.fromkeys(strings))

with io.open("scripts/fa_strings_report.txt", "w", encoding="utf-8") as w:
    for f, ss in out.items():
        w.write("\n=== %s ===\n" % f)
        for t in ss:
            w.write("  %s\n" % t)

print("files:", len(out), "| unique strings:", sum(len(v) for v in out.values()))
