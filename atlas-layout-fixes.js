(()=>{
  const originalLayoutOptions=layoutOptions;

  layoutOptions=function(view){
    const id=String(view?.id||'').toLowerCase();
    const kind=String(view?.kind||'').toLowerCase();
    const type=String(view?.diagram_type||view?.visual_type||'').toLowerCase();
    const isDependency=id==='dependency-surface'||kind==='dependency'||(type==='network'&&/dependenc|import/.test(`${id} ${kind} ${String(view?.title||'').toLowerCase()}`));

    if(isDependency){
      const direction={LR:'RIGHT',RL:'LEFT',TB:'DOWN',BT:'UP'}[view?.layout?.direction]||'RIGHT';
      return {
        name:'elk',
        fit:true,
        padding:110,
        animate:false,
        nodeDimensionsIncludeLabels:true,
        elk:{
          algorithm:'layered',
          'elk.direction':direction,
          'elk.edgeRouting':'ORTHOGONAL',
          'elk.spacing.nodeNode':'92',
          'elk.spacing.edgeNode':'48',
          'elk.layered.spacing.nodeNodeBetweenLayers':'150',
          'elk.layered.spacing.edgeNodeBetweenLayers':'70',
          'elk.layered.spacing.edgeEdgeBetweenLayers':'28',
          'elk.layered.nodePlacement.strategy':'NETWORK_SIMPLEX',
          'elk.layered.cycleBreaking.strategy':'GREEDY'
        }
      };
    }

    return originalLayoutOptions(view);
  };
})();
