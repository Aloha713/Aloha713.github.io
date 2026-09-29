(function () {
  "use strict";

  var frame = document.querySelector("[data-profile-rotation]");
  if (!frame) return;
  var primary = frame.querySelector(".author__photo-primary");
  var secondary = frame.querySelector(".author__photo-secondary");
  var interval = 60000;
  var key = "profile-rotation:" + primary.getAttribute("src") + ":" + secondary.dataset.src;
  var timer;
  var ready = false;
  var state = { index: 0, due: Date.now() + interval };

  try {
    var saved = JSON.parse(sessionStorage.getItem(key));
    if (saved && (saved.index === 0 || saved.index === 1) &&
        Number.isFinite(saved.due)) state = { index: saved.index, due: saved.due };
  } catch (error) { /* Storage is optional in private or restricted browsing. */ }

  function save() {
    try { sessionStorage.setItem(key, JSON.stringify(state)); } catch (error) { /* Optional. */ }
  }

  function paint() {
    frame.classList.toggle("is-outdoor", state.index === 1);
  }

  // Retain the tab's 60-second schedule across normal page navigation.
  function advance() {
    var now = Date.now();
    if (now >= state.due) {
      var steps = Math.floor((now - state.due) / interval) + 1;
      state.index = (state.index + steps) % 2;
      state.due += steps * interval;
    }
  }

  function schedule() {
    window.clearTimeout(timer);
    if (!ready || document.hidden) return;
    advance();
    paint();
    save();
    timer = window.setTimeout(schedule, Math.max(0, state.due - Date.now()));
  }

  document.addEventListener("visibilitychange", schedule);
  window.addEventListener("pagehide", function () { window.clearTimeout(timer); save(); });
  window.addEventListener("pageshow", schedule);

  function loaded(image) {
    return new Promise(function (resolve, reject) {
      if (image.complete) {
        if (image.naturalWidth) resolve(); else reject();
      } else {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", reject, { once: true });
      }
    });
  }

  secondary.src = secondary.dataset.src;
  Promise.all([loaded(primary), loaded(secondary)]).then(function () {
    ready = true;
    secondary.hidden = false;
    schedule();
    window.requestAnimationFrame(function () { frame.classList.add("is-ready"); });
  }).catch(function () {
    window.clearTimeout(timer);
    frame.classList.remove("is-outdoor");
    secondary.hidden = true;
  });
})();
