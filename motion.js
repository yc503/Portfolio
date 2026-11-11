/* ==========================================================================
   动效层：两处粒子
   1) 首屏浮尘 —— 极淡的漂移微粒，只作氛围
   2) 架构链路 —— 粒子是沿着边流动的请求，点节点看那一层的架构与能力
   链路图是个工厂：作品页与个人项目页各一张，共用同一套实现。
   粒子在这里承担信息，不是背景装饰。
   ========================================================================== */

(function () {
  'use strict';

  var REDUCED = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 主题色读取（跟随深浅主题切换） ─────────────────────────────── */
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    function v(n) { return cs.getPropertyValue(n).trim(); }
    return {
      rule:       v('--rule'),
      ruleStrong: v('--rule-strong'),
      ink3:       v('--ink-3'),
      up:         v('--up')
    };
  }
  var C = readColors();
  new MutationObserver(function () { C = readColors(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ── 画布尺寸（含 DPR） ─────────────────────────────────────────── */
  function fit(cv) {
    var r = cv.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.max(1, Math.round(r.width * dpr));
    cv.height = Math.max(1, Math.round(r.height * dpr));
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: r.width, h: r.height, ctx: ctx };
  }

  /* ══════════════════════════════════════════════════════════════════
     1. 首屏浮尘
     ══════════════════════════════════════════════════════════════════ */
  var dust = (function () {
    var cv = document.getElementById('herodust');
    if (!cv) return null;

    var N = 62, ps = [], W = 0, H = 0, ctx = null;

    function build() {
      if (!cv.clientWidth) return;          // 隐藏时不动
      var f = fit(cv); ctx = f.ctx; W = f.w; H = f.h;
      ps = [];
      for (var i = 0; i < N; i++) {
        ps.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.7 + Math.random() * 1.3,
          vx: 0.035 + Math.random() * 0.075,
          vy: -0.02 - Math.random() * 0.045,
          a: 0.14 + Math.random() * 0.34
        });
      }
    }

    function draw() {
      if (!ctx || !W || !H) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.ruleStrong;
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function step() {
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x > W + 8) p.x = -8;
        if (p.y < -8) p.y = H + 8;
      }
      draw();
    }

    build();
    if (REDUCED) draw();
    else (function loop() { step(); requestAnimationFrame(loop); })();

    var rt = null;
    function refit() {
      clearTimeout(rt);
      rt = setTimeout(function () { build(); if (REDUCED) draw(); }, 120);
    }
    if ('ResizeObserver' in window) new ResizeObserver(refit).observe(cv.parentElement || cv);
    else window.addEventListener('resize', refit);

    return { refit: refit };
  })();

  /* ══════════════════════════════════════════════════════════════════
     2. 架构链路（工厂）
     ══════════════════════════════════════════════════════════════════ */
  function makeArch(o) {
    var host = document.getElementById(o.root);
    var cv = document.getElementById(o.canvas);
    var nodeLayer = document.getElementById(o.nodes);
    var panel = document.getElementById(o.panel);
    if (!host || !cv || !nodeLayer || !panel || !o.data) return null;

    var NODES = o.data.nodes;
    var EDGES = o.data.edges;
    var LAYOUT = o.layout;
    var ARC = o.arc;
    var FONT = '11px ' + getComputedStyle(document.body).fontFamily;

    var W = 0, H = 0, ctx = null;
    var pos = {}, buttons = {}, flows = [];
    var selected = o.initial || NODES[0].id;
    var hovered = null;

    /* ── 节点按钮（真按钮，不是画在 canvas 里） ───────────────────── */
    NODES.forEach(function (n) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'arch__node' +
        (n.hub ? ' arch__node--hub' : '') +
        (n.minor ? ' arch__node--minor' : '');
      b.dataset.id = n.id;

      var l = document.createElement('span');
      l.className = 'arch__node-label';
      l.textContent = n.label;

      var s = document.createElement('span');
      s.className = 'arch__node-sub';
      s.textContent = n.sub;

      b.appendChild(l); b.appendChild(s);
      nodeLayer.appendChild(b);
      buttons[n.id] = b;

      b.addEventListener('click', function () { select(n.id); });
      b.addEventListener('mouseenter', function () { hovered = n.id; });
      b.addEventListener('mouseleave', function () { hovered = null; });
      b.addEventListener('focus', function () { hovered = n.id; });
      b.addEventListener('blur', function () { hovered = null; });
    });

    function select(id) {
      selected = id;
      NODES.forEach(function (n) {
        buttons[n.id].setAttribute('aria-pressed', String(n.id === id));
      });
      renderPanel(id);
      draw();
    }

    /* ── 侧面板 ───────────────────────────────────────────────────── */
    function col(heading, items, cls) {
      var d = document.createElement('div');
      d.className = 'blk' + (cls ? ' ' + cls : '');
      var h = document.createElement('h4');
      h.className = 'blk__h'; h.textContent = heading;
      d.appendChild(h);
      var ul = document.createElement('ul');
      items.forEach(function (t) {
        var li = document.createElement('li');
        li.textContent = t;
        ul.appendChild(li);
      });
      d.appendChild(ul);
      return d;
    }

    function renderPanel(id) {
      var n = null;
      NODES.forEach(function (x) { if (x.id === id) n = x; });
      if (!n) return;

      panel.textContent = '';

      var sel = document.createElement('p');
      sel.className = 'arch__sel';
      sel.appendChild(document.createTextNode('当前：'));
      var b = document.createElement('b');
      b.textContent = n.label + ' · ' + n.sub;
      sel.appendChild(b);

      // 这一层有对应的项目卡片时，给一个跳过去的入口
      if (n.proj) {
        var jump = document.createElement('button');
        jump.type = 'button';
        jump.className = 'arch__jump';
        jump.textContent = '跳到项目 ↓';
        jump.addEventListener('click', function () {
          if (window.PORTFOLIO && PORTFOLIO.jumpToProject) PORTFOLIO.jumpToProject(n.proj);
        });
        sel.appendChild(jump);
      }
      panel.appendChild(sel);

      var cols = document.createElement('div');
      cols.className = 'arch__cols';
      cols.appendChild(col('架构设计', n.arch));
      cols.appendChild(col('支撑的能力', n.cap, 'arch__cap'));
      panel.appendChild(cols);
    }

    /* ── 几何 ─────────────────────────────────────────────────────── */
    function layoutName() { return host.clientWidth < 640 ? 'narrow' : 'wide'; }

    function measure() {
      var f = fit(cv); ctx = f.ctx; W = f.w; H = f.h;

      var L = LAYOUT[layoutName()];
      pos = {};
      NODES.forEach(function (n) {
        var p = L[n.id] || [0.5, 0.5];
        pos[n.id] = { x: p[0] * W, y: p[1] * H };
      });
      NODES.forEach(function (n) {
        var b = buttons[n.id], p = pos[n.id];
        b.style.left = p.x + 'px';
        b.style.top = p.y + 'px';
      });
    }

    /* 边：直线，或二次贝塞尔（反馈闭环走弧线，避免与正向边重叠） */
    function geom(e) {
      var a = pos[e.from], b = pos[e.to];
      if (!a || !b) return null;
      if (!e.arc) return { kind: 'line', a: a, b: b };
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      var dx = b.x - a.x, dy = b.y - a.y;
      var len = Math.hypot(dx, dy) || 1;
      // 垂直于边的单位向量（屏幕坐标下顺时针 90°）
      var px = -dy / len, py = dx / len;
      var amt = Math.min(W, H) * (ARC[layoutName()] || 0.24);
      return { kind: 'arc', a: a, b: b, c: { x: mx + px * amt, y: my + py * amt } };
    }

    function pointAt(g, t) {
      if (g.kind === 'line') {
        return { x: g.a.x + (g.b.x - g.a.x) * t, y: g.a.y + (g.b.y - g.a.y) * t };
      }
      var u = 1 - t;
      return {
        x: u * u * g.a.x + 2 * u * t * g.c.x + t * t * g.b.x,
        y: u * u * g.a.y + 2 * u * t * g.c.y + t * t * g.b.y
      };
    }

    /* ── 粒子 ─────────────────────────────────────────────────────── */
    function seed() {
      flows = EDGES.map(function (e, i) {
        var g = geom(e);
        if (!g) return null;
        var len = Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y) * (g.kind === 'arc' ? 1.15 : 1);
        var n = Math.max(3, Math.min(11, Math.round(len / 46)));
        var parts = [];
        for (var k = 0; k < n; k++) {
          parts.push({
            t: (k + 0.5) / n + (i * 0.07) % 0.2,
            sp: 0.00016 + Math.random() * 0.00013
          });
        }
        return { e: e, g: g, parts: parts };
      }).filter(Boolean);
    }

    function active(id) { return id === (hovered || selected); }

    function draw() {
      if (!ctx || !W || !H) return;
      ctx.clearRect(0, 0, W, H);

      flows.forEach(function (f) {
        var on = active(f.e.from) || active(f.e.to);

        ctx.beginPath();
        if (f.g.kind === 'line') {
          ctx.moveTo(f.g.a.x, f.g.a.y);
          ctx.lineTo(f.g.b.x, f.g.b.y);
        } else {
          ctx.moveTo(f.g.a.x, f.g.a.y);
          ctx.quadraticCurveTo(f.g.c.x, f.g.c.y, f.g.b.x, f.g.b.y);
        }
        ctx.strokeStyle = on ? C.up : C.rule;
        ctx.globalAlpha = on ? 0.55 : 0.75;
        ctx.lineWidth = 1;
        ctx.stroke();

        if (f.e.arc && f.e.label) {
          var mid = pointAt(f.g, 0.5);
          ctx.globalAlpha = on ? 0.9 : 0.5;
          ctx.fillStyle = on ? C.up : C.ink3;
          ctx.font = FONT;
          ctx.textAlign = 'center';
          ctx.fillText(f.e.label, mid.x, mid.y - 8);
        }

        // 粒子：一小段拖尾，方向感来自拖尾而不是箭头
        ctx.lineCap = 'round';
        f.parts.forEach(function (p) {
          var t = p.t % 1;
          var head = pointAt(f.g, t);
          var tail = pointAt(f.g, Math.max(0, t - 0.035));
          ctx.beginPath();
          ctx.moveTo(tail.x, tail.y);
          ctx.lineTo(head.x, head.y);
          ctx.strokeStyle = on ? C.up : C.ink3;
          ctx.globalAlpha = on ? 0.95 : 0.5;
          ctx.lineWidth = on ? 1.8 : 1.3;
          ctx.stroke();
        });
      });

      ctx.globalAlpha = 1;
      ctx.textAlign = 'start';
    }

    function step() {
      flows.forEach(function (f) {
        var k = (active(f.e.from) || active(f.e.to)) ? 3.2 : 1;   // 选中时加速
        f.parts.forEach(function (p) {
          p.t += p.sp * k;
          if (p.t >= 1) p.t -= 1;
        });
      });
      draw();
    }

    /* ── 生命周期 ─────────────────────────────────────────────────── */
    function rebuild() {
      if (!host.clientWidth) return;   // 页面隐藏时不动，等显示后再建
      measure(); seed(); draw();
    }

    rebuild();
    select(selected);

    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; },
        { rootMargin: '120px' }).observe(host);
    }

    if (!REDUCED) {
      var last = 0;
      (function loop(ts) {
        // 标签页隐藏或区块滚出视野时停帧，别白烧 CPU
        if (visible && !document.hidden && W > 0 && ts - last > 15) { step(); last = ts; }
        requestAnimationFrame(loop);
      })(0);
    }

    var rt = null;
    function schedule() { clearTimeout(rt); rt = setTimeout(rebuild, 120); }
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(host);
    else window.addEventListener('resize', schedule);

    return {
      refresh: function () { rebuild(); },
      select: select,
      host: host,
      buttons: buttons
    };
  }

  /* ── 启动两张图 ─────────────────────────────────────────────────── */
  var arches = [];

  if (typeof DATA !== 'undefined') {

    // 作品页：四层链路，节点挂到项目卡片上
    if (DATA.arch) {
      var a1 = makeArch({
        root: 'arch', canvas: 'archcanvas', nodes: 'archnodes', panel: 'archpanel',
        data: DATA.arch,
        initial: 'agent',
        arc: { wide: 0.24, narrow: 0.46 },
        layout: {
          wide: {
            llm:   [0.15, 0.19],
            vec:   [0.15, 0.65],
            agent: [0.50, 0.40],
            term:  [0.50, 0.85],
            eval:  [0.85, 0.40]
          },
          narrow: {
            llm:   [0.27, 0.085],
            vec:   [0.73, 0.085],
            agent: [0.50, 0.355],
            term:  [0.50, 0.635],
            eval:  [0.50, 0.905]
          }
        }
      });
      if (a1) arches.push(a1);
    }

    // 个人项目页：一条消息走完全程
    if (DATA.personal && DATA.personal.arch) {
      var a2 = makeArch({
        root: 'arch2', canvas: 'archcanvas2', nodes: 'archnodes2', panel: 'archpanel2',
        data: DATA.personal.arch,
        initial: 'persona',
        arc: { wide: 0.24, narrow: 0.46 },
        layout: {
          wide: {
            msg:     [0.07, 0.50],
            judge:   [0.29, 0.50],
            persona: [0.60, 0.50],
            guard:   [0.88, 0.50],
            memory:  [0.44, 0.88]
          },
          narrow: {
            msg:     [0.50, 0.05],
            judge:   [0.50, 0.25],
            persona: [0.50, 0.48],
            guard:   [0.50, 0.72],
            memory:  [0.20, 0.94]
          }
        }
      });
      if (a2) arches.push(a2);
    }
  }

  /* ── 对外接口 ───────────────────────────────────────────────────── */
  if (!window.PORTFOLIO) window.PORTFOLIO = {};

  // 项目卡片上的「在架构图里看」调这里（索引按节点 id 建）
  PORTFOLIO.selectArch = function (id) {
    var a = arches[0];
    if (!a || !a.buttons[id]) return false;
    a.select(id);
    a.host.scrollIntoView({ block: 'start' });   // behavior 交给 CSS，减动效时自动瞬时
    try { a.buttons[id].focus({ preventScroll: true }); } catch (e) { /* 忽略 */ }
    return true;
  };

  // 页面切换后重建刚显示出来的画布（隐藏时尺寸是 0，建不了）
  PORTFOLIO.onPageShown = function () {
    if (dust) dust.refit();
    arches.forEach(function (a) { a.refresh(); });
  };
})();
