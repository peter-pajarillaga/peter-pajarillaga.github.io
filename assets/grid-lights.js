
/* Aquarius Grid Lights */
(() => {
  if (document.getElementById("aq-grid-lights")) return;

  const canvas = document.createElement("canvas");
  canvas.id = "aq-grid-lights";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");
  const spacing = 64;
  const count = 13;
  const directions = [
    [1, 0], [-1, 0], [0, 1], [0, -1]
  ];

  let width, height, cols, rows, dots = [];
  let lastTime = 0;

  const key = (x, y) => `${x},${y}`;
  const edge = (a, b) =>
    [key(a.x, a.y), key(b.x, b.y)].sort().join("|");

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);

    width = window.innerWidth;
    height = window.innerHeight;
    cols = Math.floor(width / spacing);
    rows = Math.floor(height / spacing);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    dots = [];
    const used = new Set();

    for (let i = 0; i < count; i++) {
      let p, attempts = 0;

      do {
        p = {
          x: Math.floor(Math.random() * (cols + 1)),
          y: Math.floor(Math.random() * (rows + 1))
        };
        attempts++;
      } while (used.has(key(p.x, p.y)) && attempts < 100);

      if (used.has(key(p.x, p.y))) break;
      used.add(key(p.x, p.y));

      dots.push({
        from: p,
        to: null,
        progress: 0,
        speed: 22 + Math.random() * 28,
        direction: null,
        trail: []
      });
    }
  }

  function chooseDirection(dot, occupied, reserved) {
    const choices = directions
      .map(dir => ({
        x: dot.from.x + dir[0],
        y: dot.from.y + dir[1],
        dir
      }))
      .filter(p =>
        p.x >= 0 && p.x <= cols &&
        p.y >= 0 && p.y <= rows &&
        !occupied.has(key(p.x, p.y)) &&
        !reserved.has(edge(dot.from, p))
      );

    if (!choices.length) return;

    const choice = choices[
      Math.floor(Math.random() * choices.length)
    ];

    dot.to = { x: choice.x, y: choice.y };
    dot.direction = choice.dir;
    dot.progress = 0;

    reserved.add(edge(dot.from, dot.to));
    occupied.add(key(dot.to.x, dot.to.y));
  }

  function animate(time) {
    const dt = Math.min((time - lastTime) / 1000 || 0, 0.05);
    lastTime = time;

    ctx.clearRect(0, 0, width, height);

    // Stationary background grid
    ctx.strokeStyle = "rgba(64,224,208,0.085)";
    ctx.lineWidth = 0.65;
    ctx.beginPath();

    for (let x = 0; x <= cols; x++) {
      ctx.moveTo(x * spacing, 0);
      ctx.lineTo(x * spacing, height);
    }

    for (let y = 0; y <= rows; y++) {
      ctx.moveTo(0, y * spacing);
      ctx.lineTo(width, y * spacing);
    }

    ctx.stroke();

    const occupied = new Set();
    const reserved = new Set();

    for (const dot of dots) {
      occupied.add(key(dot.from.x, dot.from.y));

      if (dot.to) {
        occupied.add(key(dot.to.x, dot.to.y));
        reserved.add(edge(dot.from, dot.to));
      }
    }

    // Move dots along reserved paths
    for (const dot of dots) {
      if (!dot.to) continue;

      dot.progress = Math.min(
        1,
        dot.progress + dot.speed * dt / spacing
      );

      if (dot.progress >= 1) {
        occupied.delete(key(dot.from.x, dot.from.y));
        reserved.delete(edge(dot.from, dot.to));

        dot.from = dot.to;
        dot.to = null;
        dot.progress = 0;
      }
    }

    // Choose new directions at intersections
    for (const dot of dots) {
      if (!dot.to) {
        chooseDirection(dot, occupied, reserved);
      }
    }

    // Draw glowing dots and trails
    for (const dot of dots) {
      const x = (
        dot.from.x +
        (dot.to ? (dot.to.x - dot.from.x) * dot.progress : 0)
      ) * spacing;

      const y = (
        dot.from.y +
        (dot.to ? (dot.to.y - dot.from.y) * dot.progress : 0)
      ) * spacing;

      const previous = dot.trail[dot.trail.length - 1];

      if (
        !previous ||
        Math.hypot(x - previous.x, y - previous.y) > 2
      ) {
        dot.trail.push({ x, y });
      }

      if (dot.trail.length > 18) dot.trail.shift();

      for (let i = 1; i < dot.trail.length; i++) {
        ctx.beginPath();
        ctx.moveTo(dot.trail[i - 1].x, dot.trail[i - 1].y);
        ctx.lineTo(dot.trail[i].x, dot.trail[i].y);
        ctx.strokeStyle =
          `rgba(64,224,208,${(i / dot.trail.length) * 0.52})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      const glow = ctx.createRadialGradient(
        x, y, 0, x, y, 11
      );

      glow.addColorStop(0, "rgba(230,255,253,0.95)");
      glow.addColorStop(0.18, "rgba(64,224,208,0.85)");
      glow.addColorStop(1, "rgba(64,224,208,0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      requestAnimationFrame(animate);
    }
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(animate);
})();
