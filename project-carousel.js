/* FunnelFlow Assist — Project carousel (complete replacement)
   Keeps the existing 3D design and synchronizes the project viewer,
   page buttons and technical details through the existing card click handlers.
*/
document.addEventListener("DOMContentLoaded", () => {
  const rail = document.getElementById("projectRail");
  if (!rail) return;

  const cards = [...rail.querySelectorAll(".explorer-card[data-project]")];
  if (!cards.length) return;

  const prev = document.getElementById("projectPrev");
  const next = document.getElementById("projectNext");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const count = cards.length;
  const step = 360 / count;
  const normalize = degrees => ((degrees + 180) % 360 + 360) % 360 - 180;
  const closest = degrees => Math.round(degrees / step) * step;

  let selected = Math.max(0, cards.findIndex(card => card.classList.contains("active")));
  let angle = selected * step;
  let pointerId = null;
  let startX = 0;
  let startAngle = 0;
  let dragging = false;
  let suppressNextClick = false;

  rail.setAttribute("tabindex", rail.getAttribute("tabindex") || "0");
  rail.style.touchAction = "pan-y";

  function render() {
    const width = rail.clientWidth;
    const radius = Math.max(70, Math.min(width * 0.32, 230));
    const depth = Math.max(40, Math.min(width * 0.12, 90));

    cards.forEach((card, index) => {
      const a = normalize(index * step - angle);
      const radians = a * Math.PI / 180;
      const x = Math.sin(radians) * radius;
      const z = Math.cos(radians) * depth;
      const scale = 0.76 + 0.24 * (Math.cos(radians) + 1) / 2;
      const transform = `translateX(${x.toFixed(2)}px) translateZ(${z.toFixed(2)}px) rotateY(${(-a * 0.42).toFixed(2)}deg) scale(${scale.toFixed(3)})`;

      card.style.setProperty("--carousel-transform", transform);
      card.style.transform = transform;
      card.style.zIndex = String(Math.round(z + 100));
      card.style.opacity = String(0.56 + 0.44 * (Math.cos(radians) + 1) / 2);
    });
  }

  function activate(index) {
    selected = ((index % count) + count) % count;
    angle = selected * step;
    rail.classList.remove("is-dragging");
    render();
    // This activates BOTH existing handlers in index.html:
    // the screenshot viewer and the technical-details panel.
    cards[selected].click();
  }

  function rotate(direction) {
    activate(Math.round(angle / step) + direction);
  }

  prev?.addEventListener("click", () => rotate(-1));
  next?.addEventListener("click", () => rotate(1));

  rail.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target.closest(".carousel-arrow")) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startAngle = angle;
    dragging = false;
    // Capture only after movement is detected so normal clicks remain reliable.
  });

  rail.addEventListener("pointermove", event => {
    if (pointerId !== event.pointerId) return;
    const delta = event.clientX - startX;
    if (!dragging && Math.abs(delta) > 8) {
      dragging = true;
      rail.classList.add("is-dragging");
      if (event.pointerType === "mouse") {
        try { rail.setPointerCapture(pointerId); } catch (_) {}
      }
    }
    if (!dragging) return;
    angle = startAngle - delta / Math.max(180, rail.clientWidth) * 240;
    render();
  });

  function finish(event) {
    if (pointerId !== event.pointerId) return;
    pointerId = null;
    if (dragging) {
      dragging = false;
      suppressNextClick = true;
      const nextIndex = Math.round(angle / step);
      activate(nextIndex);
      // Clear after the browser's ensuing pointer-generated click.
      window.setTimeout(() => { suppressNextClick = false; }, 250);
    }
    rail.classList.remove("is-dragging");
  }

  rail.addEventListener("pointerup", finish);
  rail.addEventListener("pointercancel", finish);
  rail.addEventListener("lostpointercapture", event => {
    if (pointerId === event.pointerId) finish(event);
  });

  rail.addEventListener("click", event => {
    if (suppressNextClick && event.isTrusted) {
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressNextClick = false;
    }
  }, true);

  cards.forEach((card, index) => {
    card.addEventListener("click", event => {
      if (!event.isTrusted) return;
      selected = index;
      angle = index * step;
      render();
    });
  });

  rail.addEventListener("keydown", event => {
    if (event.target !== rail) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      rotate(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      rotate(1);
    }
  });

  // CSS handles the reduced-motion transition rules; JS keeps positioning stable.
  motionQuery.addEventListener?.("change", render);
  window.addEventListener("resize", render, { passive: true });
  render();
});
