#!/usr/bin/env python3
"""EPUB3 builder for the Meeting Man book.

Usage: python3 build_epub.py <manuscript_dir> <out.epub> [--cover cover.jpg]

manuscript_dir must contain:
  book.json  -> {"title","subtitle","author","author_kana","publisher","language","description",
                 "chapters":[{"id","kind","title","file"}], "uuid", "date"}
  *.md       -> one Markdown file per chapter (limited Markdown: #/##/### headings, paragraphs,
                 blank-line separated, '- ' bullets, '> ' blockquotes, **bold**, ---- rules, ※ notes)
"""
import html
import json
import os
import re
import sys
import uuid
import zipfile
from datetime import datetime, timezone

def esc(s):
    return html.escape(s, quote=False)

def inline(s):
    # escape first, then apply inline marks
    s = esc(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<em>\1</em>", s)
    s = re.sub(r"《《(.+?)》》", r'<span class="emph">\1</span>', s)  # bouten-style emphasis
    return s

def md_to_xhtml_body(md):
    lines = md.splitlines()
    out = []
    i = 0
    para = []
    list_buf = []
    quote_buf = []

    def flush_para():
        nonlocal para
        if para:
            text = "".join(p.strip() for p in para)  # Japanese: join without spaces
            out.append(f"<p>{inline(text)}</p>")
            para = []

    def flush_list():
        nonlocal list_buf
        if list_buf:
            out.append("<ul>" + "".join(f"<li>{inline(x)}</li>" for x in list_buf) + "</ul>")
            list_buf = []

    def flush_quote():
        nonlocal quote_buf
        if quote_buf:
            out.append("<blockquote>" + "".join(f"<p>{inline(x)}</p>" for x in quote_buf) + "</blockquote>")
            quote_buf = []

    while i < len(lines):
        line = lines[i].rstrip("\n")
        stripped = line.strip()
        if not stripped:
            flush_para(); flush_list(); flush_quote()
            i += 1
            continue
        m = re.match(r"^(#{1,4})\s+(.*)$", stripped)
        if m:
            flush_para(); flush_list(); flush_quote()
            level = len(m.group(1))
            text = m.group(2).strip()
            if level == 1:
                pass  # chapter title handled by template
            else:
                out.append(f"<h{level}>{inline(text)}</h{level}>")
            i += 1
            continue
        if re.match(r"^(-{3,}|\*{3,}|＊{3,})$", stripped):
            flush_para(); flush_list(); flush_quote()
            out.append('<hr class="sep"/>')
            i += 1
            continue
        if stripped.startswith("- ") or stripped.startswith("・"):
            flush_para(); flush_quote()
            list_buf.append(stripped[2:].strip() if stripped.startswith("- ") else stripped[1:].strip())
            i += 1
            continue
        if stripped.startswith("> "):
            flush_para(); flush_list()
            quote_buf.append(stripped[2:].strip())
            i += 1
            continue
        if stripped.startswith(":::box"):
            # box block: :::box TITLE ... :::
            flush_para(); flush_list(); flush_quote()
            title = stripped[len(":::box"):].strip()
            i += 1
            box_lines = []
            while i < len(lines) and lines[i].strip() != ":::":
                box_lines.append(lines[i])
                i += 1
            i += 1
            inner = md_to_xhtml_body("\n".join(box_lines))
            t = f'<p class="box-title">{inline(title)}</p>' if title else ""
            out.append(f'<div class="box">{t}{inner}</div>')
            continue
        flush_list(); flush_quote()
        para.append(stripped)
        i += 1
    flush_para(); flush_list(); flush_quote()
    return "\n".join(out)

XHTML_HEAD = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="ja" lang="ja">
<head>
<meta charset="utf-8"/>
<title>{title}</title>
<link rel="stylesheet" type="text/css" href="../css/style.css"/>
</head>
<body epub:type="{etype}">
"""
XHTML_FOOT = "</body>\n</html>\n"

CSS = """@charset "UTF-8";
html { -webkit-text-size-adjust: 100%; }
body { font-family: serif; line-height: 1.85; margin: 0; padding: 0; text-align: justify; }
h1.chapter-title { font-size: 1.5em; font-weight: bold; line-height: 1.4; margin: 2.5em 0 1.5em; text-align: left; page-break-after: avoid; }
h1.chapter-title .chapter-number { display: block; font-size: 0.7em; font-weight: normal; letter-spacing: 0.1em; margin-bottom: 0.6em; color: #555; }
h2 { font-size: 1.2em; font-weight: bold; line-height: 1.4; margin: 2.2em 0 0.9em; page-break-after: avoid; border-left: 0.35em solid #333; padding-left: 0.6em; }
h3 { font-size: 1.05em; font-weight: bold; margin: 1.8em 0 0.6em; page-break-after: avoid; }
p { margin: 0; text-indent: 1em; }
p.noindent, blockquote p, .box p, p.box-title { text-indent: 0; }
blockquote { margin: 1.2em 1em; padding: 0.2em 0 0.2em 1em; border-left: 2px solid #999; color: #333; }
ul { margin: 0.8em 0 0.8em 1.2em; padding: 0; }
li { margin: 0.25em 0; }
hr.sep { border: 0; height: 0; margin: 2em auto; text-align: center; }
hr.sep::after { content: "＊　＊　＊"; color: #666; font-size: 0.9em; }
.box { border: 1px solid #999; border-radius: 6px; padding: 0.9em 1em; margin: 1.5em 0; background: #f7f7f7; }
.box-title { font-weight: bold; margin-bottom: 0.5em; }
.emph { text-emphasis: filled sesame; -webkit-text-emphasis: filled sesame; }
strong { font-weight: bold; }
/* title page */
.titlepage { text-align: center; margin-top: 30%; }
.titlepage .title { font-size: 1.9em; font-weight: bold; line-height: 1.4; }
.titlepage .subtitle { font-size: 1.1em; margin-top: 1em; line-height: 1.6; }
.titlepage .author { font-size: 1.1em; margin-top: 3em; }
/* toc */
nav#toc ol { list-style: none; padding-left: 0; margin: 0; }
nav#toc li { margin: 0.5em 0; }
nav#toc ol ol { padding-left: 1.2em; }
nav#toc ol ol li { font-size: 0.92em; margin: 0.25em 0; }
nav#toc a { text-decoration: none; color: inherit; }
h1.toc-title, h1.simple-title { font-size: 1.4em; margin: 2em 0 1.2em; text-align: left; }
/* colophon */
.colophon { margin-top: 40%; font-size: 0.9em; }
.colophon p { text-indent: 0; margin: 0.3em 0; }
.colophon .booktitle { font-weight: bold; font-size: 1.1em; margin-bottom: 1em; }
.profile p { text-indent: 0; margin: 0.4em 0; }
.cover-body { margin: 0; padding: 0; text-align: center; }
.cover-body img { max-width: 100%; max-height: 100%; }
"""

def build(ms_dir, out_path, cover_path=None):
    meta = json.load(open(os.path.join(ms_dir, "book.json"), encoding="utf-8"))
    book_uuid = meta.get("uuid") or str(uuid.uuid4())
    date = meta.get("date") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    modified = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    title = meta["title"]; subtitle = meta.get("subtitle", ""); author = meta["author"]

    items = []   # (id, href, media-type, properties)
    spine = []   # (idref, linear)
    nav_entries = []  # (href, label, [(href#id, sublabel)...])
    files = {}   # zip path -> bytes

    files["mimetype"] = b"application/epub+zip"
    files["META-INF/container.xml"] = """<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
""".encode("utf-8")
    files["OEBPS/css/style.css"] = CSS.encode("utf-8")
    items.append(("css", "css/style.css", "text/css", None))

    # cover
    if cover_path and os.path.exists(cover_path):
        files["OEBPS/images/cover.jpg"] = open(cover_path, "rb").read()
        items.append(("cover-image", "images/cover.jpg", "image/jpeg", "cover-image"))
        cover_xhtml = XHTML_HEAD.format(title=esc(title), etype="cover") + \
            '<div class="cover-body"><img src="../images/cover.jpg" alt="' + esc(title) + '"/></div>\n' + XHTML_FOOT
        files["OEBPS/text/cover.xhtml"] = cover_xhtml.encode("utf-8")
        items.append(("cover", "text/cover.xhtml", "application/xhtml+xml", None))
        spine.append(("cover", "no"))

    # title page
    tp = XHTML_HEAD.format(title=esc(title), etype="titlepage frontmatter") + \
        f'<div class="titlepage"><p class="title noindent">{esc(title)}</p>' + \
        (f'<p class="subtitle noindent">{esc(subtitle)}</p>' if subtitle else "") + \
        f'<p class="author noindent">{esc(author)}</p></div>\n' + XHTML_FOOT
    files["OEBPS/text/titlepage.xhtml"] = tp.encode("utf-8")
    items.append(("titlepage", "text/titlepage.xhtml", "application/xhtml+xml", None))
    spine.append(("titlepage", "yes"))

    # nav placeholder position (after title page)
    spine.append(("nav", "yes"))

    # chapters
    chapter_count = 0
    for ch in meta["chapters"]:
        md = open(os.path.join(ms_dir, ch["file"]), encoding="utf-8").read()
        # the manuscript's own H1 wins over book.json (single source of truth in the .md)
        m_h1 = re.search(r"^#\s+(.+)$", md, flags=re.M)
        if m_h1:
            ch = dict(ch); ch["title"] = re.sub(r"^第\d+章[　 ]*", "", m_h1.group(1).strip())
        body = md_to_xhtml_body(md)
        kind = ch.get("kind", "chapter")
        cid = ch["id"]
        if kind == "chapter":
            chapter_count += 1
            num_label = f"第{chapter_count}章"
            etype = "bodymatter chapter"
            h1 = f'<h1 class="chapter-title"><span class="chapter-number">{num_label}</span>{inline(ch["title"])}</h1>'
            label = f'{num_label}　{ch["title"]}'
        elif kind == "preface":
            etype = "frontmatter preface"
            h1 = f'<h1 class="chapter-title">{inline(ch["title"])}</h1>'
            label = ch["title"]
        elif kind == "afterword":
            etype = "backmatter afterword"
            h1 = f'<h1 class="chapter-title">{inline(ch["title"])}</h1>'
            label = ch["title"]
        else:
            etype = "bodymatter"
            h1 = f'<h1 class="chapter-title">{inline(ch["title"])}</h1>'
            label = ch["title"]
        # add ids to h2 for sub-toc
        subs = []
        def add_id(m, _c=[0]):
            _c[0] += 1
            hid = f"{cid}-s{_c[0]}"
            subs.append((hid, re.sub(r"<[^>]+>", "", m.group(1))))
            return f'<h2 id="{hid}">{m.group(1)}</h2>'
        body = re.sub(r"<h2>(.*?)</h2>", add_id, body)
        x = XHTML_HEAD.format(title=esc(ch["title"]), etype=etype) + f'<section epub:type="{etype.split()[-1]}">\n' + h1 + "\n" + body + "\n</section>\n" + XHTML_FOOT
        href = f"text/{cid}.xhtml"
        files[f"OEBPS/{href}"] = x.encode("utf-8")
        items.append((cid, href, "application/xhtml+xml", None))
        spine.append((cid, "yes"))
        nav_entries.append((href, label, [(f"{href}#{hid}", t) for hid, t in subs]))

    # colophon / author profile
    profile = meta.get("author_profile", "")
    col = XHTML_HEAD.format(title="奥付", etype="backmatter colophon") + '<section epub:type="colophon">'
    if profile:
        col += '<h1 class="simple-title">著者プロフィール</h1><div class="profile">' + "".join(f"<p>{inline(p)}</p>" for p in profile.split("\n") if p.strip()) + "</div>"
    col += f'<div class="colophon"><p class="booktitle">{esc(title)}' + (f"　{esc(subtitle)}" if subtitle else "") + "</p>"
    col += f"<p>{esc(date)}　初版発行</p><p>著者　{esc(author)}</p>"
    if meta.get("publisher"):
        col += f"<p>発行　{esc(meta['publisher'])}</p>"
    col += f"<p>©{date[:4]} {esc(author)}</p><p>本書の無断複製・転載を禁じます。</p></div></section>\n" + XHTML_FOOT
    files["OEBPS/text/colophon.xhtml"] = col.encode("utf-8")
    items.append(("colophon", "text/colophon.xhtml", "application/xhtml+xml", None))
    spine.append(("colophon", "yes"))
    nav_entries.append(("text/colophon.xhtml", "奥付", []))

    # nav document
    nav = XHTML_HEAD.format(title="目次", etype="frontmatter toc")
    nav += '<nav epub:type="toc" id="toc"><h1 class="toc-title">目次</h1><ol>'
    for href, label, subs in nav_entries:
        rel = href.replace("text/", "")
        nav += f'<li><a href="{rel}">{esc(label)}</a>'
        if subs:
            nav += "<ol>" + "".join(f'<li><a href="{s.replace("text/", "")}">{esc(t)}</a></li>' for s, t in subs) + "</ol>"
        nav += "</li>"
    nav += "</ol></nav>"
    nav += '<nav epub:type="landmarks" hidden="hidden"><h2>Landmarks</h2><ol>'
    if cover_path and os.path.exists(cover_path):
        nav += '<li><a epub:type="cover" href="cover.xhtml">表紙</a></li>'
    nav += '<li><a epub:type="toc" href="nav.xhtml">目次</a></li>'
    first_body = next((c["id"] for c in meta["chapters"] if c.get("kind", "chapter") == "chapter"), None)
    if first_body:
        nav += f'<li><a epub:type="bodymatter" href="{first_body}.xhtml">本文</a></li>'
    nav += "</ol></nav>\n" + XHTML_FOOT
    files["OEBPS/text/nav.xhtml"] = nav.encode("utf-8")
    items.append(("nav", "text/nav.xhtml", "application/xhtml+xml", "nav"))

    # OPF
    manifest = "\n".join(
        f'    <item id="{i}" href="{h}" media-type="{m}"' + (f' properties="{p}"' if p else "") + "/>"
        for i, h, m, p in items)
    spine_xml = "\n".join(f'    <itemref idref="{r}"' + ('' if lin == "yes" else ' linear="no"') + "/>" for r, lin in spine)
    kana = meta.get("author_kana", "")
    opf = f"""<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="ja" prefix="rendition: http://www.idpf.org/vocab/rendition/#">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:{book_uuid}</dc:identifier>
    <dc:title id="title">{esc(title)}</dc:title>
    <meta refines="#title" property="title-type">main</meta>
    {"<dc:title id='subtitle'>" + esc(subtitle) + "</dc:title><meta refines='#subtitle' property='title-type'>subtitle</meta>" if subtitle else ""}
    <dc:creator id="creator">{esc(author)}</dc:creator>
    <meta refines="#creator" property="role" scheme="marc:relators">aut</meta>
    {"<meta refines='#creator' property='file-as'>" + esc(kana) + "</meta>" if kana else ""}
    <dc:language>ja</dc:language>
    <dc:date>{esc(date)}</dc:date>
    {"<dc:publisher>" + esc(meta['publisher']) + "</dc:publisher>" if meta.get('publisher') else ""}
    {"<dc:description>" + esc(meta['description']) + "</dc:description>" if meta.get('description') else ""}
    <meta property="dcterms:modified">{modified}</meta>
    <meta property="rendition:layout">reflowable</meta>
    <meta property="rendition:spread">auto</meta>
    <meta property="ibooks:specified-fonts">false</meta>
    {"<meta name='cover' content='cover-image'/>" if cover_path and os.path.exists(cover_path) else ""}
  </metadata>
  <manifest>
{manifest}
  </manifest>
  <spine page-progression-direction="ltr">
{spine_xml}
  </spine>
</package>
"""
    # ibooks prefix needed
    opf = opf.replace('prefix="rendition: http://www.idpf.org/vocab/rendition/#"',
                      'prefix="rendition: http://www.idpf.org/vocab/rendition/# ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0/"')
    files["OEBPS/content.opf"] = opf.encode("utf-8")

    with zipfile.ZipFile(out_path, "w") as z:
        z.writestr(zipfile.ZipInfo("mimetype"), files["mimetype"], compress_type=zipfile.ZIP_STORED)
        for path, data in files.items():
            if path == "mimetype":
                continue
            z.writestr(path, data, compress_type=zipfile.ZIP_DEFLATED)
    total = 0
    for ch in meta["chapters"]:
        md = open(os.path.join(ms_dir, ch["file"]), encoding="utf-8").read()
        total += len(re.sub(r"\s", "", md))
    print(f"built {out_path}: {len(meta['chapters'])} sections, ~{total} chars")

if __name__ == "__main__":
    args = sys.argv[1:]
    cover = None
    if "--cover" in args:
        idx = args.index("--cover"); cover = args[idx + 1]; del args[idx:idx + 2]
    build(args[0], args[1], cover)
