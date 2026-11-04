const right = document.querySelector("#right");
const toggle = document.querySelector("#toggle");
const canvases = document.querySelectorAll(".fog-canvas");
const ambience = document.querySelector("#ambience");

const welcome = document.querySelector("#welcome");
const enter = document.querySelector("#enter");
const main = document.querySelector("#main");

const rainCanvas = document.querySelector("#rain-canvas");
const rainCtx = rainCanvas.getContext("2d");

let opened = false;
let audioStarted = false;
let fadeTimer;
let entered = false;


ambience.volume = 0;

function startAudio() {
  if (audioStarted) return;

  ambience.play().then(() => {
    audioStarted = true;
  }).catch(error => {
    console.log("Audio playback failed:", error);
  });
}

function fadeVolume(target, duration = 1200) {
  clearInterval(fadeTimer);

  const start = ambience.volume;
  const steps = 25;
  const interval = duration / steps;

  let step = 0;

  fadeTimer = setInterval(() => {
    step++;

    const progress = Math.min(step / steps, 1);

    ambience.volume = Math.max(
      0,
      Math.min(
        1,
        start + (target - start) * progress
      )
    );

    if (step >= steps) {
      clearInterval(fadeTimer);
    }
  }, interval);
}


function enterRoom() {
  if (entered) return;

  entered = true;

  startAudio();
  fadeVolume(0.45, 1800);

  main.classList.add("visible");
  welcome.classList.add("hidden");

  startRain();

  setTimeout(() => {
    welcome.style.display = "none";
  }, 1300);
}

enter.addEventListener("click", enterRoom);


function switchWindow() {
  if (!entered) return;

  startAudio();

  opened = !opened;

  right.classList.toggle("open", opened);

  toggle.textContent = opened
    ? "Close Window"
    : "Open Window";

  fadeVolume(opened ? 0.9 : 0.45);
}

toggle.addEventListener("click", switchWindow);

document
  .querySelector("#handle")
  .addEventListener("click", switchWindow);

let raindrops = [];
let rainRunning = false;
let rainWidth = 0;
let rainHeight = 0;
let lastRainTime = 0;

function createRaindrop() {
  return {
    x: Math.random() * rainWidth,
    y: Math.random() * rainHeight,
    length: 8 + Math.random() * 17,
    speed: 190 + Math.random() * 220,
    opacity: 0.12 + Math.random() * 0.25,
    width: 0.5 + Math.random() * 0.45,
    drift: -0.12 - Math.random() * 0.2
  };
}

function resizeRain() {
  const rect = rainCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  rainWidth = rect.width;
  rainHeight = rect.height;

  rainCanvas.width = Math.round(rainWidth * dpr);
  rainCanvas.height = Math.round(rainHeight * dpr);

  rainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  raindrops = Array.from(
    { length: 190 },
    createRaindrop
  );
}

function drawRain(time) {
  if (!rainRunning) return;

  const delta = lastRainTime
    ? Math.min((time - lastRainTime) / 1000, 0.05)
    : 0.016;

  lastRainTime = time;

  rainCtx.clearRect(0, 0, rainWidth, rainHeight);

  const intensity = opened ? 1.35 : 1;

  rainCtx.lineCap = "round";

  raindrops.forEach(drop => {
    drop.y += drop.speed * delta;
    drop.x += drop.drift * drop.speed * delta;

    if (drop.y > rainHeight + drop.length) {
      drop.y = -drop.length;
      drop.x = Math.random() * rainWidth;
    }

    if (drop.x < -20) {
      drop.x = rainWidth + 10;
    }

    rainCtx.beginPath();

    rainCtx.strokeStyle =
      `rgba(205, 219, 228, ${Math.min(
        drop.opacity * intensity,
        0.65
      )})`;

    rainCtx.lineWidth = drop.width;

    rainCtx.moveTo(drop.x, drop.y);

    rainCtx.lineTo(
      drop.x + drop.drift * drop.length,
      drop.y + drop.length
    );

    rainCtx.stroke();
  });

  requestAnimationFrame(drawRain);
}

function startRain() {
  if (rainRunning) return;

  resizeRain();
  rainRunning = true;
  lastRainTime = 0;

  requestAnimationFrame(drawRain);
}

window.addEventListener("resize", () => {
  if (rainRunning) resizeRain();
});



function createFog(canvas) {
  const w = 500;
  const h = 780;

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");

  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = "rgba(204, 213, 213, 0.48)";
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 130; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 30 + Math.random() * 115;

    const gradient = ctx.createRadialGradient(
      x, y, 0,
      x, y, r
    );

    gradient.addColorStop(
      0,
      "rgba(235, 240, 239, 0.055)"
    );

    gradient.addColorStop(
      1,
      "rgba(235, 240, 239, 0)"
    );

    ctx.fillStyle = gradient;
    ctx.fillRect(
      x - r,
      y - r,
      r * 2,
      r * 2
    );
  }

  const edgeGradient = ctx.createRadialGradient(
    w / 2, h / 2, 100,
    w / 2, h / 2, 470
  );

  edgeGradient.addColorStop(
    0,
    "rgba(225, 232, 231, 0)"
  );

  edgeGradient.addColorStop(
    0.65,
    "rgba(225, 232, 231, 0.06)"
  );

  edgeGradient.addColorStop(
    1,
    "rgba(225, 232, 231, 0.32)"
  );

  ctx.fillStyle = edgeGradient;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 650; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const radius = 0.3 + Math.random() * 1.1;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    ctx.fillStyle =
      `rgba(245, 248, 247, ${0.035 + Math.random() * 0.09})`;

    ctx.fill();
  }

  ctx.globalCompositeOperation = "destination-out";

  let drawing = false;
  let previous = null;

  function brush(x, y) {
    const radius = 55;

    const gradient = ctx.createRadialGradient(
      x, y, 4,
      x, y, radius
    );

    gradient.addColorStop(
      0,
      "rgba(0,0,0,0.95)"
    );

    gradient.addColorStop(
      0.45,
      "rgba(0,0,0,0.85)"
    );

    gradient.addColorStop(
      0.75,
      "rgba(0,0,0,0.4)"
    );

    gradient.addColorStop(
      1,
      "rgba(0,0,0,0)"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
      x - radius,
      y - radius,
      radius * 2,
      radius * 2
    );
  }

  function wipe(e) {
    if (!drawing || !entered) return;

    const rect = canvas.getBoundingClientRect();

    const x =
      (e.clientX - rect.left) /
      rect.width * w;

    const y =
      (e.clientY - rect.top) /
      rect.height * h;

    if (previous) {
      const distance = Math.hypot(
        x - previous.x,
        y - previous.y
      );

      const steps = Math.max(
        1,
        Math.ceil(distance / 8)
      );

      for (let i = 1; i <= steps; i++) {
        const t = i / steps;

        brush(
          previous.x + (x - previous.x) * t,
          previous.y + (y - previous.y) * t
        );
      }
    } else {
      brush(x, y);
    }

    previous = { x, y };
  }

  canvas.onpointerdown = e => {
    if (!entered) return;

    if (
      opened &&
      canvas.closest(".right")
    ) return;

    drawing = true;
    previous = null;

    canvas.setPointerCapture(e.pointerId);

    wipe(e);
  };

  canvas.onpointermove = wipe;

  canvas.onpointerup =
  canvas.onpointercancel = () => {
    drawing = false;
    previous = null;
  };
}

canvases.forEach(createFog);


document.querySelector("#reset").onclick = () => {
  if (!entered) return;

  canvases.forEach(createFog);
};
