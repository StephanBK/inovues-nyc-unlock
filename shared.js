// Shared helpers for all INOVUES visual options. Loaded after config.js.
window.INV = (() => {
  const WOODHULL = [-73.941604, 40.700528];
  const COLORS = {'H+H':'#00E5FF','DOE':'#F5B942','NYPD':'#5B8DEF','FDNY':'#EF5B5B','DPR':'#6BCB77','CUNY':'#C77DFF',
    'DSNY':'#A0A0A0','DCAS':'#FFFFFF','DOT':'#FF9F1C','DOC':'#B5651D','Libraries':'#F2E863','DEP':'#3ABEFF','Other':'#8890A0'};
  const LABELS = {'H+H':'NYC Health + Hospitals','DOE':'Dept. of Education','NYPD':'NYPD','FDNY':'FDNY','DPR':'Parks','CUNY':'CUNY',
    'DSNY':'Sanitation','DCAS':'DCAS-managed','DOT':'DOT','DOC':'Correction','Libraries':'Libraries','DEP':'DEP','Other':'Other agencies'};
  const COLOR_EXPR = ['match',['get','agency'], ...Object.entries(COLORS).flat().slice(0,-2), COLORS.Other];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tokenOk(){
    const ok = window.MAPBOX_TOKEN && !window.MAPBOX_TOKEN.startsWith('PASTE');
    if(!ok){ const e=document.getElementById('err'); if(e) e.classList.add('on'); }
    return ok;
  }
  function makeMap(opts){
    mapboxgl.accessToken = window.MAPBOX_TOKEN;
    const map = new mapboxgl.Map(Object.assign({container:'map',style:'mapbox://styles/mapbox/dark-v11',antialias:true,attributionControl:true},opts));
    return map;
  }
  async function loadData(){
    const [b,a] = await Promise.all([fetch('buildings.json').then(r=>r.json()), fetch('agg.json').then(r=>r.json())]);
    return {buildings:b, agg:a};
  }
  function kmFromWoodhull(lon,lat){
    const R=6371, toR=Math.PI/180;
    const dLat=(lat-WOODHULL[1])*toR, dLon=(lon-WOODHULL[0])*toR;
    const h=Math.sin(dLat/2)**2 + Math.cos(WOODHULL[1]*toR)*Math.cos(lat*toR)*Math.sin(dLon/2)**2;
    return 2*R*Math.asin(Math.sqrt(h));
  }
  function circlePolygon(center,km,n=96){
    const pts=[]; const lat=center[1]*Math.PI/180;
    for(let i=0;i<=n;i++){ const a=i/n*2*Math.PI;
      pts.push([center[0]+ (km/111.32/Math.cos(lat))*Math.cos(a), center[1]+ (km/110.57)*Math.sin(a)]); }
    return {type:'Feature',geometry:{type:'Polygon',coordinates:[pts]}};
  }
  function fmtM(x){ return (x/1e6).toFixed(1)+'M'; }
  function tooltip(map,layer){
    const tip=document.createElement('div'); tip.className='tip'; document.body.appendChild(tip);
    map.on('mousemove',layer,e=>{const p=e.features[0].properties; map.getCanvas().style.cursor='pointer';
      tip.innerHTML=`<b>${p.name}</b><br>${LABELS[p.agency]||p.agency} · ${(p.sqft/1000).toFixed(0)}k sq ft`;
      tip.style.display='block'; tip.style.left=e.point.x+14+'px'; tip.style.top=e.point.y+14+'px';});
    map.on('mouseleave',layer,()=>{map.getCanvas().style.cursor=''; tip.style.display='none';});
  }

  // ---- Constellation (D3) ----
  // Rings: 0 Woodhull · 1 H+H buildings · 2 DCAS Energy Management (the buyer) · 3 agency portfolios sized by sq ft
  // onSelect(ring, agency|null) fires when the user clicks a ring/agency. reveal(step) animates 0..3.
  function constellation(svgEl, agg, {onSelect=()=>{}, compact=false}={}){
    const svg=d3.select(svgEl); const W=+svgEl.getAttribute('width')||svgEl.clientWidth, H=+svgEl.getAttribute('height')||svgEl.clientHeight;
    svg.attr('viewBox',`0 0 ${W} ${H}`); svg.selectAll('*').remove();
    const cx=W/2, cy=H/2, R=Math.min(W,H)/2-(compact?40:70);
    const r1=R*0.30, r2=R*0.52, r3=R*0.82;
    const g=svg.append('g');
    const hh=agg.agencies.find(a=>a.grp==='H+H');
    const others=agg.agencies.filter(a=>a.grp!=='H+H').sort((a,b)=>b.sqft-a.sqft);
    const sizeScale=d3.scaleSqrt().domain([0,d3.max(others,a=>a.sqft)]).range([6,compact?26:38]);

    // ring guides
    [r1,r2,r3].forEach(r=>g.append('circle').attr('cx',cx).attr('cy',cy).attr('r',r).attr('fill','none').attr('stroke','#2A3350').attr('stroke-dasharray','2 6').attr('class','guide').style('opacity',0));

    // ring 3: agencies
    const ag=g.append('g').attr('class','ring3').style('opacity',0);
    others.forEach((a,i)=>{
      const ang=-Math.PI/2 + i/others.length*2*Math.PI; const x=cx+r3*Math.cos(ang), y=cy+r3*Math.sin(ang);
      ag.append('line').attr('x1',cx+r2*Math.cos(ang)).attr('y1',cy+r2*Math.sin(ang)).attr('x2',x).attr('y2',y).attr('stroke',COLORS[a.grp]).attr('stroke-opacity',.35);
      const n=ag.append('g').attr('class','agency').attr('transform',`translate(${x},${y})`).style('cursor','pointer').on('click',()=>onSelect(3,a.grp));
      n.append('circle').attr('r',sizeScale(a.sqft)).attr('fill',COLORS[a.grp]).attr('fill-opacity',.85);
      const lx=Math.cos(ang)*(sizeScale(a.sqft)+8), ly=Math.sin(ang)*(sizeScale(a.sqft)+8);
      const anchor=Math.cos(ang)>0.3?'start':Math.cos(ang)<-0.3?'end':'middle';
      n.append('text').attr('x',lx).attr('y',ly+(Math.sin(ang)>0.3?12:Math.sin(ang)<-0.3?-4:4)).attr('text-anchor',anchor).attr('fill','#E8ECF6').attr('font-size',compact?11:13).attr('font-weight',600).text(LABELS[a.grp]);
      n.append('text').attr('x',lx).attr('y',ly+(Math.sin(ang)>0.3?26:Math.sin(ang)<-0.3?10:18)).attr('text-anchor',anchor).attr('fill','#8C95AE').attr('font-size',compact?10:12).text(`${a.n} bldgs · ${a.sqft}M sq ft`);
    });

    // ring 2: the buyer
    const buyer=g.append('g').attr('class','ring2').style('opacity',0).style('cursor','pointer').on('click',()=>onSelect(2,null));
    buyer.append('circle').attr('cx',cx).attr('cy',cy).attr('r',r2).attr('fill','none').attr('stroke','#FFFFFF').attr('stroke-opacity',.55).attr('stroke-width',1.5);
    buyer.append('text').attr('x',cx).attr('y',cy-r2-8).attr('text-anchor','middle').attr('fill','#FFFFFF').attr('font-size',compact?12:14).attr('font-weight',600).text('DCAS Energy Management — funds retrofits for every agency');

    // ring 1: H+H buildings
    const hg=g.append('g').attr('class','ring1').style('opacity',0).style('cursor','pointer').on('click',()=>onSelect(1,'H+H'));
    for(let i=0;i<hh.n;i++){ const ang=i/hh.n*2*Math.PI; hg.append('circle').attr('cx',cx+r1*Math.cos(ang)).attr('cy',cy+r1*Math.sin(ang)).attr('r',compact?2.2:3).attr('fill',COLORS['H+H']).attr('fill-opacity',.9); }
    hg.append('text').attr('x',cx).attr('y',cy+r1+(compact?16:20)).attr('text-anchor','middle').attr('fill',COLORS['H+H']).attr('font-size',compact?11:13).attr('font-weight',600).text(`NYC Health + Hospitals · ${hh.n} buildings · ${hh.sqft}M sq ft`);

    // center: Woodhull
    const w=g.append('g').attr('class','ring0').style('cursor','pointer').on('click',()=>onSelect(0,'wood'));
    w.append('circle').attr('cx',cx).attr('cy',cy).attr('r',compact?22:30).attr('fill',COLORS['H+H']).attr('fill-opacity',.18).attr('class','halo');
    w.append('circle').attr('cx',cx).attr('cy',cy).attr('r',compact?7:9).attr('fill','#fff').attr('stroke',COLORS['H+H']).attr('stroke-width',3);
    w.append('text').attr('x',cx).attr('y',cy-(compact?30:40)).attr('text-anchor','middle').attr('fill','#fff').attr('font-size',compact?12:14).attr('font-weight',800).text('Woodhull Hospital');
    w.append('text').attr('x',cx).attr('y',cy-(compact?16:24)).attr('text-anchor','middle').attr('fill','#8C95AE').attr('font-size',compact?10:12).text('1,134 SWR units · NYSERDA-funded');

    function reveal(step,dur=700){
      const t=reduced?0:dur;
      g.selectAll('.guide').transition().duration(t).style('opacity',step>=1?1:0);
      g.select('.ring1').transition().duration(t).style('opacity',step>=1?1:0);
      g.select('.ring2').transition().duration(t).style('opacity',step>=2?1:0);
      g.select('.ring3').transition().duration(t).style('opacity',step>=3?1:0);
    }
    function highlight(ring,agency){
      g.selectAll('.agency circle').attr('stroke','none');
      g.select('.ring1').style('filter',null); g.select('.ring2 circle').attr('stroke-opacity',.55);
      if(ring===3&&agency){ g.selectAll('.agency').filter(function(){return d3.select(this).select('text').text()===LABELS[agency];}).select('circle').attr('stroke','#fff').attr('stroke-width',3); }
      if(ring===2) g.select('.ring2 circle').attr('stroke-opacity',1);
    }
    return {reveal, highlight};
  }

  return {WOODHULL,COLORS,LABELS,COLOR_EXPR,reduced,tokenOk,makeMap,loadData,kmFromWoodhull,circlePolygon,fmtM,tooltip,constellation};
})();
