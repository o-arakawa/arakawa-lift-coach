const seedLogs = [
  { date: "2026-05-26", raw: "ラットプル50×10、シーテッドロー50×12、スクワット80×10。股関節めっちゃ痛くなった", type: "training" },
  { date: "2026-05-31", raw: "ベンチ60×8、60×8、65×5、ローロウ60×12、ショルダープレス50×10", type: "training" },
];

const partRules = [
  ["ベンチ|チェスト|フライ|ディップ|腕立て", "胸"],
  ["ラット|ロー|プルダウン|プルオーバー", "背中"],
  ["スクワット|ランジ|レッグ", "脚"],
  ["サイドレイズ|ショルダー|フェイスプル", "肩"],
  ["カール|プレスダウン", "腕"],
  ["プランク|腹筋", "体幹"],
  ["ランニング|ウォーク|走", "有酸素"],
];

const hintRules = [
  { test: (p) => !p.sets.length, text: "種目は「ベンチ60×8」みたいに書くと自動でセット数とボリュームを拾えます。", add: "ベンチ60×8、60×8" },
  { test: (p) => !p.bodyWeight, text: "体重も一緒に残すと、増量/減量の判断がかなり楽になります。", add: "体重72.4kg" },
  { test: (p) => !p.sleepHours, text: "睡眠を書いておくと、重い日と軽い日の理由が見えます。", add: "睡眠6時間" },
  { test: (p) => !p.pain, text: "痛みや違和感はメニュー調整に直結します。肩・腰・股関節だけでも十分です。", add: "肩ちょい痛い" },
  { test: (p) => !p.goal, text: "目的を書くと、次回提案が「伸ばす」「絞る」「整える」に寄ります。", add: "今日は胸を伸ばしたい" },
  { test: (p) => !p.cardioMinutes, text: "有酸素も残せます。減量中なら特にあとで効きます。", add: "ランニング15分" },
];

const $ = (id) => document.getElementById(id);
const today = new Date();

function iso(date) {
  return date.toISOString().slice(0, 10);
}

function getLogs() {
  return JSON.parse(localStorage.getItem("arakawa-simple-logs") || "[]");
}

function allLogs() {
  return [...seedLogs, ...getLogs()].sort((a, b) => a.date.localeCompare(b.date));
}

function partOf(text) {
  const found = partRules.find(([pattern]) => new RegExp(pattern).test(text));
  return found ? found[1] : "メモ";
}

function parseMemo(raw, date = $("logDate").value || iso(today), type = "training") {
  const sets = [];
  const volume = {};
  const exercises = new Set();
  let benchMax = 0;
  let lastPart = "メモ";
  let lastExercise = "";

  const chunks = raw.split(/\n|、|,/).map((item) => item.trim()).filter(Boolean);
  for (const chunk of chunks) {
    const detectedPart = partOf(chunk);
    const detectedExercise = chunk.replace(/[0-9０-９].*$/, "").replace(/kg/gi, "").trim();
    const hasLoad = /(\d+(?:\.\d+)?)\s*(?:kg)?\s*[×x✖️]\s*(\d+)/i.test(chunk);
    if (detectedPart !== "メモ") lastPart = detectedPart;
    if (detectedExercise && detectedPart !== "メモ") lastExercise = detectedExercise;
    const part = hasLoad ? lastPart : detectedPart;
    const exercise = detectedExercise || (hasLoad ? lastExercise : "");
    if (exercise && part !== "メモ") exercises.add(exercise);
    const matches = [...chunk.matchAll(/(\d+(?:\.\d+)?)\s*(?:kg)?\s*[×x✖️]\s*(\d+)/gi)];
    for (const match of matches) {
      const weight = Number(match[1]);
      const reps = Number(match[2]);
      const estimated = Math.round(weight * (1 + reps / 30) * 10) / 10;
      sets.push({ part, exercise: exercise || chunk, weight, reps, estimated });
      volume[part] = (volume[part] || 0) + weight * reps;
      if (chunk.includes("ベンチ")) benchMax = Math.max(benchMax, estimated);
      if (exercise) lastExercise = exercise;
      lastPart = part;
    }
  }

  const pain = raw.includes("肩") && raw.includes("痛") ? "肩" : raw.includes("腰") && raw.includes("痛") ? "腰" : raw.includes("股関節") && raw.includes("痛") ? "股関節" : "";
  const alcohol = raw.includes("飲ん") || raw.includes("酒");
  const fatigue = raw.includes("疲労") || raw.includes("だる") || raw.includes("重い");
  const bodyWeight = raw.match(/体重\s*(\d+(?:\.\d+)?)\s*kg?/i)?.[1] || "";
  const bodyFat = raw.match(/体脂肪\s*(\d+(?:\.\d+)?)\s*%?/i)?.[1] || "";
  const sleepHours = raw.match(/睡眠\s*(\d+(?:\.\d+)?)\s*(?:時間|h)?/i)?.[1] || "";
  const steps = raw.match(/歩数\s*(\d+)\s*歩?/i)?.[1] || "";
  const cardioMinutes = raw.match(/(?:ランニング|ウォーク|有酸素|歩き)\s*(\d+)\s*分/i)?.[1] || "";
  const protein = raw.includes("たんぱく") || raw.includes("タンパク") || raw.includes("プロテイン");
  const goal = raw.includes("減量") || raw.includes("絞") ? "減量" : raw.includes("重量更新") || raw.includes("MAX") ? "重量更新" : raw.includes("整える") || raw.includes("軽め") ? "調整" : raw.includes("伸ばしたい") ? "伸ばす" : "";

  return {
    date,
    raw,
    type,
    sets,
    volume,
    exercises: [...exercises],
    benchMax,
    pain,
    alcohol,
    fatigue,
    bodyWeight,
    bodyFat,
    sleepHours,
    steps,
    cardioMinutes,
    protein,
    goal,
  };
}

function daysSinceLastTraining() {
  const logs = allLogs().map((log) => parseMemo(log.raw, log.date, log.type)).filter((log) => log.type !== "rest" && log.sets.length);
  const last = logs.at(-1);
  if (!last) return 0;
  return Math.max(0, Math.round((today - new Date(`${last.date}T00:00:00`)) / 86400000));
}

function weakPart() {
  const recent = allLogs().slice(-5).map((log) => parseMemo(log.raw, log.date, log.type));
  const totals = { 胸: 0, 背中: 0, 脚: 0, 肩: 0, 腕: 0 };
  for (const log of recent) {
    Object.entries(log.volume).forEach(([part, value]) => {
      if (part in totals) totals[part] += value;
    });
  }
  return Object.entries(totals).sort((a, b) => a[1] - b[1])[0][0];
}

function menuFor(parsed) {
  if (parsed.type === "rest") {
    return { title: "休養でOK", reason: "今日は記録だけで勝ち。明日は軽く再開できる。", items: ["散歩 10分", "肩甲骨まわし", "睡眠を優先"] };
  }
  if (parsed.pain === "肩") {
    return { title: "PULL 軽め", reason: "肩が怪しい日はベンチ高重量を外す。背中で整える。", items: ["ラットプル 15回 x 3", "ローロウ 12回 x 3", "フェイスプル 15回 x 3"] };
  }
  if (parsed.pain === "股関節") {
    return { title: "上半身だけ", reason: "股関節が怪しい日は脚を外す。痛みゼロで帰る。", items: ["ベンチ 軽中重量 x 3", "ラットプル x 3", "サイドレイズ軽め x 2"] };
  }
  if (parsed.pain === "腰") {
    return { title: "腰を守る日", reason: "腰が怪しい日はスクワットや重いローを避ける。支えのある種目へ。", items: ["チェストプレス 12回 x 3", "ラットプル 12回 x 3", "有酸素 10分"] };
  }
  if (parsed.sleepHours && Number(parsed.sleepHours) < 6) {
    return { title: "睡眠不足の調整", reason: "睡眠が少ない日は重量更新を狙わない。フォーム練習で勝ち。", items: ["メイン種目 80%重量 x 3", "補助 2種目だけ", "RPE7まで"] };
  }
  if (parsed.alcohol || parsed.fatigue) {
    return { title: "調整日", reason: "飲酒か疲労がある日は記録更新を狙わない。", items: ["マシン中心 12回 x 2-3", "有酸素 10-15分", "RPE7まで"] };
  }
  if (parsed.goal === "減量") {
    return { title: "減量向け", reason: "筋トレは落とさず、有酸素を少し足す。やりすぎないのが継続向き。", items: ["大きい種目 2つ", "補助 1つ", "有酸素 15分"] };
  }
  if (parsed.goal === "重量更新") {
    return { title: "重量更新狙い", reason: "更新は最初のメイン種目だけ。補助は控えめで十分。", items: ["メイン種目 アップ丁寧に", "トップセット 1回だけ挑戦", "バックオフ 2セット"] };
  }
  if (weakPart() === "脚") {
    return { title: "脚・体幹", reason: "直近で脚が薄い。軽くても入れる価値あり。", items: ["スクワット 70kg x 8-10 x 3", "プランク 30秒 x 3", "傾斜ウォーク 10分"] };
  }
  return { title: "胸・背中", reason: "ベンチを伸ばしつつ、背中も入れて肩を守る。", items: ["ベンチ 60kg x 6-8 x 3", "ラットプル 10回 x 3", "フェイスプル 15回 x 3"] };
}

function renderParsed(parsed) {
  const parts = Object.entries(parsed.volume).map(([part, value]) => `<span>${part} ${Math.round(value)}kg</span>`).join("");
  const lifestyle = [
    parsed.bodyWeight ? `<span>体重:${parsed.bodyWeight}kg</span>` : "",
    parsed.bodyFat ? `<span>体脂肪:${parsed.bodyFat}%</span>` : "",
    parsed.sleepHours ? `<span>睡眠:${parsed.sleepHours}h</span>` : "",
    parsed.steps ? `<span>歩数:${Number(parsed.steps).toLocaleString()}歩</span>` : "",
    parsed.cardioMinutes ? `<span>有酸素:${parsed.cardioMinutes}分</span>` : "",
    parsed.protein ? "<span>食事/たんぱく質</span>" : "",
    parsed.goal ? `<span>目的:${parsed.goal}</span>` : "",
  ].join("");
  $("parsedBox").innerHTML = `
    <div class="metric-row">
      <div><strong>${parsed.sets.length}</strong><span>セット</span></div>
      <div><strong>${parsed.benchMax ? `${parsed.benchMax}kg` : "-"}</strong><span>ベンチ推定</span></div>
      <div><strong>${daysSinceLastTraining()}日</strong><span>空き日数</span></div>
    </div>
    <div class="tag-list">${parts || "<span>メモとして保存</span>"}${lifestyle}${parsed.pain ? `<span>痛み:${parsed.pain}</span>` : ""}${parsed.alcohol ? "<span>飲酒</span>" : ""}${parsed.fatigue ? "<span>疲労</span>" : ""}</div>
  `;
}

function renderPlan(parsed) {
  const plan = menuFor(parsed);
  $("planBox").innerHTML = `
    <h3>${plan.title}</h3>
    <p>${plan.reason}</p>
    <ul>${plan.items.map((item) => `<li>${item}</li>`).join("")}</ul>
  `;
}

function renderMissed() {
  const recorded = new Set(allLogs().map((log) => log.date));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    return iso(date);
  });
  $("missedList").innerHTML = days.map((date) => `
    <button class="${recorded.has(date) ? "done" : ""}" data-date="${date}">
      <strong>${date}</strong>
      <span>${recorded.has(date) ? "記録済み" : "未記録"}</span>
    </button>
  `).join("");
  document.querySelectorAll("[data-date]").forEach((button) => {
    button.addEventListener("click", () => {
      $("logDate").value = button.dataset.date;
      $("rawMemo").focus();
    });
  });
}

function renderHints(parsed) {
  const hints = hintRules.filter((hint) => hint.test(parsed)).slice(0, 4);
  $("hintBox").innerHTML = hints.map((hint) => `
    <button data-hint-add="${hint.add}">
      <span>${hint.text}</span>
      <strong>追加する</strong>
    </button>
  `).join("");
  document.querySelectorAll("[data-hint-add]").forEach((button) => {
    button.addEventListener("click", () => {
      appendMemo(button.dataset.hintAdd);
    });
  });
}

function renderHistory() {
  $("historyList").innerHTML = allLogs().slice(-8).reverse().map((log) => {
    const parsed = parseMemo(log.raw, log.date, log.type);
    const summary = Object.entries(parsed.volume).map(([part, value]) => `${part}:${Math.round(value)}kg`).join(" / ");
    return `<article><strong>${log.date}</strong><p>${log.raw}</p><span>${summary || (log.type === "rest" ? "休養" : "メモ")}</span></article>`;
  }).join("");
}

function render() {
  const parsed = parseMemo($("rawMemo").value || allLogs().at(-1)?.raw || "", $("logDate").value || iso(today));
  renderParsed(parsed);
  renderPlan(parsed);
  renderHints(parsed);
  renderMissed();
  renderHistory();
}

function appendMemo(text) {
  const prefix = $("rawMemo").value.trim() ? "\n" : "";
  $("rawMemo").value += `${prefix}${text}`;
  $("rawMemo").focus();
  render();
}

$("saveMemo").addEventListener("click", () => {
  const raw = $("rawMemo").value.trim();
  if (!raw) return;
  const logs = getLogs();
  logs.push({ date: $("logDate").value || iso(today), raw, type: raw === "休養" ? "rest" : "training" });
  localStorage.setItem("arakawa-simple-logs", JSON.stringify(logs));
  $("rawMemo").value = "";
  render();
});

$("yesterdayButton").addEventListener("click", () => {
  const date = new Date(today);
  date.setDate(today.getDate() - 1);
  $("logDate").value = iso(date);
  $("rawMemo").focus();
});

$("restButton").addEventListener("click", () => {
  $("rawMemo").value = "休養";
  render();
});

document.querySelectorAll("[data-add]").forEach((button) => {
  button.addEventListener("click", () => {
    appendMemo(button.dataset.add);
  });
});

$("rawMemo").addEventListener("input", render);
$("logDate").value = iso(today);
$("clearLogs").addEventListener("click", () => {
  localStorage.removeItem("arakawa-simple-logs");
  render();
});

render();
