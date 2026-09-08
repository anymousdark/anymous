/**
 * HUD Canvas — rotating arcs, radar sweep, grid, data ticks
 */
(function () {
  const canvas = document.getElementById("hudCanvas");
  const ctx = canvas.getContext("2d");
  let time = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function drawArc(cx, cy, radius, startAngle, endAngle, color, lineWidth) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth || 1;
    ctx.stroke();
  }

  function drawDashedCircle(cx, cy, radius, color, dashLen, gapLen) {
    ctx.setLineDash([dashLen, gapLen]);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawRotatingArcs(cx, cy, t) {
    const arcs = [
      { r: 140, speed: 0.3, len: 1.2, w: 2, alpha: 0.4 },
      { r: 160, speed: -0.2, len: 0.8, w: 1.5, alpha: 0.3 },
      { r: 180, speed: 0.15, len: 1.5, w: 1, alpha: 0.2 },
      { r: 200, speed: -0.4, len: 0.6, w: 2, alpha: 0.35 },
      { r: 120, speed: 0.5, len: 1.0, w: 1, alpha: 0.25 },
    ];

    arcs.forEach((arc) => {
      const start = t * arc.speed;
      drawArc(
        cx, cy, arc.r,
        start, start + arc.len,
        `rgba(0, 246, 255, ${arc.alpha})`,
        arc.w
      );
      // Secondary ghost arc
      drawArc(
        cx, cy, arc.r,
        start + Math.PI, start + Math.PI + arc.len * 0.6,
        `rgba(0, 119, 255, ${arc.alpha * 0.5})`,
        arc.w * 0.5
      );
    });
  }

  function drawRadarSweep(cx, cy, radius, t) {
    const angle = t * 0.5;
    const gradient = ctx.createConicalGradient
      ? null
      : ctx.createLinearGradient(cx, cy, cx + radius, cy);

    // Sweep line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(angle) * radius,
      cy + Math.sin(angle) * radius
    );
    ctx.strokeStyle = "rgba(0, 246, 255, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Sweep trail (gradient fade)
    for (let i = 0; i < 30; i++) {
      const a = angle - (i * 0.02);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx + Math.cos(a) * radius,
        cy + Math.sin(a) * radius
      );
      ctx.strokeStyle = `rgba(0, 246, 255, ${0.02 * (30 - i) / 30})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Blips
    const blips = [
      { angle: 0.5, dist: 0.6 },
      { angle: 2.1, dist: 0.4 },
      { angle: 4.0, dist: 0.75 },
      { angle: 5.5, dist: 0.3 },
    ];

    blips.forEach((blip) => {
      const diff = ((angle - blip.angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      if (diff < 0.8) {
        const alpha = 0.8 * (1 - diff / 0.8);
        const bx = cx + Math.cos(blip.angle) * radius * blip.dist;
        const by = cy + Math.sin(blip.angle) * radius * blip.dist;
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 246, 255, ${alpha})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 246, 255, ${alpha * 0.2})`;
        ctx.fill();
      }
    });
  }

  function drawCrosshairs(cx, cy, size, t) {
    const alpha = 0.15 + 0.05 * Math.sin(t);
    ctx.strokeStyle = `rgba(0, 246, 255, ${alpha})`;
    ctx.lineWidth = 0.5;

    // Horizontal
    ctx.beginPath();
    ctx.moveTo(cx - size, cy);
    ctx.lineTo(cx - 20, cy);
    ctx.moveTo(cx + 20, cy);
    ctx.lineTo(cx + size, cy);
    ctx.stroke();

    // Vertical
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx, cy - 20);
    ctx.moveTo(cx, cy + 20);
    ctx.lineTo(cx, cy + size);
    ctx.stroke();

    // Tick marks
    for (let i = 1; i <= 4; i++) {
      const d = i * 50;
      const tickSize = 5;
      ctx.beginPath();
      ctx.moveTo(cx + d, cy - tickSize);
      ctx.lineTo(cx + d, cy + tickSize);
      ctx.moveTo(cx - d, cy - tickSize);
      ctx.lineTo(cx - d, cy + tickSize);
      ctx.moveTo(cx - tickSize, cy + d);
      ctx.lineTo(cx + tickSize, cy + d);
      ctx.moveTo(cx - tickSize, cy - d);
      ctx.lineTo(cx + tickSize, cy - d);
      ctx.stroke();
    }
  }

  function drawHexGrid(cx, cy, t) {
    const hexSize = 30;
    const rows = 5;
    const cols = 7;
    const offsetX = cx - (cols * hexSize * 1.5) / 2;
    const offsetY = cy + 160;

    ctx.strokeStyle = `rgba(0, 246, 255, 0.06)`;
    ctx.lineWidth = 0.5;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * hexSize * 1.5;
        const y = offsetY + r * hexSize * 1.73 + (c % 2 ? hexSize * 0.866 : 0);

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const hx = x + hexSize * 0.5 * Math.cos(angle);
          const hy = y + hexSize * 0.5 * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  function drawDataTicks(t) {
    const w = canvas.width;
    const h = canvas.height;

    ctx.font = "9px Orbitron";
    ctx.fillStyle = "rgba(0, 246, 255, 0.2)";

    // Left side ticks
    for (let i = 0; i < 8; i++) {
      const y = 100 + i * 60;
      const val = (Math.sin(t * 0.5 + i) * 50 + 50).toFixed(1);
      ctx.fillText(`${val}`, 285, y);
    }

    // Right side ticks
    for (let i = 0; i < 8; i++) {
      const y = 100 + i * 60;
      const val = (Math.cos(t * 0.3 + i * 0.7) * 100 + 200).toFixed(0);
      ctx.fillText(`${val}`, w - 300, y);
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    time += 0.016;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Dashed reference circles
    drawDashedCircle(cx, cy, 100, "rgba(0, 246, 255, 0.06)", 4, 8);
    drawDashedCircle(cx, cy, 220, "rgba(0, 246, 255, 0.04)", 2, 12);

    // Main HUD elements
    drawCrosshairs(cx, cy, 250, time);
    drawRotatingArcs(cx, cy, time);
    drawRadarSweep(cx, cy, 100, time);
    drawHexGrid(cx, cy, time);
    drawDataTicks(time);

    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  resize();
  animate();
})();
