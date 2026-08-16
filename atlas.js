const root=document.querySelector('#atlasRoot');
const fmt=n=>new Intl.NumberFormat('en-US',{notation:Number(n)>=1000000?'compact':'standard',maximumFractionDigits:1}).format(Number(n)||0);
const int=n=>Number.isFinite(Number(n))?Number(n):0;
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const enc=s=>encodeURIComponent(String(s??''));
let activeCy=null;
const visualCache=new Map();
function track(name,data={}){try{window.va&&window.va('event',{name,data})}catch{}}
function pathRepo(){const p=location.pathname.split('/').filter(Boolean);return p[0]==='atlas'&&p.length>=3?`${decodeURIComponent(p[1])}/${decodeURIComponent(p[2])}`.toLowerCase():''}
async function getJson(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(String(r.status));return r.json()}
function action(url,label,event,repoId,primary=false){return url?`<a ${primary?'class="primary-link"':''} href="${esc(url)}" data-event="${event}" data-repo="${esc(repoId)}"><span>${label}</span><span>↗</span></a>`:''}
function renderNotFound(){root.innerHTML=`<div class="atlas-not-found"><div class="eyebrow">Atlas not found</div><h1>No map here.</h1><p>This repository is not currently published in BITwiki Atlas.</p><a class="btn" href="/#index">Back to index</a></div>`}
function identity(a){const repoId=String(a.repo_id||'').toLowerCase();return {repoId,owner:a.owner||repoId.split('/')[0]||'',repo:a.repo||repoId.split('/')[1]||'',sha:String(a.source_sha||'')}}
function artifactUrl(a,path){const {owner,repo,sha}=identity(a);return `/api/atlas-artifact?owner=${enc(owner)}&repo=${enc(repo)}&sha=${enc(sha)}&path=${enc(path)}`}
function atlasBlobUrl(a,path){const {owner,repo,sha}=identity(a);const p=['repos',owner,repo,'versions',sha,...String(path).split('/')].map(enc).join('/');return `https://github.com/bitwikiorg/atlas/blob/main/${p}`}
async function artifactJson(a,path){return getJson(artifactUrl(a,path))}
function render(a,metrics){
  const {repoId,owner,repo,sha}=identity(a);
  const views=int(metrics?.by_repo?.[repoId]?.pageviews ?? a.impressions);
  const versions=int(a.version_count||a.indexed_count||1),words=int(a.words_generated||a.generated_words),files=int(a.source_files_mapped||a.source_file_count||a.file_count),visuals=int(a.visual_count),graph=int(a.graph_entities||(int(a.graph_nodes)+int(a.graph_edges)));
  const score=Number.isFinite(Number(a.foundry_score))?Number(a.foundry_score).toFixed(0):'—';
  document.title=`${owner}/${repo} · BITwiki Atlas`;
  root.innerHTML=`
    <div class="atlas-breadcrumb">BITwiki Atlas / ${esc(owner)} / ${esc(repo)}</div>
    <div class="atlas-title-row"><div class="atlas-title"><h1>${esc(repo)}</h1><p>${esc(a.description||`A source-linked repository map generated from ${owner}/${repo}.`)}</p></div><div class="atlas-score">${score}<span>FOUNDRY SCORE</span></div></div>
    <div class="atlas-metric-grid">
      <div class="atlas-metric"><strong>${fmt(versions)}</strong><span>Versions</span></div>
      <div class="atlas-metric"><strong>${words?fmt(words):'—'}</strong><span>Words</span></div>
      <div class="atlas-metric"><strong>${files?fmt(files):'—'}</strong><span>Files mapped</span></div>
      <div class="atlas-metric"><strong>${visuals?fmt(visuals):'—'}</strong><span>Visuals</span></div>
      <div class="atlas-metric"><strong>${graph?fmt(graph):'—'}</strong><span>Graph entities</span></div>
      <div class="atlas-metric"><strong>${views?fmt(views):'—'}</strong><span>Impressions</span></div>
    </div>
    <div class="atlas-layout">
      <div>
        <section class="atlas-block"><div class="eyebrow">Repository map</div><h2>One pinned source, many usable views.</h2><p>This Atlas was generated from commit <code>${esc(sha||'—')}</code>. Documentation, visual datasets, scorecard, graph data, and provenance point back to the same pinned repository evidence.</p></section>
        <section class="atlas-block"><div class="eyebrow">Publication</div><div class="atlas-facts"><div class="atlas-fact"><b>Repository</b><span>${esc(repoId)}</span></div><div class="atlas-fact"><b>Language</b><span>${esc(a.language||'Mixed')}</span></div><div class="atlas-fact"><b>Evidence</b><span>${esc(a.evidence_grade||'—')}</span></div><div class="atlas-fact"><b>Coverage</b><span>${Math.round(int(a.doc_coverage)*100)}%</span></div><div class="atlas-fact"><b>Template</b><span>${esc(a.template_id||'base')}</span></div><div class="atlas-fact"><b>Indexed</b><span>${esc(a.last_indexed_at||'—')}</span></div></div></section>
      </div>
      <aside><section class="atlas-block"><div class="eyebrow">Open artifacts</div><div class="atlas-actions">${action(a.github_docs_url,'Read Atlas on GitHub','github_docs_open',repoId,true)}${action(a.download_url,'Download artifacts','atlas_download',repoId)}${action(a.repo_url,'Open source repository','source_repo_open',repoId)}${action(a.manifest_uri,'View manifest','manifest_open',repoId)}</div></section><section class="atlas-block"><div class="eyebrow">Durable identity</div><p><code>${esc(sha||'—')}</code></p><p>Published versions are immutable in <strong>bitwikiorg/atlas</strong>; this Foundry page renders the current version from that durable source.</p></section></aside>
    </div>
    <div id="atlasVisualMount"></div>
    <div id="atlasDocMap"></div>`;
  root.querySelectorAll('a[data-event]').forEach(el=>el.addEventListener('click',()=>track(el.dataset.event,{repo_id:el.dataset.repo})));
  track('atlas_page_loaded',{repo_id:repoId});
  loadAtlasSurfaces(a);
}
function typeColor(t){
  const x=String(t||'').toLowerCase();
  if(/repository|system|root/.test(x))return '#dcff68';
  if(/external|dependency|deploy/.test(x))return '#ffae42';
  if(/evidence|source|document/.test(x))return '#b76cff';
  if(/state|data|store|memory/.test(x))return '#38ddff';
  if(/actor|service|module|component|directory|file/.test(x))return '#51fa8d';
  if(/status|unknown/.test(x))return '#798391';
  return '#aeb8c4';
}
function layoutOptions(view){
  const family=view?.layout?.family||'force';
  const direction={LR:'RIGHT',RL:'LEFT',TB:'DOWN',BT:'UP'}[view?.layout?.direction]||'RIGHT';
  if((family==='layered'||family==='tree')&&window.cytoscape){
    return {name:'elk',fit:true,padding:42,nodeDimensionsIncludeLabels:true,elk:{algorithm:family==='tree'?'mrtree':'layered','elk.direction':direction,'elk.edgeRouting':'ORTHOGONAL','elk.spacing.nodeNode':'34','elk.layered.spacing.nodeNodeBetweenLayers':'58'}};
  }
  if(family==='radial')return {name:'concentric',fit:true,padding:42,minNodeSpacing:38,levelWidth:()=>1,concentric:n=>Number(n.data('importance')||0.5)};
  if(family==='grid')return {name:'grid',fit:true,padding:42,avoidOverlap:true};
  return {name:'cose',fit:true,padding:42,animate:false,nodeRepulsion:9000,idealEdgeLength:120,gravity:.4};
}
function cyElements(view){
  const nodeIds=new Set((view.nodes||[]).map(n=>String(n.id)));
  const nodes=(view.nodes||[]).map(n=>({data:{id:String(n.id),label:String(n.label||n.id),type:String(n.type||'entity'),importance:Number(n.importance??.5),evidence_refs:n.evidence_refs||[],source_paths:n.source_paths||[],parent:n.group&&nodeIds.has(String(n.group))?String(n.group):undefined}}));
  const edges=(view.edges||[]).map((e,i)=>({data:{id:String(e.id||`e-${i}`),source:String(e.source??e.from),target:String(e.target??e.to),label:String(e.label||''),type:String(e.type||'related_to'),confidence:Number(e.confidence??1),evidence_refs:e.evidence_refs||[]}}));
  return [...nodes,...edges];
}
function detailHtml(view,node){
  if(!node)return `<div class="atlas-detail-empty">Select a node to inspect its semantic type, source paths and evidence references.</div>`;
  const d=node.data();
  const paths=Array.isArray(d.source_paths)?d.source_paths:[];
  const refs=Array.isArray(d.evidence_refs)?d.evidence_refs:[];
  return `<span class="atlas-detail-label">Selected node</span><h4>${esc(d.label)}</h4><p>${esc(d.type||'entity')} · importance ${Number(d.importance||0).toFixed(2)}</p>${paths.length?`<span class="atlas-detail-label">Source paths</span><div class="atlas-detail-list">${paths.map(x=>`<div class="atlas-detail-chip">${esc(x)}</div>`).join('')}</div>`:''}${refs.length?`<span class="atlas-detail-label">Evidence</span><div class="atlas-detail-list">${refs.map(x=>`<div class="atlas-detail-chip">${esc(x)}</div>`).join('')}</div>`:''}${!paths.length&&!refs.length?`<div class="atlas-detail-empty">This structural node has no direct source/evidence attachment.</div>`:''}`;
}
function renderFallback(view,container){
  const nodes=(view.nodes||[]).slice(0,30).map(n=>`<div class="atlas-detail-chip"><b>${esc(n.label)}</b><br>${esc(n.type||'entity')}</div>`).join('');
  container.innerHTML=`<div class="atlas-visual-error">Interactive renderer unavailable. Visual data remains accessible below.<div class="atlas-detail-list" style="margin-top:18px;text-align:left">${nodes}</div></div>`;
}
function renderVisual(view,meta,a){
  const frame=document.querySelector('#atlasVisualFrame');
  if(!frame)return;
  const stats=view.stats||meta.stats||{nodes:(view.nodes||[]).length,edges:(view.edges||[]).length};
  frame.innerHTML=`<div class="atlas-visual-meta"><div><h3>${esc(view.title||meta.title)}</h3><p>${esc(view.purpose||meta.purpose||'Repository visual data view.')}</p><div class="atlas-visual-legend">${[...(view.legend?.node_types||[])].slice(0,8).map(x=>`<span class="atlas-legend-chip">${esc(x)}</span>`).join('')}</div></div><div class="atlas-visual-stats">${int(stats.nodes)} nodes · ${int(stats.edges)} edges · ${esc(view.layout?.family||'auto')} layout</div></div><div class="atlas-visual-workspace"><div class="atlas-canvas-wrap"><div class="atlas-visual-controls"><button type="button" id="atlasFit">Fit</button><button type="button" id="atlasRelayout">Layout</button></div><div id="atlasCanvas" class="atlas-canvas"></div></div><aside id="atlasVisualDetail" class="atlas-visual-detail">${detailHtml(view,null)}</aside></div>`;
  const canvas=document.querySelector('#atlasCanvas');
  if(activeCy){try{activeCy.destroy()}catch{}activeCy=null}
  if(!window.cytoscape)return renderFallback(view,canvas);
  try{
    const cy=window.cytoscape({container:canvas,elements:cyElements(view),wheelSensitivity:.18,minZoom:.2,maxZoom:2.5,boxSelectionEnabled:false,style:[
      {selector:'node',style:{'label':'data(label)','background-color':ele=>typeColor(ele.data('type')),'border-width':1,'border-color':'#141a21','color':'#eef3f7','font-size':10,'font-family':'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace','text-wrap':'wrap','text-max-width':150,'text-valign':'center','text-halign':'center','text-outline-width':2,'text-outline-color':'#080b0f','width':ele=>42+Math.round(Number(ele.data('importance')||.5)*26),'height':ele=>34+Math.round(Number(ele.data('importance')||.5)*16),'shape':'round-rectangle'}},
      {selector:':parent',style:{'background-opacity':.08,'border-width':1,'border-style':'dashed','border-color':'#566272','text-valign':'top','text-halign':'center','padding':'20px'}},
      {selector:'node:selected',style:{'border-width':3,'border-color':'#dcff68'}},
      {selector:'edge',style:{'width':1.4,'line-color':'#4b5664','target-arrow-color':'#667384','target-arrow-shape':'triangle','curve-style':'bezier','label':'data(label)','font-size':8,'color':'#8d98a6','text-background-color':'#080b0f','text-background-opacity':.9,'text-background-padding':2,'arrow-scale':.75}},
      {selector:'edge[confidence < 0.8]',style:{'line-style':'dashed','line-color':'#8b704d','target-arrow-color':'#8b704d'}},
      {selector:'edge:selected',style:{'width':2.5,'line-color':'#dcff68','target-arrow-color':'#dcff68'}}
    ]});
    activeCy=cy;
    const run=()=>{try{cy.layout(layoutOptions(view)).run()}catch{cy.layout({name:'cose',fit:true,padding:42,animate:false}).run()}};
    run();
    cy.on('tap','node',evt=>{document.querySelector('#atlasVisualDetail').innerHTML=detailHtml(view,evt.target);track('atlas_visual_node',{repo_id:a.repo_id,visual_id:view.id,node_id:evt.target.id()})});
    cy.on('tap',evt=>{if(evt.target===cy)document.querySelector('#atlasVisualDetail').innerHTML=detailHtml(view,null)});
    document.querySelector('#atlasFit')?.addEventListener('click',()=>cy.fit(undefined,42));
    document.querySelector('#atlasRelayout')?.addEventListener('click',run);
  }catch{renderFallback(view,canvas)}
}
async function selectVisual(a,index,meta){
  document.querySelectorAll('.atlas-visual-tab').forEach((b,i)=>b.classList.toggle('active',i===index));
  const frame=document.querySelector('#atlasVisualFrame');
  if(frame)frame.innerHTML='<div class="atlas-visual-error">Loading visual data…</div>';
  try{
    let view=visualCache.get(meta.path);
    if(!view){view=await artifactJson(a,meta.path);visualCache.set(meta.path,view)}
    renderVisual(view,meta,a);
    track('atlas_visual_open',{repo_id:a.repo_id,visual_id:meta.id,kind:meta.kind});
  }catch{if(frame)frame.innerHTML='<div class="atlas-visual-error">This visual dataset is unavailable.</div>'}
}
async function loadVisualSuite(a){
  const mount=document.querySelector('#atlasVisualMount');
  if(!mount)return;
  try{
    const ix=await artifactJson(a,'visuals/index.json');
    const views=Array.isArray(ix.views)?ix.views:[];
    if(!views.length)return;
    mount.innerHTML=`<section class="atlas-visual-suite"><div class="atlas-visual-head"><div><div class="eyebrow">Visual Atlas</div><h2>Repository intelligence as visual data.</h2><p>Each view is a bounded projection of the same pinned RepoGraph. Switch views to inspect architecture, dependencies, evidence and repository-specific flows without losing provenance.</p></div></div><div class="atlas-visual-tabs">${views.map((v,i)=>`<button class="atlas-visual-tab ${i===0?'active':''}" type="button" data-visual-index="${i}">${esc(v.title||v.id)}</button>`).join('')}</div><div id="atlasVisualFrame" class="atlas-visual-frame"><div class="atlas-visual-error">Loading visual data…</div></div></section>`;
    mount.querySelectorAll('[data-visual-index]').forEach(btn=>btn.addEventListener('click',()=>{const i=Number(btn.dataset.visualIndex);selectVisual(a,i,views[i])}));
    selectVisual(a,0,views[0]);
  }catch{mount.innerHTML=''}
}
async function loadNavigation(a){
  const mount=document.querySelector('#atlasDocMap');
  if(!mount)return;
  try{
    const nav=await artifactJson(a,'navigation.json');
    const groups=Array.isArray(nav.groups)?nav.groups:[];
    if(!groups.length)return;
    mount.innerHTML=`<section class="atlas-doc-map"><div class="eyebrow">Knowledge map</div><h2>Documentation topology</h2><div class="atlas-nav-groups">${groups.map(g=>`<article class="atlas-nav-group"><h3>${esc(g.title)}</h3>${g.description?`<p>${esc(g.description)}</p>`:''}<div class="atlas-nav-pages">${(g.pages||[]).map(p=>`<a class="atlas-nav-page" href="${esc(atlasBlobUrl(a,p.path))}" target="_blank" rel="noopener"><span>${esc(p.title||p.path)}</span><span>↗</span></a>`).join('')}</div></article>`).join('')}</div></section>`;
  }catch{mount.innerHTML=''}
}
async function loadAtlasSurfaces(a){await Promise.allSettled([loadVisualSuite(a),loadNavigation(a)])}
(async()=>{const repoId=pathRepo();if(!repoId)return renderNotFound();try{const [idx,metrics]=await Promise.all([getJson('/api/atlas-index'),getJson('/api/atlas-metrics').catch(()=>({by_repo:{}}))]);const rows=Array.isArray(idx)?idx:(idx.repositories||[]);const a=rows.find(x=>String(x.repo_id||'').toLowerCase()===repoId);if(!a)return renderNotFound();render(a,metrics)}catch{renderNotFound()}})();
