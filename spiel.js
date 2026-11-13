const desk = document.querySelector("#desk");
const map = document.querySelector("#map");
const features = document.querySelector("#features");
const metrics = document.querySelector("#metrics");
const restart = document.querySelector("#restart-dialog");
const reset = document.querySelector("#reset");
const labels = ["Arbeitsplätze", "Natur", "Lebensqualität"];
const icons = ["jobs", "nature", "life"];
const initial = [35, 74, 49];
const key = "alpenrat-tannenbrunn-v1";
const signs = value => value < 0 ? `−${-value}` : value > 0 ? `+${value}` : "0";
const clamp = value => Math.max(0, Math.min(100, value));
const icon = id => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
const jokes = [
  "Meine Prognose: Der erste Stau fängt mit einem Auto an.",
  "Ich vermiete meine Höhle erst, wenn jemand die Kissen ausschüttelt.",
  "Der Skiverein sagt: steil. Meine Knie sagen: Zeitung lesen.",
  "Der Parkplatz ist voll. Der Berg hat leider keinen zweiten Eingang.",
  "Der Wald hat keine Lobby. Aber ich kenne da einen Specht.",
  "Wandern ist wie Skifahren. Nur bergauf. Und ohne Ski.",
  "Das beste Mitbringsel ist Käse. Sagt auch mein Rucksack.",
  "Ich höre wieder die Vögel. Die waren die ganze Zeit da.",
  "Schnee auf Knopfdruck. Kann das Ding auch Käse?",
  "Wildtiere hätten gern Ruhe. Schriftlich beantragen können sie die schlecht.",
  "Bremsen ist auch eine Sportart. Besonders vor meiner Höhle.",
  "Ein Zug voll Käse. Endlich reden wir über die wichtigen Dinge.",
  "Der Investor sagt Panorama. Die Wiese sagt bis später.",
  "Ich protokolliere alles. Außer, wer den Kuchen aufgegessen hat.",
  "52 Jahre im Amt. So lange hält bei mir sonst nur der Winterschlaf."
];

const positions = [[15,83],[61,62],[26,43],[76,79],[43,42],[57,86],[43,70],[31,77],[17,58],[79,39],[66,51],[85,62],[83,91],[51,56],[91,49]];
const shapes = {
  hotel: '<path fill="#ead3aa" d="M3 8h18v13H3z"/><path fill="#ac6551" d="m2 8 10-5 10 5z"/><path d="M7 12h1m4 0h1m4 0h1m-11 4h1m4 0h1m4 0h1m-6 5v-3"/>',
  lift: '<path d="m2 7 20-4M12 5v5"/><rect fill="#e8a382" x="6" y="10" width="13" height="9" rx="2"/><path d="M9 13h7m-4 0v3"/>',
  rail: '<rect fill="#a7cbd7" x="3" y="5" width="17" height="13" rx="3"/><path d="M6 9h4m4 0h3M7 18l-2 3m11-3 2 3m-12-6h1m9 0h1"/>',
  bus: '<rect fill="#d6bc76" x="3" y="6" width="18" height="12" rx="3"/><path d="M6 10h4m3 0h4M7 18v2m10-2v2m-11-5h1m10 0h1"/>',
  nature: '<path fill="#8caa76" d="m12 2-6 7h3l-5 6h4l-4 4h16l-4-4h4l-5-6h3z"/><path d="M12 19v3"/>',
  road: '<path fill="#c3b69b" d="m3 21 6-18h6l6 18z"/><path d="M12 5v3m0 3v3m0 3v3"/>',
  parking: '<rect fill="#d7e4ea" x="4" y="4" width="16" height="16" rx="3"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
  walk: '<circle cx="13" cy="5" r="2"/><path d="m9 20 3-6 3 3 1 3m-4-6 1-5 3 3h4m-7-3-4 3H6"/>',
  snow: '<path d="M12 3v18M4 7l16 10M4 17 20 7M9 5l3 3 3-3m-6 14 3-3 3 3"/>',
  bike: '<circle cx="6" cy="16" r="4"/><circle cx="18" cy="16" r="4"/><path d="m6 16 4-8 4 8H6m8 0 3-6 1 6m-9-8h3m4-2h3"/>',
  house: '<path fill="#eddbb7" d="M4 10h16v11H4z"/><path fill="#b86b52" d="m2 10 10-7 10 7z"/><path d="M10 21v-7h4v7m-7-7h.5m9 0h.5"/>',
  piste: '<path fill="#e5eef2" d="m3 20 8-15 5 8 2-4 4 11z"/><path d="m13 11-2 3 3 2-3 3"/>'
};
const kinds = [
  ["road","road","bus"],["hotel","house","house"],["lift","lift","walk"],
  ["parking","parking","bus"],["piste","piste","nature"],["house","walk","walk"],
  ["house","house","house"],["road","bus","bus"],["snow","snow","walk"],
  ["walk","nature","nature"],["bike","bike","bike"],["bus","rail","house"],
  ["hotel","house","house"],["house","house","house"],["piste","nature","bus"]
];

function newGame() { return { stage: "intro", picks: [] }; }

function load() {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    if (!value || !Array.isArray(value.picks) || value.picks.length > rounds.length ||
        !value.picks.every(n => Number.isInteger(n) && n >= 0 && n < 3)) return newGame();
    const count = value.picks.length;
    const valid = (value.stage === "intro" && !count) ||
      (value.stage === "choice" && count < rounds.length) ||
      (value.stage === "effect" && count > 0) ||
      (value.stage === "report" && count === rounds.length);
    return valid ? value : newGame();
  } catch { return newGame(); }
}

let state = load();

function record(picks) {
  const scores = [...initial];
  return picks.map((choice, i) => {
    const option = rounds[i][3 + choice];
    const before = [...scores];
    const later = [];
    const apply = delta => delta.forEach((n, j) => { scores[j] = clamp(scores[j] + n); });
    apply(option[1]);
    picks.slice(0, i).forEach((earlierChoice, earlier) => {
      const consequence = rounds[earlier][3 + earlierChoice][4];
      if (consequence?.[0] === i + 1) {
        apply(consequence[1]);
        later.push(consequence);
      }
    });
    return { choice, option, scores: [...scores], before, later };
  });
}

function update(next, focus = true) {
  state = next;
  try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  render();
  if (focus) document.querySelector("#panel-title").focus({ preventScroll: window.innerWidth > 860 });
}

function addReporter(message) {
  const node = document.querySelector("#reporter").content.cloneNode(true);
  node.querySelector("p").textContent = message;
  desk.append(node);
}

function renderMap(index, history, current) {
  const last = history.at(-1);
  const progress = index / (rounds.length - 1);
  map.style.setProperty("--sepia", 1 - progress);
  map.style.setProperty("--saturation", .83 + .22 * progress);
  document.querySelector("#year").textContent = rounds[index][0];
  document.querySelector("#steps").innerHTML = rounds.map((_, i) =>
    `<i class="step ${i < history.length ? "done" : i === index ? "active" : ""}"></i>`).join("");
  features.replaceChildren();
  const label = document.querySelector("#map-label");
  label.textContent = last ? last.option[0] : "Bauernhöfe und Bergwald";
  history.forEach(({ choice, option }, i) => {
    const marker = document.createElement("button");
    const kind = kinds[i][choice];
    marker.type = "button";
    marker.className = "feature" + (current && i === history.length - 1 ? " new" : "");
    marker.dataset.kind = kind;
    marker.style.setProperty("--x", `${positions[i][0]}%`);
    marker.style.setProperty("--y", `${positions[i][1]}%`);
    marker.setAttribute("aria-label", `${rounds[i][0]}: ${option[0]}`);
    marker.title = option[0];
    marker.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24">${shapes[kind]}</svg>`;
    marker.addEventListener("click", () => { label.textContent = `${rounds[i][0]} · ${option[0]}`; });
    features.append(marker);
  });
  metrics.innerHTML = (last?.scores ?? initial).map((score, i) => {
    const change = current ? score - last.before[i] : 0;
    return `<div class="metric ${icons[i]}"><div class="metric-label">${icon(icons[i])}${labels[i]}</div>
      <div class="meter" role="meter" aria-label="${labels[i]}" aria-valuenow="${score}" aria-valuemin="0" aria-valuemax="100"><i style="--value:${score}%"></i></div>
      <div class="metric-value"><strong>${score}</strong>/100${change ? `<span class="delta ${change > 0 ? "up" : "down"}">${signs(change)}</span>` : ""}</div></div>`;
  }).join("");
}

function render() {
  const { stage, picks } = state;
  const history = record(picks);
  const index = Math.max(0, stage === "choice" ? picks.length : picks.length - 1);
  const [year, title, prompt, ...choices] = rounds[index];
  reset.hidden = stage === "intro";
  renderMap(index, history, stage === "effect");
  const heading = text => `<h2 id="panel-title" tabindex="-1">${text}</h2>`;

  if (stage === "intro") {
    desk.innerHTML = `<span class="eyebrow">TANNENBRUNN · 1950</span>${heading("Ab ins Bürgermeisteramt")}
      <p class="lead">Tannenbrunn ist ein kleines Alpendorf. Jetzt kommen die ersten Urlaubsgäste. Du entscheidest, wie sich dein Dorf bis 2002 entwickelt.</p>
      <button class="primary intro-action" id="start">Amt antreten <span aria-hidden="true">→</span></button>`;
    addReporter("Ich bin Murmel, der Dorfreporter. Meine Höhle bleibt bitte in der ruhigen Lage.");
    document.querySelector("#start").onclick = () => update({ stage: "choice", picks: [] });
    return;
  }

  if (stage === "report") {
    renderReport(history, heading);
    return;
  }

  const badge = `<div class="eyebrow kicker">${icon("clock")} ${year} · Beschluss ${index + 1} von ${rounds.length}</div>`;
  if (stage === "choice") {
    const scores = history.at(-1)?.scores ?? initial;
    desk.innerHTML = `${badge}${heading(title)}<p class="lead">${prompt}</p>
      <div class="choices">${choices.map(([label, delta], i) => `<button type="button" class="choice" data-choice="${i}">
        <span class="letter">${"ABC"[i]}</span><span><span class="choice-title">${label}</span><span class="impact">
        ${delta.map((value, j) => { const effective = clamp(scores[j] + value) - scores[j]; return `<span class="${effective > 0 ? "up" : effective < 0 ? "down" : ""}" aria-label="${labels[j]}: ${signs(effective)}" title="${labels[j]}">${icon(icons[j])}${signs(effective)}</span>`; }).join("")}
        </span></span></button>`).join("")}</div>`;
    addReporter(jokes[index]);
    desk.querySelectorAll(".choice").forEach(button => {
      button.onclick = () => update({ stage: "effect", picks: [...picks, Number(button.dataset.choice)] });
    });
    return;
  }

  const { option, later } = history.at(-1);
  desk.innerHTML = `${badge}${heading(option[0])}<p class="lead">${option[2]}</p>
    ${later.length ? `<ul class="events">${later.map(([, delta, note]) => `<li><strong>Spätfolge</strong>${note} <span class="impact">${delta.map((value, j) => `<span title="${labels[j]}" aria-label="${labels[j]}: ${signs(value)}">${icon(icons[j])}${signs(value)}</span>`).join("")}</span></li>`).join("")}</ul>` : ""}
    <button id="next" class="primary next">${picks.length === rounds.length ? "Dorfbericht lesen" : "Zum nächsten Beschluss"} <span aria-hidden="true">→</span></button>`;
  document.querySelector("#next").onclick = () => update({ stage: picks.length === rounds.length ? "report" : "choice", picks });
}

function renderReport(history, heading) {
  const scores = history.at(-1).scores;
  const wins = [
    ["Arbeitsplätze", "Du hast Beschäftigung im Dorf gestärkt.", "Du hast bei mehreren Beschlüssen Arbeit im Ort gesichert."],
    ["Natur", "Du hast den Wert für die Natur verbessert.", "Mit einigen Entscheidungen hast du Eingriffe begrenzt."],
    ["Lebensqualität", "Du hast das Leben im Dorf verbessert.", "Mit einzelnen Beschlüssen hast du den Alltag im Ort erleichtert."]
  ];
  const challenges = [
    "Wie könnten Höfe, Pensionen und Handwerk mehr Arbeit vor Ort schaffen?",
    "Wie schützt der Ort Bergwald und Almwiesen auch bei vielen Gästen?",
    "Wie kann das Dorf Verkehr und Lärm senken und trotzdem erreichbar bleiben?"
  ];
  const order = [0, 1, 2].sort((a, b) => (scores[b] - initial[b]) - (scores[a] - initial[a]));
  const biggestProblem = order[2];
  desk.innerHTML = `<span class="eyebrow">TANNENBRUNN · 2002</span>${heading("Dein Dorfbericht")}
    <div class="report-items">${order.slice(0, 2).map(i => {
      const [title, positive, partial] = wins[i];
      const project = [...history].sort((a, b) => b.option[1][i] - a.option[1][i])[0].option[0];
      return `<article class="report-item success"><h3>${title}</h3><p>${scores[i] > initial[i] ? positive : partial} Ein Beispiel: <strong>${project}</strong>.</p></article>`;
    }).join("")}<article class="report-item"><h3>Offene Baustelle · ${labels[biggestProblem]}</h3><p>${challenges[biggestProblem]}</p></article></div>
    <details><summary>Deine 15 Beschlüsse ansehen</summary><ol class="log">${history.map(({ option }, i) => `<li>${rounds[i][0]} · ${option[0]}</li>`).join("")}</ol></details>`;
  addReporter("Sonderausgabe! Ich drucke sie auf Papier. Die Almwiese bleibt stehen.");
}

document.querySelector("#help").onclick = () => document.querySelector("#rules").showModal();
reset.onclick = () => { restart.returnValue = ""; restart.showModal(); };
restart.addEventListener("close", () => { if (restart.returnValue === "restart") update(newGame()); });
render();
