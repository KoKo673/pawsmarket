"""Report which files under public/images are reachable from source.

Read-only. Answers "how much of this 68 MB does anyone actually load" before
anyone spends an hour converting files that no page references.
"""
import os
import pathlib
import re
import sys

REPO = pathlib.Path(__file__).resolve().parent.parent
ROOT = REPO / "public"


def rel(p: pathlib.Path) -> str:
    return p.relative_to(ROOT).as_posix()


def main() -> int:
    src_files = list((REPO / "src").rglob("*.ts")) + list((REPO / "src").rglob("*.tsx"))
    referenced: set[str] = set()
    dynamic_prefixes: set[str] = set()

    for p in src_files:
        txt = p.read_text(encoding="utf-8", errors="replace")
        # Literal paths: asset('images/...'), "/images/..."
        for m in re.finditer(r"""["'`](?:/)?((?:images/)[^"'`\s?){]+\.(?:jpg|jpeg|png|webp|svg))""", txt):
            referenced.add(m.group(1))
        # Directory prefixes used to build a path at runtime, e.g.
        # asset('images/listings/' + f)
        for m in re.finditer(r"""["']((?:images/)[a-z]+/)["']""", txt):
            dynamic_prefixes.add(m.group(1))

    on_disk = {rel(p) for p in (ROOT / "images").rglob("*") if p.is_file()}

    missing = sorted(referenced - on_disk)
    # A file counts as reachable if it is named literally or lives under a
    # directory the code builds paths into at runtime.
    dynamic_hits = {f for f in on_disk if any(f.startswith(p) for p in dynamic_prefixes)}
    reachable = (referenced & on_disk) | dynamic_hits
    unreachable = on_disk - reachable

    def bytes_of(files):
        return sum((ROOT / f).stat().st_size for f in files)

    print(f"on disk            {len(on_disk):>6}  {bytes_of(on_disk)/1e6:>7.1f} MB")
    print(f"referenced literal {len(referenced & on_disk):>6}  {bytes_of(referenced & on_disk)/1e6:>7.1f} MB")
    print(f"via dynamic prefix {len(dynamic_hits):>6}  {bytes_of(dynamic_hits)/1e6:>7.1f} MB")
    print(f"  prefixes: {sorted(dynamic_prefixes)}")
    print(f"reachable total    {len(reachable):>6}  {bytes_of(reachable)/1e6:>7.1f} MB")
    print(f"UNREACHABLE        {len(unreachable):>6}  {bytes_of(unreachable)/1e6:>7.1f} MB")
    if missing:
        print(f"\nBROKEN (referenced, not on disk): {len(missing)}")
        for f in missing[:10]:
            print("  ", f)

    if unreachable:
        print("\nunreachable by directory:")
        by_dir: dict[str, list[str]] = {}
        for f in unreachable:
            by_dir.setdefault(str(pathlib.PurePosixPath(f).parent), []).append(f)
        for d, fs in sorted(by_dir.items(), key=lambda kv: -len(kv[1])):
            print(f"  {len(fs):>5}  {bytes_of(fs)/1e6:>6.1f} MB  {d}")

    return 0


if __name__ == "__main__":
    sys.exit(main())