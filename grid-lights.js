/* FUNNELFLOW ASSIST — AQUARIUS GRID LIGHTS
   Complete replacement: 52px grid, 16 moving lights, four-way turns,
   glowing trails. Pauses when hidden, on mobile, or for reduced motion.
*/
(() => {
  if (document.getElementById('aq-grid-lights')) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'aq-grid-lights';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const spacing = 52;
  const count = 16;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const mobile = window.matchMedia('(max-width: 700px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, cols = 0, rows = 0;
  let dots = [], frame = null, last = 0, resizeTimer = null;

  const key = (x, y) => `${x},${y}`;
  const edge = (a, b) => [key(a.x, a.y), key(b.x, b.y)].sort().join('|');
  const random = n => Math.floor(Math.random() * n);
  const enabled = () => !mobile.matches && !reducedMotion.matches && !document.hidden;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.floor(width / spacing);
    rows = Math.floor(height / spacing);
    dots = [];
    const used = new Set();
    const total = (cols + 1) * (rows + 1);
    for (let i = 0; i < Math.min(count, total); i++) {
      let point, tries = 0;
      do {
        point = { x: random(cols + 1), y: random(rows + 1) };
      } while (used.has(key(point.x, point.y)) && ++tries < 100);
      if (used.has(key(point.x, point.y))) continue;
      used.add(key(point.x, point.y));
      dots.push({ from: point, to: null, t: 0, speed: 22 + Math.random() * 28, trail: [], dir: null });
    }
  }

  function choose(dot, occupied, reserved) {
    const options = dirs.map(v => ({
      x: dot.from.x + v[0], y: dot.from.y + v[1], v
    })).filter(p =>
      p.x >= 0 && p.x <= cols && p.y >= 0 && p.y <= rows &&
      !occupied.has(key(p.x, p.y)) && !reserved.has(edge(dot.from, p))
    );
    if (!options.length) return;
    // Weighted choice: prefer continuing straight, but allow natural turns.
    const weights = options.map(p => dot.dir && p.v[0] === dot.dir[0] && p.v[1] === dot.dir[1] ? 2.5 : 1);
    let choice = Math.random() * weights.reduce((a, b) => a + b, 0);
    let index = 0;
    while (index < weights.length - 1 && (choice -= weights[index]) >= 0) index++;
    const selected = options[index];
    dot.to = { x: selected.x, y: selected.y };
    dot.dir = selected.v;
    dot.t = 0;
    reserved.add(edge(dot.from, dot.to));
    occupied.add(key(dot.to.x, dot.to.y));
  }

  function render(now) {
    frame = null;
    if (!enabled()) return;
    const dt = Math.min((now - last) / 1000 || 0, .05);
    last = now;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(64,224,208,.065)';
    ctx.lineWidth = .65;
    ctx.beginPath();
    for (let x = 0; x <= cols; x++) { ctx.moveTo(x * spacing, 0); ctx.lineTo(x * spacing, height); }
    for (let y = 0; y <= rows; y++) { ctx.moveTo(0, y * spacing); ctx.lineTo(width, y * spacing); }
    ctx.stroke();

    // Advance first, then build fresh occupancy from the updated positions.
    for (const dot of dots) {
      if (!dot.to) continue;
      dot.t = Math.min(1, dot.t + dot.speed * dt / spacing);
      if (dot.t >= 1) {
        dot.from = dot.to;
        dot.to = null;
        dot.t = 0;
      }
    }
    const occupied = new Set();
    const reserved = new Set();
    for (const dot of dots) {
      occupied.add(key(dot.from.x, dot.from.y));
      if (dot.to) {
        occupied.add(key(dot.to.x, dot.to.y));
        reserved.add(edge(dot.from, dot.to));
      }
    }
    for (const dot of dots) if (!dot.to) choose(dot, occupied, reserved);

    for (const dot of dots) {
      const x = (dot.from.x + (dot.to ? (dot.to.x - dot.from.x) * dot.t : 0)) * spacing;
      const y = (dot.from.y + (dot.to ? (dot.to.y - dot.from.y) * dot.t : 0)) * spacing;
      const previous = dot.trail[dot.trail.length - 1];
      if (!previous || Math.hypot(x - previous.x, y - previous.y) > 2) dot.trail.push({ x, y });
      if (dot.trail.length > 18) dot.trail.shift();
      for (let j = 1; j < dot.trail.length; j++) {
        ctx.beginPath();
        ctx.moveTo(dot.trail[j - 1].x, dot.trail[j - 1].y);
        ctx.lineTo(dot.trail[j].x, dot.trail[j].y);
        ctx.strokeStyle = `rgba(64,224,208,${(j / dot.trail.length) * .52})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 11);
      glow.addColorStop(0, 'rgba(230,255,253,.95)');
      glow.addColorStop(.18, 'rgba(64,224,208,.85)');
      glow.addColorStop(1, 'rgba(64,224,208,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.fill();
    }
    frame = window.requestAnimationFrame(render);
  }

  function sync() {
    if (!enabled()) {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      last = 0;
      ctx.clearRect(0, 0, width, height);
      return;
    }
    if (frame === null) {
      last = 0;
      frame = window.requestAnimationFrame(render);
    }
  }

  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => { resize(); sync(); }, 140);
  }, { passive: true });
  document.addEventListener('visibilitychange', sync);
  mobile.addEventListener?.('change', sync);
  reducedMotion.addEventListener?.('change', sync);
  resize();
  sync();
})();
