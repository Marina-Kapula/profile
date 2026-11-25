// Day sky for light mode, like a live iPhone wallpaper: blue sky that is
// lighter near the horizon, a soft glow from the sun in the corner and
// fluffy clouds that slowly float by (big clouds low, thin ones high up).
// Shown only in light mode; dark mode has the night sky (custom.js).
(function () {
  "use strict";

  var CLOUD_RES = 450;         // cloud picture height in pixels (more = sharper, slower to make)
  var SPEED_BIG = 7;            // how fast the big clouds float, px per second
  var SPEED_THIN = 3;           // how fast the thin high clouds float
  var SKY_SEED = 20260525;      // any number; the same number = the same clouds on every page

  var root = document.documentElement;
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var canvas = document.createElement("canvas");
  canvas.id = "daysky";
  canvas.setAttribute("aria-hidden", "true");
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext("2d");

  var W, H, base, big, thin, lastFrame = 0, start = performance.now();
  var cloudsFrom = 0;           // when the clouds were ready (they fade in from then)
  var cloudsFor = "";           // window size the clouds were made for
  var job = 0;                  // number of the current cloud making (a newer one stops the old)

  // ---- Noise: smooth random "hills", repeating left-right so the clouds can loop ----
  var perm = new Uint8Array(512);
  (function () {
    var s = SKY_SEED, p = [], i, j, t;
    for (i = 0; i < 256; i++) p[i] = i;
    for (i = 255; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      j = s % (i + 1); t = p[i]; p[i] = p[j]; p[j] = t;
    }
    for (i = 0; i < 512; i++) perm[i] = p[i & 255];
  })();

  function fade(t) { return t * t * (3 - 2 * t); }
  function lattice(ix, iy) { return perm[(perm[ix & 255] + iy) & 255] / 255; }

  // value noise; x repeats every `period` cells
  function noise(x, y, period) {
    var ix = Math.floor(x), iy = Math.floor(y);
    var fx = fade(x - ix), fy = fade(y - iy);
    var x0 = ((ix % period) + period) % period, x1 = (x0 + 1) % period;
    var a = lattice(x0, iy), b = lattice(x1, iy);
    var c = lattice(x0, iy + 1), d = lattice(x1, iy + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }

  // several layers of noise = natural cloud shapes
  function fbm(x, y, period, octaves) {
    var sum = 0, amp = 0.5, norm = 0;
    for (var o = 0; o < octaves; o++) {
      sum += amp * noise(x, y, period);
      norm += amp; amp *= 0.5;
      x *= 2; y *= 2; period *= 2;
    }
    return sum / norm;
  }

  function smooth(a, b, x) {
    var t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  // ---- One cloud layer: a picture twice as wide as the screen (it loops) ----
  // Made a few rows at a time (see runJobs), so the page never freezes.
  function cloudMaker(opt) {
    var h = CLOUD_RES;
    var w = Math.round(h * (W / H)) * 2;
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    var g = c.getContext("2d");
    var img = g.createImageData(w, h), px = img.data;
    var period = opt.cells;                  // noise cells across the whole picture
    var sx = period / w;                     // picture px -> noise cells
    var sy = sx * opt.stretch;               // stretch > 1: flatter, wider clouds
    var off = opt.seedOffset;
    var thick = new Float32Array(w * h);
    var steps = [[1, -2], [2, -5], [4, -9], [6, -14], [9, -20]];
    var row = 0, part = 1;

    // 1) how thick the cloud is in one row (0 = clear sky)
    function thicknessRow(y) {
      var v = y / h;
      // where in the sky this layer lives (0 = top of the screen, 1 = bottom)
      var band = smooth(opt.from, opt.from + 0.2, v) * (1 - smooth(opt.to - 0.2, opt.to, v));
      if (band <= 0.002) return;
      for (var x = 0; x < w; x++) {
        var n = fbm(x * sx, y * sy + off, period, 6);
        thick[y * w + x] = Math.max(0, n - opt.cover) * band;
      }
    }

    // 2) light in one row: walk a few steps towards the sun (up and a bit right);
    //    the more cloud in the way, the darker (grey-blue bottoms, bright white tops)
    function lightRow(y) {
      for (var x = 0; x < w; x++) {
        var i = y * w + x, d = thick[i], p = i * 4;
        if (d <= 0) continue;
        var inWay = 0;
        for (var k = 0; k < steps.length; k++) {
          var yy = y + steps[k][1];
          if (yy < 0) break;
          inWay += thick[yy * w + ((x + steps[k][0]) % w)];
        }
        var light = Math.exp(-inWay * opt.shadow * 3.5);
        // thin edges let the sun through: a bright "silver lining"
        var edge = 1 - smooth(0, 0.06, d);
        light = Math.min(1, light + edge * 0.5);
        px[p]     = 196 + 59 * light;   // shadow (196,206,222) -> white
        px[p + 1] = 206 + 49 * light;
        px[p + 2] = 222 + 33 * light;
        px[p + 3] = 255 * smooth(0, opt.soft, d) * opt.alpha;
      }
    }

    // does some rows; returns the finished picture, or null if not ready yet
    return function work(until) {
      while (performance.now() < until) {
        if (part === 1) { thicknessRow(row++); if (row === h) { part = 2; row = 0; } }
        else { lightRow(row++); if (row === h) { g.putImageData(img, 0, 0); return c; } }
      }
      return null;
    };
  }

  // Makes both cloud layers in small pieces (about 8 ms each), between frames
  function makeClouds() {
    var my = ++job;
    // big fluffy clouds in the lower part of the screen
    var makeBig = cloudMaker({ cells: Math.max(5, Math.round(4.5 * W / H)), stretch: 1.9, cover: 0.53,
                               soft: 0.07, alpha: 1, shadow: 1, from: 0.3, to: 1.1, seedOffset: 0 });
    // thin high clouds near the top, very light
    var makeThin = cloudMaker({ cells: Math.max(4, Math.round(3.5 * W / H)), stretch: 4, cover: 0.56,
                                soft: 0.15, alpha: 0.4, shadow: 0.2, from: -0.1, to: 0.5, seedOffset: 40 });
    var newBig = null, newThin = null;
    function piece() {
      if (my !== job) return;               // the window changed size again: stop
      var until = performance.now() + 8;
      if (!newBig) newBig = makeBig(until);
      else if (!newThin) newThin = makeThin(until);
      if (newBig && newThin) {
        big = newBig; thin = newThin;
        cloudsFrom = performance.now();
        return;
      }
      setTimeout(piece, 0);
    }
    setTimeout(piece, 0);
  }

  // ---- Sky colours and the sun glow, made once per window size ----
  function makeBase() {
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var g = c.getContext("2d");
    var sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#4f8fdc");    // deep blue high up
    sky.addColorStop(0.45, "#86b8ec");
    sky.addColorStop(0.85, "#c6e0f8");
    sky.addColorStop(1, "#e4f0fb");    // pale near the horizon
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    var r = Math.max(W, H) * 0.7;
    var sun = g.createRadialGradient(W * 0.88, -H * 0.05, 0, W * 0.88, -H * 0.05, r);
    sun.addColorStop(0, "rgba(255,250,235,0.85)");
    sun.addColorStop(0.15, "rgba(255,245,225,0.45)");
    sun.addColorStop(0.5, "rgba(255,240,220,0.12)");
    sun.addColorStop(1, "rgba(255,240,220,0)");
    g.fillStyle = sun;
    g.fillRect(0, 0, W, H);
    return c;
  }

  function build() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    base = makeBase();
    // New clouds only when the shape of the window really changed.
    // On a phone the height jumps a little while scrolling (the address bar):
    // then the old clouds are just stretched a bit.
    var key = W + ":" + Math.round(W / H * 5);
    if (key !== cloudsFor) {
      cloudsFor = key;
      makeClouds();
    }
    draw(performance.now());
  }

  // draw a looping layer moved `shift` screen px to the right
  function drawLayer(layer, shift) {
    var scale = H / layer.height;
    var lw = layer.width * scale;           // layer width on the screen
    var x = (shift % lw) - lw;
    ctx.drawImage(layer, x, 0, lw, H);
    ctx.drawImage(layer, x + lw, 0, lw, H);
  }

  function draw(t) {
    var sec = reduceMotion ? 0 : (t - start) / 1000;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(base, 0, 0);
    if (!big) return;                        // clouds are still being made
    ctx.globalAlpha = reduceMotion ? 1 : Math.min(1, (t - cloudsFrom) / 1500); // soft fade in
    drawLayer(thin, sec * SPEED_THIN);
    drawLayer(big, sec * SPEED_BIG);
    ctx.globalAlpha = 1;
  }

  // about 30 frames a second is plenty for slow clouds
  function frame(t) {
    requestAnimationFrame(frame);
    if (root.classList.contains("dark")) return; // dark mode: the night sky instead
    if (reduceMotion && lastFrame && big && t - cloudsFrom > 100) return; // "reduce motion": a still picture
    if (t - lastFrame < 33) return;
    lastFrame = t;
    draw(t);
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  });

  build();
  requestAnimationFrame(frame);
})();

