/* ==========================================================================
   渲染 + 主题切换。内容全在 data.js，这里只负责把它画出来。
   ========================================================================== */

(function () {
  'use strict';

  /* ── 小工具：建元素 ─────────────────────────────────────────────── */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ── 架构图 ←→ 项目卡片 的索引 ─────────────────────────────────── */
  var cardIndex = {};          // 项目 id -> 卡片元素
  var archNodeOf = {};         // 项目 id -> 架构图里对应的节点

  if (typeof DATA !== 'undefined' && DATA.arch) {
    DATA.arch.nodes.forEach(function (n) {
      if (n.proj) archNodeOf[n.proj] = n;
    });
  }

  /* ── 一个项目 ───────────────────────────────────────────────────── */
  function renderProject(p) {
    var art = el('article', 'proj');
    art.id = 'p-' + p.id;
    art.tabIndex = -1;              // 可编程聚焦，跳转后键盘能接着用
    cardIndex[p.id] = art;

    var head = el('div', 'proj__head');
    head.appendChild(el('span', 'proj__tag', p.tag));

    // 反向链接：只给在架构图里有对应节点的项目
    if (archNodeOf[p.id]) {
      // 注意两边 id 不是一套：项目 id 是 gateway，架构节点 id 是 llm。
      // 这里传的是节点 id，selectArch 的索引按节点 id 建。
      var node = archNodeOf[p.id];
      var back = el('button', 'proj__arch', '在架构图里看 ↑');
      back.type = 'button';
      back.addEventListener('click', function () {
        // motion.js 比本文件后加载，所以点击时才判断它在不在
        if (window.PORTFOLIO && PORTFOLIO.selectArch) PORTFOLIO.selectArch(node.id);
      });
      head.appendChild(back);
    }
    art.appendChild(head);

    var h = el('h3', 'proj__title', p.title);
    art.appendChild(h);

    if (p.role) art.appendChild(el('p', 'proj__role', p.role));
    if (p.lede) art.appendChild(el('p', 'proj__lede', p.lede));

    /* 规格条 */
    if (p.spec && p.spec.length) {
      var spec = el('div', 'spec');
      p.spec.forEach(function (pair) {
        var item = el('div', 'spec__item');
        item.appendChild(el('span', 'spec__v', pair[0]));
        item.appendChild(el('span', 'spec__k', pair[1]));
        spec.appendChild(item);
      });
      art.appendChild(spec);
    }

    /* 正文分块 */
    if (p.blocks && p.blocks.length) {
      var body = el('div', 'proj__body');
      p.blocks.forEach(function (b) {
        var blk = el('div', 'blk' + (b.kind === 'hard' ? ' blk--hard' : ''));
        blk.appendChild(el('h4', 'blk__h', b.h));
        var ul = el('ul');
        b.items.forEach(function (t) {
          var li = el('li');
          li.innerHTML = t;   // 内容由 data.js 手写，无外部输入
          ul.appendChild(li);
        });
        blk.appendChild(ul);
        body.appendChild(blk);
      });
      art.appendChild(body);
    }

    /* 结果 */
    if (p.result) {
      var r = el('p', 'proj__result');
      r.innerHTML = p.result;
      art.appendChild(r);
    }

    return art;
  }

  /* ── 挂载 ───────────────────────────────────────────────────────── */
  var projRoot = document.getElementById('projects');
  DATA.projects.forEach(function (p) { projRoot.appendChild(renderProject(p)); });

  var sideRoot = document.getElementById('side');
  DATA.side.forEach(function (p) { sideRoot.appendChild(renderProject(p)); });

  var skillRoot = document.getElementById('skills');
  DATA.skills.forEach(function (s) { skillRoot.appendChild(el('li', null, s)); });

  /* ── 跨模块联动：架构图 → 项目卡片 ─────────────────────────────── */
  function flashCard(id) {
    var card = cardIndex[id];
    if (!card) return;
    card.classList.remove('proj--flash');
    void card.offsetWidth;          // 强制重排，动画才能重放
    card.classList.add('proj--flash');
    clearTimeout(card._flashT);
    card._flashT = setTimeout(function () {
      card.classList.remove('proj--flash');
    }, 2600);
  }

  function jumpToProject(id) {
    var card = cardIndex[id];
    if (!card) return false;
    // 不写死 behavior：让 CSS 的 scroll-behavior 决定，
    // 这样 prefers-reduced-motion 下会自动变成瞬时跳转
    card.scrollIntoView({ block: 'start' });
    flashCard(id);
    try { card.focus({ preventScroll: true }); } catch (e) { card.focus(); }
    return true;
  }

  // motion.js 会往这个对象上补 selectArch
  window.PORTFOLIO = {
    jumpToProject: jumpToProject,
    flashProject: flashCard,
    cardIndex: cardIndex
  };

  /* ── 主题 ───────────────────────────────────────────────────────── */
  var btn = document.getElementById('themebtn');
  var label = document.getElementById('themebtn-label');
  var KEY = 'portfolio-theme';

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    if (label) label.textContent = t === 'dark' ? '浅色' : '深色';
    if (btn) btn.setAttribute('aria-label',
      t === 'dark' ? '切换到浅色主题' : '切换到深色主题');
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* 隐私模式 */ }

  var prefersDark = window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  applyTheme(saved || (prefersDark ? 'dark' : 'light'));

  if (btn) {
    btn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark'
        ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* 忽略 */ }
    });
  }
})();
