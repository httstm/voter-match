const AXES = ["leadership","thinking","empathy","adaptability"];


// TODO: CSV読み込みに変更する

async function loadCandidatesFromCSV() {
  const response = await fetch("candidates.csv");
  let text = await response.text();

  // BOM除去（重要）
  text = text.replace(/^\uFEFF/, "");

  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map(h => h.trim());

  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim());
    const obj = { name: values[1], scores: {} };

    for (let j = 1; j < headers.length; j++) {
      obj.scores[headers[j]] = Number(values[j]);
    }

    result.push(obj);
  }

  return result;
}


let candidates = [];
let candidatesLoaded = false;

loadCandidatesFromCSV().then(data => {
  candidates = data;
  candidatesLoaded = true;
});

document.getElementById("surveyForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  // CSV未ロードなら待つ
  if (!candidatesLoaded) {
    candidates = await loadCandidatesFromCSV();
    candidatesLoaded = true;
  }

  const formData = new FormData(e.target);
  const user = {};

  AXES.forEach(axis => {
    user[axis] = Number(formData.get(axis));
  });

  const results = candidates.map(c => {
    let diff = 0;
    AXES.forEach(axis => {
      diff += Math.abs(user[axis] - c.scores[axis]);
    });
    const maxDiff = AXES.length * 4;
    const matchRate = Math.round((1 - diff / maxDiff) * 100);
    return { name: c.name, rate: matchRate };
  });

  results.sort((a, b) => b.rate - a.rate);

  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "";

  results.forEach(r => {
    const p = document.createElement("p");
    p.textContent = `${r.name}：一致度 ${r.rate}%`;
    resultDiv.appendChild(p);
  });
});
