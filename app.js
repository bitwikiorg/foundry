const state={repos:[],pending:null,metrics:{enabled:false,total_atlas_pageviews:null,by_repo:{}}};
const $=s=>document.querySelector(s);
const fmt=n=>new Intl.NumberFormat('en-US',{notation:Number(n)>=1000000?'compact':'standard',maximumFractionDigits:1}).format(Number(n)||0);
const int=n=>Number.isFinite(Number(n))?Number(n):0;
function track(name,data={}){try{window.va&&window.va('event',{name,data})}catch{}}
function repoHostOK(value){try{const u=new URL(value);return u.protocol==='https:'&&u.hostname.toLowerCase()==='github.com'&&u.pathname.split('/').filter(Boolean).length>=2}catch{return false}}
function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function repoIdentity(a){const parts=String(a.repo_id||'').split('/');return {owner:a.owner||parts[0]||'',repo:a.repo||a.name||parts[1]||''}}
function repoViews(a){return int(state.metrics.by_repo?.[String(a.repo_id||'').toLowerCase()]?.pageviews ?? a.impressions)}
function repoCard(a){
  const {owner,repo}=repoIdentity(a),repoId=String(a.repo_id||`${owner}/${repo}`).toLowerCase();
  const indexed=a.last_indexed_at||a.indexed_at||'—';
  const atlasHref=`/atlas/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const versions=int(a.version_count||a.indexed_count||1);
  const words=int(a.words_generated||a.generated_words);
  const views=repoViews(a);
  const links=[
    `<a class="primary-link" href="${atlasHref}" data-event="atlas_open" data-repo="${esc(repoId)}">Open Atlas →</a>`,
    a.github_docs_url&&`<a href="${esc(a.github_docs_url)}" data-event="github_docs_open" data-repo="${esc(repoId)}">GitHub docs ↗</a>`,
    a.download_url&&`<a href="${esc(a.download_url)}" data-event="atlas_download" data-repo="${esc(repoId)}">Download</a>`
  ].filter(Boolean).join('');
  return `<article class="repo-card"><div class="repo-top"><div><div class="repo-name">${esc(repo)}</div><div class="repo-owner">${esc(owner)} · ${esc(a.language||'Mixed')} · indexed ${esc(indexed)}</div></div><div class="score" title="Foundry Score">${Number.isFinite(Number(a.foundry_score))?Number(a.foundry_score).toFixed(0):'—'}</div></div><div class="metrics"><div class="metric"><b>${fmt(versions)}</b><span>Versions</span></div><div class="metric"><b>${words?fmt(words):'—'}</b><span>Words</span></div><div class="metric"><b>${views?fmt(views):'—'}</b><span>Views</span></div><div class="metric"><b>${Math.round(int(a.doc_coverage)*100)}%</b><span>Coverage</span></div></div><div class="repo-actions">${links}</div></article>`;
}
function emptyVisual(){return `<svg viewBox="0 0 160 90" aria-hidden="true"><defs><linearGradient id="e" x1="0" x2="1"><stop stop-color="#ff4f78"/><stop offset=".5" stop-color="#51fa8d"/><stop offset="1" stop-color="#38ddff"/></linearGradient></defs><g fill="none" stroke="#36404c"><path d="M18 45L48 20L80 45L111 20L142 45L111 70L80 45L48 70Z"/><circle cx="80" cy="45" r="28" stroke-dasharray="3 6"/></g><path d="M18 45L48 20L80 45L111 70L142 45" fill="none" stroke="url(#e)" stroke-width="2"/><g fill="#07090c" stroke="#727e8d"><circle cx="18" cy="45" r="4"/><circle cx="48" cy="20" r="4"/><circle cx="48" cy="70" r="4"/><circle cx="80" cy="45" r="6"/><circle cx="111" cy="20" r="4"/><circle cx="111" cy="70" r="4"/><circle cx="142" cy="45" r="4"/></g></svg>`}
function render(){
  const q=$('#search').value.trim().toLowerCase(),lang=$('#language').value,min=Number($('#rating').value),sort=$('#sort').value;
  let rows=state.repos.filter(a=>(!q||`${a.owner||''}/${a.repo||a.name||''} ${a.description||''} ${a.repo_id||''}`.toLowerCase().includes(q))&&(!lang||a.language===lang)&&Number(a.foundry_score||0)>=min);
  rows.sort((a,b)=>sort==='views'?repoViews(b)-repoViews(a):sort==='fresh'?String(b.last_indexed_at||'').localeCompare(String(a.last_indexed_at||'')):sort==='name'?String(a.repo_id||'').localeCompare(String(b.repo_id||'')):(b.foundry_score||0)-(a.foundry_score||0));
  $('#resultCount').textContent=`${rows.length} repositor${rows.length===1?'y':'ies'}`;
  $('#repoGrid').innerHTML=rows.length?rows.map(repoCard).join(''):`<div class="empty">${emptyVisual()}<h3>No repositories indexed yet.</h3><p>The Atlas registry is empty. Submit a repository above to request the first mapping.</p></div>`;
}
function renderStats(){
  const rows=state.repos;
  const versions=rows.reduce((n,x)=>n+int(x.version_count||x.indexed_count||1),0);
  const words=rows.reduce((n,x)=>n+int(x.words_generated||x.generated_words),0);
  const files=rows.reduce((n,x)=>n+int(x.source_files_mapped||x.source_file_count||x.file_count),0);
  const agents=rows.reduce((n,x)=>n+int(x.agent_runs),0);
  const graph=rows.reduce((n,x)=>n+int(x.graph_entities||(int(x.graph_nodes)+int(x.graph_edges))),0);
  const fallbackViews=rows.reduce((n,x)=>n+int(x.impressions),0);
  $('#statRepos').textContent=fmt(rows.length);
  $('#statVersions').textContent=fmt(versions);
  $('#statWords').textContent=words?fmt(words):'—';
  const views=state.metrics.total_atlas_pageviews;
  $('#statImpressions').textContent=views!=null?fmt(views):(fallbackViews?fmt(fallbackViews):'—');
  $('#statFiles').textContent=files?fmt(files):'—';
  $('#statAgents').textContent=agents?fmt(agents):'—';
  $('#statGraph').textContent=graph?fmt(graph):'—';
}
async function loadMetrics(){
  try{const r=await fetch('/api/atlas-metrics',{cache:'no-store'});if(r.ok)state.metrics=await r.json()}catch{}
  render();renderStats();
}
async function loadData(){
  try{const r=await fetch('/api/atlas-index',{cache:'no-store'});if(!r.ok)throw new Error('Atlas index unavailable');const d=await r.json();state.repos=Array.isArray(d)?d:(d.repositories||[])}catch{state.repos=[]}
  const langs=[...new Set(state.repos.map(x=>x.language).filter(Boolean))].sort();
  $('#language').innerHTML='<option value="">All languages</option>'+langs.map(x=>`<option>${esc(x)}</option>`).join('');
  render();renderStats();loadMetrics();
}
['#search','#language','#rating','#sort'].forEach(id=>$(id).addEventListener('input',render));
$('#repoGrid').addEventListener('click',e=>{const a=e.target.closest('a[data-event]');if(a)track(a.dataset.event,{repo_id:a.dataset.repo})});
$('#repoForm').addEventListener('submit',e=>{e.preventDefault();const email=$('#email').value.trim(),repo_url=$('#repo').value.trim();$('#formStatus').textContent='';if(!repoHostOK(repo_url)){const x=$('#formStatus');x.className='status error';x.textContent='Enter a public GitHub repository URL, for example https://github.com/owner/repo.';return}state.pending={email,repo_url};$('#modalStatus').textContent='';$('#reviewModal').classList.add('open')});
function closeModal(){$('#reviewModal').classList.remove('open')}
$('#cancelModal').addEventListener('click',closeModal);$('#reviewModal').addEventListener('click',e=>{if(e.target.id==='reviewModal')closeModal()});
$('#confirmSubmit').addEventListener('click',async()=>{if(!state.pending)return;const b=$('#confirmSubmit'),status=$('#modalStatus');b.disabled=true;b.textContent='Queuing…';status.textContent='';try{const r=await fetch('/api/submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(state.pending)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||'Submission intake is unavailable.');track('submission_accepted',{repository:new URL(state.pending.repo_url).pathname.replace(/^\/|\/$/g,'').toLowerCase()});status.className='status ok';status.textContent='Repository request accepted into the Foundry queue.';b.textContent='Queued';setTimeout(()=>{closeModal();$('#repoForm').reset();state.pending=null;b.disabled=false;b.textContent='Agree & queue repository'},850)}catch(err){status.className='status error';status.textContent=err.message;b.disabled=false;b.textContent='Agree & queue repository'}});
loadData();
