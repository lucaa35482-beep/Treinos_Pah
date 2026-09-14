
const DAYS = ["segunda","terca","quarta","quinta","sexta"];
const workouts = window.WORKOUTS;
const STORAGE_KEY = "treinoSemanal_v1";

function pad(n){ return String(n).padStart(2,"0"); }
function localDateKey(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function mondayOf(date){
  const d = new Date(date.getFullYear(),date.getMonth(),date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1-day;
  d.setDate(d.getDate()+diff);
  d.setHours(0,0,0,0);
  return d;
}
function weekKey(date=new Date()){ return localDateKey(mondayOf(date)); }
function weekRange(){
  const m = mondayOf(new Date()); const f = new Date(m); f.setDate(m.getDate()+4);
  return `Semana de ${pad(m.getDate())}/${pad(m.getMonth()+1)} a ${pad(f.getDate())}/${pad(f.getMonth()+1)}`;
}
function initialState(){ return {week:weekKey(), done:{}}; }
function loadState(){
  let s;
  try{s=JSON.parse(localStorage.getItem(STORAGE_KEY))}catch(e){}
  if(!s || s.week !== weekKey()){
    s = initialState();
    localStorage.setItem(STORAGE_KEY,JSON.stringify(s));
  }
  return s;
}
let state = loadState();
let activeDay = (() => {
  const n = new Date().getDay();
  if(n>=1 && n<=5) return DAYS[n-1];
  return "segunda";
})();

function save(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }
function itemKey(day,index){ return `${day}:${index}`; }
function isDone(day,index){ return !!state.done[itemKey(day,index)]; }

function renderTabs(){
  const tabs = document.querySelector("#tabs");
  tabs.innerHTML = DAYS.map(day => {
    const w = workouts[day];
    return `<button class="tab ${day===activeDay?"active":""}" data-day="${day}">${w.label}</button>`;
  }).join("");
  tabs.querySelectorAll(".tab").forEach(btn => btn.onclick = () => {
    activeDay = btn.dataset.day; renderAll();
  });
}
function renderDay(){
  const w = workouts[activeDay];
  const total = w.exercises.length;
  const done = w.exercises.filter((_,i)=>isDone(activeDay,i)).length;
  document.querySelector("#dayContent").innerHTML = `
    <section class="day-head card">
      <div>
        <p class="eyebrow">${w.label.toUpperCase()}</p>
        <h2>${w.subtitle}</h2>
        <div class="day-meta">
          <span class="pill">🔥 Aquecimento: ${w.warmup}</span>
          <span class="pill">🏃 Cardio: ${w.cardio}</span>
          <span class="pill">${done}/${total} exercícios</span>
        </div>
      </div>
      <div class="${done===total?"day-done":"muted"}">${done===total?"✓ Treino concluído":"Marque cada exercício"}</div>
    </section>
    <div class="exercise-list">
      ${w.exercises.map((ex,i)=>`
        <article class="exercise card ${isDone(activeDay,i)?"done":""}">
          <img src="images/${ex[0]}.svg" alt="Demonstração de ${ex[1]}">
          <div>
            <h3 class="exercise-title">${ex[1]}</h3>
            <div class="reps">${ex[2]}</div>
            <p class="tip">${ex[3]}</p>
          </div>
          <button class="check ${isDone(activeDay,i)?"done":""}" data-i="${i}" aria-label="Marcar ${ex[1]} como concluído">${isDone(activeDay,i)?"✓":"○"}</button>
        </article>
      `).join("")}
    </div>
    <section class="finish card">
      <div>
        <strong>${done===total?"Treino do dia finalizado!":"Continue firme 💪"}</strong>
        <div class="muted">${done===total?"Seu progresso ficou salvo neste aparelho.":"Conclua os exercícios para fechar o dia."}</div>
      </div>
      <span>${Math.round(done/total*100)}%</span>
    </section>`;
  document.querySelectorAll(".check").forEach(btn => btn.onclick = () => {
    const i = Number(btn.dataset.i); const k = itemKey(activeDay,i);
    state.done[k] = !state.done[k]; save(); renderAll();
    if(state.done[k]) toast("Exercício concluído ✓");
  });
}
function renderProgress(){
  let total=0, done=0;
  DAYS.forEach(day => workouts[day].exercises.forEach((_,i)=>{total++; if(isDone(day,i))done++;}));
  const pct = Math.round(done/total*100);
  document.querySelector("#progressText").textContent = `${pct}% concluído • ${done}/${total}`;
  document.querySelector("#progressBar").style.width = `${pct}%`;
}
function toast(msg){
  const t=document.querySelector("#toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(window.__toast); window.__toast=setTimeout(()=>t.classList.remove("show"),1800);
}
function renderAll(){
  document.querySelector("#weekLabel").textContent = weekRange();
  renderTabs(); renderDay(); renderProgress();
}
document.querySelector("#resetBtn").onclick = () => {
  if(confirm("Quer apagar o progresso desta semana e começar de novo?")){
    state = initialState(); save(); renderAll(); toast("Semana resetada");
  }
};
renderAll();
