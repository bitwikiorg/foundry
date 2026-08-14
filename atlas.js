const root=document.querySelector('#atlasRoot');
const fmt=n=>new Intl.NumberFormat('en-US',{notation:Number(n)>=1000000?'compact':'standard',maximumFractionDigits:1}).format(Number(n)||0);
const int=n=>Number.isFinite(Number(n))?Number(n):0;
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function track(name,data={}){try{window.va&&window.va('event',{name,data})}catch{}}
function pathRepo(){const p=location.pathname.split('/').filter(Boolean);return p[0]==='atlas'&&p.length>=3?`${decodeURIComponent(p[1])}/${decodeURIComponent(p[2])}`.toLowerCase():''}
async function getJson(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(String(r.status));return r.json()}
function action(url,label,event,repoId,primary=false){return url?`<a ${primary?'class="primary-link"':''} href="${esc(url)}" data-event="${event}" data-repo="${esc(repoId)}"><span>${label}</span><span>↗</span></a>`:''}
function renderNotFound(){root.innerHTML=`<div class="atlas-not-found"><div class="eyebrow">Atlas not found</div><h1>No map here.</h1><p>This repository is not currently published in BITwiki Atlas.</p><a class="btn" href="/#index">Back to index</a></div>`}
function render(a,metrics){
  const repoId=String(a.repo_id||'').toLowerCase(),owner=a.owner||repoId.split('/')[0],repo=a.repo||repoId.split('/')[1];
  const views=int(metrics?.by_repo?.[repoId]?.pageviews ?? a.impressions);
  const versions=int(a.version_count||a.indexed_count||1),words=int(a.words_generated||a.generated_words),files=int(a.source_files_mapped||a.source_file_count||a.file_count),agents=int(a.agent_runs),graph=int(a.graph_entities||(int(a.graph_nodes)+int(a.graph_edges)));
  const score=Number.isFinite(Number(a.foundry_score))?Number(a.foundry_score).toFixed(0):'—';
  document.title=`${owner}/${repo} · BITwiki Atlas`;
  root.innerHTML=`
    <div class="atlas-breadcrumb">BITwiki Atlas / ${esc(owner)} / ${esc(repo)}</div>
    <div class="atlas-title-row"><div class="atlas-title"><h1>${esc(repo)}</h1><p>${esc(a.description||`A source-linked repository map generated from ${owner}/${repo}.`)}</p></div><div class="atlas-score">${score}<span>FOUNDRY SCORE</span></div></div>
    <div class="atlas-metric-grid">
      <div class="atlas-metric"><strong>${fmt(versions)}</strong><span>Versions</span></div><div class="atlas-metric"><strong>${words?fmt(words):'—'}</strong><span>Words</span></div><div class="atlas-metric"><strong>${files?fmt(files):'—'}</strong><span>Files mapped</span></div><div class="atlas-metric"><strong>${agents?fmt(agents):'—'}</strong><span>Agent runs</span></div><div class="atlas-metric"><strong>${graph?fmt(graph):'—'}</strong><span>Graph entities</span></div><div class="atlas-metric"><strong>${views?fmt(views):'—'}</strong><span>Impressions</span></div>
    </div>
    <div class="atlas-layout">
      <div>
        <section class="atlas-block"><div class="eyebrow">Repository map</div><h2>One pinned source, many usable views.</h2><p>This Atlas was generated from commit <code>${esc(a.source_sha||'—')}</code>. Documentation, scorecard, graph data, and provenance all point back to the same pinned repository evidence.</p></section>
        <section class="atlas-block"><div class="eyebrow">Publication</div><div class="atlas-facts"><div class="atlas-fact"><b>Repository</b><span>${esc(repoId)}</span></div><div class="atlas-fact"><b>Language</b><span>${esc(a.language||'Mixed')}</span></div><div class="atlas-fact"><b>Evidence</b><span>${esc(a.evidence_grade||'—')}</span></div><div class="atlas-fact"><b>Coverage</b><span>${Math.round(int(a.doc_coverage)*100)}%</span></div><div class="atlas-fact"><b>Template</b><span>${esc(a.template_id||'base')}</span></div><div class="atlas-fact"><b>Indexed</b><span>${esc(a.last_indexed_at||'—')}</span></div></div></section>
      </div>
      <aside><section class="atlas-block"><div class="eyebrow">Open artifacts</div><div class="atlas-actions">${action(a.github_docs_url,'Read Atlas on GitHub','github_docs_open',repoId,true)}${action(a.download_url,'Download artifacts','atlas_download',repoId)}${action(a.repo_url,'Open source repository','source_repo_open',repoId)}${action(a.manifest_uri,'View manifest','manifest_open',repoId)}</div></section><section class="atlas-block"><div class="eyebrow">Durable identity</div><p><code>${esc(a.source_sha||'—')}</code></p><p>Published versions are immutable in <strong>bitwikiorg/atlas</strong>; this Foundry page is the canonical readable entry point.</p></section></aside>
    </div>`;
  root.querySelectorAll('a[data-event]').forEach(el=>el.addEventListener('click',()=>track(el.dataset.event,{repo_id:el.dataset.repo})));
  track('atlas_page_loaded',{repo_id:repoId});
}
(async()=>{const repoId=pathRepo();if(!repoId)return renderNotFound();try{const [idx,metrics]=await Promise.all([getJson('/api/atlas-index'),getJson('/api/atlas-metrics').catch(()=>({by_repo:{}}))]);const rows=Array.isArray(idx)?idx:(idx.repositories||[]);const a=rows.find(x=>String(x.repo_id||'').toLowerCase()===repoId);if(!a)return renderNotFound();render(a,metrics)}catch{renderNotFound()}})();
