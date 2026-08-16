(()=>{
  const SCORECARD_DOC='docs/scorecard.md';

  function visibleNavGroups(){
    return (state.navigation?.groups||[])
      .map(g=>({...g,pages:(g.pages||[]).filter(p=>p.path!==SCORECARD_DOC)}))
      .filter(g=>(g.pages||[]).length);
  }

  allPages=function(){
    return visibleNavGroups().flatMap(g=>(g.pages||[]).map(p=>({...p,group:g.title})));
  };

  docNav=function(active){
    const groups=visibleNavGroups();
    return `<aside class="atlas-doc-sidebar"><div class="atlas-doc-sidebar-head"><strong>Documentation</strong><button id="atlasNavClose" aria-label="Close navigation">×</button></div>${groups.map(g=>`<section class="atlas-doc-nav-group"><h3>${esc(g.title||'Documentation')}</h3>${g.description?`<p>${esc(g.description)}</p>`:''}<div>${(g.pages||[]).map(p=>`<button type="button" class="atlas-doc-link ${p.path===active?'active':''}" data-doc="${esc(p.path)}">${esc(p.title||p.path)}</button>`).join('')}</div></section>`).join('')}</aside>`;
  };

  const originalBindArticleLinks=bindArticleLinks;
  bindArticleLinks=function(article,current){
    originalBindArticleLinks(article,current);
    article.querySelectorAll('a[href]').forEach(a=>{
      const href=String(a.getAttribute('href')||'');
      if(/(?:^|\/)scorecard\.md(?:#.*)?$/i.test(href)){
        a.addEventListener('click',e=>{e.preventDefault();showTab('scorecard')});
      }
    });
  };

  function applyGraphContrast(){
    const cy=state.activeCy;
    if(!cy)return;
    try{
      cy.style()
        .selector('node')
        .style({
          'color':'#07100a',
          'text-outline-width':0,
          'font-weight':750,
          'border-color':'#09120d',
          'border-width':2
        })
        .selector('node:selected')
        .style({'border-color':'#ffffff','border-width':4})
        .update();
    }catch{}
  }

  const originalRenderVisual=renderVisual;
  renderVisual=async function(view,meta){
    await originalRenderVisual(view,meta);
    applyGraphContrast();
    if(state.activeCy){
      try{state.activeCy.resize()}catch{}
    }
  };

  function setChartExpanded(on){
    const stage=document.querySelector('.atlas-visual-stage');
    const expand=document.querySelector('#atlasVisualExpand');
    if(!stage)return;
    stage.classList.toggle('expanded',!!on);
    document.body.classList.toggle('atlas-chart-expanded',!!on);
    if(expand)expand.textContent=on?'Close':'Expand';
    let close=stage.querySelector('#atlasVisualClose');
    if(on&&!close){
      close=document.createElement('button');
      close.id='atlasVisualClose';
      close.type='button';
      close.className='atlas-visual-close';
      close.setAttribute('aria-label','Close expanded chart');
      close.textContent='Close ×';
      close.addEventListener('click',()=>setChartExpanded(false));
      stage.append(close);
    }
    if(!on&&close)close.remove();
    setTimeout(()=>{
      try{state.activeCy?.resize();state.activeCy?.fit(undefined,90)}catch{}
    },80);
  }

  function bindExpandOnly(){
    const old=document.querySelector('#atlasVisualExpand');
    if(!old)return;
    const btn=old.cloneNode(true);
    old.replaceWith(btn);
    btn.textContent=document.querySelector('.atlas-visual-stage')?.classList.contains('expanded')?'Close':'Expand';
    btn.addEventListener('click',()=>setChartExpanded(!document.querySelector('.atlas-visual-stage')?.classList.contains('expanded')));
  }

  const originalBindVisualControls=bindVisualControls;
  bindVisualControls=function(){
    originalBindVisualControls();
    bindExpandOnly();
  };

  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&document.querySelector('.atlas-visual-stage.expanded'))setChartExpanded(false);
  });

  function groupMetricRows(score,g){
    const by=metricByName(score);
    return (g.metrics||[]).map(name=>{
      const m=by.get(String(name));
      if(!m)return '';
      const applicable=m.applicability==='applicable'&&Number.isFinite(Number(m.score));
      const value=applicable?Number(m.score).toFixed(0):'N/A';
      const first=String(m.rationale||'').split(/(?<=[.!?])\s+/)[0]||'';
      return `<article class="atlas-score-group-metric"><div><strong>${esc(m.name)}</strong><span class="atlas-metric-score ${applicable?scoreTone(m.score):''}">${value}</span></div><p>${esc(first)}</p><small>${esc(confidenceLabel(m.confidence))}</small></article>`;
    }).join('');
  }

  groupCards=function(score){
    return Object.entries(score.groups||{}).map(([name,g])=>`<details class="atlas-score-group ${scoreTone(g.score)}"><summary><div class="atlas-score-group-summary"><div><span>${esc(name)}</span><small>${(g.metrics||[]).length} metrics · ${Math.round(Number(g.weight||0)*100)}% weight</small></div><strong>${Number(g.score||0).toFixed(0)}</strong></div><div class="atlas-score-bar"><i style="width:${clamp(Number(g.score||0),0,100)}%"></i></div><em>Why this score ↓</em></summary><div class="atlas-score-group-body">${groupMetricRows(score,g)}</div></details>`).join('');
  };

  function scoringMethod(score){
    const rows=Object.entries(score.groups||{}).map(([name,g])=>`<div><span>${esc(name)}</span><b>${Number(g.score||0).toFixed(0)}</b><small>${Math.round(Number(g.weight||0)*100)}% weight</small></div>`).join('');
    return `<details class="atlas-score-method"><summary>How the overall score is calculated</summary><div><p>The headline score is the weighted combination of the category scores below. Confidence is separate: it describes how much evidence was available, not how good or bad the repository is.</p><div class="atlas-score-method-grid">${rows}</div></div></details>`;
  }

  async function scoreNarrative(){
    try{return await artifactText(state.atlas,SCORECARD_DOC)}catch{return ''}
  }

  renderScorecard=async function(){
    const surface=document.querySelector('#atlasSurface');
    if(!surface)return;
    surface.innerHTML='<div class="atlas-loading-inline">Loading scorecard…</div>';
    try{
      const [score,narrative]=await Promise.all([
        state.scorecard||artifactJson(state.atlas,'scorecard.json'),
        scoreNarrative()
      ]);
      state.scorecard=score;
      const total=Number(score.foundry_score??state.atlas.foundry_score??0);
      const conf=Number(score.confidence??state.atlas.score_confidence??0);
      surface.innerHTML=`<div class="atlas-score-page"><section class="atlas-score-hero"><div class="atlas-score-number"><strong>${total.toFixed(0)}</strong><span>/ 100</span></div><div><span class="atlas-section-kicker">Foundry scorecard</span><h2>Repository quality at a glance</h2><p>Open any category to see exactly what contributed to its score. Detailed metric rationale, evidence, and improvement opportunities remain expandable below.</p><div class="atlas-score-confidence">${Math.round(conf*100)}% confidence · ${esc(confidenceLabel(conf))}</div></div></section>${scoringMethod(score)}<section class="atlas-score-groups">${groupCards(score)}</section>${strengthRiskLists(score)}${prioritizedActions(score)}<section class="atlas-score-detail-section"><div class="atlas-section-intro compact"><span class="atlas-section-kicker">Metric detail</span><h3>Detailed scoring evidence</h3><p>Each metric includes the rationale, confidence, evidence references, and suggested improvements.</p></div>${metricDetails(score)}</section>${narrative?`<details class="atlas-score-full-analysis"><summary>Full generated scorecard narrative</summary><article id="atlasScoreNarrative" class="atlas-article atlas-score-narrative">${renderMarkdown(narrative)}</article></details>`:''}</div>`;
      const article=document.querySelector('#atlasScoreNarrative');
      if(article){decorateEvidence(article);decorateHeadings(article);bindArticleLinks(article,SCORECARD_DOC);await renderMermaidBlocks(article)}
      track('atlas_scorecard_open',{repo_id:state.atlas.repo_id});
    }catch{
      surface.innerHTML='<div class="atlas-doc-error"><h2>Scorecard unavailable</h2><p>The machine-readable scorecard could not be loaded.</p></div>';
    }
  };

  function installHireCta(){
    if(document.querySelector('#atlasHire'))return;
    const footer=document.querySelector('.footer');
    if(!footer)return;
    const hire=document.createElement('section');
    hire.id='atlasHire';
    hire.className='atlas-bridge';
    hire.innerHTML='<div><strong>Need more than an automated Atlas?</strong><p>BITwiki builds custom documentation systems, repository intelligence, and AI context engines around complex codebases. Focused audits and documentation engagements are typically $500–$1,000. Custom documentation machines and context engines start around $25K+.</p></div><a class="atlas-link" href="mailto:admin@bitwiki.org?subject=BITwiki%20Foundry%20project"><span>→</span> Hire BITwiki</a>';
    footer.before(hire);

    const navlinks=document.querySelector('.navlinks');
    if(navlinks&&!navlinks.querySelector('a[href^="mailto:admin@bitwiki.org"]'))navlinks.insertAdjacentHTML('beforeend','<a href="mailto:admin@bitwiki.org?subject=BITwiki%20Foundry%20project">Hire us</a>');
    const footerLinks=document.querySelector('.footer-links');
    if(footerLinks&&!footerLinks.querySelector('a[href^="mailto:admin@bitwiki.org"]'))footerLinks.insertAdjacentHTML('beforeend','<a href="mailto:admin@bitwiki.org">Contact</a>');
  }

  // Handles direct ?view=visuals / ?view=scorecard loads where atlas.js rendered before this patch loaded.
  if(document.querySelector('#atlasVisualExpand'))bindExpandOnly();
  if(currentTab()==='scorecard'&&state.atlas)renderScorecard();
  installHireCta();
})();