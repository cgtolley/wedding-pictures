(function () {
  const { cfg, photos, fullSrc, applyConfig, shuffle, preload } = window.Site;
  applyConfig("Slideshow");

  const slideMs = Math.max(2, Number(cfg.slideSeconds) || 6) * 1000;
  document.documentElement.style.setProperty("--slide-ms", slideMs + "ms");

  const layers = Array.from(document.querySelectorAll(".layer"));
  const bar = document.getElementById("bar");
  const playBtn = document.getElementById("play");
  const dl = document.getElementById("download");
  const toastEl = document.getElementById("toast");

  if (!photos.length) {
    document.querySelector(".controls").remove();
    document.querySelector(".progress").remove();
    const msg = document.createElement("div");
    msg.className = "empty";
    msg.textContent = "No photos yet. Check back soon!";
    document.body.appendChild(msg);
    return;
  }

  // Random order with no repeats until every photo has been shown.
  let order = shuffle(photos);
  let pos = -1;
  let active = 0;
  let playing = true;
  let timer = null;
  let token = 0;

  function ensure(i) {
    while (i >= order.length) {
      let next = shuffle(photos);
      if (photos.length > 1 && next[0] === order[order.length - 1]) next.push(next.shift());
      order = order.concat(next);
    }
  }

  async function go(i) {
    if (i < 0) return;
    ensure(i + 1);
    const my = ++token;
    clearTimeout(timer);
    const name = order[i];
    const src = fullSrc(name);
    await preload(src);
    if (my !== token) return; // a newer navigation won

    pos = i;
    const incoming = layers[1 - active];
    const outgoing = layers[active];
    incoming.querySelector("img").src = src;
    incoming.querySelector(".blur").style.backgroundImage = 'url("' + src + '")';
    // restart the slow zoom animation
    const img = incoming.querySelector("img");
    img.style.animation = "none"; void img.offsetWidth; img.style.animation = "";
    incoming.classList.add("active");
    outgoing.classList.remove("active");
    active = 1 - active;

    dl.href = src;
    dl.setAttribute("download", name);

    restartBar();
    if (playing) timer = setTimeout(() => go(pos + 1), slideMs);
    preload(fullSrc(order[i + 1])); // warm the next one
  }

  function restartBar() {
    bar.classList.remove("run", "paused");
    void bar.offsetWidth;
    bar.classList.add("run");
    if (!playing) bar.classList.add("paused");
  }

  function setPlaying(p) {
    playing = p;
    document.getElementById("icon-pause").hidden = !p;
    document.getElementById("icon-play").hidden = p;
    playBtn.title = p ? "Pause (space)" : "Play (space)";
    clearTimeout(timer);
    if (p) {
      restartBar();
      timer = setTimeout(() => go(pos + 1), slideMs);
    } else {
      bar.classList.add("paused");
      wake();
    }
    toast(p ? "Playing" : "Paused");
  }

  let toastT;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("show"), 900);
  }

  // Hide the controls when nobody is touching anything.
  let idleT;
  function wake() {
    document.body.classList.remove("idle");
    clearTimeout(idleT);
    idleT = setTimeout(() => { if (playing) document.body.classList.add("idle"); }, 3000);
  }

  function toggleFullscreen() {
    const d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) {
      (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    } else {
      const el = d.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) req.call(el); else toast("Full screen isn't supported here");
    }
  }

  document.getElementById("prev").onclick = () => go(pos - 1);
  document.getElementById("next").onclick = () => go(pos + 1);
  playBtn.onclick = () => setPlaying(!playing);
  document.getElementById("fullscreen").onclick = toggleFullscreen;

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    wake();
    if (e.key === "ArrowRight") go(pos + 1);
    else if (e.key === "ArrowLeft") go(pos - 1);
    else if (e.key === " " || e.key === "k") { e.preventDefault(); setPlaying(!playing); }
    else if (e.key === "f") toggleFullscreen();
    else if (e.key === "d") dl.click();
  });

  ["mousemove", "mousedown", "touchstart"].forEach((ev) =>
    document.addEventListener(ev, wake, { passive: true }));

  // Swipe left/right on phones
  let sx = null, sy = null;
  const stage = document.getElementById("stage");
  stage.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? pos + 1 : pos - 1);
    sx = null;
  });

  wake();
  go(0);
})();
