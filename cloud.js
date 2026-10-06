// ===== Sign-in, cloud sync and class dashboard (Supabase) =====
(function(){
const CFG=window.QA_CONFIG||{};
const CLOUD=!!(CFG.supabaseUrl&&CFG.supabaseAnonKey&&window.supabase);
const DOMAIN=(CFG.usernameDomain||'example.com').replace(/^@/,'');
// students type a name; the app turns it into the hidden account email (ahmed -> ahmed@example.com)
const toEmail=s=>{s=String(s||'').trim().toLowerCase();return s.includes('@')?s:s.replace(/\s+/g,'')+'@'+DOMAIN;};
const DAY=86400000;
const isAppKey=k=>k&&(k.startsWith('kalimat.')||k==='lq-companion-v1');
const readLocal=()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(isAppKey(k))o[k]=localStorage.getItem(k);}return o;};
const clearLocal=()=>Object.keys(readLocal()).forEach(k=>localStorage.removeItem(k));
const writeLocal=o=>{clearLocal();for(const k in o)if(o[k]!=null)localStorage.setItem(k,o[k]);};
const J=s=>{try{return JSON.parse(s);}catch(e){return null;}};
// ---- merging two copies of the same student's progress (from two iPads) ----
const lastRev=c=>c?(c.d||0)-(c.v||0)*DAY:-Infinity;
function mergeCards(a,b){const o={...(b||{})};for(const k in (a||{}))if(!(k in o)||lastRev(a[k])>=lastRev(o[k]))o[k]=a[k];return o;}
const pday=s=>{if(!s)return 0;const [y,m,d]=String(s).split('-').map(Number);return new Date(y,(m||1)-1,d||1).getTime();};
function mergeKey(k,A,B){if(A==null)return B;if(B==null)return A;const a=J(A),b=J(B);if(a==null||b==null)return A;
 if(k==='kalimat.srs2')return JSON.stringify(mergeCards(a,b));
 if(k==='kalimat.starred')return JSON.stringify({...b,...a});
 if(k==='kalimat.milestone')return JSON.stringify(Math.max(+a||0,+b||0));
 if(k==='kalimat.streak'){const ta=pday(a.last),tb=pday(b.last);return JSON.stringify(ta>tb||(ta===tb&&(a.n||0)>=(b.n||0))?a:b);}
 if(k==='lq-companion-v1'){const o={...b,...a};o.done={...(b.done||{}),...(a.done||{})};o.best={...(b.best||{})};for(const u in (a.best||{}))o.best[u]=Math.max(a.best[u],o.best[u]||0);
  o.score={...(b.score||{})};for(const q in (a.score||{}))if(!o.score[q]||(a.score[q].t||0)>=(o.score[q].t||0))o.score[q]=a.score[q];
  o.gsrs=mergeCards(a.gsrs,b.gsrs);o.miss={...(b.miss||{})};for(const u in (a.miss||{}))o.miss[u]=[...new Set([...(o.miss[u]||[]),...a.miss[u]])].sort();return JSON.stringify(o);}
 return A;}
function mergeAll(A,B){const o={};new Set([...Object.keys(A||{}),...Object.keys(B||{})]).forEach(k=>{const v=mergeKey(k,A&&A[k],B&&B[k]);if(v!=null)o[k]=v;});return o;}
// ---- summary the teacher sees ----
function summary(name){const d=readLocal();const S=J(d['lq-companion-v1'])||{};const srs=J(d['kalimat.srs2'])||{};const st=J(d['kalimat.streak'])||{};const now=Date.now();
 let K=null,L=null;try{K=document.getElementById('fK').contentWindow.K;L=document.getElementById('fL').contentWindow.LQA;}catch(e){}
 const bests=S.best||{},bv=Object.values(bests);
 const miss=S.miss||{};const weak=Object.entries(miss).map(([u,a])=>[u,a.filter(t=>now-t<14*DAY).length]).filter(x=>x[1]>=2).sort((a,b)=>b[1]-a[1]).slice(0,5);
 return {name,lastActive:new Date().toISOString(),unitsDone:Object.keys(S.done||{}).length,avgBest:bv.length?Math.round(bv.reduce((a,b)=>a+b,0)/bv.length):null,bests,lastUnit:S.last||null,
  gramDue:Object.values(S.gsrs||{}).filter(c=>c.d<=now).length,weak,wordsStudied:Object.values(srs).filter(c=>c.r>0).length,wordsDue:Object.values(srs).filter(c=>c.d<=now).length,
  coverage:K&&K.coveragePct?Math.round(K.coveragePct()*10)/10:null,streak:st.n||0,streakLast:st.last||null};}
// ---- state ----
let sb=null,user=null,profile=null,dirty=false,busy=false,lastOk=null,online=navigator.onLine;
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function status(){const el=$('#acct .st');if(!el)return;el.textContent=!online?'Offline — changes are kept on this iPad and sync later':busy?'Syncing…':dirty?'Changes waiting to sync':lastOk?`Saved ${ago(lastOk)}`:'Up to date';}
const ago=t=>{const s=Math.round((Date.now()-t)/1000);return s<60?'just now':s<3600?Math.round(s/60)+' min ago':Math.round(s/3600)+' h ago';};
async function push(){if(!CLOUD||!user||busy||!navigator.onLine)return false;busy=true;status();
 try{const r=await sb.from('progress').select('data').eq('user_id',user.id).maybeSingle();if(r.error)throw r.error;
  const merged=mergeAll(readLocal(),r.data&&r.data.data&&r.data.data.keys);
  const w=await sb.from('progress').upsert({user_id:user.id,data:{keys:merged},summary:summary(profile&&profile.name),updated_at:new Date().toISOString()});if(w.error)throw w.error;
  dirty=false;lastOk=Date.now();busy=false;status();return true;}
 catch(e){busy=false;dirty=true;status();return false;}}
window.addEventListener('storage',e=>{if(isAppKey(e.key)){dirty=true;status();}});
window.addEventListener('online',()=>{online=true;status();push();});window.addEventListener('offline',()=>{online=false;status();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&dirty)push();});
setInterval(()=>{if(dirty)push();else status();},30000);
// ---- screens ----
function gate(html){let g=$('#gate');if(!g){g=document.createElement('div');g.id='gate';document.body.appendChild(g);}g.innerHTML=`<div class="gbox">${html}</div>`;return g;}
function closeGate(){const g=$('#gate');if(g)g.remove();}
function loginScreen(msg){const g=gate(`<div class="ar gbrand">لِسَانٌ عَرَبِيٌّ مُبِينٌ</div><h1>Sign in</h1><p class="muted">Type your name and the password your teacher gave you.</p>
 <label>Name<input id="gE" type="text" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="e.g. ahmed"></label>
 <label>Password<input id="gP" type="password" autocomplete="current-password"></label>
 <p class="gerr">${esc(msg||'')}</p><button class="btn solid" id="gGo">Sign in</button>`);
 const go=async()=>{const e=toEmail($('#gE').value),p=$('#gP').value;if(!e||!p)return;$('#gGo').disabled=true;$('#gGo').textContent='Signing in…';
  const r=await sb.auth.signInWithPassword({email:e,password:p});
  if(r.error){loginScreen(navigator.onLine?'That name and password did not match. Check with your teacher.':'You need internet to sign in the first time.');return;}
  user=r.data.user;await afterLogin();};
 $('#gGo').onclick=go;$('#gP').onkeydown=e=>{if(e.key==='Enter')go();};}
function nameScreen(){return new Promise(res=>{gate(`<h1>Welcome</h1><p class="muted">What name should your teacher see?</p><label>Your name<input id="gN" autocomplete="name" value="${esc((user.email||'').split('@')[0].replace(/^./,ch=>ch.toUpperCase()))}"></label><p class="gerr"></p><button class="btn solid" id="gGo">Continue</button>`);
 $('#gGo').onclick=async()=>{const n=$('#gN').value.trim();if(!n)return;const r=await sb.from('profiles').insert({id:user.id,name:n});if(r.error){$('.gerr').textContent='Could not save — check your connection.';return;}res({id:user.id,name:n,role:'student'});};});}
async function afterLogin(){gate('<p class="muted">Getting your progress…</p>');
 // profile (cached for offline starts)
 let p=null;try{const r=await sb.from('profiles').select('id,name,role').eq('id',user.id).maybeSingle();if(!r.error)p=r.data;}catch(e){}
 if(!p)p=J(localStorage.getItem('qa.profile.'+user.id));
 if(!p&&navigator.onLine)p=await nameScreen();
 profile=p||{id:user.id,name:user.email,role:'student'};localStorage.setItem('qa.profile.'+user.id,JSON.stringify(profile));
 // swap this iPad's working copy to this student, never losing anyone's unsynced work
 const owner=localStorage.getItem('qa.owner');
 if(owner&&owner!==user.id){const cur=readLocal();if(Object.keys(cur).length)localStorage.setItem('qa.stash.'+owner,JSON.stringify(cur));clearLocal();}
 const stash=J(localStorage.getItem('qa.stash.'+user.id));
 let remote=null;try{const r=await sb.from('progress').select('data').eq('user_id',user.id).maybeSingle();if(!r.error&&r.data)remote=r.data.data&&r.data.data.keys;}catch(e){}
 let data=readLocal();if(stash)data=mergeAll(data,stash);if(remote)data=mergeAll(data,remote);
 writeLocal(data);localStorage.setItem('qa.owner',user.id);
 closeGate();acctButton();window.QA_START();
 if(stash){dirty=true;if(await push())localStorage.removeItem('qa.stash.'+user.id);}else{lastOk=remote?Date.now():null;status();}}
async function signOut(){const ok=await push();if(!ok){const cur=readLocal();if(Object.keys(cur).length)localStorage.setItem('qa.stash.'+user.id,JSON.stringify(cur));}
 clearLocal();localStorage.removeItem('qa.owner');await sb.auth.signOut().catch(()=>{});location.reload();}
function acctButton(){const h=document.querySelector('.hrow');let a=$('#acct');if(!a){a=document.createElement('div');a.id='acct';h.appendChild(a);}
 a.innerHTML=`<button class="who" aria-haspopup="true" aria-expanded="false">${esc((profile.name||'?')[0].toUpperCase())}</button><div class="menu" hidden><b>${esc(profile.name)}</b>${profile.role==='teacher'?'<span class="muted">Teacher</span>':''}<span class="st muted"></span><button class="btn" data-sync>Sync now</button><button class="btn" data-out>Sign out</button></div>`;
 const m=a.querySelector('.menu'),w=a.querySelector('.who');w.onclick=()=>{m.hidden=!m.hidden;w.setAttribute('aria-expanded',!m.hidden);status();};
 a.querySelector('[data-sync]').onclick=async()=>{dirty=true;await push();status();};a.querySelector('[data-out]').onclick=()=>{a.querySelector('[data-out]').textContent='Saving…';signOut();};
 if(profile.role==='teacher'){const nav=document.querySelector('nav.main');if(!nav.querySelector('[data-sec="class"]')){const b=document.createElement('button');b.dataset.sec='class';b.innerHTML='<span class="ico">صف</span>Class';nav.appendChild(b);b.onclick=()=>window.QA_OPEN('class');}}
 status();}
// ---- teacher dashboard ----
async function classView(el){el.innerHTML='<div class="wrap"><h1>Class</h1><p class="muted">Loading students…</p></div>';
 if(!navigator.onLine){el.innerHTML='<div class="wrap"><h1>Class</h1><p class="muted">The class view needs internet.</p></div>';return;}
 const [P,G]=await Promise.all([sb.from('profiles').select('id,name,role'),sb.from('progress').select('user_id,summary,updated_at')]);
 if(P.error||G.error){el.innerHTML=`<div class="wrap"><h1>Class</h1><p class="gerr">Could not load: ${esc((P.error||G.error).message)}</p></div>`;return;}
 const prog={};(G.data||[]).forEach(r=>prog[r.user_id]=r);
 const U=(document.getElementById('fL').contentWindow.LQA||{}).UNITS||[];const un=id=>{const i=U.findIndex(u=>u.id===id);return i<0?id:`${i+1}. ${U[i].en}`;};
 const rows=(P.data||[]).filter(p=>p.role!=='teacher').sort((a,b)=>a.name.localeCompare(b.name)).map(p=>{const r=prog[p.id],s=(r&&r.summary)||{};
  const seen=r?new Date(r.updated_at):null;const days=seen?Math.floor((Date.now()-seen)/DAY):null;
  return `<tr><th>${esc(p.name)}</th><td>${seen?(days===0?'today':days===1?'yesterday':days+' days ago'):'never'}</td><td>${s.unitsDone??'—'}/39</td><td>${s.avgBest!=null?s.avgBest+'%':'—'}</td><td>${s.wordsStudied??'—'}${s.coverage!=null?` <small>(${s.coverage}%)</small>`:''}</td><td>${s.streak??'—'}</td><td>${(s.gramDue||0)+(s.wordsDue||0)}</td>
   <td>${(s.weak||[]).length?(s.weak||[]).map(([u,n])=>`<div>${esc(un(u))} <small>(${n})</small></div>`).join(''):'<span class="muted">—</span>'}</td><td>${s.lastUnit?esc(un(s.lastUnit)):'—'}</td></tr>`;}).join('');
 el.innerHTML=`<div class="wrap"><h1>Class</h1><p class="lede">Each student's progress as of their last sync. Students sync automatically while online.</p>
  <div class="tscroll"><table class="ctab"><thead><tr><th>Student</th><th>Last active</th><th>Units done</th><th>Avg. best test</th><th>Words studied <small>(% of Qur'an)</small></th><th>Streak</th><th>Reviews due</th><th>Weak units <small>(misses, 2 wks)</small></th><th>Working on</th></tr></thead><tbody>${rows||'<tr><td colspan="9" class="muted">No students yet. Create their accounts in Supabase (see SETUP-CLASS.md).</td></tr>'}</tbody></table></div>
  <button class="btn" id="cRef">Refresh</button></div>`;
 document.getElementById('cRef').onclick=()=>classView(el);}
window.QA_CLOUD={enabled:CLOUD,classView,push,isTeacher:()=>profile&&profile.role==='teacher'};
// ---- boot ----
window.QA_BOOT=async function(){if(!CLOUD){window.QA_START();return;}
 sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'qa-auth'}});
 gate('<p class="muted">Opening…</p>');
 let session=null;try{session=(await sb.auth.getSession()).data.session;}catch(e){}
 if(!session){loginScreen();return;}
 user=session.user;await afterLogin();};
window.__qaMerge=mergeAll;
})();
