const state={repos:[],pending:null};
const $=s=>document.querySelector(s);
const fmt=n=>new Intl.NumberFormat('en-US',{notation:Number(n)>=1000000?'compact':'standard',maximumFractionDigits:1}).format(Number(n)||0);
function repoHostOK(value){try{const u=new URL(value);return u.protocol==='https:'&&u.hostname.toLowerCase()==='github.com'&&u.pathname.split('/').filter(Boolean).length>=2}catch{return false}}
function esc(s){return String(s??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function repoCard(a){
  const name=a.name||a.repo||String(a.repo_id||'').split('/')[1]||'Repository';
  const owner=a.owner||String(a.repo_id||'').split('/')[0]||'';
  const indexed=a.indexed_at||a.last_indexed_at||'—';
  const links=[a.github_docs_url&&`<a href="${esc(a.github_docs_url)}">GitHub docs ↗</a>`,a.download_url&&`<a href="${esc(a.download_url)}">Download</a>`,a.atlas_url&&`<a href="${esc(a.atlas_url)}">Rendered view</a>`].filter(Boolean).join('');
  return `<article class="repo-card"><div class="repo-top"><div><div class="repo-name">${esc(name)}</div><div class="repo-owner">${esc(owner)} · ${esc(a.language||'Mixed')} · indexed ${esc(indexed)}</div></div><div class="score" title="Foundry Score">${Number(a.foundry_score||0)}</div></div><div class="metrics"><div class="metric"><b>★ ${fmt(a.github_stars)}</b><span>Stars</span></div><div class="metric"><b>${esc(a.evidence_grade||'—')}</b><span>Evidence</span></div><div class="metric"><b>${esc(a.template_id||'base')}</b><span>Template</span></div><div class="metric"><b>${Math.round(Number(a.doc_coverage||0)*100)}%</b><span>Coverage</span></div></div>${links?`<div class="repo-actions">${links}</div>`:''}</article>`;
}
function emptyVisual(){return `<svg viewBox="0 0 160 90" aria-hidden="true"><defs><linearGradient id="e" x1="0" x2="1"><stop stop-color="#ff4f78"/><stop offset=".5" stop-color="#51fa8d"/><stop offset="1" stop-color="#38ddff"/></linearGradient></defs><g fill="none" stroke="#36404c"><path d="M18 45L48 20L80 45L111 20L142 45L111 70L80 45L48 70Z"/><circle cx="80" cy="45" r="28" stroke-dasharray="3 6"/></g><path d="M18 45L48 20L80 45L111 70L142 45" fill="none" stroke="url(#e)" stroke-width="2"/><g fill="#07090c" stroke="#727e8d"><circle cx="18" cy="45" r="4"/><circle cx="48" cy="20" r="4"/><circle cx="48" cy="70" r="4"/><circle cx="80" cy="45" r="6"/><circle cx="111" cy="20" r="4"/><circle cx="111" cy="70" r="4"/><circle cx="142" cy="45" r="4"/></g></svg>`}
function render(){
  const q=$('#search').value.trim().toLowerCase(),lang=$('#language').value,min=Number($('#rating').value),sort=$('#sort').value;
  let rows=state.repos.filter(a=>(!q||`${a.owner||''}/${a.name||a.repo||''} ${a.description||''} ${a.repo_id||''}`.toLowerCase().includes(q))&&(!lang||a.language===lang)&&Number(a.foundry_score||0)>=min);
  rows.sort((a,b)=>sort==='stars'?(b.github_stars||0)-(a.github_stars||0):sort==='fresh'?String(b.last_indexed_at||'').localeCompare(String(a.last_indexed_at||'')):sort==='name'?String(a.repo_id||'').localeCompare(String(b.repo_id||'')):(b.foundry_score||0)-(a.foundry_score||0));
  $('#resultCount').textContent=`${rows.length} repositor${rows.length===1?'y':'ies'}`;
  $('#repoGrid').innerHTML=rows.length?rows.map(repoCard).join(''):`<div class="empty">${emptyVisual()}<h3>No repositories indexed yet.</h3><p>The Atlas registry is empty. Submit a repository above to request the first mapping.</p></div>`;
}
function renderStats(){
  const rows=state.repos,langs=new Set(rows.map(x=>x.language).filter(Boolean));
  const scores=rows.map(x=>Number(x.foundry_score)).filter(Number.isFinite);
  const coverage=rows.map(x=>Number(x.doc_coverage)).filter(Number.isFinite);
  $('#statRepos').textContent=fmt(rows.length);
  $('#statLanguages').textContent=fmt(langs.size);
  $('#statScore').textContent=scores.length?(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1):'—';
  $('#statCoverage').textContent=coverage.length?Math.round(coverage.reduce((a,b)=>a+b,0)/coverage.length*100)+'%':'—';
}
async function loadData(){
  try{const r=await fetch('/api/atlas-index',{cache:'no-store'});if(!r.ok)throw new Error('Atlas index unavailable');const d=await r.json();state.repos=Array.isArray(d)?d:(d.repositories||[])}catch{state.repos=[]}
  const langs=[...new Set(state.repos.map(x=>x.language).filter(Boolean))].sort();
  $('#language').innerHTML='<option value="">All languages</option>'+langs.map(x=>`<option>${esc(x)}</option>`).join('');render();renderStats();
}
['#search','#language','#rating','#sort'].forEach(id=>$(id).addEventListener('input',render));
$('#repoForm').addEventListener('submit',e=>{e.preventDefault();const email=$('#email').value.trim(),repo_url=$('#repo').value.trim();$('#formStatus').textContent='';if(!repoHostOK(repo_url)){const x=$('#formStatus');x.className='status error';x.textContent='Enter a public GitHub repository URL, for example https://github.com/owner/repo.';return}state.pending={email,repo_url};$('#modalStatus').textContent='';$('#reviewModal').classList.add('open')});
function closeModal(){$('#reviewModal').classList.remove('open')}
$('#cancelModal').addEventListener('click',closeModal);$('#reviewModal').addEventListener('click',e=>{if(e.target.id==='reviewModal')closeModal()});
$('#confirmSubmit').addEventListener('click',async()=>{if(!state.pending)return;const b=$('#confirmSubmit'),status=$('#modalStatus');b.disabled=true;b.textContent='Queuing…';status.textContent='';try{const r=await fetch('/api/submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(state.pending)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||'Submission intake is unavailable.');status.className='status ok';status.textContent='Repository request accepted into the Foundry queue.';b.textContent='Queued';setTimeout(()=>{closeModal();$('#repoForm').reset();state.pending=null;b.disabled=false;b.textContent='Agree & queue repository'},850)}catch(err){status.className='status error';status.textContent=err.message;b.disabled=false;b.textContent='Agree & queue repository'}});
loadData();
