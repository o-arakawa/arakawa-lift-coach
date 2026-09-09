#!/usr/bin/env python3
"""Turn the workflow's plan result (JSON) into PLAN.json / STYLE.md / FACTS.md for writer agents."""
import json, sys, os
src = sys.argv[1]
out_dir = sys.argv[2]
data = json.load(open(src, encoding="utf-8"))
plan = data["plan"]; research = data.get("research") or {}
os.makedirs(out_dir, exist_ok=True)
json.dump(plan, open(os.path.join(out_dir, "PLAN.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

style = ["# 文体ルール（STYLE）", "", f"書名: 『{plan['title']}』　副題: {plan['subtitle']}", f"キャッチ: {plan['catchcopy']}", "", "## 読者", plan["reader_persona"], "", "## 読者への約束", plan["reader_promise"], "", "## voice_rules"]
style += [f"- {r}" for r in plan["voice_rules"]]
style += ["", "## 禁止事項（forbidden）"] + [f"- {r}" for r in plan["forbidden"]]
style += ["", "## 本全体で繰り返すモチーフ（recurring_motifs）"] + [f"- {r}" for r in plan["recurring_motifs"]]
style += ["", "## 章一覧（重複を避けるため全体を把握すること）"]
for c in plan["chapters"]:
    style.append(f"- {c['id']} ({c['kind']}): {c['title']} — {c['thesis']} [{c['target_chars']}字]")
open(os.path.join(out_dir, "STYLE.md"), "w", encoding="utf-8").write("\n".join(style) + "\n")

facts = ["# 引用してよい事実と言い回し（FACTS）", "", "ここに載っていない研究・数値・逸話・統計は本文に書かない。confidence が low のものは書かない。", ""]
for f in research.get("facts", []):
    facts += [f"## {f['claim']}", f"- 詳細: {f['detail']}", f"- 出典: {f['source']}", f"- 確度: {f['confidence']}", f"- 本文での言い回し例: {f['how_to_cite_in_japanese']}", ""]
facts += ["## 書いてはいけないこと（do_not_claim）"] + [f"- {d}" for d in research.get("do_not_claim", [])]
open(os.path.join(out_dir, "FACTS.md"), "w", encoding="utf-8").write("\n".join(facts) + "\n")
print("chapters:", [(c["id"], c["target_chars"]) for c in plan["chapters"]], "total:", sum(c["target_chars"] for c in plan["chapters"]))
