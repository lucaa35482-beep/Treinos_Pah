
const DAYS=["segunda","terca","quarta","quinta","sexta"];
const workouts=window.WORKOUTS;
const EXERCISE_IMAGES={
"elevacao-pelvica":"https://static.strengthlevel.com/images/exercises/hip-thrust/hip-thrust-800.jpg",
"flexora":"https://static.strengthlevel.com/images/exercises/lying-leg-curl/lying-leg-curl-800.jpg",
"stiff":"https://static.strengthlevel.com/images/exercises/dumbbell-romanian-deadlift/dumbbell-romanian-deadlift-800.jpg",
"leg-press":"https://static.strengthlevel.com/images/exercises/sled-leg-press/sled-leg-press-800.jpg",
"abdutora":"https://static.strengthlevel.com/images/exercises/hip-abduction/hip-abduction-800.jpg",
"gluteo-cabo":"https://static.strengthlevel.com/images/exercises/glute-kickback/glute-kickback-800.jpg",
"agachamento-smith":"https://static.strengthlevel.com/images/exercises/smith-machine-squat/smith-machine-squat-800.jpg",
"cadeira-extensora":"https://static.strengthlevel.com/images/exercises/leg-extension/leg-extension-800.jpg",
"passada":"https://static.strengthlevel.com/images/exercises/dumbbell-lunge/dumbbell-lunge-800.jpg",
"panturrilha":"https://static.strengthlevel.com/images/exercises/standing-calf-raise/standing-calf-raise-800.jpg",
"puxada-frente":"https://static.strengthlevel.com/images/exercises/lat-pulldown/lat-pulldown-800.jpg",
"remada":"https://static.strengthlevel.com/images/exercises/seated-cable-row/seated-cable-row-800.jpg",
"supino":"https://static.strengthlevel.com/images/exercises/chest-press/chest-press-800.jpg",
"elevacao-lateral":"https://static.strengthlevel.com/images/exercises/dumbbell-lateral-raise/dumbbell-lateral-raise-800.jpg",
"rosca-biceps":"https://static.strengthlevel.com/images/exercises/dumbbell-curl/dumbbell-curl-800.jpg",
"triceps":"https://static.strengthlevel.com/images/exercises/tricep-pushdown/tricep-pushdown-800.jpg",
"abdomen":"https://static.strengthlevel.com/images/exercises/sit-ups/sit-ups-800.jpg"
};

const VIDEO_MATCHES={
"elevacao-pelvica":["hip thrust","lever hip thrust","bridge pose"],
"flexora":["lever seated leg curl","lever lying leg curl","leg curl","band prone leg curl"],
"stiff":["dumbbell romanian deadlift","dumbbell straight leg deadlift","barbell straight leg deadlift","dumbbell deadlift"],
"leg-press":["leg press","close feet leg press"],
"abdutora":["hip abduction","band hip abduction"],
"gluteo-cabo":["cable glute kickback","glute kickback","lever standing rear kick","band one-leg kickback"],
"agachamento-smith":["smith squat","smith machine squat","squat","barbell back squat"],
"cadeira-extensora":["leg extension","lever leg extension","band seated leg extension"],
"passada":["dumbbell lunge","barbell lunge","lunge"],
"panturrilha":["lever standing calf raise","standing calf raise","dumbbell standing calf raise","band standing calf raise"],
"puxada-frente":["cable pulldown","lat pulldown","cable close grip lat pulldown"],
"remada":["seated row","cable seated row","band seated row","cable one-arm twisting seated row"],
"supino":["chest press","lever chest press","barbell bench press"],
"elevacao-lateral":["dumbbell lateral raise","cable lateral raise","lateral raise"],
"rosca-biceps":["dumbbell biceps curl","barbell curl","cable one arm curl"],
"triceps":["cable triceps pushdown","cable rope triceps pushdown","band triceps pushdown","triceps pushdown"],
"abdomen":["bench crunch","sit-up","sit up","cable kneeling crunch","crunch"]
};

const EXERCISE_API="https://exercise-database.zenithfits.com/api/v1/exercises?limit=317";
let EXERCISE_DB=[];
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

function normalizeText(s){
  return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
}
function findVideoFor(key){
  if(!EXERCISE_DB.length) return null;
  const candidates=VIDEO_MATCHES[key]||[];
  for(const candidate of candidates){
    const target=normalizeText(candidate);
    let exact=EXERCISE_DB.find(x=>normalizeText(x.name)===target);
    if(exact) return exact;
    let contains=EXERCISE_DB.find(x=>normalizeText(x.name).includes(target));
    if(contains) return contains;
  }
  return null;
}
function getVideoUrl(item){
  if(!item) return null;
  const videos=item.videos||{};
  return videos.female || videos.male || null;
}
function getPoster(item){
  if(!item) return null;
  const thumbs=item.thumbnails||{};
  return thumbs.female || thumbs.male || null;
}
function hydrateVideos(){
  document.querySelectorAll(".exercise-media").forEach(box=>{
    const key=box.dataset.exercise;
    const item=findVideoFor(key);
    const url=getVideoUrl(item);
    if(!url) {
      const loading=box.querySelector(".video-loading");
      if(loading) loading.textContent="Imagem demonstrativa";
      return;
    }
    if(box.querySelector("video")) return;
    const poster=getPoster(item) || EXERCISE_IMAGES[key] || "";
    const video=document.createElement("video");
    video.className="exercise-video";
    video.src=url;
    video.poster=poster;
    video.muted=true;
    video.loop=true;
    video.autoplay=true;
    video.playsInline=true;
    video.preload="metadata";
    video.setAttribute("webkit-playsinline","");
    video.setAttribute("aria-label",`Vídeo demonstrando ${item.name||"o exercício"}`);
    video.addEventListener("canplay",()=>{
      const img=box.querySelector(".fallback-img");
      const loading=box.querySelector(".video-loading");
      if(img) img.classList.add("hidden-media");
      if(loading) loading.classList.add("hidden-media");
    });
    video.addEventListener("error",()=>{
      video.remove();
      const loading=box.querySelector(".video-loading");
      if(loading) loading.textContent="Imagem demonstrativa";
    });
    box.insertBefore(video,box.firstChild);
  });
}
async function loadExerciseVideos(){
  const cacheKey="treinosPah_exerciseDb_v1";
  try{
    const cached=localStorage.getItem(cacheKey);
    if(cached){
      const parsed=JSON.parse(cached);
      if(parsed && Array.isArray(parsed.data) && Date.now()-parsed.savedAt<7*24*60*60*1000){
        EXERCISE_DB=parsed.data;
        hydrateVideos();
        return;
      }
    }
  }catch(e){}
  try{
    const res=await fetch(EXERCISE_API,{mode:"cors"});
    if(!res.ok) throw new Error("API indisponível");
    const payload=await res.json();
    EXERCISE_DB=Array.isArray(payload.data)?payload.data:(Array.isArray(payload)?payload:[]);
    if(EXERCISE_DB.length){
      try{localStorage.setItem(cacheKey,JSON.stringify({savedAt:Date.now(),data:EXERCISE_DB}))}catch(e){}
      hydrateVideos();
    }
  }catch(e){
    document.querySelectorAll(".video-loading").forEach(el=>el.textContent="Imagem demonstrativa");
  }
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
        <div class="exercise-media" data-exercise="${ex[0]}">
          <img class="fallback-img" src="${EXERCISE_IMAGES[ex[0]]}" alt="Como fazer ${ex[1]}" loading="lazy" referrerpolicy="no-referrer">
          <div class="video-loading">▶ Carregando demonstração...</div>
          <span class="img-credit">Demonstração do exercício</span>
        </div>
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
  hydrateVideos();
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
loadExerciseVideos();
