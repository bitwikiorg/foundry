(()=>{
  const ZOOM_STEP=1.42;

  function clampZoom(cy,z){
    let min=.12,max=5;
    try{min=cy.minZoom();max=cy.maxZoom()}catch{}
    return Math.max(min,Math.min(max,z));
  }

  function zoomAt(cy,factor,renderedPosition){
    if(!cy)return;
    const next=clampZoom(cy,cy.zoom()*factor);
    const pos=renderedPosition||{
      x:(cy.container()?.clientWidth||0)/2,
      y:(cy.container()?.clientHeight||0)/2
    };
    try{cy.zoom({level:next,renderedPosition:pos})}catch{try{cy.zoom(next)}catch{}}
    updateZoomReadout();
  }

  function updateZoomReadout(){
    const out=document.querySelector('#atlasZoomLevel');
    const cy=state.activeCy;
    if(out&&cy)out.textContent=`${Math.round(cy.zoom()*100)}%`;
  }

  function focusSelection(){
    const cy=state.activeCy;
    if(!cy)return;
    try{
      const selected=cy.$(':selected');
      if(selected.length){
        cy.animate({fit:{eles:selected.closedNeighborhood(),padding:130},duration:140});
      }else{
        cy.animate({fit:{eles:cy.elements(),padding:90},duration:140});
      }
    }catch{try{cy.fit(undefined,90)}catch{}}
    setTimeout(updateZoomReadout,160);
  }

  function resetZoom(){
    const cy=state.activeCy;
    if(!cy)return;
    try{
      const center={x:(cy.container()?.clientWidth||0)/2,y:(cy.container()?.clientHeight||0)/2};
      cy.zoom({level:clampZoom(cy,1),renderedPosition:center});
    }catch{}
    updateZoomReadout();
  }

  function configureCy(){
    const cy=state.activeCy;
    if(!cy)return;
    try{
      // Navigation-only canvas: nodes are inspectable, not draggable/editable.
      cy.autoungrabify(true);
      cy.panningEnabled(true);
      cy.userPanningEnabled(true);
      // Disable Cytoscape's deliberately slow wheel handler; use our faster cursor-centred handler below.
      cy.userZoomingEnabled(false);
      cy.off('zoom.atlasNav');
      cy.on('zoom.atlasNav',updateZoomReadout);
    }catch{}
    updateZoomReadout();
  }

  function installFastWheel(){
    const canvas=document.querySelector('#atlasVisualCanvas');
    if(!canvas||canvas.dataset.fastWheel==='1')return;
    canvas.dataset.fastWheel='1';
    canvas.addEventListener('wheel',e=>{
      const cy=state.activeCy;
      if(!cy)return;
      e.preventDefault();
      const rect=canvas.getBoundingClientRect();
      const renderedPosition={x:e.clientX-rect.left,y:e.clientY-rect.top};
      // Works with both mouse-wheel notches and high-resolution trackpads.
      const normalized=Math.max(-3,Math.min(3,e.deltaY/80));
      const factor=Math.pow(ZOOM_STEP,-normalized);
      zoomAt(cy,factor,renderedPosition);
    },{passive:false});
  }

  function addNavControls(){
    const toolbar=document.querySelector('.atlas-visual-toolbar');
    if(!toolbar||document.querySelector('#atlasZoomIn'))return;

    const before=document.querySelector('#atlasVisualFit');
    const make=(id,label,title)=>{
      const b=document.createElement('button');
      b.id=id;b.type='button';b.textContent=label;b.title=title;
      return b;
    };

    const minus=make('atlasZoomOut','−','Zoom out');
    const readout=make('atlasZoomLevel','100%','Current zoom');
    readout.disabled=true;
    const plus=make('atlasZoomIn','+','Zoom in');
    const reset=make('atlasZoomReset','100%','Reset to 100% zoom');
    const focus=make('atlasVisualFocus','Focus','Focus selected node and its neighbors');

    for(const el of [minus,readout,plus,reset,focus])toolbar.insertBefore(el,before||null);

    minus.addEventListener('click',()=>zoomAt(state.activeCy,1/ZOOM_STEP));
    plus.addEventListener('click',()=>zoomAt(state.activeCy,ZOOM_STEP));
    reset.addEventListener('click',resetZoom);
    focus.addEventListener('click',focusSelection);

    const fit=document.querySelector('#atlasVisualFit');
    fit?.addEventListener('click',()=>setTimeout(updateZoomReadout,30));
  }

  const previousRenderVisual=renderVisual;
  renderVisual=async function(view,meta){
    await previousRenderVisual(view,meta);
    configureCy();
    installFastWheel();
  };

  const previousBindVisualControls=bindVisualControls;
  bindVisualControls=function(){
    previousBindVisualControls();
    addNavControls();
    installFastWheel();
    configureCy();
  };

  window.addEventListener('keydown',e=>{
    if(state.activeTab!=='visuals'||!state.activeCy)return;
    const tag=String(document.activeElement?.tagName||'').toLowerCase();
    if(tag==='input'||tag==='textarea'||tag==='select')return;
    if(e.key==='+'||e.key==='='){e.preventDefault();zoomAt(state.activeCy,ZOOM_STEP)}
    if(e.key==='-'||e.key==='_'){e.preventDefault();zoomAt(state.activeCy,1/ZOOM_STEP)}
    if(e.key==='0'){e.preventDefault();resetZoom()}
    if(e.key.toLowerCase()==='f'){e.preventDefault();focusSelection()}
  });

  // Direct visual deep-links may already be rendered by the time this patch loads.
  if(document.querySelector('.atlas-visual-toolbar')){
    addNavControls();
    installFastWheel();
    configureCy();
  }
})();
