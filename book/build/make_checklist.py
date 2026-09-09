#!/usr/bin/env python3
"""Build AUTHOR_CHECKLIST.md from the plan's author_check_items plus agent-reported needs_author_check items."""
import json, sys, glob, re
plan = json.load(open('book/plan/PLAN.json', encoding='utf-8'))
extra = []
for path in sys.argv[1:]:
    try:
        d = json.load(open(path, encoding='utf-8'))
    except Exception as e:
        print('skip', path, e); continue
    r = d.get('result', d)
    def walk(x, ctx=''):
        if isinstance(x, dict):
            for k in ('needs_author_check', 'author_checks', 'remaining_checks', 'unresolved'):
                for item in x.get(k, []) or []:
                    extra.append((ctx, item))
            for k, v in x.items():
                walk(v, x.get('id', ctx) if isinstance(x.get('id'), str) else ctx)
        elif isinstance(x, list):
            for v in x: walk(v, ctx)
    walk(r)
seen = set(); dedup = []
for ctx, item in extra:
    key = re.sub(r'\s', '', item)[:60]
    if key in seen: continue
    seen.add(key); dedup.append((ctx, item))
# also collect inline markers from the manuscript
inline = []
for f in sorted(glob.glob('book/manuscript/*.md')):
    for m in re.finditer(r'\[要確認[^\]]*\]', open(f, encoding='utf-8').read()):
        inline.append((f.split('/')[-1], m.group(0)))
out = ['# 著者確認リスト（出版前に荒川さん本人が確認する事項）', '',
       '本文は著者の音声メモと公開情報をもとに、編集・執筆チームが「著者ならこう書く」という前提で構成しています。',
       '以下は **本人でなければ真偽を判断できない事項** です。事実と違う箇所は `book/manuscript/*.md` を直接修正し、`book/README.md` の手順で再ビルドしてください。', '',
       '## A. 最優先（掲載可否・実在確認）']
pri = [a for a in plan['author_check_items'] if '最優先' in a or '実名' in a or '長倉' in a]
rest = [a for a in plan['author_check_items'] if a not in pri and not a.startswith('[編集判断]')]
notes = [a for a in plan['author_check_items'] if a.startswith('[編集判断]')]
out += [f'- [ ] {a}' for a in pri]
out += ['', '## B. エピソード・習慣・数字の事実確認（企画段階で洗い出したもの）']
out += [f'- [ ] {a}' for a in rest]
out += ['', '## C. 執筆・編集エージェントが本文を書きながら挙げた確認事項（章別）']
cur = None
for ctx, item in sorted(dedup, key=lambda t: t[0]):
    if ctx != cur:
        out.append(f'\n### {ctx or "全体"}'); cur = ctx
    out.append(f'- [ ] {item}')
if inline:
    out += ['', '## D. 本文中に残っている [要確認] マーク（確認後、マークを消してください）']
    out += [f'- [ ] `{f}`: {m}' for f, m in inline]
out += ['', '## E. 編集判断のメモ（参考）'] + [f'- {a}' for a in notes]
open('book/AUTHOR_CHECKLIST.md', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print(f'checklist: A={len(pri)} B={len(rest)} C={len(dedup)} D={len(inline)}')
