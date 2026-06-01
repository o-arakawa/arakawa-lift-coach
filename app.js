const seedWorkouts = [
  { date: "2026-05-16", exercises: ["ベンチプレス", "ラットプルダウン", "スクワット", "サイドレイズ"], volume: { 胸: 1320, 背中: 715, 脚: 2100, 肩: 140 }, benchMax: 76 },
  { date: "2026-05-17", exercises: ["ベンチプレス", "チェストサポートロー", "ショルダープレス", "サイドレイズ", "ペクトラルフライ"], volume: { 胸: 1880, 背中: 912, 肩: 426 }, benchMax: 66 },
  { date: "2026-05-18", exercises: ["ラットプルダウン", "サイドレイズ", "ハンマーカール", "フェイスプル"], volume: { 背中: 937, 肩: 608, 腕: 881 }, pain: "肩" },
  { date: "2026-05-20", exercises: ["ベンチプレス", "インクラインダンベルプレス", "ケーブルフライ", "フェイスプル"], volume: { 胸: 2715, 肩: 1299 }, benchMax: 76 },
  { date: "2026-05-21", exercises: ["ラットプルダウン", "ローロウ", "インクラインプレス", "プルダウン", "EZバーカール"], volume: { 背中: 6740, 胸: 1430, 腕: 600 } },
  { date: "2026-05-24", exercises: ["ラットプル", "サイドレイズ", "EZバーカール", "ケーブルプルオーバー"], volume: { 背中: 2575, 肩: 192, 腕: 950 } },
  { date: "2026-05-24", exercises: ["ショルダープレスマシン", "ベンチプレス", "ラットプルダウン", "ローロウ"], volume: { 肩: 900, 胸: 3160, 背中: 2631 }, benchMax: 73.3 },
  { date: "2026-05-26", exercises: ["ラットプルダウン", "シーテッドローイング", "ショルダープレス", "スクワット"], volume: { 背中: 3850, 肩: 2100, 脚: 2720 }, pain: "股関節" },
  { date: "2026-05-31", exercises: ["ラットプルダウン", "ベンチプレス", "ローロウ", "ショルダープレスマシン"], volume: { 背中: 3225, 胸: 3255, 肩: 1400, 腕: 1480 }, benchMax: 76 },
];

const bodyPartMap = [
  ["ベンチ", "胸"], ["チェスト", "胸"], ["フライ", "胸"], ["ディップ", "胸"], ["腕立て", "胸"],
  ["ラット", "背中"], ["ロー", "背中"], ["プルダウン", "背中"], ["プルオーバー", "背中"],
  ["スクワット", "脚"], ["ランジ", "脚"], ["レッグ", "脚"],
  ["サイドレイズ", "肩"], ["ショルダー", "肩"], ["フェイスプル", "肩"],
  ["カール", "腕"], ["プレスダウン", "腕"],
  ["プランク", "体幹"], ["腹筋", "体幹"],
  ["ランニング", "有酸素"], ["ウォーク", "有酸素"], ["走", "有酸素"],
];

const programs = {
  chest: {
    title: "胸・背中バランス",
    focus: "胸を伸ばしつつ、肩を守るため背中も入れる",
    warmup: ["肩甲骨まわし 1分", "バーのみ 10回", "40kg x 6"],
    main: ["ベンチプレス 60kg x 6-8 x 3", "止めベンチ 55kg x 6 x 2"],
    accessory: ["インクラインDBプレス 14-16kg x 10 x 3", "ケーブルフライ 12-15回 x 2", "フェイスプル 15回 x 3"],
    finisher: "余力があれば傾斜ウォーク10分",
  },
  pull: {
    title: "背中・腕の厚み",
    focus: "肩の前側を休ませて、引く力と姿勢を作る",
    warmup: ["ラットプル軽め 15回", "フェイスプル軽め 15回"],
    main: ["ラットプルダウン 42.5-50kg x 10 x 3", "ローロウ 50-60kg x 10-12 x 3"],
    accessory: ["ケーブルプルオーバー 12-15回 x 3", "EZバーカール 20-30kg x 10 x 3", "ハンマーカール 8kg x 12 x 2"],
    finisher: "背中を伸ばして終了",
  },
  legs: {
    title: "脚・体幹の再起動",
    focus: "頻度が少ない脚を入れて、全身の土台を上げる",
    warmup: ["股関節まわし 1分", "自重スクワット 10回", "バーのみ 10回"],
    main: ["スクワット 70kg x 8-10 x 3", "80kgはフォーム良い時だけ 1-2セット"],
    accessory: ["レッグプレス or ランジ 10-12回 x 3", "ハンギングレッグレイズ 5-8回 x 2", "プランク 30秒 x 3"],
    finisher: "心拍を上げすぎず徒歩10分",
  },
  conditioning: {
    title: "回復・コンディショニング",
    focus: "疲労を抜きながら次の高重量日に備える",
    warmup: ["傾斜ウォーク 5分", "肩甲骨・股関節を軽く動かす"],
    main: ["ラットプル軽め 15回 x 3", "マシンチェストプレス軽め 12回 x 2"],
    accessory: ["フェイスプル 15回 x 3", "サイドレイズ 15回 x 2", "プランク 30秒 x 2"],
    finisher: "傾斜ウォーク 10-15分",
  },
};

const $ = (id) => document.getElementById(id);
const today = new Date();
let selectedGoal = "muscle";
const exerciseCatalog = ["ベンチプレス", "ラットプルダウン", "ローロウ", "スクワット", "ショルダープレス", "サイドレイズ", "EZバーカール", "ランニング", "その他"];
const exerciseLibrary = [
  {
    id: "bench",
    name: "ベンチプレス",
    part: "胸",
    level: "初心者は軽めから",
    query: "bench press beginner form Japanese",
    prescription: "60kg x 6-8 x 3",
    cues: ["肩甲骨を寄せて下げる", "バーは胸の少し下へ", "肩が痛い日は深く下ろしすぎない"],
    mistakes: ["お尻が浮く", "手首が反る", "毎セット限界までやる"],
    illustration: "bench",
  },
  {
    id: "lat",
    name: "ラットプルダウン",
    part: "背中",
    level: "姿勢づくり",
    query: "lat pulldown beginner form Japanese",
    prescription: "42.5-50kg x 10 x 3",
    cues: ["胸を軽く張る", "肘を下に引く", "首の後ろには引かない"],
    mistakes: ["腕だけで引く", "体を倒しすぎる", "反動で戻す"],
    illustration: "lat",
  },
  {
    id: "squat",
    name: "スクワット",
    part: "脚",
    level: "土台づくり",
    query: "barbell squat beginner form Japanese",
    prescription: "70kg x 8-10 x 3",
    cues: ["足裏全体で押す", "膝とつま先を同じ方向へ", "股関節が痛い日は浅めで止める"],
    mistakes: ["膝が内に入る", "腰から潰れる", "アップなしで重くする"],
    illustration: "squat",
  },
  {
    id: "row",
    name: "ローロウ",
    part: "背中",
    level: "厚みづくり",
    query: "seated row beginner form Japanese",
    prescription: "50-60kg x 10-12 x 3",
    cues: ["胸を張って引く", "肩をすくめない", "最後に肩甲骨を寄せる"],
    mistakes: ["腰を丸める", "反動で引く", "戻しを雑にする"],
    illustration: "row",
  },
  {
    id: "shoulder",
    name: "ショルダープレス",
    part: "肩",
    level: "痛みがなければ",
    query: "shoulder press beginner form Japanese",
    prescription: "軽中重量 x 10 x 3",
    cues: ["肘を少し前に出す", "腰を反りすぎない", "痛みが出たら中止"],
    mistakes: ["真横に肘を開きすぎる", "首をすくめる", "無理に深く下ろす"],
    illustration: "shoulder",
  },
  {
    id: "curl",
    name: "EZバーカール",
    part: "腕",
    level: "仕上げ",
    query: "EZ bar curl beginner form Japanese",
    prescription: "20-30kg x 10 x 3",
    cues: ["肘の位置を固定", "上げ下げをゆっくり", "肩を前に出さない"],
    mistakes: ["反動で上げる", "肘が前後する", "重さを追いすぎる"],
    illustration: "curl",
  },
];

const beginnerProgram = [
  { day: "Day 1", title: "押す + 背中", target: "胸・背中", menu: ["ベンチプレス", "ラットプルダウン", "ケーブルフライ", "フェイスプル"], point: "最初は胸だけで終わらせず、肩を守る背中種目を入れる。" },
  { day: "Day 2", title: "脚 + 体幹", target: "脚・体幹", menu: ["スクワット", "ランジ", "プランク", "傾斜ウォーク"], point: "脚は週1で十分。フォームが崩れる重量は使わない。" },
  { day: "Day 3", title: "引く + 腕", target: "背中・腕", menu: ["ラットプルダウン", "ローロウ", "ケーブルプルオーバー", "EZバーカール"], point: "背中の日を作ると、ベンチの肩痛リスクも下がる。" },
  { day: "Rest", title: "休養・調整", target: "回復", menu: ["散歩", "ストレッチ", "睡眠", "記録だけ残す"], point: "休養日を記録すると、空き日数の判断が正確になる。" },
];

function todayISO() {
  return today.toISOString().slice(0, 10);
}

function getLocalWorkouts() {
  return JSON.parse(localStorage.getItem("arakawa-lift-logs") || "[]");
}

function allWorkouts() {
  return [...seedWorkouts, ...getLocalWorkouts()].sort((a, b) => a.date.localeCompare(b.date));
}

function trainingWorkouts() {
  return allWorkouts().filter((workout) => workout.type !== "rest" && Object.keys(workout.volume || {}).length);
}

function setView(viewId) {
  document.querySelectorAll(".app-view").forEach((view) => view.classList.toggle("is-active", view.id === viewId));
  document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("is-active", button.dataset.view === viewId));
  window.location.hash = viewId.replace("View", "");
}

function daysBetween(dateString) {
  const last = new Date(`${dateString}T00:00:00`);
  return Math.max(0, Math.round((today - last) / 86400000));
}

function aggregateVolume(workouts) {
  return workouts.reduce((acc, workout) => {
    Object.entries(workout.volume || {}).forEach(([part, value]) => {
      acc[part] = (acc[part] || 0) + value;
    });
    return acc;
  }, {});
}

function recentVolume(days = 5) {
  return aggregateVolume(allWorkouts().slice(-days));
}

function lowestPriorityPart() {
  const parts = ["胸", "背中", "脚", "肩", "腕"];
  const volume = recentVolume(6);
  return parts.map((part) => [part, volume[part] || 0]).sort((a, b) => a[1] - b[1])[0][0];
}

function topRecentPart() {
  const volume = recentVolume(4);
  const top = Object.entries(volume).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : "なし";
}

function readiness() {
  const fatigue = Number($("fatigueInput").value);
  const sleep = $("sleepInput").value;
  const alcohol = $("alcoholInput").checked;
  const shoulder = $("shoulderInput").checked;
  const hip = $("hipInput").checked;
  const motivated = $("motivationInput").checked;
  const daysOff = daysBetween(trainingWorkouts().at(-1)?.date || todayISO());

  let score = 82;
  score -= (fatigue - 1) * 9;
  if (sleep === "bad") score -= 14;
  if (sleep === "good") score += 6;
  if (alcohol) score -= 16;
  if (shoulder) score -= 12;
  if (hip) score -= 10;
  if (motivated) score += 5;
  if (daysOff >= 3) score += 7;
  score = Math.max(25, Math.min(98, score));

  const zone = score >= 78 ? "攻めてOK" : score >= 58 ? "普通に積む" : "整える日";
  return { score, zone };
}

function partFromExercise(name) {
  return bodyPartMap.find(([key]) => name.includes(key))?.[1] || "未分類";
}

function parseMemo(text, date = todayISO(), type = "training") {
  const lines = text.split(/\n|、|,/).map((line) => line.trim()).filter(Boolean);
  const volume = {};
  const exercises = [];
  let benchMax = null;
  let pain = "";

  for (const line of lines) {
    if (line.includes("肩") && line.includes("痛")) pain = "肩";
    if (line.includes("股関節") && line.includes("痛")) pain = "股関節";
    const part = partFromExercise(line);
    const exercise = line.replace(/[0-9０-９].*$/, "").replace(/kg|KG/g, "").trim() || line;
    if (!exercises.includes(exercise) && part !== "未分類") exercises.push(exercise);

    const matches = [...line.matchAll(/(\d+(?:\.\d+)?)\s*(?:kg)?\s*[×x✖️]\s*(\d+)/gi)];
    for (const match of matches) {
      const weight = Number(match[1]);
      const reps = Number(match[2]);
      volume[part] = (volume[part] || 0) + weight * reps;
      if (line.includes("ベンチ")) {
        benchMax = Math.max(benchMax || 0, Math.round(weight * (1 + reps / 30) * 10) / 10);
      }
    }
  }

  return {
    date,
    type,
    exercises: exercises.length ? exercises : ["メモ記録"],
    volume,
    benchMax,
    pain,
    raw: text,
  };
}

function emptyWorkout(date, type, memo) {
  return {
    date,
    type,
    exercises: type === "rest" ? ["休養"] : ["体調メモ"],
    volume: {},
    benchMax: null,
    pain: memo.includes("肩") ? "肩" : memo.includes("股関節") ? "股関節" : "",
    raw: memo,
  };
}

function createExerciseRow(values = {}) {
  const row = document.createElement("div");
  row.className = "exercise-row";
  row.innerHTML = `
    <select class="exercise-name">
      ${exerciseCatalog.map((name) => `<option value="${name}" ${values.name === name ? "selected" : ""}>${name}</option>`).join("")}
    </select>
    <input class="exercise-weight" type="number" min="0" step="0.5" placeholder="kg" value="${values.weight ?? ""}" />
    <input class="exercise-reps" type="number" min="0" step="1" placeholder="回数" value="${values.reps ?? ""}" />
    <input class="exercise-sets" type="number" min="1" step="1" placeholder="セット" value="${values.sets ?? 1}" />
    <button class="row-remove" title="削除" aria-label="削除">×</button>
  `;
  row.querySelector(".row-remove").addEventListener("click", () => {
    row.remove();
    if (!$("exerciseRows").children.length) createExerciseRow();
  });
  $("exerciseRows").appendChild(row);
}

function collectStructuredWorkout() {
  const date = $("logDate").value || todayISO();
  const type = $("sessionType").value;
  const memo = $("memoInput").value.trim();
  if (type !== "training") return emptyWorkout(date, type, memo);

  const volume = {};
  const exercises = [];
  let benchMax = null;

  document.querySelectorAll(".exercise-row").forEach((row) => {
    const name = row.querySelector(".exercise-name").value;
    const weight = Number(row.querySelector(".exercise-weight").value);
    const reps = Number(row.querySelector(".exercise-reps").value);
    const sets = Number(row.querySelector(".exercise-sets").value || 1);
    if (!name || !weight || !reps) return;
    const part = partFromExercise(name);
    exercises.push(name);
    volume[part] = (volume[part] || 0) + weight * reps * sets;
    if (name.includes("ベンチ")) {
      benchMax = Math.max(benchMax || 0, Math.round(weight * (1 + reps / 30) * 10) / 10);
    }
  });

  const memoWorkout = memo ? parseMemo(memo, date, type) : null;
  if (memoWorkout) {
    Object.entries(memoWorkout.volume).forEach(([part, value]) => {
      volume[part] = (volume[part] || 0) + value;
    });
  }

  return {
    date,
    type,
    exercises: [...new Set([...exercises, ...(memoWorkout?.exercises || [])])].filter(Boolean),
    volume,
    benchMax: Math.max(benchMax || 0, memoWorkout?.benchMax || 0) || null,
    pain: memoWorkout?.pain || "",
    raw: memo,
  };
}

function chooseProgram() {
  const state = readiness();
  const priority = lowestPriorityPart();
  const top = topRecentPart();
  const shoulder = $("shoulderInput").checked;
  const hip = $("hipInput").checked;
  const time = Number($("timeInput").value);

  if (state.score < 58) return { key: "conditioning", reason: "回復スコアが低め。今日は記録更新より、次に伸びる体を作る。" };
  if (shoulder) return { key: "pull", reason: "肩の違和感があるので、押す高重量を外して背中主導にする。" };
  if (hip) return { key: "chest", reason: "股関節を休ませたいので、脚は避けて上半身を丁寧に積む。" };
  if (selectedGoal === "strength" && top !== "胸") return { key: "chest", reason: "重量更新狙い。ベンチは前回水準が良いので、RPEを管理して攻める。" };
  if (selectedGoal === "fatloss") return { key: time >= 50 ? "legs" : "conditioning", reason: "消費量を作る日。脚か有酸素を入れて、終わった後に軽く息が上がる強度へ。" };
  if (priority === "脚") return { key: "legs", reason: "直近で脚が薄い。全身の伸びを作るために下半身を戻す。" };
  if (top === "胸" || top === "肩") return { key: "pull", reason: "押す種目が続いているので、背中で姿勢と肩の位置を整える。" };
  return { key: "chest", reason: "全体バランスは悪くない。今日は胸を主軸にして気持ちよく積む。" };
}

function currentWorkoutExercises() {
  const choice = chooseProgram();
  const map = {
    chest: ["bench", "lat", "shoulder"],
    pull: ["lat", "row", "curl"],
    legs: ["squat", "row", "bench"],
    conditioning: ["lat", "shoulder", "curl"],
  };
  return (map[choice.key] || ["bench", "lat", "squat"]).map((id) => exerciseLibrary.find((item) => item.id === id));
}

function adjustItems(items) {
  const time = Number($("timeInput").value);
  if (time <= 35) return items.slice(0, 2);
  if (time >= 70) return items;
  return items.slice(0, 3);
}

function renderPlan() {
  const workouts = allWorkouts();
  const last = trainingWorkouts().at(-1);
  const daysOff = last ? daysBetween(last.date) : 0;
  const benchMax = Math.max(...workouts.map((w) => w.benchMax || 0));
  const state = readiness();
  const choice = chooseProgram();
  const program = programs[choice.key];

  $("readinessScore").textContent = state.score;
  $("readinessText").textContent = state.zone;
  $("fatigueValue").textContent = $("fatigueInput").value;
  $("daysOff").textContent = `${daysOff}日`;
  $("priorityPart").textContent = lowestPriorityPart();
  $("benchMax").textContent = benchMax ? `${benchMax}kg` : "-";

  $("planCard").innerHTML = `
    <div class="plan-topline">
      <span>${state.zone}</span>
      <span>${$("timeInput").value}分</span>
    </div>
    <h3>${program.title}</h3>
    <p>${choice.reason}</p>
    <div class="prescription">
      <section>
        <strong>ウォームアップ</strong>
        <ul>${program.warmup.map((item) => `<li>${item}</li>`).join("")}</ul>
      </section>
      <section>
        <strong>メイン</strong>
        <ul>${adjustItems(program.main).map((item) => `<li>${item}</li>`).join("")}</ul>
      </section>
      <section>
        <strong>補助</strong>
        <ul>${adjustItems(program.accessory).map((item) => `<li>${item}</li>`).join("")}</ul>
      </section>
    </div>
    <p class="note">やめ時: 痛みが3/10を超える、フォームが崩れる、またはRPE9を超えたら重量を落とす。</p>
    <button class="primary-button compact-action" data-start-workout>この内容で始める</button>
  `;
  const startButton = document.querySelector("[data-start-workout]");
  startButton?.addEventListener("click", () => setView("workoutView"));
}

function drawChart() {
  const canvas = $("volumeChart");
  const ctx = canvas.getContext("2d");
  const entries = Object.entries(aggregateVolume(allWorkouts())).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map((entry) => entry[1]), 1);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111419";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  entries.forEach(([part, value], index) => {
    const x = 34 + index * 96;
    const barHeight = Math.round((value / max) * 188);
    const y = 238 - barHeight;
    const grad = ctx.createLinearGradient(0, y, 0, 238);
    grad.addColorStop(0, "#ff5f3d");
    grad.addColorStop(1, "#f2c14e");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, 54, barHeight);
    ctx.fillStyle = "#f4f7f8";
    ctx.font = "13px sans-serif";
    ctx.fillText(part, x + 2, 265);
    ctx.fillStyle = "#aab3bd";
    ctx.font = "12px sans-serif";
    ctx.fillText(Math.round(value).toLocaleString(), x - 4, y - 8);
  });
}

function renderNotes() {
  const state = readiness();
  const notes = [];
  if (topRecentPart() === "胸") notes.push(["肩を守る", "胸の頻度が高いので、フェイスプルとロウ系を毎回入れる。"]);
  if (lowestPriorityPart() === "脚") notes.push(["脚を捨てない", "脚の頻度が少ないと全身の消費量と安定感が落ちる。週1回は軽くても入れる。"]);
  if ($("shoulderInput").checked) notes.push(["ベンチ制限", "肩の前側が痛む日は、可動域を浅くするかDB/マシンに変更。"]);
  if ($("hipInput").checked) notes.push(["股関節ケア", "スクワット前に股関節まわし。痛みが出る日は脚をやらない。"]);
  if (state.score >= 78) notes.push(["攻める条件", "今日はメイン種目の最終セットだけ重量を狙ってOK。全セットMAX狙いはしない。"]);
  if (!notes.length) notes.push(["継続優先", "今日の勝ちは、記録を残して次回の判断材料を増やすこと。"]);

  $("coachNotes").innerHTML = notes.map(([title, body]) => `
    <div class="note-item">
      <strong>${title}</strong>
      <span>${body}</span>
    </div>
  `).join("");
}

function renderProgram() {
  $("programGrid").innerHTML = beginnerProgram.map((item, index) => `
    <article class="program-card">
      <div class="program-number">${item.day}</div>
      <div>
        <span>${item.target}</span>
        <h2>${item.title}</h2>
        <ul>${item.menu.map((menu) => `<li>${menu}</li>`).join("")}</ul>
        <p>${item.point}</p>
        <button data-program-start="${index}">この日をやる</button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll("[data-program-start]").forEach((button) => {
    button.addEventListener("click", () => setView("workoutView"));
  });
}

function illustration(type) {
  const common = `<div class="mat"></div><div class="person"><span></span><span></span><span></span><span></span></div>`;
  if (type === "bench") return `<div class="exercise-art bench-art">${common}<div class="barbell"></div><div class="bench-line"></div></div>`;
  if (type === "lat") return `<div class="exercise-art lat-art">${common}<div class="cable"></div><div class="handle"></div></div>`;
  if (type === "squat") return `<div class="exercise-art squat-art">${common}<div class="barbell"></div></div>`;
  if (type === "row") return `<div class="exercise-art row-art">${common}<div class="handle"></div></div>`;
  if (type === "shoulder") return `<div class="exercise-art shoulder-art">${common}<div class="dumbbell left"></div><div class="dumbbell right"></div></div>`;
  return `<div class="exercise-art curl-art">${common}<div class="curlbar"></div></div>`;
}

function videoUrl(item) {
  return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(item.query)}`;
}

function videoSearchUrl(item) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(item.query)}`;
}

function selectExercise(item) {
  $("videoFrame").src = videoUrl(item);
  $("videoSearchLink").href = videoSearchUrl(item);
  $("cueBox").innerHTML = `
    <div class="cue-title">
      <span>${item.part}</span>
      <h2>${item.name}</h2>
      <strong>${item.prescription}</strong>
    </div>
    <div class="cue-grid">
      <section><h3>見るポイント</h3><ul>${item.cues.map((cue) => `<li>${cue}</li>`).join("")}</ul></section>
      <section><h3>初心者NG</h3><ul>${item.mistakes.map((mistake) => `<li>${mistake}</li>`).join("")}</ul></section>
    </div>
  `;
}

function renderWorkoutPlayer() {
  const items = currentWorkoutExercises();
  $("workoutSteps").innerHTML = items.map((item, index) => `
    <button class="workout-step ${index === 0 ? "is-active" : ""}" data-exercise-id="${item.id}">
      ${illustration(item.illustration)}
      <span>${index + 1}</span>
      <strong>${item.name}</strong>
      <small>${item.prescription}</small>
    </button>
  `).join("");

  document.querySelectorAll("[data-exercise-id]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".workout-step").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      selectExercise(exerciseLibrary.find((item) => item.id === button.dataset.exerciseId));
    });
  });
  selectExercise(items[0]);
}

function renderLibrary() {
  $("exerciseLibrary").innerHTML = exerciseLibrary.map((item) => `
    <article class="exercise-card">
      ${illustration(item.illustration)}
      <div class="exercise-content">
        <span>${item.part}・${item.level}</span>
        <h2>${item.name}</h2>
        <p>${item.cues[0]}。${item.mistakes[0]}は避ける。</p>
        <div class="exercise-actions">
          <button data-watch="${item.id}">動画で確認</button>
          <a href="${videoSearchUrl(item)}" target="_blank" rel="noreferrer">YouTube</a>
        </div>
      </div>
    </article>
  `).join("");

  document.querySelectorAll("[data-watch]").forEach((button) => {
    button.addEventListener("click", () => {
      setView("workoutView");
      setTimeout(() => {
        const target = document.querySelector(`[data-exercise-id="${button.dataset.watch}"]`);
        target?.click();
      }, 0);
    });
  });
}

function renderHistory() {
  $("historyList").innerHTML = allWorkouts().slice(-8).reverse().map((workout) => `
    <div class="history-item">
      <strong>${workout.date} ${workout.exercises.slice(0, 3).join(" / ")}</strong>
      <span>${workout.type === "rest" ? "休養日" : Object.entries(workout.volume || {}).map(([k, v]) => `${k}:${Math.round(v)}kg`).join("　") || "メモのみ"}${workout.pain ? `　痛み:${workout.pain}` : ""}</span>
    </div>
  `).join("");
}

function renderMissedDays() {
  const logged = new Set(allWorkouts().map((workout) => workout.date));
  const days = Array.from({ length: 10 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    return date.toISOString().slice(0, 10);
  });

  $("missedList").innerHTML = days.map((date) => {
    const done = logged.has(date);
    return `
      <div class="missed-item ${done ? "is-done" : ""}">
        <strong>${date}</strong>
        <span>${done ? "記録済み" : "未記録"}</span>
        <button data-fill-date="${date}">${done ? "追記" : "この日を記録"}</button>
      </div>
    `;
  }).join("");

  document.querySelectorAll("[data-fill-date]").forEach((button) => {
    button.addEventListener("click", () => {
      $("logDate").value = button.dataset.fillDate;
      setView("logView");
    });
  });
}

function render() {
  renderPlan();
  renderNotes();
  drawChart();
  renderHistory();
  renderMissedDays();
  renderProgram();
  renderWorkoutPlayer();
  renderLibrary();
}

document.querySelectorAll("#goalGroup button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("#goalGroup button").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    selectedGoal = button.dataset.goal;
    render();
  });
});

document.querySelectorAll("[data-template]").forEach((button) => {
  button.addEventListener("click", () => {
    $("memoInput").value = button.dataset.template;
    $("memoInput").focus();
  });
});

$("addExerciseRow").addEventListener("click", () => createExerciseRow());
$("markRestDay").addEventListener("click", () => {
  $("sessionType").value = "rest";
  $("memoInput").value = "休養日";
  document.querySelectorAll(".exercise-row").forEach((row) => row.remove());
});

$("saveLog").addEventListener("click", () => {
  const workout = collectStructuredWorkout();
  if (workout.type === "training" && !workout.exercises.length && !$("memoInput").value.trim()) return;
  const logs = getLocalWorkouts();
  logs.push(workout);
  localStorage.setItem("arakawa-lift-logs", JSON.stringify(logs));
  $("memoInput").value = "";
  $("sessionType").value = "training";
  document.querySelectorAll(".exercise-row").forEach((row) => row.remove());
  createExerciseRow();
  render();
});

$("refreshPlan").addEventListener("click", render);
$("clearLocal").addEventListener("click", () => {
  localStorage.removeItem("arakawa-lift-logs");
  render();
});
["timeInput", "sleepInput", "fatigueInput", "alcoholInput", "shoulderInput", "hipInput", "motivationInput"].forEach((id) => {
  $(id).addEventListener("input", render);
});

$("sessionType").addEventListener("input", () => {
  const isTraining = $("sessionType").value === "training";
  $("exerciseRows").classList.toggle("is-muted", !isTraining);
});

document.querySelectorAll("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById(button.dataset.jump).scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.querySelectorAll(".nav-link").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

$("markExerciseDone").addEventListener("click", () => {
  const active = document.querySelector(".workout-step.is-active");
  active?.classList.add("is-done");
});

$("logDate").value = todayISO();
$("logTime").value = today.toTimeString().slice(0, 5);
createExerciseRow({ name: "ベンチプレス", weight: 60, reps: 8, sets: 3 });
render();

const initial = window.location.hash.replace("#", "");
if (initial) {
  const view = `${initial}View`;
  if (document.getElementById(view)) setView(view);
}
