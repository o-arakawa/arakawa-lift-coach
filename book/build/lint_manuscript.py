#!/usr/bin/env python3
"""Deterministic checks on the manuscript: forbidden words, char counts, structure, notation drift."""
import json, os, re, sys
ms = sys.argv[1] if len(sys.argv) > 1 else 'book/manuscript'
plan = json.load(open('book/plan/PLAN.json', encoding='utf-8'))
targets = {c['id']: c['target_chars'] for c in plan['chapters']}
FORBIDDEN = [r'コンサル', r'コーチ', r'ファシリテート', r'ソリューション', r'アジェンダ', r'マネタイズ', r'ナレッジ', r'コンテンツ',
             r'不労所得', r'裏技', r'最短で', r'人生が変わる', r'誰でも', r'必ず', r'簡単に稼', r'月\d+万', r'年収', r'時給', r'思索の小道', r'Thinking Path']
DRIFT = [r'三行', r'三つの質問', r'3つの質問', r'10分の', r'十五分', r'七割', r'三割', r'問い三つ', r'仮説一つ']
ok = True
total = 0
for c in plan['chapters']:
    path = os.path.join(ms, c['id'] + '.md')
    if not os.path.exists(path):
        print(f'[MISSING] {path}'); ok = False; continue
    s = open(path, encoding='utf-8').read()
    n = len(re.sub(r'\s', '', s)); total += n
    t = targets[c['id']]
    flag = '' if abs(n - t) <= t * 0.12 else '  <-- OUT OF RANGE'
    print(f'{c["id"]:10s} {n:6d} chars (target {t}){flag}')
    if not s.lstrip().startswith('# '):
        print('   [STRUCT] no H1'); ok = False
    h2 = len(re.findall(r'^## ', s, flags=re.M))
    if c['kind'] == 'chapter' and not (3 <= h2 <= 7):
        print(f'   [STRUCT] h2 count={h2}')
    if s.count(':::box') != len(re.findall(r'^:::\s*$', s, flags=re.M)):
        print('   [STRUCT] unbalanced :::box'); ok = False
    if c['kind'] == 'chapter' and ':::box' not in s:
        print('   [STRUCT] no takeaway box')
    for pat in FORBIDDEN:
        for m in re.finditer(pat, s):
            ctx = s[max(0, m.start()-25):m.end()+25].replace('\n', ' ')
            print(f'   [FORBIDDEN:{pat}] …{ctx}…')
    for pat in DRIFT:
        for m in re.finditer(pat, s):
            ctx = s[max(0, m.start()-20):m.end()+20].replace('\n', ' ')
            print(f'   [DRIFT:{pat}] …{ctx}…')
    for m in re.finditer(r'\[要確認[^\]]*\]', s):
        print(f'   [CHECK] {m.group(0)}')
    if re.search(r'[!！]{2,}', s): print('   [STYLE] multiple exclamation marks')
    ex = len(re.findall(r'！', s))
    if ex > 6: print(f'   [STYLE] {ex} exclamation marks')
print(f'TOTAL {total} chars')
sys.exit(0 if ok else 1)
