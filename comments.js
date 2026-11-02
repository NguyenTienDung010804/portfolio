/* Comment mode: click an element or drag a box, write feedback -> saved to a Google Sheet
 * through an Apps Script web app (window.PFC_API). Saved comments are drawn back as numbered pins. */
(function () {
  var API = window.PFC_API || '';
  var mine = {}; try { mine = JSON.parse(localStorage.getItem('pfc-mine') || '{}'); } catch (e) {}
  function saveMine() { try { localStorage.setItem('pfc-mine', JSON.stringify(mine)); } catch (e) {} }
  function post(o) { return fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(o) }).then(function (r) { return r.json(); }).then(function (r) { if (!r.ok) throw new Error(r.error || 'fail'); return r; }); }
  var store = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
                set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };

  var css = '' +
    '#pfc-ui{position:fixed;right:20px;bottom:20px;z-index:2147483000;display:flex;gap:8px;font:500 14px/1 Geist,system-ui,sans-serif}' +
    '#pfc-ui{align-items:center;right:24px;bottom:24px}' +
    '#pfc-ui button{border:0;border-radius:999px;padding:12px 18px;cursor:pointer;box-shadow:0 6px 24px rgba(40,20,80,.22);font:inherit}' +
    '#pfc-toggle{background:linear-gradient(135deg,#6A2FB8,#3E1A75);color:#fff;font-size:18px!important;font-weight:600!important;padding:18px 28px!important;box-shadow:0 10px 32px rgba(62,26,117,.45)!important;animation:pfc-pulse 2.4s ease-in-out infinite}' +
    '#pfc-toggle.on{background:#E8590C;animation:none}#pfc-toggle:hover{transform:translateY(-2px)}' +
    '@keyframes pfc-pulse{0%,100%{box-shadow:0 10px 32px rgba(62,26,117,.45),0 0 0 0 rgba(106,47,184,.45)}50%{box-shadow:0 10px 32px rgba(62,26,117,.45),0 0 0 14px rgba(106,47,184,0)}}' +
    '#pfc-call{position:fixed;right:24px;bottom:96px;z-index:2147483000;width:300px;max-width:calc(100vw - 48px);background:#fff;color:#1d1230;border-radius:16px;padding:18px 20px 16px;box-shadow:0 16px 48px rgba(30,10,60,.3);font:15px/1.5 Geist,system-ui,sans-serif;animation:pfc-in .5s cubic-bezier(.2,.9,.3,1.3) both}' +
    '#pfc-call:after{content:"";position:absolute;right:48px;bottom:-8px;width:16px;height:16px;background:#fff;transform:rotate(45deg)}' +
    '#pfc-call b{display:block;font-size:17px;margin-bottom:4px;color:#3E1A75}#pfc-call .x{position:absolute;right:10px;top:8px;border:0;background:none;font-size:20px;color:#9a93a8;cursor:pointer;padding:4px}' +
    '#pfc-call .go{margin-top:12px;border:0;border-radius:10px;padding:10px 14px;background:#6A2FB8;color:#fff;font:600 14px Geist,system-ui,sans-serif;cursor:pointer}' +
    '@keyframes pfc-in{from{opacity:0;transform:translateY(16px) scale(.95)}to{opacity:1;transform:none}}' +
    '.pfc-pop .danger{background:#fdecea;color:#b42318}.pfc-pop .mine{font-size:11px;color:#6A2FB8;margin-left:4px}' +
    '#pfc-show{background:#fff;color:#3E1A75}' +
    '#pfc-hint{position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:2147483000;background:#1d1230;color:#fff;padding:10px 16px;border-radius:10px;font:14px/1.4 Geist,system-ui,sans-serif;display:none;box-shadow:0 6px 24px rgba(0,0,0,.25)}' +
    'body.pfc-on,body.pfc-on *{cursor:crosshair!important}' +
    '#pfc-hover{position:absolute;pointer-events:none;z-index:2147482990;outline:2px solid #E8590C;background:rgba(232,89,12,.06);border-radius:4px;display:none}' +
    '#pfc-drag{position:absolute;pointer-events:none;z-index:2147482991;border:2px dashed #E8590C;background:rgba(232,89,12,.10);display:none}' +
    '#pfc-layer{position:absolute;left:0;top:0;width:0;height:0;z-index:2147482995}' +
    '.pfc-box{position:absolute;border:2px solid rgba(106,47,184,.55);background:rgba(106,47,184,.06);border-radius:4px;pointer-events:none;display:none}' +
    '.pfc-box.show{display:block}' +
    '.pfc-pin{position:absolute;width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50% 50% 50% 4px;background:#6A2FB8;color:#fff;font:600 13px/28px Geist,system-ui,sans-serif;text-align:center;cursor:pointer!important;box-shadow:0 3px 12px rgba(40,20,80,.35);border:2px solid #fff;transition:transform .15s}' +
    '.pfc-pin:hover{transform:scale(1.15)}.pfc-pin.done{background:#9a93a8}' +
    '.pfc-pop{position:absolute;z-index:2147483001;width:320px;max-width:calc(100vw - 32px);background:#fff;color:#1d1230;border-radius:12px;box-shadow:0 12px 40px rgba(30,10,60,.28);padding:14px;font:14px/1.5 Geist,system-ui,sans-serif;cursor:auto!important}' +
    '.pfc-pop *{cursor:auto!important}.pfc-pop button,.pfc-pop a{cursor:pointer!important}' +
    '.pfc-pop textarea{width:100%;box-sizing:border-box;min-height:96px;border:1px solid #d9cfe9;border-radius:8px;padding:8px;font:inherit;resize:vertical;cursor:text!important}' +
    '.pfc-pop .row{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}' +
    '.pfc-pop button{border:0;border-radius:8px;padding:8px 12px;font:inherit}' +
    '.pfc-pop .pri{background:#6A2FB8;color:#fff}.pfc-pop .sec{background:#f1ecf8;color:#3E1A75}' +
    '.pfc-pop .meta{font-size:12px;color:#7a6f8c;margin-bottom:6px}.pfc-pop .body{white-space:pre-wrap;max-height:240px;overflow:auto}' +
    '.pfc-pop .note{font-size:12px;color:#7a6f8c;margin-top:8px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var ui = el('div', { id: 'pfc-ui' });
  var showBtn = el('button', { id: 'pfc-show', type: 'button' }, 'Ẩn ghim');
  var toggle = el('button', { id: 'pfc-toggle', type: 'button' }, '💬 Góp ý tại đây');
  ui.appendChild(showBtn); ui.appendChild(toggle);
  var hint = el('div', { id: 'pfc-hint' }, 'Bấm vào một phần tử hoặc kéo chuột để khoanh vùng · Esc để thoát');
  var hover = el('div', { id: 'pfc-hover' });
  var drag = el('div', { id: 'pfc-drag' });
  var layer = el('div', { id: 'pfc-layer' });
  document.body.appendChild(layer); document.body.appendChild(hover); document.body.appendChild(drag);
  document.body.appendChild(hint); document.body.appendChild(ui);

  var on = false, pinsVisible = true, pop = null, issues = [];
  function isUI(t) { return t && t.closest && t.closest('#pfc-ui,.pfc-pop,.pfc-pin,#pfc-hint,#pfc-call'); }

  function setMode(v) {
    on = v; toggle.classList.toggle('on', on); toggle.textContent = on ? '✕ Thoát góp ý' : '💬 Góp ý tại đây';
    document.body.classList.toggle('pfc-on', on); hint.style.display = on ? 'block' : 'none';
    if (!on) { hover.style.display = 'none'; drag.style.display = 'none'; }
  }
  toggle.onclick = function () { hideCall(); closePop(); setMode(!on); };
  var call = el('div', { id: 'pfc-call' }, '<button class="x" type="button" aria-label="Đóng">×</button><b>Góp ý trực tiếp trên trang</b>Bấm nút bên dưới, rồi bấm vào chỗ bất kỳ hoặc kéo chuột khoanh vùng để để lại nhận xét. Không cần đăng nhập.<br><button class="go" type="button">Bắt đầu góp ý →</button>');
  function hideCall() { if (call.parentNode) call.remove(); }
  call.querySelector('.x').onclick = hideCall;
  call.querySelector('.go').onclick = function () { hideCall(); closePop(); setMode(true); };
  setTimeout(function () { if (!on) document.body.appendChild(call); }, 1200);
  showBtn.onclick = function () { pinsVisible = !pinsVisible; layer.style.display = pinsVisible ? '' : 'none'; showBtn.textContent = pinsVisible ? 'Ẩn ghim' : 'Hiện ghim'; };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closePop(); setMode(false); } });

  // ---- anchoring ----
  function selectorOf(node) {
    var parts = [];
    while (node && node.nodeType === 1 && node !== document.body) {
      if (node.id) { parts.unshift('#' + CSS.escape(node.id)); break; }
      var i = 1, s = node; while ((s = s.previousElementSibling)) if (s.tagName === node.tagName) i++;
      parts.unshift(node.tagName.toLowerCase() + ':nth-of-type(' + i + ')');
      node = node.parentElement;
    }
    return (parts[0] && parts[0][0] === '#' ? '' : 'body > ') + parts.join(' > ');
  }
  function docRect(r) { return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; }
  function docSize() { var d = document.documentElement; return { w: d.scrollWidth, h: d.scrollHeight }; }
  function makeAnchor(target, box) { // box in doc coords
    var er = docRect(target.getBoundingClientRect()), ds = docSize();
    return {
      sel: selectorOf(target),
      txt: (target.innerText || target.alt || '').trim().replace(/\s+/g, ' ').slice(0, 60),
      r: [(box.x - er.x) / (er.w || 1), (box.y - er.y) / (er.h || 1), box.w / (er.w || 1), box.h / (er.h || 1)].map(function (n) { return +n.toFixed(4); }),
      p: [box.x / ds.w, box.y / ds.h, box.w / ds.w, box.h / ds.h].map(function (n) { return +n.toFixed(5); })
    };
  }
  function resolve(a) {
    var t = null; try { t = document.querySelector(a.sel); } catch (e) {}
    if (t && a.txt) { var tt = (t.innerText || t.alt || '').trim().replace(/\s+/g, ' ').slice(0, 60); if (tt.slice(0, 20) !== a.txt.slice(0, 20)) t = null; }
    if (t && t.getBoundingClientRect().width) {
      var er = docRect(t.getBoundingClientRect());
      return { x: er.x + a.r[0] * er.w, y: er.y + a.r[1] * er.h, w: a.r[2] * er.w, h: a.r[3] * er.h };
    }
    var ds = docSize(); return { x: a.p[0] * ds.w, y: a.p[1] * ds.h, w: a.p[2] * ds.w, h: a.p[3] * ds.h };
  }

  // ---- pick / drag ----
  var start = null;
  function under(x, y) {
    hover.style.display = 'none';
    var t = document.elementFromPoint(x, y);
    return t && !isUI(t) && t !== document.documentElement ? t : document.body;
  }
  document.addEventListener('pointermove', function (e) {
    if (!on || pop) return;
    if (start) {
      var x = Math.min(start.x, e.pageX), y = Math.min(start.y, e.pageY), w = Math.abs(e.pageX - start.x), h = Math.abs(e.pageY - start.y);
      if (w > 6 || h > 6) start.moved = true;
      if (start.moved) { Object.assign(drag.style, { display: 'block', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' }); hover.style.display = 'none'; }
      return;
    }
    if (isUI(e.target)) { hover.style.display = 'none'; return; }
    var t = under(e.clientX, e.clientY), r = docRect(t.getBoundingClientRect());
    Object.assign(hover.style, { display: 'block', left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
  }, true);
  document.addEventListener('pointerdown', function (e) {
    if (!on || isUI(e.target) || e.button !== 0) return;
    if (pop) { closePop(); return; }
    e.preventDefault(); e.stopPropagation();
    start = { x: e.pageX, y: e.pageY, cx: e.clientX, cy: e.clientY, moved: false };
  }, true);
  document.addEventListener('pointerup', function (e) {
    if (!on || !start) return;
    e.preventDefault(); e.stopPropagation();
    var s = start; start = null; drag.style.display = 'none';
    var box, target;
    if (s.moved) {
      box = { x: Math.min(s.x, e.pageX), y: Math.min(s.y, e.pageY), w: Math.abs(e.pageX - s.x), h: Math.abs(e.pageY - s.y) };
      target = under(box.x + box.w / 2 - scrollX, box.y + box.h / 2 - scrollY);
    } else {
      target = under(s.cx, s.cy); box = docRect(target.getBoundingClientRect());
    }
    hover.style.display = 'none';
    compose(target, box);
  }, true);
  document.addEventListener('click', function (e) { if (on && !isUI(e.target)) { e.preventDefault(); e.stopPropagation(); } }, true);

  // ---- popovers ----
  function closePop() { if (pop) { pop.remove(); pop = null; } layer.querySelectorAll('.pfc-box.temp').forEach(function (b) { b.remove(); }); }
  function place(p, x, y) {
    document.body.appendChild(p);
    var w = p.offsetWidth, maxX = scrollX + innerWidth - w - 16;
    p.style.left = Math.max(scrollX + 16, Math.min(x, maxX)) + 'px'; p.style.top = (y + 12) + 'px'; pop = p;
  }
  function compose(target, box) {
    closePop();
    var b = el('div', { class: 'pfc-box show temp' }); Object.assign(b.style, { left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px', borderColor: '#E8590C' }); layer.appendChild(b);
    var a = makeAnchor(target, box);
    var p = el('div', { class: 'pfc-pop' },
      '<div class="meta">Góp ý cho: ' + esc(a.txt || target.tagName.toLowerCase()) + '</div>' +
      '<input class="pfc-name" placeholder="Tên của bạn (không bắt buộc)" style="width:100%;box-sizing:border-box;border:1px solid #d9cfe9;border-radius:8px;padding:8px;font:inherit;margin-bottom:8px;cursor:text!important">' +
      '<textarea placeholder="Viết góp ý…"></textarea>' +
      '<input class="pfc-hp" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px">' +
      '<div class="row"><button class="sec" type="button">Huỷ</button><button class="pri" type="button">Gửi góp ý</button></div>');
    place(p, box.x, box.y + box.h);
    var ta = p.querySelector('textarea'), nm = p.querySelector('.pfc-name');
    nm.value = store.get('pfc-name') || ''; (nm.value ? ta : nm).focus();
    p.querySelector('.sec').onclick = closePop;
    var send = p.querySelector('.pri');
    send.onclick = function () {
      var text = ta.value.trim(); if (!text) { ta.focus(); return; }
      var name = nm.value.trim(); store.set('pfc-name', name);
      send.disabled = true; send.textContent = 'Đang gửi…';
      post({ action: 'create', name: name, text: text, where: a.txt || a.sel, anchor: a, hp: p.querySelector('.pfc-hp').value })
        .then(function (res) {
          if (res.token) { mine[res.id] = res.token; saveMine(); }
          closePop(); setMode(false);
          issues.push({ anchor: a, text: text, name: name || 'Mentor', date: new Date().toISOString(), done: false, id: res.id });
          render(); flash('Đã gửi góp ý. Cảm ơn bạn!');
        })
        .catch(function () { send.disabled = false; send.textContent = 'Gửi lại'; flash('Gửi chưa được, thử lại nhé.'); });
    };
  }
  function flash(msg) { hint.textContent = msg; hint.style.display = 'block'; clearTimeout(flash.t); flash.t = setTimeout(function () { hint.style.display = on ? 'block' : 'none'; hint.textContent = 'Bấm vào một phần tử hoặc kéo chuột để khoanh vùng · Esc để thoát'; }, 2500); }
  function showIssue(it, n) {
    closePop();
    var pos = resolve(it.anchor), own = !!mine[it.id];
    var p = el('div', { class: 'pfc-pop' });
    function view() {
      p.innerHTML = '<div class="meta">#' + n + ' · ' + esc(it.name || 'Mentor') + (own ? '<span class="mine">(của bạn)</span>' : '') + ' · ' + new Date(it.date).toLocaleDateString('vi-VN') + (it.done ? ' · đã xử lý' : '') + '</div>' +
        '<div class="body">' + esc(it.text) + '</div>' +
        '<div class="row">' + (own ? '<button class="danger" data-a="del" type="button">Xoá</button><button class="sec" data-a="edit" type="button">Sửa</button>' : '') +
        '<button class="pri" data-a="close" type="button">Đóng</button></div>';
      p.querySelector('[data-a=close]').onclick = closePop;
      if (!own) return;
      p.querySelector('[data-a=edit]').onclick = edit;
      var del = p.querySelector('[data-a=del]');
      del.onclick = function () {
        if (!del.dataset.sure) { del.dataset.sure = 1; del.textContent = 'Xoá thật?'; return; }
        del.disabled = true; del.textContent = 'Đang xoá…';
        post({ action: 'delete', id: it.id, token: mine[it.id] }).then(function () {
          delete mine[it.id]; saveMine(); issues = issues.filter(function (x) { return x !== it; }); closePop(); render(); flash('Đã xoá góp ý.');
        }).catch(function (e) {
          if (/notfound/.test(e.message)) { issues = issues.filter(function (x) { return x !== it; }); closePop(); render(); return; }
          del.disabled = false; del.textContent = 'Xoá'; delete del.dataset.sure; flash('Xoá chưa được, thử lại nhé.');
        });
      };
    }
    function edit() {
      p.innerHTML = '<div class="meta">Sửa góp ý #' + n + '</div><textarea></textarea>' +
        '<div class="row"><button class="sec" data-a="cancel" type="button">Huỷ</button><button class="pri" data-a="save" type="button">Lưu</button></div>';
      var ta = p.querySelector('textarea'); ta.value = it.text; ta.focus();
      p.querySelector('[data-a=cancel]').onclick = view;
      var sv = p.querySelector('[data-a=save]');
      sv.onclick = function () {
        var t = ta.value.trim(); if (!t) { ta.focus(); return; }
        sv.disabled = true; sv.textContent = 'Đang lưu…';
        post({ action: 'edit', id: it.id, token: mine[it.id], text: t }).then(function () {
          it.text = t; render(); view(); flash('Đã lưu thay đổi.');
        }).catch(function () { sv.disabled = false; sv.textContent = 'Lưu lại'; flash('Lưu chưa được, thử lại nhé.'); });
      };
    }
    view(); place(p, pos.x, pos.y + pos.h);
  }

  // ---- load & render pins ----
  function render() {
    layer.innerHTML = '';
    issues.forEach(function (it, i) {
      var r = resolve(it.anchor);
      var box = el('div', { class: 'pfc-box' }); Object.assign(box.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
      var pin = el('div', { class: 'pfc-pin' + (it.done ? ' done' : ''), title: String(it.text).slice(0, 80) }, String(i + 1));
      Object.assign(pin.style, { left: (r.x + r.w) + 'px', top: r.y + 'px' });
      pin.onmouseenter = function () { box.classList.add('show'); };
      pin.onmouseleave = function () { box.classList.remove('show'); };
      pin.onclick = function (e) { e.stopPropagation(); showIssue(it, i + 1); };
      layer.appendChild(box); layer.appendChild(pin);
    });
  }
  function parse(list) {
    issues = (list || []).map(function (x) {
      var an = x.anchor; if (typeof an === 'string') { try { an = JSON.parse(an); } catch (e) { an = null; } }
      return an && an.p ? { anchor: an, text: x.text, name: x.name, date: x.date, done: !!x.done, id: x.id } : null;
    }).filter(Boolean).sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    render();
  }
  function load() {
    if (!API) return;
    fetch(API).then(function (r) { return r.json(); }).then(function (d) { parse(d.items); }).catch(function () {});
  }
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(render, 150); });
  addEventListener('load', function () { setTimeout(render, 300); });
  load();
})();
