
const right = document.querySelector("#right");
const toggle = document.querySelector("#toggle");
const canvases = document.querySelectorAll("canvas");
const ambience = document.querySelector("#ambience");

let opened = false;
let audioStarted = false;
let fadeTimer;

ambience.volume = 0.45;

function startAudio() {
  if (audioStarted) return;

  ambience.play().then(() => {
    audioStarted = true;
  }).catch(() => {});
}

function fadeVolume(target) {
  clearInterval(fadeTimer);

  const start = ambience.volume;
  let step = 0;

  fadeTimer = setInterval(() => {
    step++;

    ambience.volume = Math.max(0, Math.min(1,
      start + (target - start) * step / 25
    ));

    if (step >= 25) clearInterval(fadeTimer);
  }, 48);
}

function switchWindow() {
  startAudio();

  opened = !opened;
  right.classList.toggle("open", opened);
  toggle.textContent = opened ? "Close Window" : "Open Window";

  fadeVolume(opened ? 0.9 : 0.45);
}

toggle.onclick = switchWindow;
document.querySelector("#handle").onclick = switchWindow;

document.addEventListener("pointerdown", startAudio);

function createFog(canvas) {
  const w = 500;
  const h = 780;

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");

  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(204, 213, 213, .72)";
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 90; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 20 + Math.random() * 110;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, "rgba(255,255,255,.11)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  ctx.globalCompositeOperation = "destination-out";

  let drawing = false;
  let previous = null;

  function brush(x, y) {
    const gradient = ctx.createRadialGradient(x, y, 5, x, y, 48);

    gradient.addColorStop(0, "rgba(0,0,0,1)");
    gradient.addColorStop(.6, "rgba(0,0,0,.8)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(x - 48, y - 48, 96, 96);
  }

  function wipe(e) {
    if (!drawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * w;
    const y = (e.clientY - rect.top) / rect.height * h;

    if (previous) {
      const distance = Math.hypot(x - previous.x, y - previous.y);
      const steps = Math.ceil(distance / 12);

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
    if (opened && canvas.closest(".right")) return;

    drawing = true;
    previous = null;
    canvas.setPointerCapture(e.pointerId);
    wipe(e);
  };

  canvas.onpointermove = wipe;

  canvas.onpointerup = canvas.onpointercancel = () => {
    drawing = false;
    previous = null;
  };
}

canvases.forEach(createFog);

document.querySelector("#reset").onclick = () => {
  canvases.forEach(createFog);
};
