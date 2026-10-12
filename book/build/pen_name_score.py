#!/usr/bin/env python3
"""Score pen-name candidates: 五格剖象法 (stroke counts, 新字体 & 康熙) + Pythagorean numerology on romaji.
Usage: python3 pen_name_score.py research.json > scores.json
research.json = workflow result {seimei:{...}, numero:{...}, names:{candidates:[...]}}
"""
import json, sys, re, unicodedata

def reduce_num(n, masters=(11, 22, 33)):
    while n > 9 and n not in masters:
        n = sum(int(d) for d in str(n))
    return n

PYTH = {c: ((i % 9) + 1) for i, c in enumerate("ABCDEFGHIJKLMNOPQRSTUVWXYZ")}
def expression(romaji):
    letters = [c for c in unicodedata.normalize("NFKD", romaji.upper()) if c in PYTH]
    return reduce_num(sum(PYTH[c] for c in letters)), sum(PYTH[c] for c in letters)

def five_grid(sei, mei, reisu=True):
    """sei, mei: lists of stroke counts. Returns dict of 天格/人格/地格/外格/総格 (熊崎式, 霊数 for 1-char names)."""
    ten = sum(sei)
    jin = sei[-1] + mei[0]
    chi = sum(mei) + (1 if (reisu and len(mei) == 1) else 0)
    sou = sum(sei) + sum(mei)
    if len(mei) == 1:
        gai = sei[0] + (1 if reisu else 0)
    else:
        gai = sei[0] + mei[-1]
    return {"天格": ten, "人格": jin, "地格": chi, "外格": gai, "総格": sou}

def main():
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    sm = data["seimei"]; nm = data["numero"]; cands = data["names"]["candidates"]
    rank = {t["n"]: t["rank"] for t in sm["table81"]}
    meaning = {t["n"]: t["meaning"] for t in sm["table81"]}
    good = set(sm.get("best_numbers_for_author_business", []))
    fit = {x["n"]: x["fit_for_author_business"] for x in nm["number_meanings"]}
    score_rank = {"大吉": 3, "吉": 2, "半吉": 1, "凶": -3, "大凶": -5}
    sei_shin = [sm["ara_strokes_shin"], sm["kawa_strokes"]]
    sei_kyu = [sm["ara_strokes_kyu"], sm["kawa_strokes"]]
    out = []
    for c in cands:
        rec = {"kanji": c["kanji"], "reading": c["reading"], "romaji": c["romaji"], "impression": c["impression"]}
        total = 0
        for label, sei, mei in (("shin", sei_shin, c["strokes_shin"]), ("kyu", sei_kyu, c["strokes_kyu"])):
            g = five_grid(sei, mei)
            ranks = {k: rank.get(v, "?") for k, v in g.items()}
            # 天格 is inherited and usually ignored; weight 人格・総格 highest
            w = {"人格": 3, "総格": 3, "地格": 2, "外格": 2, "天格": 0}
            sc = sum(score_rank.get(ranks[k], -1) * w[k] for k in g)
            bad = [k for k in ("人格", "地格", "外格", "総格") if ranks[k] in ("凶", "大凶", "?")]
            rec[label] = {"grids": g, "ranks": ranks, "score": sc, "bad": bad,
                          "bonus_numbers": [k for k in ("人格", "総格") if g[k] in good]}
            total += sc
        full = "ARAKAWA " + c["romaji"]
        ex, raw = expression(full)
        rec["numerology"] = {"full_romaji": full, "expression": ex, "raw_sum": raw, "fit": fit.get(ex, "?")}
        nfit = {"高": 6, "中": 2, "低": -4}.get(str(fit.get(ex, ""))[:1], 0)
        rec["total_score"] = total + nfit
        rec["all_clear_both"] = not rec["shin"]["bad"] and not rec["kyu"]["bad"]
        rec["all_clear_shin"] = not rec["shin"]["bad"]
        out.append(rec)
    out.sort(key=lambda r: (-int(r["all_clear_both"]), -int(r["all_clear_shin"]), -r["total_score"]))
    json.dump({"sei_strokes": {"shin": sei_shin, "kyu": sei_kyu}, "results": out}, sys.stdout, ensure_ascii=False, indent=1)

if __name__ == "__main__":
    main()
