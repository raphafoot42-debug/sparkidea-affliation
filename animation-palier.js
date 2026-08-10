  // Palier celebration (demo trigger)
  const celebrateOverlay = document.getElementById('celebrate-overlay');
  const confettiCanvas = document.getElementById('confetti-canvas');
  const cctx = confettiCanvas.getContext('2d');
  let confettiPieces = [];
  function launchConfetti(){
    confettiCanvas.width = window.innerWidth; confettiCanvas.height = window.innerHeight;
    confettiCanvas.classList.add('active');
    const colors = ['#00e0ff','#38bdf8','#fbbf24','#c084fc','#4ade80'];
    confettiPieces = Array.from({length:140}, ()=>({
      x: Math.random()*confettiCanvas.width, y: -20 - Math.random()*200,
      s: 4+Math.random()*5, c: colors[Math.floor(Math.random()*colors.length)],
      vy: 2+Math.random()*3, vx: -1.5+Math.random()*3, r: Math.random()*360, vr: -6+Math.random()*12
    }));
    let frame=0;
    function tick(){
      frame++;
      cctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
      confettiPieces.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy; p.r+=p.vr;
        cctx.save(); cctx.translate(p.x,p.y); cctx.rotate(p.r*Math.PI/180);
        cctx.fillStyle=p.c; cctx.fillRect(-p.s/2,-p.s/2,p.s,p.s*0.6); cctx.restore();
      });
      if(frame<160) requestAnimationFrame(tick);
      else confettiCanvas.classList.remove('active');
    }
    tick();
  }
  document.getElementById('demo-trigger').addEventListener('click', ()=>{
    celebrateOverlay.classList.add('active');
    launchConfetti();
  });
  document.getElementById('celebrate-close').addEventListener('click', ()=> celebrateOverlay.classList.remove('active'));
  celebrateOverlay.addEventListener('click', e=>{ if(e.target===celebrateOverlay) celebrateOverlay.classList.remove('active'); });
