// Night sky as the naked eye sees it: very dark sky, thousands of tiny
// stars of different brightness and color, a few bright stars with a small
// soft glow that twinkle (stronger near the bottom, like near the horizon),
// and an occasional falling star. Shown only in dark mode.
(function () {
  "use strict";

  var STARS_PER_MILLION_PX = 900;  // how many faint stars (more = denser sky)
  var BRIGHT_PER_MILLION_PX = 10;  // how many bright twinkling stars
  var FALL_MIN = 4000;             // shortest pause between falling stars, ms
  var FALL_MAX = 12000;            // longest pause between falling stars, ms
  var SKY_SEED = 20021102;         // any number; the same number = the same sky on every page

  // Real star colors: white, blue-white, yellowish, orange
  var STAR_COLORS = [
    [255, 255, 255],
    [200, 218, 255],
    [255, 244, 222],
    [255, 210, 170]
  ];

  var root = document.documentElement;
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Canvas that sits behind all the content
  var canvas = document.createElement("canvas");
  canvas.id = "sky";
  canvas.setAttribute("aria-hidden", "true");
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext("2d");

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W, H, layer, brightStars, dots, glows;
  var falling = [];
  var nextFall = performance.now() + 3000;
  var lastFrame = 0;

  // Random numbers that always come out the same for the same seed,
  // so every page shows the same stars in the same places
  var rand;
  function seededRandom(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6D2B79F5) | 0;
      var r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Mostly white, sometimes blue-white, yellowish or orange
  function pickColor() {
    var p = rand();
    if (p < 0.62) return 0;
    if (p < 0.80) return 1;
    if (p < 0.93) return 2;
    return 3;
  }

  // Tiny soft dot for faint stars, one per color
  function makeDot(c) {
    var s = document.createElement("canvas");
    s.width = s.height = 16;
    var g = s.getContext("2d");
    var rgb = c[0] + "," + c[1] + "," + c[2];
    var grd = g.createRadialGradient(8, 8, 0, 8, 8, 8);
    grd.addColorStop(0, "rgba(" + rgb + ",1)");
    grd.addColorStop(0.25, "rgba(" + rgb + ",0.7)");
    grd.addColorStop(0.6, "rgba(" + rgb + ",0.1)");
    grd.addColorStop(1, "rgba(" + rgb + ",0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 16, 16);
    return s;
  }

  // Bright star as the eye sees it: small white-hot point with a soft
  // little glow around it (no rays - rays only appear in camera photos)
  function makeGlow(c) {
    var N = 128, half = N / 2;
    var s = document.createElement("canvas");
    s.width = s.height = N;
    var g = s.getContext("2d");
    var img = g.createImageData(N, N);
    var px = img.data;
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        var dx = x - half + 0.5, dy = y - half + 0.5;
        var r = Math.sqrt(dx * dx + dy * dy) / half;   // 0 center .. 1 edge
        if (r >= 1) continue;
        var edge = (1 - r) * (1 - r);
        var core = Math.exp(-Math.pow(r / 0.07, 2));              // bright point
        var bloom = 0.45 * Math.exp(-Math.pow(r / 0.25, 2));      // soft glow
        var halo = 0.1 * Math.exp(-r / 0.32) * edge;              // faint light around
        var light = Math.max(0, Math.min(1, core + bloom + halo) - 0.008) / 0.992;
        var mix = Math.min(1, r * 4);                             // white center, color outside
        var i = (y * N + x) * 4;
        px[i]     = 255 + (c[0] - 255) * mix;
        px[i + 1] = 255 + (c[1] - 255) * mix;
        px[i + 2] = 255 + (c[2] - 255) * mix;
        px[i + 3] = light * 255;
      }
    }
    g.putImageData(img, 0, 0);
    return s;
  }

  // Builds the sky once (and again when the window size changes)
  function build() {
    rand = seededRandom(SKY_SEED); // start the same sequence every time
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    if (!dots) {
      dots = STAR_COLORS.map(makeDot);
      glows = STAR_COLORS.map(makeGlow);
    }

    layer = document.createElement("canvas");
    layer.width = canvas.width;
    layer.height = canvas.height;
    var g = layer.getContext("2d");
    g.scale(dpr, dpr);

    // Real night sky is not flat black: darkest at the top,
    // a tiny bit lighter and bluer towards the bottom (the horizon)
    var sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#000000");
    sky.addColorStop(0.7, "#020308");
    sky.addColorStop(1, "#070a14");
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);

    // Faint stars: most are barely visible, few are a bit brighter
    var area = (W * H) / 1e6;
    var count = Math.round(area * STARS_PER_MILLION_PX);
    for (var i = 0; i < count; i++) {
      var x = rand() * W;
      var y = rand() * H;
      var b = Math.pow(rand(), 3);        // brightness, mostly small
      var d = 1.6 + b * 2.4;                     // dot size
      g.globalAlpha = 0.12 + b * 0.8;
      g.drawImage(dots[pickColor()], x - d / 2, y - d / 2, d, d);
    }
    g.globalAlpha = 1;

    // Bright stars: each has its own color and size
    brightStars = [];
    for (i = 0; i < Math.round(area * BRIGHT_PER_MILLION_PX + 4); i++) {
      var by = rand() * H;
      var color = pickColor();
      brightStars.push({
        x: rand() * W,
        y: by,
        size: 18 + Math.pow(rand(), 2) * 30,  // glow size in px
        color: color,
        flash: color,                                  // color during a flash
        flashLeft: 0,
        // stars low on the screen twinkle more, like near the horizon
        amount: 0.12 + 0.3 * (by / H),
        level: 1, levelTo: 1, nextLevel: 0, nextFlash: 0
      });
    }
  }

  // Twinkling: air makes the brightness jump a little, very fast,
  // and sometimes the star flashes a different color for a moment
  function updateBrightStar(s, t) {
    if (t > s.nextLevel) {
      s.levelTo = 1 - Math.random() * s.amount * 2;
      s.nextLevel = t + 30 + Math.random() * 90;
    }
    s.level += (s.levelTo - s.level) * 0.45;

    if (t > s.nextFlash) {
      if (Math.random() < s.amount) {
        s.flash = Math.floor(Math.random() * STAR_COLORS.length);
        s.flashLeft = 1;
      }
      s.nextFlash = t + 150 + Math.random() * 500;
    }
    s.flashLeft = Math.max(0, s.flashLeft - 0.12);
  }

  // Draw one bright star; light adds up like real light
  function drawBrightStar(s, t) {
    var level = 1;
    if (!reduceMotion) {
      updateBrightStar(s, t);
      level = s.level;
    }
    var size = s.size * (0.85 + 0.15 * level);
    var x = s.x - size / 2, y = s.y - size / 2;

    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = level * (1 - s.flashLeft);
    ctx.drawImage(glows[s.color], x, y, size, size);
    if (s.flashLeft > 0) {
      ctx.globalAlpha = level * s.flashLeft;
      ctx.drawImage(glows[s.flash], x, y, size, size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  // Start a new falling star from the top part of the screen
  function addFallingStar(t) {
    var angle = (25 + Math.random() * 30) * Math.PI / 180; // falls down to the right
    falling.push({
      x: Math.random() * W * 0.9,
      y: Math.random() * H * 0.4,
      dx: Math.cos(angle),
      dy: Math.sin(angle),
      length: 60 + Math.random() * 100,  // tail length
      dist: 250 + Math.random() * 350,   // how far it flies
      time: 400 + Math.random() * 500,   // how long it flies, ms
      start: t
    });
  }

  // Draw all falling stars; remove the ones that finished
  function drawFalling(t) {
    if (!reduceMotion && t > nextFall) {
      addFallingStar(t);
      nextFall = t + FALL_MIN + Math.random() * (FALL_MAX - FALL_MIN);
    }
    for (var i = falling.length - 1; i >= 0; i--) {
      var f = falling[i];
      var p = (t - f.start) / f.time; // 0..1
      if (p > 1) { falling.splice(i, 1); continue; }
      var hx = f.x + f.dx * f.dist * p;
      var hy = f.y + f.dy * f.dist * p;
      var tx = hx - f.dx * f.length;
      var ty = hy - f.dy * f.length;
      var fade = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85; // fades in, then out

      var grd = ctx.createLinearGradient(hx, hy, tx, ty);
      grd.addColorStop(0, "rgba(255,255,255," + (fade * 0.9) + ")");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = grd;
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
  }

  // Draws one frame (about 60 times a second)
  function frame(t) {
    requestAnimationFrame(frame);
    if (!root.classList.contains("dark")) return; // light mode: no sky
    if (t - lastFrame < 16) return;
    lastFrame = t;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(layer, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (var i = 0; i < brightStars.length; i++) {
      drawBrightStar(brightStars[i], t);
    }
    drawFalling(t);
  }

  // Rebuild the sky when the window size changes
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  });

  build();
  requestAnimationFrame(frame);
})();