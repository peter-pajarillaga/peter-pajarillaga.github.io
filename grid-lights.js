/* Aquarius grid: four-way turning lights with non-overlapping node/edge reservations. */
(() => {
  if (document.getElementById('aq-grid-lights')) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'aq-grid-lights';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const spacing = 52, count = 16, safe = 25;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  let w=0,h=0,cols=0,rows=0,dots=[],last=0;
  const key=(x,y)=>`${x},${y}`;
  const edge=(a,b)=>[key(a.x,a.y),key(b.x,b.y)].sort().join('|');
  const rand=n=>Math.floor(Math.random()*n);
  function resize(){
    const dpr=Math.min(window.devicePixelRatio||1,2);
    w=window.innerWidth;h=window.innerHeight;
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    canvas.style.width=w+'px';canvas.style.height=h+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    cols=Math.floor(w/spacing);rows=Math.floor(h/spacing);
    dots=[];
    const used=new Set();
    for(let i=0;i<count && used.size<(cols+1)*(rows+1);i++){
      let p,tries=0;
      do {p={x:rand(cols+1),y:rand(rows+1)};} while(used.has(key(p.x,p.y)) && ++tries<100);
      if(used.has(key(p.x,p.y)))break;
      used.add(key(p.x,p.y));
      dots.push({from:p,to:null,t:0,speed:22+Math.random()*28,trail:[],dir:null});
    }
  }
  function choose(d, occupied, reserved){
    const options=dirs.map(v=>({x:d.from.x+v[0],y:d.from.y+v[1],v})).filter(p=>
      p.x>=0&&p.x<=cols&&p.y>=0&&p.y<=rows &&
      !occupied.has(key(p.x,p.y)) && !reserved.has(edge(d.from,p))
    );
    if(!options.length)return;
    options.sort((a,b)=>((d.dir && a.v[0]===d.dir[0]&&a.v[1]===d.dir[1])?-0.45:0)+Math.random() -
      (((d.dir && b.v[0]===d.dir[0]&&b.v[1]===d.dir[1])?-0.45:0)+Math.random()));
    const p=options[0];d.to={x:p.x,y:p.y};d.dir=p.v;d.t=0;reserved.add(edge(d.from,d.to));occupied.add(key(d.to.x,d.to.y));
  }
  function render(now){
    const dt=Math.min((now-last)/1000||0,.05);last=now;
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle='rgba(64,224,208,.065)';ctx.lineWidth=.65;ctx.beginPath();
    for(let x=0;x<=cols;x++){ctx.moveTo(x*spacing,0);ctx.lineTo(x*spacing,h)}
    for(let y=0;y<=rows;y++){ctx.moveTo(0,y*spacing);ctx.lineTo(w,y*spacing)}ctx.stroke();
    const occupied=new Set(),reserved=new Set();
    for(const d of dots){
      occupied.add(key(d.from.x,d.from.y));
      if(d.to){occupied.add(key(d.to.x,d.to.y));reserved.add(edge(d.from,d.to))}
    }
    // Plan movements before drawing, reserving destination nodes and entire edges.
    for(const d of dots){
      if(d.to){
        d.t=Math.min(1,d.t+d.speed*dt/spacing);
        if(d.t>=1){
          occupied.delete(key(d.from.x,d.from.y));reserved.delete(edge(d.from,d.to));
          d.from=d.to;d.to=null;d.t=0;
        }
      }
    }
    for(const d of dots){if(!d.to)choose(d,occupied,reserved)}
    for(const d of dots){
      const x=(d.from.x+(d.to?(d.to.x-d.from.x)*d.t:0))*spacing;
      const y=(d.from.y+(d.to?(d.to.y-d.from.y)*d.t:0))*spacing;
      const lastPt=d.trail[d.trail.length-1];
      if(!lastPt||Math.hypot(x-lastPt.x,y-lastPt.y)>2)d.trail.push({x,y});
      if(d.trail.length>18)d.trail.shift();
      for(let j=1;j<d.trail.length;j++){
        ctx.beginPath();ctx.moveTo(d.trail[j-1].x,d.trail[j-1].y);
        ctx.lineTo(d.trail[j].x,d.trail[j].y);
        ctx.strokeStyle=`rgba(64,224,208,${(j/d.trail.length)*.52})`;
        ctx.lineWidth=1.6;ctx.stroke();
      }
      const glow=ctx.createRadialGradient(x,y,0,x,y,11);
      glow.addColorStop(0,'rgba(230,255,253,.95)');
      glow.addColorStop(.18,'rgba(64,224,208,.85)');
      glow.addColorStop(1,'rgba(64,224,208,0)');
      ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,11,0,Math.PI*2);ctx.fill();
    }
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)requestAnimationFrame(render);
  }
  window.addEventListener('resize',resize,{passive:true});resize();requestAnimationFrame(render);
})();
