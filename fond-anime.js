  // Subtle static-ish cybernetic grid background
  const canvas = document.getElementById('grid-canvas');
  const ctx = canvas.getContext('2d');
  let w,h, points=[];
  function resize(){
    w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight;
    points = [];
    const gap = 70;
    for(let x=0;x<w+gap;x+=gap){
      for(let y=0;y<h+gap;y+=gap){
        points.push({x:x+(Math.random()*20-10), y:y+(Math.random()*20-10), o:Math.random()*.5+.1});
      }
    }
  }
  let mouse={x:-9999,y:-9999};
  window.addEventListener('mousemove', e=>{mouse.x=e.clientX; mouse.y=e.clientY;});
  window.addEventListener('resize', resize);
  resize();
  function draw(){
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle='rgba(0,224,255,0.06)';
    for(let i=0;i<points.length;i++){
      for(let j=i+1;j<points.length;j++){
        const p1=points[i], p2=points[j];
        const d=Math.hypot(p1.x-p2.x,p1.y-p2.y);
        if(d<90){ ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y); ctx.stroke(); }
      }
    }
    points.forEach(p=>{
      const dm = Math.hypot(p.x-mouse.x,p.y-mouse.y);
      const glow = dm<140 ? (1-dm/140) : 0;
      ctx.beginPath();
      ctx.arc(p.x,p.y,glow>0?2+glow*2:1.4,0,Math.PI*2);
      ctx.fillStyle = glow>0 ? `rgba(0,224,255,${0.15+glow*0.6})` : `rgba(0,224,255,${p.o*0.25})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
