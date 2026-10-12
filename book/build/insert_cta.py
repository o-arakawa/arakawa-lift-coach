#!/usr/bin/env python3
"""Insert the LINE reader-bonus CTAs (funnel/dist/book_cta.md, sections A-F) into the manuscript. Idempotent.

A -> preface (before the 今日からできること box)   B -> ch06 (after the box, before the bridge paragraph)
C -> ch09 (same as B)                               D -> afterword (end of file)
E -> book/manuscript/bonus.md (new backmatter section, registered in book.json before 奥付)
F -> book.json author_profile + contact
"""
import json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MS = os.path.join(ROOT, "book/manuscript")
src = open(os.path.join(ROOT, "funnel/dist/book_cta.md"), encoding="utf-8").read()
parts = {m.group(1): re.sub(r"<!--.*?-->\s*", "", m.group(2), flags=re.S).strip() for m in re.finditer(r"^## ([A-F])\b[^\n]*\n(.*?)(?=^## [A-F]\b|\Z)", src, flags=re.M | re.S)}
missing = [k for k in "ABCDEF" if k not in parts]
if missing: sys.exit(f"book_cta.md is missing sections: {missing}")
def strip_marks(s, key):
    return re.sub(rf"\n*<!-- cta:{key} -->.*?<!-- /cta:{key} -->\n*", "\n\n", s, flags=re.S)
def block(key, text):
    return f"<!-- cta:{key} -->\n{text}\n<!-- /cta:{key} -->"
def insert_before_box(path, key):
    s = strip_marks(open(path, encoding="utf-8").read(), key)
    i = s.index(":::box")
    s = s[:i].rstrip() + "\n\n" + block(key, parts[key]) + "\n\n" + s[i:]
    open(path, "w", encoding="utf-8").write(s)
def insert_after_box(path, key):
    s = strip_marks(open(path, encoding="utf-8").read(), key)
    m = list(re.finditer(r"^:::\s*$", s, flags=re.M))[-1]
    s = s[:m.end()] + "\n\n" + block(key, parts[key]) + s[m.end():]
    open(path, "w", encoding="utf-8").write(s)
def append(path, key):
    s = strip_marks(open(path, encoding="utf-8").read(), key).rstrip()
    open(path, "w", encoding="utf-8").write(s + "\n\n" + block(key, parts[key]) + "\n")
insert_before_box(os.path.join(MS, "preface.md"), "A")
insert_after_box(os.path.join(MS, "ch06.md"), "B")
insert_after_box(os.path.join(MS, "ch09.md"), "C")
# D replaces the two "奥付の連絡先" sentences in the afterword (falls back to inserting before the final line)
ap = os.path.join(MS, "afterword.md"); s_a = strip_marks(open(ap, encoding="utf-8").read(), "D")
target = "感想は、奥付の連絡先に送ってほしい。それが、僕の次の一冊の種になる。"
if target in s_a:
    s_a = s_a.replace(target, block("D", parts["D"]))
elif "うまくいかなかった話でも構わない。" in s_a:
    s_a = s_a.replace("うまくいかなかった話でも構わない。", "うまくいかなかった話でも構わない。" + block("D", parts["D"]), 1)
else:
    lines = s_a.rstrip().split("\n"); lines.insert(len(lines) - 1, block("D", parts["D"]) + "\n"); s_a = "\n".join(lines) + "\n"
open(ap, "w", encoding="utf-8").write(s_a)
e = parts["E"]
if not e.lstrip().startswith("# "):
    e = re.sub(r"^#+\s*", "", e, count=1, flags=re.M); e = "# " + e
open(os.path.join(MS, "bonus.md"), "w", encoding="utf-8").write(e.strip() + "\n")
bj = os.path.join(MS, "book.json"); b = json.load(open(bj, encoding="utf-8"))
b["chapters"] = [c for c in b["chapters"] if c["id"] != "bonus"] + [{"id": "bonus", "kind": "backmatter", "title": re.sub(r"^#\s*", "", e.strip().splitlines()[0]), "file": "bonus.md"}]
f = parts["F"]
prof = re.sub(r"^(#+.*|\*\*著者プロフィール\*\*)$", "", f, flags=re.M).strip()
contact = ""
m = re.search(r"^.*(ご感想|お問い合わせ).*$", prof, flags=re.M)
if m:
    contact = m.group(0).strip().lstrip("-・ ").strip(); prof = prof.replace(m.group(0), "").strip()
b["author_profile"] = prof; b["contact"] = contact
json.dump(b, open(bj, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("inserted A-F; bonus.md registered; profile/contact updated")
