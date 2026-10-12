#!/usr/bin/env python3
"""Fill placeholders from funnel/config.json into the funnel deliverables.

  python3 funnel/build/apply_config.py
Reads  funnel/src/*.md and funnel/lp/index.template.html
Writes funnel/dist/*.md, arukinagara/index.html (GitHub Pages LP), funnel/dist/qr_lp.png, book/manuscript/qr.png
Placeholders: {{AUTHOR}} {{AUTHOR_ROMAJI}} {{LP_URL}} {{LINE_URL}} {{SALES_URL}} {{BOOK_URL}}
"""
import json, os, re, glob, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
cfg = json.load(open(os.path.join(ROOT, "funnel/config.json"), encoding="utf-8"))
def fill(s):
    for k, v in cfg.items():
        if k.startswith("_"): continue
        s = s.replace("{{" + k + "}}", v)
    return s
os.makedirs(os.path.join(ROOT, "funnel/dist"), exist_ok=True)
for src in glob.glob(os.path.join(ROOT, "funnel/src/*.md")):
    out = os.path.join(ROOT, "funnel/dist", os.path.basename(src))
    open(out, "w", encoding="utf-8").write(fill(open(src, encoding="utf-8").read()))
    print("filled", os.path.relpath(out, ROOT))
tpl = os.path.join(ROOT, "funnel/lp/index.template.html")
if os.path.exists(tpl):
    os.makedirs(os.path.join(ROOT, "arukinagara"), exist_ok=True)
    page = open(tpl, encoding="utf-8").read()
    body_path = os.path.join(ROOT, "funnel/lp/body.html")
    if os.path.exists(body_path):
        page = page.replace("<!--LP_BODY-->", open(body_path, encoding="utf-8").read())
    open(os.path.join(ROOT, "arukinagara/index.html"), "w", encoding="utf-8").write(fill(page))
    print("filled arukinagara/index.html")
qr = os.path.join(ROOT, "funnel/build/make_qr.py")
subprocess.run([sys.executable, "-I", qr, cfg["LP_URL"], os.path.join(ROOT, "funnel/dist/qr_lp.png")], check=True)
subprocess.run([sys.executable, "-I", qr, cfg["LP_URL"], os.path.join(ROOT, "book/manuscript/qr.png")], check=True)
if not cfg["LINE_URL"].startswith("https://lin.ee/X"):
    subprocess.run([sys.executable, "-I", qr, cfg["LINE_URL"], os.path.join(ROOT, "funnel/dist/qr_line.png")], check=True)
left = [p for p in glob.glob(os.path.join(ROOT, "funnel/dist/*.md")) + [os.path.join(ROOT, "arukinagara/index.html")] if os.path.exists(p) and re.search(r"\{\{[A-Z_]+\}\}", open(p, encoding="utf-8").read())]
print("unfilled placeholders remain in:", [os.path.relpath(p, ROOT) for p in left] or "none")
