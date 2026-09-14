
const DAYS=["segunda","terca","quarta","quinta","sexta"];
const workouts=window.WORKOUTS;
const EXERCISE_IMAGES={"elevacao-pelvica": "https://static.strengthlevel.com/images/exercises/hip-thrust/hip-thrust-800.jpg", "flexora": "https://static.strengthlevel.com/images/exercises/lying-leg-curl/lying-leg-curl-800.jpg", "stiff": "https://static.strengthlevel.com/images/exercises/dumbbell-romanian-deadlift/dumbbell-romanian-deadlift-800.jpg", "leg-press": "https://static.strengthlevel.com/images/exercises/sled-leg-press/sled-leg-press-800.jpg", "abdutora": "https://static.strengthlevel.com/images/exercises/hip-abduction/hip-abduction-800.jpg", "gluteo-cabo": "https://static.strengthlevel.com/images/exercises/glute-kickback/glute-kickback-800.jpg", "agachamento-smith": "https://static.strengthlevel.com/images/exercises/smith-machine-squat/smith-machine-squat-800.jpg", "cadeira-extensora": "https://static.strengthlevel.com/images/exercises/leg-extension/leg-extension-800.jpg", "passada": "https://static.strengthlevel.com/images/exercises/dumbbell-lunge/dumbbell-lunge-800.jpg", "panturrilha": "https://static.strengthlevel.com/images/exercises/standing-calf-raise/standing-calf-raise-800.jpg", "puxada-frente": "https://static.strengthlevel.com/images/exercises/lat-pulldown/lat-pulldown-800.jpg", "remada": "https://static.strengthlevel.com/images/exercises/seated-cable-row/seated-cable-row-800.jpg", "supino": "https://static.strengthlevel.com/images/exercises/chest-press/chest-press-800.jpg", "elevacao-lateral": "https://static.strengthlevel.com/images/exercises/dumbbell-lateral-raise/dumbbell-lateral-raise-800.jpg", "rosca-biceps": "https://static.strengthlevel.com/images/exercises/dumbbell-curl/dumbbell-curl-800.jpg", "triceps": "https://static.strengthlevel.com/images/exercises/tricep-pushdown/tricep-pushdown-800.jpg", "abdomen": "https://static.strengthlevel.com/images/exercises/sit-ups/sit-ups-800.jpg"};
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
        <div class="exercise-image"><img src="${EXERCISE_IMAGES[ex[0]]}" alt="Como fazer ${ex[1]}" loading="lazy" referrerpolicy="no-referrer"><span class="img-credit">Imagem: Strength Level</span></div>
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
function renderAll(){
  const weekLabel=document.querySelector("#weekLabel");
  if(weekLabel) weekLabel.textContent=weekRange();
  renderTabs();
  renderDay();
  renderProgress();
}

let currentView="treino";

function allStats(){
  let total=0,done=0;
  const byDay={};
  DAYS.forEach(day=>{
    const w=workouts[day];
    const d=w.exercises.filter((_,i)=>isDone(day,i)).length;
    byDay[day]={done:d,total:w.exercises.length,pct:Math.round((d/w.exercises.length)*100)};
    total+=w.exercises.length; done+=d;
  });
  return {total,done,pct:Math.round((done/total)*100),byDay};
}

function setActiveBottomNav(view){
  document.querySelectorAll(".nav-btn").forEach(btn=>{
    btn.classList.toggle("active",btn.dataset.view===view);
  });
}

function showTreino(){
  currentView="treino";
  setActiveBottomNav("treino");
  document.querySelector("#navView").classList.add("hidden");
  document.querySelector("#tabs").classList.remove("hidden");
  document.querySelector("#dayContent").classList.remove("hidden");
  document.querySelector(".summary").classList.remove("hidden");
  renderAll();
  window.scrollTo({top:0,behavior:"smooth"});
}

function showProgress(){
  currentView="progresso";
  setActiveBottomNav("progresso");
  document.querySelector("#tabs").classList.add("hidden");
  document.querySelector("#dayContent").classList.add("hidden");
  document.querySelector(".summary").classList.add("hidden");

  const s=allStats();
  const view=document.querySelector("#navView");
  view.classList.remove("hidden");
  view.innerHTML=`
    <section class="page-card card">
      <p class="eyebrow">PROGRESSO</p>
      <h2>Seu progresso semanal</h2>
      <div class="big-progress">${s.pct}%</div>
      <div class="progress"><span style="width:${s.pct}%"></span></div>
      <p class="muted">${s.done} de ${s.total} exercícios concluídos nesta semana.</p>
    </section>
    <div class="stats-grid">
      ${DAYS.map(day=>`
        <button class="day-stat card" data-go-day="${day}" type="button">
          <strong>${workouts[day].label}</strong>
          <span>${s.byDay[day].done}/${s.byDay[day].total}</span>
          <div class="mini-progress"><i style="width:${s.byDay[day].pct}%"></i></div>
          <small>${s.byDay[day].pct}% concluído</small>
        </button>`).join("")}
    </div>`;
  view.querySelectorAll("[data-go-day]").forEach(btn=>{
    btn.onclick=()=>{
      activeDay=btn.dataset.goDay;
      showTreino();
    };
  });
  window.scrollTo({top:0,behavior:"smooth"});
}

function showWeek(){
  currentView="semana";
  setActiveBottomNav("semana");
  document.querySelector("#tabs").classList.add("hidden");
  document.querySelector("#dayContent").classList.add("hidden");
  document.querySelector(".summary").classList.add("hidden");

  const s=allStats();
  const view=document.querySelector("#navView");
  view.classList.remove("hidden");
  view.innerHTML=`
    <section class="page-card card">
      <p class="eyebrow">SEMANA</p>
      <h2>${weekRange()}</h2>
      <p class="muted">Toque em um dia para abrir o treino.</p>
    </section>
    <div class="week-list">
      ${DAYS.map(day=>{
        const st=s.byDay[day];
        return `<button class="week-row card" data-week-day="${day}" type="button">
          <div>
            <strong>${workouts[day].label}</strong>
            <span>${workouts[day].subtitle}</span>
          </div>
          <div class="week-row-right">
            <b>${st.done}/${st.total}</b>
            <small>${st.pct}%</small>
          </div>
        </button>`;
      }).join("")}
    </div>`;
  view.querySelectorAll("[data-week-day]").forEach(btn=>{
    btn.onclick=()=>{
      activeDay=btn.dataset.weekDay;
      showTreino();
    };
  });
  window.scrollTo({top:0,behavior:"smooth"});
}

function showCompleted(){
  currentView="concluidos";
  setActiveBottomNav("concluidos");
  document.querySelector("#tabs").classList.add("hidden");
  document.querySelector("#dayContent").classList.add("hidden");
  document.querySelector(".summary").classList.add("hidden");

  const completed=[];
  DAYS.forEach(day=>{
    workouts[day].exercises.forEach((ex,i)=>{
      if(isDone(day,i)) completed.push({day,ex,i});
    });
  });

  const view=document.querySelector("#navView");
  view.classList.remove("hidden");
  view.innerHTML=`
    <section class="page-card card">
      <p class="eyebrow">CONCLUÍDOS</p>
      <h2>Exercícios finalizados</h2>
      <p class="muted">${completed.length ? `${completed.length} exercício(s) concluído(s) nesta semana.` : "Você ainda não marcou nenhum exercício como concluído."}</p>
    </section>
    <div class="completed-list">
      ${completed.length ? completed.map(item=>`
        <button class="completed-row card" data-complete-day="${item.day}" type="button">
          <span class="done-badge">✓</span>
          <div>
            <strong>${item.ex[1]}</strong>
            <small>${workouts[item.day].label} • ${item.ex[2]}</small>
          </div>
        </button>`).join("") : `
        <div class="empty-state card">
          <div>💪</div>
          <strong>Comece o treino</strong>
          <span>Os exercícios que você concluir aparecerão aqui.</span>
        </div>`}
    </div>`;
  view.querySelectorAll("[data-complete-day]").forEach(btn=>{
    btn.onclick=()=>{
      activeDay=btn.dataset.completeDay;
      showTreino();
    };
  });
  window.scrollTo({top:0,behavior:"smooth"});
}

function initBottomNav(){
  document.querySelectorAll(".nav-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const view=btn.dataset.view;
      if(view==="treino") showTreino();
      if(view==="progresso") showProgress();
      if(view==="semana") showWeek();
      if(view==="concluidos") showCompleted();
    });
  });
}

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
