
const DAYS=["segunda","terca","quarta","quinta","sexta"];
const workouts=window.WORKOUTS;
const STORAGE_KEY="treinosPah_v2";
let deferredPrompt=null;

function pad(n){return String(n).padStart(2,"0")}
function localDateKey(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function mondayOf(date){
  const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());
  const day=d.getDay(), diff=day===0?-6:1-day;
  d.setDate(d.getDate()+diff);d.setHours(0,0,0,0);return d;
}
function weekKey(date=new Date()){return localDateKey(mondayOf(date))}
function weekRange(){
  const m=mondayOf(new Date()), f=new Date(m);f.setDate(m.getDate()+4);
  return `Semana ${pad(m.getDate())}/${pad(m.getMonth()+1)} a ${pad(f.getDate())}/${pad(f.getMonth()+1)}`;
}
function initialState(){return {week:weekKey(),done:{}}}
function loadState(){
  let s=null;try{s=JSON.parse(localStorage.getItem(STORAGE_KEY))}catch(e){}
  if(!s||s.week!==weekKey()){s=initialState();localStorage.setItem(STORAGE_KEY,JSON.stringify(s))}
  return s;
}
let state=loadState();
let activeDay=(()=>{const d=new Date().getDay();return d>=1&&d<=5?DAYS[d-1]:"segunda"})();

function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function itemKey(day,i){return `${day}:${i}`}
function isDone(day,i){return !!state.done[itemKey(day,i)]}

function renderTabs(){
  const el=document.querySelector("#tabs");
  el.innerHTML=DAYS.map(d=>`<button class="tab ${d===activeDay?"active":""}" data-day="${d}">${workouts[d].short}</button>`).join("");
  el.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{activeDay=b.dataset.day;renderAll();window.scrollTo({top:0,behavior:"smooth"})});
}
function renderDay(){
  const w=workouts[activeDay], total=w.exercises.length, done=w.exercises.filter((_,i)=>isDone(activeDay,i)).length;
  document.querySelector("#dayContent").innerHTML=`
    <section class="day-head card">
      <p class="eyebrow">${w.label.toUpperCase()}</p>
      <h2>${w.subtitle}</h2>
      <div class="day-meta">
        <span class="pill">🔥 ${w.warmup}</span>
        <span class="pill">🏃 ${w.cardio}</span>
        <span class="pill">${done}/${total} feitos</span>
      </div>
      <div class="status-line ${done===total?"done":""}">${done===total?"✓ Treino do dia concluído":"Marque cada exercício quando terminar"}</div>
    </section>
    <div class="exercise-list">
    ${w.exercises.map((ex,i)=>`
      <article class="exercise card ${isDone(activeDay,i)?"done":""}">
        <div class="exercise-image"><img src="images/${ex[0]}.svg" alt="Como fazer ${ex[1]}"></div>
        <div class="exercise-body">
          <div class="exercise-top">
            <div><h3 class="exercise-title">${ex[1]}</h3><div class="reps">${ex[2]}</div></div>
            <button class="check ${isDone(activeDay,i)?"done":""}" data-i="${i}" aria-label="Marcar exercício">${isDone(activeDay,i)?"✓":"○"}</button>
          </div>
          <p class="tip">${ex[3]}</p>
        </div>
      </article>`).join("")}
    </div>
    <section class="finish card">
      <div><strong>${done===total?"Treino finalizado! 🎉":"Continue firme 💪"}</strong><div class="muted">${done===total?"O progresso ficou salvo neste aparelho.":"Você pode fechar e voltar depois."}</div></div>
      <div class="pct">${Math.round(done/total*100)}%</div>
    </section>`;
  document.querySelectorAll(".check").forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.i), k=itemKey(activeDay,i);
    state.done[k]=!state.done[k];save();renderAll();if(state.done[k])toast("Exercício concluído ✓");
  });
}
function renderProgress(){
  let total=0,done=0;
  DAYS.forEach(d=>workouts[d].exercises.forEach((_,i)=>{total++;if(isDone(d,i))done++}));
  const p=Math.round(done/total*100);
  document.querySelector("#progressText").textContent=`${p}% concluído • ${done}/${total}`;
  document.querySelector("#progressBar").style.width=`${p}%`;
}
function renderAll(){document.querySelector("#weekLabel").textContent=weekRange();renderTabs();renderDay();renderProgress()}
function toast(msg){const t=document.querySelector("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(window.__t);window.__t=setTimeout(()=>t.classList.remove("show"),1700)}

document.querySelector("#resetBtn").onclick=()=>{if(confirm("Apagar todo o progresso desta semana?")){state=initialState();save();renderAll();toast("Semana resetada")}}

window.addEventListener("beforeinstallprompt",(e)=>{
  e.preventDefault();deferredPrompt=e;document.querySelector("#installBtn").classList.remove("hidden");
});
document.querySelector("#installBtn").onclick=async()=>{
  if(deferredPrompt){
    deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;document.querySelector("#installBtn").classList.add("hidden");
  }else{
    document.querySelector("#installHelp").classList.remove("hidden");
  }
};
document.querySelector("#closeInstallHelp").onclick=()=>document.querySelector("#installHelp").classList.add("hidden");
document.querySelector("#installHelp").onclick=(e)=>{if(e.target.id==="installHelp")e.currentTarget.classList.add("hidden")};

// iOS does not fire beforeinstallprompt
const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone=window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
if(isIOS && !standalone)document.querySelector("#installBtn").classList.remove("hidden");

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
renderAll();
