/* ==========================================================================
   渲染 + 页面路由 + 主题切换。内容全在 data.js，这里只负责把它画出来。
   两个分页：个人资料（项目以外）与个人项目（全部项目），用 hash 切换。
   ========================================================================== */

(function () {
  'use strict';

  var NAME = (typeof DATA !== 'undefined' && DATA.profile) ? DATA.profile.name : '';
  var SITE_TITLE = NAME ? NAME + ' — 量化交易 Agent 工程' : document.title;

  /* ── 小工具：建元素 ─────────────────────────────────────────────── */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function byId(id) { return document.getElementById(id); }

  /* ── 正文分块：项目卡片共用 ─────────────────────────────────────── */
  function renderBlocks(p) {
    var body = el('div', 'proj__body');
    (p.blocks || []).forEach(function (b) {
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
    return body;
  }

  function renderSpec(container, pairs) {
    (pairs || []).forEach(function (pair) {
      var item = el('div', 'spec__item');
      item.appendChild(el('span', 'spec__v', pair[0]));
      item.appendChild(el('span', 'spec__k', pair[1]));
      container.appendChild(item);
    });
  }

  /* 关键读数：资料页当引子、项目页当首屏，两处共用同一份数据 */
  function renderReadout(container, items) {
    if (!container) return;
    (items || []).forEach(function (r) {
      var cell = el('div', 'readout__cell' + (r.up ? ' readout__cell--up' : ''));
      cell.setAttribute('role', 'listitem');
      var num = el('span', 'readout__num');
      num.innerHTML = r.num;            // 含 <em> / 箭头标记，内容手写无外部输入
      cell.appendChild(num);
      cell.appendChild(el('span', 'readout__cap', r.cap));
      container.appendChild(cell);
    });
  }

  function linkEl(l) {
    var a = el('a', null, l.label);
    a.href = l.href;
    if (/^https?:/i.test(l.href)) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
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

    art.appendChild(el('h3', 'proj__title', p.title));
    if (p.role) art.appendChild(el('p', 'proj__role', p.role));
    if (p.lede) art.appendChild(el('p', 'proj__lede', p.lede));

    if (p.spec && p.spec.length) {
      var spec = el('div', 'spec');
      renderSpec(spec, p.spec);
      art.appendChild(spec);
    }

    if (p.blocks && p.blocks.length) art.appendChild(renderBlocks(p));

    if (p.result) {
      var r = el('p', 'proj__result');
      r.innerHTML = p.result;
      art.appendChild(r);
    }

    return art;
  }

  /* ── 个人资料页 ─────────────────────────────────────────────────── */
  function renderProfilePage() {
    var p = DATA.profile;
    if (!p) return;

    var mn = byId('mastname');
    if (mn) mn.textContent = p.name;

    if (byId('pf-name')) byId('pf-name').textContent = p.name;
    if (byId('pf-role')) byId('pf-role').textContent = p.role || '';
    if (byId('pf-bio')) byId('pf-bio').textContent = p.bio || '';

    // 概况：小表格，和身份放在一起
    var facts = byId('pf-facts');
    if (facts) {
      (p.facts || []).forEach(function (f) {
        facts.appendChild(el('dt', null, f.k));
        facts.appendChild(el('dd', null, f.v));
      });
    }

    var links = byId('pf-links');
    if (links) {
      (p.links || []).forEach(function (l) {
        var li = el('li');
        li.appendChild(linkEl(l));
        links.appendChild(li);
      });
    }

    var about = byId('pf-about');
    if (about) {
      (p.about || []).forEach(function (t) { about.appendChild(el('p', null, t)); });
    }

    var focus = byId('pf-focus');
    if (focus) {
      (p.focus || []).forEach(function (f) {
        var d = el('div', 'focus__item');
        d.appendChild(el('h3', 'focus__h', f.h));
        d.appendChild(el('p', 'focus__p', f.p));
        focus.appendChild(d);
      });
    }

    renderReadout(byId('pf-readout'), DATA.readout);

    var skills = byId('skills');
    if (skills) {
      DATA.skills.forEach(function (s) { skills.appendChild(el('li', null, s)); });
    }

    // 页脚的联系方式与资料页同源，改一处就够
    var foot = byId('footlinks');
    if (foot && p.links && p.links.length) {
      p.links.forEach(function (l, i) {
        if (i) {
          var sep = el('span', 'linksep', '·');
          sep.setAttribute('aria-hidden', 'true');
          foot.appendChild(sep);
        }
        foot.appendChild(linkEl(l));
      });
    }
  }

  /* ── 个人项目页 ─────────────────────────────────────────────────── */
  function renderProjectsPage() {
    var root = byId('projects');
    if (root) DATA.projects.forEach(function (p) { root.appendChild(renderProject(p)); });

    renderReadout(byId('pj-readout'), DATA.readout);

    var note = byId('arch2-note');
    if (note && DATA.personal && DATA.personal.note) note.textContent = DATA.personal.note;
  }

  /* ── 挂载 ───────────────────────────────────────────────────────── */
  renderProfilePage();
  renderProjectsPage();

  /* ── 页面路由（hash） ───────────────────────────────────────────── */
  var PAGES = ['profile', 'projects'];

  function pageFromHash() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    return PAGES.indexOf(h) >= 0 ? h : 'profile';
  }

  function showPage(name) {
    PAGES.forEach(function (p) {
      var node = byId('page-' + p);
      if (node) node.hidden = (p !== name);
    });

    [].forEach.call(document.querySelectorAll('.nav a'), function (a) {
      if (a.dataset.page === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    document.title = (name === 'projects' ? '个人项目 — ' : '') + SITE_TITLE;

    // 让 motion.js 有机会重建刚显示出来的画布（隐藏时尺寸是 0）
    if (window.PORTFOLIO && PORTFOLIO.onPageShown) PORTFOLIO.onPageShown(name);
  }

  function route(scrollTop) {
    showPage(pageFromHash());
    if (scrollTop !== false) window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', function () { route(true); });
  route(false);        // 首次加载保留浏览器恢复的滚动位置

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

  // motion.js 会往这个对象上补 selectArch / onPageShown
  window.PORTFOLIO = {
    jumpToProject: jumpToProject,
    flashProject: flashCard,
    cardIndex: cardIndex
  };

  /* ── 主题 ───────────────────────────────────────────────────────── */
  var btn = byId('themebtn');
  var label = byId('themebtn-label');
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
