const right = document.querySelector("#right");
const toggle = document.querySelector("#toggle");
const canvases = document.querySelectorAll("canvas");
const ambience = document.querySelector("#ambience");

const welcome = document.querySelector("#welcome");
const enter = document.querySelector("#enter");
const main = document.querySelector("#main");

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

    const gradient = ctx.createRadialGradient(
      x, y, 0,
      x, y, r
    );

    gradient.addColorStop(
      0,
      "rgba(255,255,255,.11)"
    );

    gradient.addColorStop(
      1,
      "rgba(255,255,255,0)"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
      x - r,
      y - r,
      r * 2,
      r * 2
    );
  }

  ctx.globalCompositeOperation = "destination-out";

  let drawing = false;
  let previous = null;

  function brush(x, y) {
    const gradient = ctx.createRadialGradient(
      x, y, 5,
      x, y, 48
    );

    gradient.addColorStop(
      0,
      "rgba(0,0,0,1)"
    );

    gradient.addColorStop(
      0.6,
      "rgba(0,0,0,.8)"
    );

    gradient.addColorStop(
      1,
      "rgba(0,0,0,0)"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
      x - 48,
      y - 48,
      96,
      96
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
