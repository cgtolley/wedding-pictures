(function () {
  const { cfg, photos, fullSrc, thumbSrc, applyConfig, preload } = window.Site;
  applyConfig("Gallery");

  const grid = document.getElementById("grid");
  document.getElementById("count").textContent =
    photos.length === 1 ? "1 photo" : photos.length + " photos";

  if (cfg.fullResLink) {
    const a = document.getElementById("fullres");
    a.href = cfg.fullResLink;
    a.hidden = false;
  }

  if (!photos.length) {
    grid.innerHTML = '<p style="color:var(--muted)">No photos yet. Check back soon!</p>';
    document.getElementById("zip").hidden = true;
  }

  // ---------- Grid ----------
  const frag = document.createDocumentFragment();
  photos.forEach((name, i) => {
    const b = document.createElement("button");
    b.className = "tile";
    b.setAttribute("aria-label", "Open photo " + (i + 1));
    const img = document.createElement("img");
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = "";
    img.onload = () => img.classList.add("loaded");
    img.src = thumbSrc(name);
    b.appendChild(img);
    b.onclick = () => open(i);
    frag.appendChild(b);
  });
  grid.appendChild(frag);

  // ---------- Lightbox ----------
  const lb = document.getElementById("lb");
  const lbImg = document.getElementById("lb-img");
  const lbDl = document.getElementById("lb-dl");
  const lbCount = document.getElementById("lb-count");
  let cur = -1;
  let lastFocus = null;

  async function show(i) {
    cur = (i + photos.length) % photos.length;
    const name = photos[cur];
    const src = fullSrc(name);
    lbCount.textContent = (cur + 1) + " / " + photos.length;
    lbDl.href = src;
    lbDl.setAttribute("download", name);
    history.replaceState(null, "", "#" + encodeURIComponent(name));
    // show the thumbnail right away, swap in the full image when ready
    lbImg.src = thumbSrc(name);
    lbImg.classList.add("loading");
    const mine = cur;
    await preload(src);
    if (mine !== cur) return;
    lbImg.src = src;
    lbImg.classList.remove("loading");
    preload(fullSrc(photos[(cur + 1) % photos.length]));
  }

  function open(i) {
    lastFocus = document.activeElement;
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    show(i);
    document.getElementById("lb-close").focus();
  }

  function close() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
    lbImg.removeAttribute("src");
    cur = -1;
    history.replaceState(null, "", location.pathname + location.search);
    if (lastFocus) lastFocus.focus();
  }

  document.getElementById("lb-close").onclick = close;
  document.getElementById("lb-prev").onclick = () => show(cur - 1);
  document.getElementById("lb-next").onclick = () => show(cur + 1);
  lb.addEventListener("click", (e) => {
    if (e.target === lb || e.target.classList.contains("lb-img")) close();
  });

  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") show(cur + 1);
    else if (e.key === "ArrowLeft") show(cur - 1);
    else if (e.key === "d" && !e.metaKey && !e.ctrlKey) lbDl.click();
  });

  let sx = null, sy = null;
  lb.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(dx < 0 ? cur + 1 : cur - 1);
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close(); // swipe down to close
    sx = null;
  });

  // Open a photo directly from a shared link like gallery.html#IMG_0042.jpg
  if (location.hash.length > 1) {
    const i = photos.indexOf(decodeURIComponent(location.hash.slice(1)));
    if (i >= 0) open(i);
  }

  // ---------- Download all as a .zip ----------
  const zipBtn = document.getElementById("zip");
  const zipLabel = document.getElementById("zip-label");

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  zipBtn.onclick = async () => {
    zipBtn.disabled = true;
    try {
      if (!window.JSZip) {
        zipLabel.textContent = "Preparing…";
        await loadScript("assets/jszip.min.js");
      }
      const zip = new JSZip();
      let done = 0;
      const queue = photos.slice();
      async function worker() {
        while (queue.length) {
          const name = queue.shift();
          const r = await fetch(fullSrc(name));
          if (!r.ok) throw new Error("Couldn't fetch " + name);
          zip.file(name, await r.blob(), { binary: true });
          done++;
          zipLabel.textContent = "Downloading " + done + " / " + photos.length;
        }
      }
      await Promise.all([worker(), worker(), worker(), worker()]);
      zipLabel.textContent = "Zipping…";
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      const slug = (cfg.eventName || "event-photos").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = (slug || "event-photos") + ".zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      zipLabel.textContent = "Download all";
    } catch (err) {
      console.error(err);
      zipLabel.textContent = "Download failed, try again";
    } finally {
      zipBtn.disabled = false;
    }
  };
})();
