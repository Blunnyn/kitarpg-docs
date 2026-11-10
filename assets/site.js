(function () {
  function kitTheme() {
    var root = document.documentElement;
    var dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("kitarpg-theme", root.dataset.theme); } catch (e) {}
  }
  window.kitTheme = kitTheme;
  try { localStorage.setItem("kitarpg-lang", window.KIT_LANG); } catch (e) {}

  // Keep the current page in view in the sidebar.
  var on = document.querySelector(".side a.on");
  var side = document.querySelector(".side");
  // Only the sidebar scrolls; scrollIntoView would move the page too.
  if (on && side) side.scrollTop = on.offsetTop - side.clientHeight / 2;

  // Mark the section being read in "On this page".
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
  if (links.length) {
    var heads = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
    var mark = function () {
      var current = 0;
      for (var i = 0; i < heads.length; i++) if (heads[i] && heads[i].getBoundingClientRect().top < 120) current = i;
      links.forEach(function (a, i) { a.classList.toggle("on", i === current); });
    };
    addEventListener("scroll", mark, { passive: true });
    mark();
  }

  // Search over the index of this language, all in the page so it works from the disk.
  var input = document.getElementById("search"), box = document.getElementById("results");
  var data = window.KIT_SEARCH || [];
  var picked = -1;
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function snippet(text, words) {
    var low = text.toLowerCase(), at = -1;
    for (var i = 0; i < words.length && at < 0; i++) at = low.indexOf(words[i]);
    if (at < 0) return esc(text.slice(0, 140));
    var start = Math.max(0, at - 50), s = esc(text.slice(start, start + 170));
    words.forEach(function (w) { if (w) s = s.replace(new RegExp("(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"), "<mark>$1</mark>"); });
    return (start > 0 ? "…" : "") + s + "…";
  }
  function run() {
    var q = input.value.trim().toLowerCase();
    if (q.length < 2) { box.hidden = true; return; }
    var words = q.split(/\s+/).filter(Boolean);
    var hits = [];
    data.forEach(function (p) {
      var t = p.t.toLowerCase(), h = p.h.toLowerCase(), x = p.x.toLowerCase(), score = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i], s = 0;
        if (t.indexOf(w) >= 0) s += 10;
        if (h.indexOf(w) >= 0) s += 4;
        if (x.indexOf(w) >= 0) s += 1 + Math.min(3, x.split(w).length - 1) * 0.3;
        if (!s) return;
        score += s;
      }
      if (t.indexOf(q) >= 0) score += 8;
      if (p.s === "api") score *= 0.6;
      hits.push({ p: p, score: score });
    });
    hits.sort(function (a, b) { return b.score - a.score; });
    hits = hits.slice(0, 12);
    picked = -1;
    box.innerHTML = hits.length ? hits.map(function (r) {
      return '<a href="' + window.KIT_ROOT + r.p.u + '"><div class="r-title">' + esc(r.p.t) + '</div><div class="r-snip">' + snippet(r.p.x, words) + "</div></a>";
    }).join("") : '<div class="none">' + window.KIT_NONE + "</div>";
    box.hidden = false;
  }
  if (input) {
    input.addEventListener("input", run);
    input.addEventListener("focus", run);
    input.addEventListener("keydown", function (e) {
      var items = box.querySelectorAll("a");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        picked = Math.max(0, Math.min(items.length - 1, picked + (e.key === "ArrowDown" ? 1 : -1)));
        items.forEach(function (a, i) { a.classList.toggle("on", i === picked); });
      } else if (e.key === "Enter" && items.length) {
        location.href = items[Math.max(0, picked)].href;
      } else if (e.key === "Escape") { box.hidden = true; input.blur(); }
    });
    document.addEventListener("click", function (e) { if (!e.target.closest(".search")) box.hidden = true; });
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== input) { e.preventDefault(); input.focus(); }
    });
  }
})();
