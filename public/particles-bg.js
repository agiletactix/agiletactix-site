/* ======================================================================
   Particle-network background — reusable across assessment pages.

   Renders a subtle vector-node field (blue dots + connecting lines)
   into any <canvas data-particles> element. Lifted verbatim from the
   7-signs carousel so the visual language stays consistent.

   Usage:
     <div class="particles-layer">
       <canvas data-particles
               data-focus-x="0.5"
               data-focus-y="0.4"
               data-count="90"
               data-radius="900"></canvas>
     </div>
     <script src="particles-bg.js"></script>

   The canvas auto-sizes to its container on load + resize.
   ====================================================================== */
(function () {
  const CONNECT = 210;

  function sizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = Math.max(1, Math.round(rect.width  * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas._dpr = dpr;
  }

  function drawParticles(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const fx = parseFloat(canvas.dataset.focusX || '0.5');
    const fy = parseFloat(canvas.dataset.focusY || '0.4');
    // Radius scales with canvas so the pattern looks consistent at any size
    const radiusHint = parseFloat(canvas.dataset.radius || '0');
    const R = radiusHint > 0
      ? radiusHint * (canvas._dpr || 1)
      : Math.max(W, H) * 0.7;
    const N = parseInt(canvas.dataset.count || '70', 10);
    const focusX = fx * W, focusY = fy * H;

    // Static render — one seed per page load (export-safe)
    const points = [];
    for (let i = 0; i < N; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.7) * R;
      const jitter = R * 0.28;
      points.push({
        x: focusX + Math.cos(angle) * dist + (Math.random() - 0.5) * jitter,
        y: focusY + Math.sin(angle) * dist + (Math.random() - 0.5) * jitter,
        r: (Math.random() * 2.2 + 0.8) * (canvas._dpr || 1)
      });
    }
    const pad = 40 * (canvas._dpr || 1);
    for (const p of points) {
      p.x = Math.max(pad, Math.min(W - pad, p.x));
      p.y = Math.max(pad, Math.min(H - pad, p.y));
    }

    const connect = CONNECT * (canvas._dpr || 1);
    // connecting lines
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < connect) {
          const alpha = (1 - d / connect) * 0.30;
          ctx.strokeStyle = `rgba(96,165,250,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
    }
    // nodes + glow
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(96,165,250,0.85)';
      ctx.fill();
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
      grad.addColorStop(0, 'rgba(96,165,250,0.35)');
      grad.addColorStop(1, 'rgba(96,165,250,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function paintAll() {
    document.querySelectorAll('canvas[data-particles]').forEach(c => {
      sizeCanvas(c);
      drawParticles(c);
    });
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(paintAll, 150);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', paintAll);
  } else {
    paintAll();
  }
})();
