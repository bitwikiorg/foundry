const root=document.querySelector('#atlasRoot');
const fmt=n=>new Intl.NumberFormat('en-US',{notation:Number(n)>=1000000?'compact':'standard',maximumFractionDigits:1}).format(Number(n)||0);
const int=n=>Number.isFinite(Number(n))?Number(n):0;
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const enc=s=>encodeURIComponent(String(s??''));
const state={atlas:null,navigation:null,visualIndex:null,graph:null,metrics:null,activeTab:'docs',activeDoc:'',activeCy:null,activeVisual:null,showEdgeLabels:false,hideExternal:false,visualCache:new Map(),docCache:new Map(),mermaidScale:1};
const ALLOWED_TABS=new Set(['docs','visuals','scorecard','evidence','versions']);

function track(name,data={}){try{window.va&&window.va('event',{name,data})}catch{}}
function pathRepo(){const p=location.pathname.split('/').filter(Boolean);return p[0]==='atlas'&&p.length>=3?`${decodeURIComponent(p[1])}/${decodeURIComponent(p[2])}`.toLowerCase():''}
function identity(a){const repoId=String(a?.repo_id||'').toLowerCase();return {repoId,owner:a?.owner||repoId.split('/')[0]||'',repo:a?.repo||repoId.split('/')[1]||'',sha:String(a?.source_sha||'')}}
function artifactUrl(a,path){const {owner,repo,sha}=identity(a);return `/api/atlas-artifact?owner=${enc(owner)}&repo=${enc(repo)}&sha=${enc(sha)}&path=${enc(path)}`}
async function getJson(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(String(r.status));return r.json()}
async function getText(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(String(r.status));return r.text()}
async function artifactJson(a,path){return getJson(artifactUrl(a,path))}
async function artifactText(a,path){return getText(artifactUrl(a,path))}
function action(url,label,event,repoId,primary=false){return url?`<a ${primary?'class="primary-link"':''} href="${esc(url)}" data-event="${event}" data-repo="${esc(repoId)}" target="_blank" rel="noopener"><span>${esc(label)}</span><span>↗</span></a>`:''}
function renderNotFound(){root.innerHTML=`<div class="atlas-not-found"><div class="eyebrow">Atlas not found</div><h1>No map here.</h1><p>This repository is not currently published in BITwiki Atlas.</p><a class="btn" href="/#index">Back to index</a></div>`}

function currentTab(){
  const t=new URLSearchParams(location.search).get('view');
  return ALLOWED_TABS.has(t)?t:'docs';
}
function requestedDoc(){return new URLSearchParams(location.search).get('doc')||''}
function setUrl(tab,doc=''){
  const u=new URL(location.href);
  if(tab==='docs')u.searchParams.delete('view'); else u.searchParams.set('view',tab);
  if(tab==='docs'&&doc)u.searchParams.set('doc',doc); else u.searchParams.delete('doc');
  history.replaceState({},'',u);
}

async function preload(a){
  const [navigation,visualIndex,graph]=await Promise.all([
    artifactJson(a,'navigation.json').catch(()=>({groups:[]})),
    artifactJson(a,'visuals/index.json').catch(()=>({views:[]})),
    artifactJson(a,'graph.json').catch(()=>({}))
  ]);
  state.navigation=navigation;
  state.visualIndex=visualIndex;
  state.graph=graph;
}

function metricGrid(a,metrics){
  const {repoId}=identity(a);
  const impressions=int(metrics?.by_repo?.[repoId]?.pageviews??a.impressions);
  const versions=int(a.version_count||a.indexed_count||1);
  const words=int(a.words_generated||a.generated_words);
  const files=int(a.source_files_mapped||a.source_file_count||a.file_count);
  const visuals=int(a.visual_count);
  const score=Number.isFinite(Number(a.foundry_score))?Number(a.foundry_score).toFixed(0):'—';
  return `<div class="atlas-summary">
    <div class="atlas-summary-score"><strong>${score}</strong><span>Foundry score</span></div>
    <div><strong>${words?fmt(words):'—'}</strong><span>Words</span></div>
    <div><strong>${files?fmt(files):'—'}</strong><span>Files mapped</span></div>
    <div><strong>${visuals?fmt(visuals):'—'}</strong><span>Visuals</span></div>
    <div><strong>${fmt(versions)}</strong><span>Versions</span></div>
    <div><strong>${impressions?fmt(impressions):'—'}</strong><span>Views</span></div>
  </div>`;
}

function renderShell(a,metrics){
  const {repoId,owner,repo,sha}=identity(a);
  document.title=`${owner}/${repo} · BITwiki Atlas`;
  root.innerHTML=`<header class="atlas-project-head">
    <div class="atlas-breadcrumb">BITwiki Atlas / ${esc(owner)} / ${esc(repo)}</div>
    <div class="atlas-project-row">
      <div><h1>${esc(repo)}</h1><p>${esc(a.description||`Documentation and repository intelligence generated from ${owner}/${repo}.`)}</p></div>
      <div class="atlas-source-pill"><span>PINNED SOURCE</span><code>${esc(sha.slice(0,12)||'—')}</code></div>
    </div>
    ${metricGrid(a,metrics)}
    <nav class="atlas-tabs" aria-label="Atlas views">
      ${[['docs','Docs'],['visuals','Visuals'],['scorecard','Scorecard'],['evidence','Evidence'],['versions','Versions']].map(([id,label])=>`<button type="button" class="atlas-tab" data-tab="${id}">${label}${id==='visuals'&&a.visual_count?` <span>${int(a.visual_count)}</span>`:''}</button>`).join('')}
    </nav>
  </header>
  <div id="atlasSurface" class="atlas-surface"></div>`;
  root.querySelectorAll('.atlas-tab').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
  track('atlas_page_loaded',{repo_id:repoId});
}

async function showTab(tab){
  if(!ALLOWED_TABS.has(tab))tab='docs';
  state.activeTab=tab;
  document.querySelectorAll('.atlas-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  if(state.activeCy){try{state.activeCy.destroy()}catch{} state.activeCy=null}
  if(tab==='docs')await renderDocs();
  if(tab==='visuals')await renderVisualBrowser();
  if(tab==='scorecard')await renderStandaloneDoc('docs/scorecard.md','Scorecard');
  if(tab==='evidence')renderEvidence();
  if(tab==='versions')renderVersions();
  if(tab!=='docs')setUrl(tab);
}

function allPages(){
  return (state.navigation?.groups||[]).flatMap(g=>(g.pages||[]).map(p=>({...p,group:g.title})));
}
function docExists(path){return allPages().some(p=>p.path===path)}
function defaultDoc(){
  const pages=allPages();
  return pages.find(p=>p.path==='docs/overview.md')?.path||
         pages.find(p=>p.path==='README.md')?.path||
         pages[0]?.path||'README.md';
}
function docNav(active){
  const groups=state.navigation?.groups||[];
  return `<aside class="atlas-doc-sidebar">
    <div class="atlas-doc-sidebar-head"><strong>Documentation</strong><button id="atlasNavClose" aria-label="Close navigation">×</button></div>
    ${groups.map(g=>`<section class="atlas-doc-nav-group"><h3>${esc(g.title||'Documentation')}</h3>${g.description?`<p>${esc(g.description)}</p>`:''}<div>${(g.pages||[]).map(p=>`<button type="button" class="atlas-doc-link ${p.path===active?'active':''}" data-doc="${esc(p.path)}">${esc(p.title||p.path)}</button>`).join('')}</div></section>`).join('')}
  </aside>`;
}
function docTools(path){
  const {repoId}=identity(state.atlas);
  const github=state.atlas.github_docs_url?`${state.atlas.github_docs_url}/${path.replace(/^README\.md$/,'README.md')}`:'';
  return `<div class="atlas-doc-tools">
    <button type="button" id="atlasNavOpen">Contents</button>
    ${action(github,'GitHub','doc_github_open',repoId)}
  </div>`;
}
async function renderDocs(){
  const surface=document.querySelector('#atlasSurface');
  if(!surface)return;
  const requested=requestedDoc();
  const initial=docExists(requested)?requested:defaultDoc();
  surface.innerHTML=`<div class="atlas-doc-app">${docNav(initial)}<main class="atlas-doc-main">${docTools(initial)}<article id="atlasArticle" class="atlas-article"><div class="atlas-loading-inline">Loading documentation…</div></article></main><aside id="atlasToc" class="atlas-toc"></aside></div>`;
  bindDocNav();
  await openDoc(initial,false);
}
function bindDocNav(){
  document.querySelectorAll('.atlas-doc-link').forEach(b=>b.addEventListener('click',()=>openDoc(b.dataset.doc,true)));
  document.querySelector('#atlasNavOpen')?.addEventListener('click',()=>document.querySelector('.atlas-doc-sidebar')?.classList.add('open'));
  document.querySelector('#atlasNavClose')?.addEventListener('click',()=>document.querySelector('.atlas-doc-sidebar')?.classList.remove('open'));
}
function slugify(s){
  return String(s||'section').toLowerCase().trim().replace(/<[^>]+>/g,'').replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,80)||'section';
}
function renderMarkdown(md){
  if(!window.marked||!window.DOMPurify)return `<pre>${esc(md)}</pre>`;
  const raw=window.marked.parse(String(md||''),{gfm:true,breaks:false});
  return window.DOMPurify.sanitize(raw,{USE_PROFILES:{html:true},ADD_ATTR:['target','rel']});
}
function evidenceMap(){
  const ev=state.graph?.deterministic?.evidence||state.graph?.evidence||[];
  return new Map(ev.map(e=>[String(e.id),e]));
}
function decorateEvidence(article){
  const map=evidenceMap();
  if(!map.size)return;
  const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);
  const nodes=[]; let n;
  while((n=walker.nextNode())){
    if(!/\[E\d{3,}\]/.test(n.nodeValue||''))continue;
    if(n.parentElement?.closest('code,pre,a,button'))continue;
    nodes.push(n);
  }
  for(const textNode of nodes){
    const text=textNode.nodeValue||'';
    const frag=document.createDocumentFragment();
    let last=0;
    text.replace(/\[(E\d{3,})\]/g,(m,id,offset)=>{
      if(offset>last)frag.append(document.createTextNode(text.slice(last,offset)));
      const rec=map.get(id);
      if(rec){
        const b=document.createElement('button');
        b.type='button'; b.className='atlas-evidence-ref'; b.textContent=`[${id}]`;
        b.title=`${rec.path||id} · pinned source`;
        b.addEventListener('click',()=>window.open(rec.source_url,'_blank','noopener'));
        frag.append(b);
      }else frag.append(document.createTextNode(m));
      last=offset+m.length;
      return m;
    });
    if(last<text.length)frag.append(document.createTextNode(text.slice(last)));
    textNode.replaceWith(frag);
  }
}
function decorateHeadings(article){
  const used=new Set();
  for(const h of article.querySelectorAll('h1,h2,h3')){
    let id=slugify(h.textContent); let i=2;
    while(used.has(id))id=`${id}-${i++}`;
    used.add(id); h.id=id;
    const a=document.createElement('a'); a.className='atlas-heading-anchor'; a.href=`#${id}`; a.textContent='#'; a.setAttribute('aria-label','Link to section');
    h.append(a);
  }
}
function buildToc(article){
  const toc=document.querySelector('#atlasToc');
  if(!toc)return;
  const hs=[...article.querySelectorAll('h2,h3')];
  toc.innerHTML=hs.length?`<div class="atlas-toc-inner"><strong>On this page</strong>${hs.map(h=>`<a class="${h.tagName==='H3'?'sub':''}" href="#${esc(h.id)}">${esc(h.childNodes[0]?.textContent||h.textContent.replace(/#$/,''))}</a>`).join('')}</div>`:'';
}
function resolveDocHref(current,href){
  if(!href||href.startsWith('#')||/^[a-z][a-z0-9+.-]*:/i.test(href))return null;
  try{
    const u=new URL(href,`https://atlas.local/${current}`);
    const path=decodeURIComponent(u.pathname.replace(/^\//,''));
    return docExists(path)?path:null;
  }catch{return null}
}
function bindArticleLinks(article,current){
  article.querySelectorAll('a[href]').forEach(a=>{
    const href=a.getAttribute('href')||'';
    const doc=resolveDocHref(current,href);
    if(doc){
      a.addEventListener('click',e=>{e.preventDefault();openDoc(doc,true)});
      return;
    }
    if(/^https?:/i.test(href)){a.target='_blank';a.rel='noopener'}
  });
}
async function renderMermaidBlocks(article){
  if(!window.mermaid)return;
  const blocks=[...article.querySelectorAll('pre code.language-mermaid,code.language-mermaid')];
  if(!blocks.length)return;
  try{window.mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:'dark',fontFamily:'Inter, system-ui, sans-serif',suppressErrorRendering:true})}catch{}
  let i=0;
  for(const code of blocks){
    const pre=code.closest('pre')||code;
    const holder=document.createElement('div'); holder.className='atlas-inline-mermaid';
    try{
      const id=`atlas-inline-mermaid-${Date.now()}-${i++}`;
      const out=await window.mermaid.render(id,code.textContent||'');
      holder.innerHTML=out.svg;
    }catch{
      holder.innerHTML=`<div class="atlas-diagram-error">Diagram could not be rendered. Source preserved below.</div><pre><code>${esc(code.textContent||'')}</code></pre>`;
    }
    pre.replaceWith(holder);
  }
}
async function openDoc(path,push=true){
  if(!docExists(path)&&path!=='docs/scorecard.md')path=defaultDoc();
  state.activeDoc=path;
  document.querySelectorAll('.atlas-doc-link').forEach(b=>b.classList.toggle('active',b.dataset.doc===path));
  document.querySelector('.atlas-doc-sidebar')?.classList.remove('open');
  const article=document.querySelector('#atlasArticle');
  if(!article)return;
  article.innerHTML='<div class="atlas-loading-inline">Loading documentation…</div>';
  try{
    let md=state.docCache.get(path);
    if(md===undefined){md=await artifactText(state.atlas,path);state.docCache.set(path,md)}
    article.innerHTML=renderMarkdown(md);
    decorateHeadings(article);
    decorateEvidence(article);
    bindArticleLinks(article,path);
    await renderMermaidBlocks(article);
    buildToc(article);
    if(push)setUrl('docs',path);
    track('atlas_doc_open',{repo_id:state.atlas.repo_id,path});
    document.querySelector('.atlas-doc-main')?.scrollTo?.({top:0});
  }catch{
    article.innerHTML='<div class="atlas-doc-error"><h2>Document unavailable</h2><p>This Atlas document could not be loaded.</p></div>';
  }
}

async function renderStandaloneDoc(path,title){
  const surface=document.querySelector('#atlasSurface');
  if(!surface)return;
  surface.innerHTML=`<div class="atlas-standalone"><div class="atlas-section-kicker">${esc(title)}</div><article id="atlasArticle" class="atlas-article"><div class="atlas-loading-inline">Loading…</div></article></div>`;
  const article=document.querySelector('#atlasArticle');
  try{
    let md=state.docCache.get(path);
    if(md===undefined){md=await artifactText(state.atlas,path);state.docCache.set(path,md)}
    article.innerHTML=renderMarkdown(md);decorateHeadings(article);decorateEvidence(article);bindArticleLinks(article,path);await renderMermaidBlocks(article);
  }catch{article.innerHTML='<div class="atlas-doc-error">Artifact unavailable.</div>'}
}

function typeColor(t){
  const x=String(t||'').toLowerCase();
  if(/repository|system|root/.test(x))return '#dcff68';
  if(/third.?party|external|dependency|deploy/.test(x))return '#ffae42';
  if(/evidence|source|document/.test(x))return '#b76cff';
  if(/state|data|store|memory/.test(x))return '#38ddff';
  if(/actor|service|module|component|directory|file|step|action/.test(x))return '#51fa8d';
  if(/decision|guard|auth|risk/.test(x))return '#ff7d9a';
  return '#aeb8c4';
}
function layoutOptions(view){
  const family=view?.layout?.family||view?.presentation?.layout||'force';
  const direction={LR:'RIGHT',RL:'LEFT',TB:'DOWN',BT:'UP'}[view?.layout?.direction||view?.presentation?.direction]||'RIGHT';
  if(family==='layered'||family==='tree')return {name:'elk',fit:true,padding:72,nodeDimensionsIncludeLabels:true,elk:{algorithm:family==='tree'?'mrtree':'layered','elk.direction':direction,'elk.edgeRouting':'ORTHOGONAL','elk.spacing.nodeNode':'56','elk.layered.spacing.nodeNodeBetweenLayers':'95','elk.padding':'[top=48,left=48,bottom=48,right=48]'}};
  if(family==='radial')return {name:'concentric',fit:true,padding:70,minNodeSpacing:70,levelWidth:()=>1,concentric:n=>Number(n.data('importance')||0.5)};
  if(family==='grid')return {name:'grid',fit:true,padding:70,avoidOverlap:true,avoidOverlapPadding:32};
  return {name:'cose',fit:true,padding:70,animate:false,nodeRepulsion:14000,idealEdgeLength:170,edgeElasticity:80,gravity:.22,numIter:1600};
}
function cyElements(view){
  const nodeIds=new Set((view.nodes||[]).map(n=>String(n.id)));
  const nodes=(view.nodes||[]).map(n=>({data:{id:String(n.id),label:String(n.label||n.id),type:String(n.type||'entity'),importance:Number(n.importance??.5),evidence_refs:n.evidence_refs||[],source_paths:n.source_paths||[],description:n.description||'',parent:n.group&&nodeIds.has(String(n.group))?String(n.group):undefined}}));
  const edges=(view.edges||[]).map((e,i)=>({data:{id:String(e.id||`e-${i}`),source:String(e.source??e.from),target:String(e.target??e.to),label:String(e.label||''),type:String(e.type||'related_to'),confidence:Number(e.confidence??1),evidence_refs:e.evidence_refs||[]}}));
  return [...nodes,...edges];
}
function graphDetail(node){
  if(!node)return `<div class="atlas-detail-empty">Select a node to inspect what it means and which pinned sources support it.</div>`;
  const d=node.data(),refs=Array.isArray(d.evidence_refs)?d.evidence_refs:[],paths=Array.isArray(d.source_paths)?d.source_paths:[];
  const em=evidenceMap();
  return `<div class="atlas-selected-head"><span>${esc(d.type||'entity')}</span><h4>${esc(d.label)}</h4>${d.description?`<p>${esc(d.description)}</p>`:''}</div>
    ${paths.length?`<div class="atlas-detail-group"><strong>Source paths</strong>${paths.map(x=>`<div class="atlas-detail-chip">${esc(x)}</div>`).join('')}</div>`:''}
    ${refs.length?`<div class="atlas-detail-group"><strong>Evidence</strong>${refs.map(id=>{const r=em.get(String(id));return r?.source_url?`<a class="atlas-detail-chip evidence" href="${esc(r.source_url)}" target="_blank" rel="noopener">${esc(id)} · ${esc(r.path||'source')} ↗</a>`:`<div class="atlas-detail-chip">${esc(id)}</div>`}).join('')}</div>`:''}`;
}
function filterVisualCy(){
  const cy=state.activeCy;if(!cy)return;
  const q=String(document.querySelector('#atlasGraphSearch')?.value||'').trim().toLowerCase();
  cy.batch(()=>{
    cy.nodes().forEach(n=>{
      const external=/external|stdlib|standard.?library/i.test(String(n.data('type')||''))||String(n.id()).startsWith('external:');
      const match=!q||String(n.data('label')||'').toLowerCase().includes(q)||String(n.data('type')||'').toLowerCase().includes(q);
      n.style('display',(state.hideExternal&&external)||!match?'none':'element');
    });
    cy.edges().forEach(e=>{
      const visible=e.source().style('display')!=='none'&&e.target().style('display')!=='none';
      e.style('display',visible?'element':'none');
      e.style('label',state.showEdgeLabels?String(e.data('label')||''):'');
    });
  });
  cy.fit(cy.elements(':visible'),60);
}
function toggleFullscreen(){
  const panel=document.querySelector('.atlas-visual-panel');if(!panel)return;
  panel.classList.toggle('fullscreen');
  setTimeout(()=>state.activeCy?.resize(),50);
  setTimeout(()=>state.activeCy?.fit(state.activeCy.elements(':visible'),60),80);
}
async function renderMermaidView(view,meta){
  const canvas=document.querySelector('#atlasVisualCanvas');
  if(!canvas)return false;
  const source=view.presentation?.mermaid_source||view.mermaid_source||'';
  if(!source||!window.mermaid)return false;
  try{
    window.mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:'dark',fontFamily:'Inter, system-ui, sans-serif',suppressErrorRendering:true,maxEdges:1200});
    const out=await window.mermaid.render(`atlas-mermaid-${Date.now()}`,source);
    state.mermaidScale=1;
    canvas.innerHTML=`<div id="atlasMermaidStage" class="atlas-mermaid-stage">${out.svg}</div>`;
    document.querySelector('#atlasZoomIn')?.addEventListener('click',()=>{state.mermaidScale=Math.min(2.4,state.mermaidScale+.15);document.querySelector('#atlasMermaidStage').style.transform=`scale(${state.mermaidScale})`});
    document.querySelector('#atlasZoomOut')?.addEventListener('click',()=>{state.mermaidScale=Math.max(.55,state.mermaidScale-.15);document.querySelector('#atlasMermaidStage').style.transform=`scale(${state.mermaidScale})`});
    document.querySelector('#atlasFit')?.addEventListener('click',()=>{state.mermaidScale=1;document.querySelector('#atlasMermaidStage').style.transform='scale(1)'});
    return true;
  }catch{return false}
}
async function renderVisual(view,meta){
  state.activeVisual=view;
  const panel=document.querySelector('#atlasVisualPanel');if(!panel)return;
  if(state.activeCy){try{state.activeCy.destroy()}catch{}state.activeCy=null}
  const stats=view.stats||meta.stats||{nodes:(view.nodes||[]).length,edges:(view.edges||[]).length};
  const renderer=view.presentation?.renderer||meta.presentation?.renderer||'cytoscape';
  const diagram=view.presentation?.diagram_type||meta.presentation?.diagram_type||view.diagram_type||view.kind||'network';
  panel.innerHTML=`<div class="atlas-visual-panel-head">
    <div><span class="atlas-visual-kind">${esc(diagram)}</span><h2>${esc(view.title||meta.title)}</h2><p>${esc(view.question||view.purpose||meta.purpose||'Repository visual view.')}</p></div>
    <div class="atlas-visual-counts">${int(stats.nodes)} nodes · ${int(stats.edges)} edges</div>
  </div>
  <div class="atlas-graph-toolbar">
    <input id="atlasGraphSearch" type="search" placeholder="Find node…" aria-label="Find graph node">
    <button id="atlasExternalToggle" type="button">External: ${state.hideExternal?'hidden':'shown'}</button>
    <button id="atlasLabelToggle" type="button">Edge labels: ${state.showEdgeLabels?'on':'off'}</button>
    <button id="atlasZoomOut" type="button">−</button><button id="atlasZoomIn" type="button">+</button>
    <button id="atlasFit" type="button">Fit</button><button id="atlasRelayout" type="button">Layout</button>
    <button id="atlasFullscreen" type="button">Expand</button>
  </div>
  <div id="atlasVisualCanvas" class="atlas-visual-canvas"></div>
  <div id="atlasVisualDetail" class="atlas-visual-detail">${graphDetail(null)}</div>`;
  document.querySelector('#atlasFullscreen')?.addEventListener('click',toggleFullscreen);
  const mermaidRendered=renderer==='mermaid'&&await renderMermaidView(view,meta);
  if(mermaidRendered){
    document.querySelector('#atlasGraphSearch').style.display='none';
    document.querySelector('#atlasExternalToggle').style.display='none';
    document.querySelector('#atlasLabelToggle').style.display='none';
    document.querySelector('#atlasRelayout').style.display='none';
    return;
  }
  const canvas=document.querySelector('#atlasVisualCanvas');
  if(!window.cytoscape){canvas.innerHTML='<div class="atlas-visual-error">Interactive renderer unavailable.</div>';return}
  try{
    const cy=window.cytoscape({container:canvas,elements:cyElements(view),wheelSensitivity:.16,minZoom:.18,maxZoom:3,boxSelectionEnabled:false,style:[
      {selector:'node',style:{'label':'data(label)','background-color':ele=>typeColor(ele.data('type')),'border-width':1.5,'border-color':'#18202a','color':'#f5f7f9','font-size':12,'font-weight':600,'font-family':'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace','text-wrap':'wrap','text-max-width':170,'text-valign':'center','text-halign':'center','text-outline-width':2.5,'text-outline-color':'#070a0e','width':ele=>Math.max(92,Math.min(168,70+String(ele.data('label')||'').length*2.4)),'height':52,'shape':'round-rectangle'}},
      {selector:':parent',style:{'background-opacity':.06,'border-width':1.2,'border-style':'dashed','border-color':'#586575','text-valign':'top','text-halign':'center','padding':'28px'}},
      {selector:'node:selected',style:{'border-width':4,'border-color':'#dcff68','overlay-opacity':0}},
      {selector:'edge',style:{'width':1.6,'line-color':'#556272','target-arrow-color':'#7a8797','target-arrow-shape':'triangle','curve-style':'taxi','taxi-direction':'rightward','taxi-turn':28,'font-size':10,'color':'#aab4c0','text-background-color':'#070a0e','text-background-opacity':.94,'text-background-padding':4,'arrow-scale':.9}},
      {selector:'edge[confidence < 0.8]',style:{'line-style':'dashed','line-color':'#9c7652','target-arrow-color':'#9c7652'}},
      {selector:'edge:selected',style:{'width':3,'line-color':'#dcff68','target-arrow-color':'#dcff68'}}
    ]});
    state.activeCy=cy;
    const run=()=>{try{cy.layout(layoutOptions(view)).run()}catch{cy.layout({name:'cose',fit:true,padding:70,animate:false}).run()}};
    run();
    cy.on('tap','node',evt=>{document.querySelector('#atlasVisualDetail').innerHTML=graphDetail(evt.target);track('atlas_visual_node',{repo_id:state.atlas.repo_id,visual_id:view.id,node_id:evt.target.id()})});
    cy.on('tap',evt=>{if(evt.target===cy)document.querySelector('#atlasVisualDetail').innerHTML=graphDetail(null)});
    document.querySelector('#atlasGraphSearch')?.addEventListener('input',filterVisualCy);
    document.querySelector('#atlasExternalToggle')?.addEventListener('click',e=>{state.hideExternal=!state.hideExternal;e.currentTarget.textContent=`External: ${state.hideExternal?'hidden':'shown'}`;filterVisualCy()});
    document.querySelector('#atlasLabelToggle')?.addEventListener('click',e=>{state.showEdgeLabels=!state.showEdgeLabels;e.currentTarget.textContent=`Edge labels: ${state.showEdgeLabels?'on':'off'}`;filterVisualCy()});
    document.querySelector('#atlasFit')?.addEventListener('click',()=>cy.fit(cy.elements(':visible'),60));
    document.querySelector('#atlasRelayout')?.addEventListener('click',run);
    document.querySelector('#atlasZoomIn')?.addEventListener('click',()=>cy.zoom({level:Math.min(3,cy.zoom()*1.18),renderedPosition:{x:cy.width()/2,y:cy.height()/2}}));
    document.querySelector('#atlasZoomOut')?.addEventListener('click',()=>cy.zoom({level:Math.max(.18,cy.zoom()/1.18),renderedPosition:{x:cy.width()/2,y:cy.height()/2}}));
    filterVisualCy();
  }catch{canvas.innerHTML='<div class="atlas-visual-error">This visual dataset could not be rendered.</div>'}
}
async function selectVisual(meta){
  document.querySelectorAll('.atlas-visual-list-item').forEach(b=>b.classList.toggle('active',b.dataset.visual===meta.id));
  try{
    let view=state.visualCache.get(meta.path);
    if(!view){view=await artifactJson(state.atlas,meta.path);state.visualCache.set(meta.path,view)}
    await renderVisual(view,meta);
    track('atlas_visual_open',{repo_id:state.atlas.repo_id,visual_id:meta.id,kind:meta.kind});
  }catch{document.querySelector('#atlasVisualPanel').innerHTML='<div class="atlas-visual-error">Visual dataset unavailable.</div>'}
}
async function renderVisualBrowser(){
  const surface=document.querySelector('#atlasSurface');if(!surface)return;
  const views=state.visualIndex?.views||[];
  if(!views.length){surface.innerHTML='<div class="atlas-empty-surface"><h2>No visual views</h2><p>This Atlas version does not contain visual artifacts.</p></div>';return}
  surface.innerHTML=`<div class="atlas-visual-browser"><aside class="atlas-visual-list"><div class="atlas-visual-list-head"><strong>Visual Atlas</strong><span>${views.length} views</span></div>${views.map(v=>`<button type="button" class="atlas-visual-list-item" data-visual="${esc(v.id)}"><span>${esc(v.title)}</span><small>${esc(v.presentation?.diagram_type||v.kind||'graph')} · ${int(v.stats?.nodes)} nodes</small><p>${esc(v.purpose||'')}</p></button>`).join('')}</aside><main id="atlasVisualPanel" class="atlas-visual-panel"><div class="atlas-loading-inline">Loading visual…</div></main></div>`;
  document.querySelectorAll('.atlas-visual-list-item').forEach(b=>b.addEventListener('click',()=>{const v=views.find(x=>x.id===b.dataset.visual);if(v)selectVisual(v)}));
  await selectVisual(views[0]);
}

function renderEvidence(){
  const surface=document.querySelector('#atlasSurface');if(!surface)return;
  const ev=[...evidenceMap().values()];
  const {sha}=identity(state.atlas);
  surface.innerHTML=`<div class="atlas-evidence-page"><div class="atlas-section-intro"><span class="atlas-section-kicker">Evidence</span><h2>Pinned source behind the Atlas</h2><p>Every evidence reference resolves to the immutable repository commit <code>${esc(sha)}</code>.</p></div><div class="atlas-evidence-grid">${ev.map(e=>`<a href="${esc(e.source_url||'#')}" target="_blank" rel="noopener" class="atlas-evidence-card"><span>${esc(e.id)}</span><strong>${esc(e.path||'source')}</strong><small>${e.blob_sha?`blob ${esc(String(e.blob_sha).slice(0,12))}`:'Pinned source'} ↗</small></a>`).join('')}</div></div>`;
}
function renderVersions(){
  const surface=document.querySelector('#atlasSurface');if(!surface)return;
  const a=state.atlas,{sha}=identity(a);
  surface.innerHTML=`<div class="atlas-versions-page"><div class="atlas-section-intro"><span class="atlas-section-kicker">Versions</span><h2>Immutable Atlas publication</h2><p>This public page renders the latest registered Atlas. Each generated version is keyed by the source commit SHA and remains immutable in Atlas.</p></div><article class="atlas-version-card"><div><span>Current source</span><code>${esc(sha)}</code><small>${esc(a.last_indexed_at||'')}</small></div><div class="atlas-actions">${action(a.github_docs_url,'Open version in Atlas Git','version_github_open',a.repo_id,true)}${action(a.repo_url,'Open source repository','source_repo_open',a.repo_id)}</div></article></div>`;
}

async function boot(){
  const repoId=pathRepo();if(!repoId)return renderNotFound();
  try{
    const [index,metrics]=await Promise.all([getJson('/api/atlas-index'),getJson('/api/atlas-metrics').catch(()=>({}))]);
    const a=(index.repositories||[]).find(x=>String(x.repo_id||'').toLowerCase()===repoId);
    if(!a)return renderNotFound();
    state.atlas=a;state.metrics=metrics;
    await preload(a);
    renderShell(a,metrics);
    await showTab(currentTab());
  }catch{renderNotFound()}
}
window.addEventListener('popstate',()=>showTab(currentTab()));
boot();