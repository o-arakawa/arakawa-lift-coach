// Render a Markdown worksheet to an A4 PDF via headless Chromium.
// Usage: node funnel/build/md_to_pdf.js <in.md> <out.pdf> [--html out.html]
// Page breaks: a line containing exactly "<!-- page -->".
const fs = require('fs'), path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>');
function md2html(md) {
  const pages = md.split(/^\s*<!-- page -->\s*$/m);
  return pages.map(p => {
    const out = []; let list = null, para = [];
    const flush = () => { if (para.length) { out.push('<p>' + inline(para.join('')) + '</p>'); para = []; } if (list) { out.push(`</${list}>`); list = null; } };
    for (const raw of p.split('\n')) {
      const l = raw.trimEnd();
      if (!l.trim()) { flush(); continue; }
      let m;
      if ((m = l.match(/^(#{1,4})\s+(.*)/))) { flush(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); continue; }
      if ((m = l.match(/^\s*[-・]\s+(.*)/))) { if (para.length) flush(); if (list !== 'ul') { if (list) out.push(`</${list}>`); out.push('<ul>'); list = 'ul'; } out.push(`<li>${inline(m[1])}</li>`); continue; }
      if ((m = l.match(/^\s*\d+[.．]\s+(.*)/))) { if (para.length) flush(); if (list !== 'ol') { if (list) out.push(`</${list}>`); out.push('<ol>'); list = 'ol'; } out.push(`<li>${inline(m[1])}</li>`); continue; }
      if ((m = l.match(/^>\s?(.*)/))) { flush(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
      if (/^-{3,}$/.test(l.trim())) { flush(); out.push('<hr/>'); continue; }
      if (/^_{6,}\s*$/.test(l.trim())) { flush(); out.push('<div class="line"></div>'); continue; }
      if (list) { flush(); }
      para.push(l.trim());
    }
    flush();
    return `<section class="page">${out.join('\n')}</section>`;
  }).join('\n');
}
const CSS = `
@page { size: A4; margin: 18mm 16mm 20mm 16mm; }
@font-face { font-family: 'NSansJP'; src: url('file://${path.resolve('fonts/NotoSansJP.ttf')}'); }
@font-face { font-family: 'NSerifJP'; src: url('file://${path.resolve('fonts/NotoSerifJP.ttf')}'); }
body { font-family: 'NSansJP', sans-serif; color: #141414; font-size: 11.5pt; line-height: 1.8; margin: 0; }
section.page { page-break-after: always; }
section.page:last-child { page-break-after: auto; }
h1 { font-size: 26pt; line-height: 1.35; margin: 0 0 14pt; letter-spacing: .02em; }
h2 { font-size: 16pt; margin: 18pt 0 8pt; border-left: 6px solid #e2461c; padding-left: 10px; }
h3 { font-size: 12.5pt; margin: 14pt 0 6pt; }
p { margin: 0 0 8pt; }
blockquote { margin: 0 0 12pt; padding: 8pt 12pt; background: #f3eee4; border-radius: 6px; font-family: 'NSerifJP', serif; }
ul, ol { margin: 0 0 10pt 1.3em; padding: 0; } li { margin: 2pt 0; }
.line { border-bottom: 1px solid #999; height: 22pt; margin: 4pt 0 6pt; }
hr { border: 0; border-top: 1px dashed #bbb; margin: 14pt 0; }
a { color: #e2461c; }
section.page:first-child { display: flex; flex-direction: column; justify-content: center; min-height: 240mm; text-align: center; }
section.page:first-child h1 { font-size: 34pt; }
section.page:first-child p { color: #555; }
.footer { position: fixed; bottom: -8mm; left: 0; right: 0; font-size: 8.5pt; color: #777; text-align: center; }
`;
(async () => {
  const [inPath, outPath] = process.argv.slice(2);
  const md = fs.readFileSync(inPath, 'utf8');
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${md2html(md)}</body></html>`;
  const hi = process.argv.indexOf('--html'); if (hi > 0) fs.writeFileSync(process.argv[hi + 1], html);
  const launch = { args: ['--no-sandbox'] }; if (process.env.CHROME_PATH) launch.executablePath = process.env.CHROME_PATH;
  const browser = await chromium.launch(launch); const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: outPath, format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;text-align:center;font-size:8px;color:#888;font-family:sans-serif"><span class="pageNumber"></span> / <span class="totalPages"></span></div>' });
  await browser.close(); console.log('pdf', outPath);
})().catch(e => { console.error(e); process.exit(1); });
