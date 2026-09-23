// Shared helpers for both pages.
(function () {
  const cfg = window.SITE_CONFIG || {};
  const photos = (window.PHOTOS || []).slice();

  function fullSrc(name) { return "photos/full/" + encodeURIComponent(name); }
  function thumbSrc(name) { return "photos/thumbs/" + encodeURIComponent(name); }

  function applyConfig(pageLabel) {
    const name = cfg.eventName || "Event Photos";
    document.title = pageLabel ? name + " · " + pageLabel : name;
    document.querySelectorAll("[data-event-name]").forEach((el) => (el.textContent = name));
    document.querySelectorAll("[data-subtitle]").forEach((el) => {
      if (cfg.subtitle) el.textContent = cfg.subtitle;
      else el.remove();
    });
    if (cfg.accentColor) document.documentElement.style.setProperty("--accent", cfg.accentColor);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Resolves once the image is downloaded and decoded (never rejects).
  function preload(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => resolve(true));
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  window.Site = { cfg, photos, fullSrc, thumbSrc, applyConfig, shuffle, preload };
})();
