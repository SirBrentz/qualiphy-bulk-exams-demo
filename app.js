/* Bulk Exam Actions demo v1: app. Vanilla JS, no build step, no network calls.
   The clinic portal's Exams tab as it is today (tabs, location dropdown, centered table, row menu with
   Deactivate Exam), plus the proposal: a checkbox column, search and filters, a bulk bar, one confirm
   dialog with the impact spelled out, undo, and a change history. Send Exam Invite shows the effect.
   Every name, ticket key and client lives in the CONTEXT block of data.js, so the public build swaps
   only that block. Line icons adapted from Feather (MIT). */
(function () {
  'use strict';

  const D = window.BULK_DEMO;
  const C = D.CTX;
  const KEY = 'qualiphy-bulk-exams-demo-v1';
  const params = new URLSearchParams(location.search);
  if (params.has('static')) document.body.classList.add('static');
  const YOU = D.ACCOUNT.you;
  const RECENT = D.COPY.recentDays;
  const UNDO_S = D.COPY.undoSeconds;
  const DAY = 864e5;

  let S = null;
  let lastScrolled = -1;
  let quiet = false;
  let undoTimer = null;

  /* ------------------------------------------------------------------ icons */
  const P = {
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    minus: '<line x1="6" y1="12" x2="18" y2="12"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    arrowLeft: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
    refresh: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    chevDown: '<polyline points="6 9 12 15 18 9"/>',
  };
  const I = (n, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
  /* Portal chrome uses the portal's own glyphs (icons.js); the demo layer uses the line icons above. */
  const PI = (n, cls) => ((window.PORTAL_ICONS || {})[n] || '').replace('<svg ', `<svg class="pi${cls ? ' ' + cls : ''}" `);

  /* ------------------------------------------------------------------ utils */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtWhen = (t) => new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const dnote = (k, html, attrs) => `<div class="dnote"${attrs ? ' ' + attrs : ''}>${I('info')}<div><span class="dn-k">${esc(k)}</span>${html}</div></div>`;
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const ref = (k) => (C.ref && C.ref[k] ? ` (${C.ref[k]})` : '');
  function setPath(o, path, v) { const ks = path.split('.'); let t = o; for (let i = 0; i < ks.length - 1; i++) { if (t[ks[i]] == null) t[ks[i]] = {}; t = t[ks[i]]; } t[ks[ks.length - 1]] = v; }
  function toast(msg, kind, undo) {
    if (quiet) return;
    const box = document.getElementById('toast'); if (!box) return;
    if (undo) box.querySelectorAll('.toast.has-undo').forEach((t) => t.remove());
    const el = document.createElement('div');
    el.className = 'toast' + (kind === 'info' ? ' info' : '') + (undo ? ' has-undo' : '');
    el.innerHTML = `${I(kind === 'info' ? 'info' : 'checkCircle')}<span>${esc(msg)}</span>${undo ? `<button class="undo" data-act="undo" id="undo-btn">Undo</button>` : ''}`;
    box.appendChild(el);
    setTimeout(() => el.remove(), undo ? UNDO_S * 1000 : 3200);
  }
  function lastLabel(d) {
    if (d == null) return 'Never';
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    if (d < 45) return `${d} days ago`;
    const m = Math.round(d / 30);
    return m >= 12 ? 'Over a year ago' : `${m} months ago`;
  }

  /* ------------------------------------------------------------------ state */
  function fresh() {
    const t0 = Date.now();
    return {
      v: 1, page: 'exams', tab: 'q', clinic: 0, exams: clone(D.EXAMS), sel: [],
      filter: { q: '', status: 'all', type: 'all' },
      history: D.HISTORY.map((h) => ({ at: t0 - h.daysAgo * DAY, who: YOU, action: h.action, how: h.how, ids: h.ids.slice() })),
      invite: { clinic: 0, type: 'gfe' },
      menu: null, modal: null, drawer: null, ctxTab: 'plan', undo: null,
      wt: { on: false, step: 0 }, welcomed: false, notes: true, flash: [],
      flags: { picked: false, filtered: false, leftOut: false, applied: false, reactivated: false },
    };
  }
  function load() {
    if (params.has('fresh') || params.has('step')) return null;
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s && s.v === 1 && Array.isArray(s.exams) && s.flags ? s : null; } catch (e) { return null; }
  }
  let saveTimer = null;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(Object.assign({}, S, { undo: null }))); } catch (e) { /* storage blocked: the demo still runs */ } }
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 200); }

  /* ------------------------------------------------------------------ model */
  const exam = (id) => S.exams.find((e) => e.id === id);
  const clinic = (i) => D.CLINICS[i == null ? S.clinic : i];
  const locked = (e, ci) => clinic(ci).service === 'gfe' && e.rx;
  const byTitle = (a, b) => a.title.localeCompare(b.title) || a.id - b.id;
  function matches(e) {
    const f = S.filter; const q = f.q.trim().toLowerCase();
    if (q && !String(e.id).includes(q) && !e.title.toLowerCase().includes(q)) return false;
    if (f.status === 'on' && !e.active) return false;
    if (f.status === 'off' && e.active) return false;
    if (f.type === 'gfe' && e.rx) return false;
    if (f.type === 'rx' && !e.rx) return false;
    return true;
  }
  const tabRows = () => S.exams.filter((e) => e.tpl === S.tab).sort(byTitle);
  const viewRows = () => tabRows().filter(matches);
  const selectableView = () => viewRows().filter((e) => !locked(e));
  const selected = () => S.sel.map(exam).filter(Boolean);
  const isRecent = (e) => e.last != null && e.last <= RECENT;
  const titles = (ids, max) => { const t = ids.map((id) => (exam(id) || {}).title).filter(Boolean); return max && t.length > max ? `${t.slice(0, max).join(', ')} and ${t.length - max} more` : t.join(', '); };
  const RX9 = D.EXAMS.filter((e) => e.tpl === 'q' && e.rx).map((e) => e.id);
  const SIX = D.EXAMS.filter((e) => e.tpl === 'q' && e.rx && !(e.last != null && e.last <= D.COPY.recentDays)).map((e) => e.id);
  const BACK = [4514, 4516];

  function log(action, how, ids) { S.history.unshift({ at: Date.now(), who: YOU, action, how, ids: ids.slice() }); }
  function openBulk(action, ids) {
    const list = (ids || S.sel).map(exam).filter((e) => e && (action === 'off' ? e.active : !e.active) && !locked(e)).map((e) => e.id);
    if (!list.length) return false;
    S.modal = { kind: 'bulk', action, ids: list };
    S.menu = null;
    return true;
  }
  function leaveOutRecent() {
    const m = S.modal; if (!m || m.kind !== 'bulk') return;
    const recent = m.ids.filter((id) => isRecent(exam(id)));
    m.ids = m.ids.filter((id) => !recent.includes(id));
    S.sel = S.sel.filter((id) => !recent.includes(id));
    if (!m.ids.length) S.modal = null;
  }
  function applyBulk() {
    const m = S.modal; if (!m || m.kind !== 'bulk' || !m.ids.length) return;
    const on = m.action === 'on';
    const prev = {};
    m.ids.forEach((id) => { const e = exam(id); prev[id] = e.active; e.active = on; });
    log(on ? 'on' : 'off', 'bulk', m.ids);
    S.undo = { ids: m.ids.slice(), prev, action: m.action };
    S.flash = m.ids.slice();
    S.sel = [];
    S.modal = null;
    toast(`${plural(m.ids.length, 'exam', 'exams')} ${on ? 'activated' : 'deactivated'}`, 'ok', true);
    clearTimeout(undoTimer);
    undoTimer = setTimeout(() => { if (S) { S.undo = null; } }, UNDO_S * 1000);
  }
  function undo() {
    const u = S.undo; if (!u) return;
    u.ids.forEach((id) => { const e = exam(id); if (e) e.active = u.prev[id]; });
    log('undo', 'bulk', u.ids);
    S.flash = u.ids.slice();
    S.undo = null;
    document.querySelectorAll('.toast.has-undo').forEach((t) => t.remove());
    toast(`Undone. ${plural(u.ids.length, 'exam', 'exams')} back as they were.`, 'info');
  }
  function rowToggle(id) {
    const e = exam(id); if (!e || locked(e)) return;
    e.active = !e.active;
    log(e.active ? 'on' : 'off', 'row', [id]);
    S.flash = [id];
    S.menu = null;
    toast(e.active ? 'Exam Activated Successfully' : 'Exam Deactivated Successfully');
  }

  /* ------------------------------------------------------------------ portal chrome */
  const MENU = [
    ['Results', 'TbReportAnalytics', ''], ['Clinics', 'BiClinic', ''], ['Managers', 'FaUserTie', ''],
    ['Medication Management', 'MdOutlineContentPasteSearch', ''], ['Exams', 'FaNotesMedical', 'exams'], ['Intake Forms (Beta)', 'FaFileAlt', ''], ['Knowledge Base', 'BsQuestionCircle', ''],
    ['Weight Loss Exam', 'MdOutlineNoteAlt', ''], ['Rewards', 'TiUserAdd', ''], ['White Label', 'IoIosColorPalette', ''], ['Settings', 'IoSettings', ''],
  ];
  function sidebar() {
    return `<aside class="side"><div class="brand"><img src="assets/logo_white.png" alt="Qualiphy"></div><div class="dash">Dashboard ${PI('IoClose')}</div><nav>${MENU.map(([l, ic, pg]) => `<button${pg ? ` id="nav-${pg}"` : ''} class="${pg && (pg === S.page || (pg === 'exams' && S.page === 'invite')) ? 'on' : ''}" data-act="${pg ? 'page' : 'noop'}" data-page="${pg}">${PI(ic)}${esc(l)}</button>`).join('')}<div class="gap"></div><button data-act="noop">${PI('TbLogout')}Logout</button></nav></aside>`;
  }
  function kebab(id, options, disabled) {
    const open = !disabled && S.menu && S.menu.id === id;
    return `<div class="kebab-wrap"><button class="kebab" data-act="menu" data-id="${id}" aria-label="Actions" ${disabled ? 'disabled' : ''}>${PI('BsThreeDotsVertical')}</button>${open ? `<div class="menu" data-stop-menu>${options.map((o) => `<button class="${o.cls || ''}" data-act="${o.act}" data-id="${id}"${o.tip ? ` data-tip="${esc(o.tip)}"` : ''}>${esc(o.name)}</button>`).join('')}</div>` : ''}</div>`;
  }
  function cb(state) { return `<span class="cb${state === 'on' ? ' on' : state === 'mixed' ? ' mixed' : ''}">${I(state === 'mixed' ? 'minus' : 'check')}</span>`; }

  /* ------------------------------------------------------------------ exams page */
  function examsPage() {
    const rows = viewRows();
    const all = tabRows();
    const selIds = new Set(S.sel);
    const pick = selectableView();
    const pickedInView = pick.filter((e) => selIds.has(e.id)).length;
    const headState = !pick.length || !pickedInView ? 'off' : pickedInView === pick.length ? 'on' : 'mixed';
    const flash = new Set(S.flash || []);
    const body = rows.map((e) => {
      const lk = locked(e);
      const opts = (e.tpl === 'c' ? [{ name: 'View', act: 'noop' }, { name: 'Edit', act: 'noop' }, { name: 'Delete', act: 'noop', cls: 'danger' }] : [])
        .concat(e.active ? [{ name: 'Deactivate Exam', act: 'row-toggle', tip: D.COPY.deactivateTip }] : [{ name: 'Activate Exam', act: 'row-toggle' }]);
      const cls = [lk ? 'lock' : '', e.active ? '' : 'off', selIds.has(e.id) ? 'picked' : '', flash.has(e.id) ? 'flash' : ''].filter(Boolean).join(' ');
      return `<tr data-exam="${e.id}"${cls ? ` class="${cls}"` : ''}>
        <td class="ck">${lk ? `<span class="cbtn dis" title="This location can't send Rx exams">${cb('off')}</span>` : `<button class="cbtn" data-act="sel" data-id="${e.id}" aria-label="Select ${esc(e.title)}" aria-pressed="${selIds.has(e.id)}">${cb(selIds.has(e.id) ? 'on' : 'off')}</button>`}</td>
        <td>${e.id}</td><td>${esc(e.title)}</td><td>$${e.price}</td><td>${e.q}</td>
        <td class="last${isRecent(e) ? ' recent' : ''}">${lastLabel(e.last)}</td>
        <td><span class="st ${e.active ? 'on' : 'off'}">${e.active ? 'Active' : 'Deactivated'}</span></td>
        <td>${kebab(e.id, opts, lk)}</td></tr>`;
    }).join('');
    const sel = selected();
    const nOff = sel.filter((e) => e.active).length;
    const nOn = sel.filter((e) => !e.active).length;
    const outOfView = S.sel.filter((id) => !rows.some((r) => r.id === id)).length;
    const f = S.filter;
    const opt = (v, l, cur) => `<option value="${v}"${cur === v ? ' selected' : ''}>${l}</option>`;
    const hist = S.history.slice(0, 6).map((h) => {
      const verb = h.action === 'on' ? 'activated' : h.action === 'off' ? 'deactivated' : 'undid a change to';
      return `<li><time>${fmtWhen(h.at)}</time><div><span class="who">${esc(h.who)}</span> <span class="chg">${verb} ${plural(h.ids.length, 'exam', 'exams')}${h.how === 'bulk' ? ' <span class="badge soft">Bulk</span>' : ' <span class="badge">Row menu</span>'}: ${esc(titles(h.ids, 3))}</span></div></li>`;
    }).join('');
    return `<div class="pv-tabs" id="exam-tabs">${['q', 'c'].map((t) => `<button class="${S.tab === t ? 'on' : ''}" data-act="tab" data-tab="${t}">${esc(D.COPY.tabs[t])}</button>`).join('')}</div>
    <div class="page">
      <div class="list-h"><div class="lh-left"><h2>${esc(D.COPY.lists[S.tab])}</h2><div class="pdrop"><select id="clinic-select" data-bind="clinic" data-num data-rerender aria-label="Select Clinic">${D.CLINICS.map((c, i) => `<option value="${i}"${i === S.clinic ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select>${I('chevDown')}</div></div>
        <button class="btn btn-primary" data-act="noop">${PI('BsFileMedicalFill')} Add Exam</button></div>
      ${dnote('What changes on this tab', 'A <b>checkbox</b> on every row, <b>search and filters</b>, and a <b>bulk bar</b> that appears once exams are selected. The row menu, tabs and location dropdown are today\'s. The status column now reads Active or Deactivated, and the ID column reads Exam ID.')}
      <div class="tools" id="exam-tools">
        <label class="srch">${I('search')}<input class="inp" id="exam-search" data-bind="filter.q" placeholder="Search exams by ID or title" value="${esc(f.q)}" autocomplete="off"></label>
        <label class="flt">Status<select class="sel" id="f-status" data-bind="filter.status" data-rerender>${opt('all', 'All', f.status)}${opt('on', 'Active', f.status)}${opt('off', 'Deactivated', f.status)}</select></label>
        <label class="flt">Type<select class="sel" id="f-type" data-bind="filter.type" data-rerender>${opt('all', 'All types', f.type)}${opt('gfe', 'Good Faith Exam', f.type)}${opt('rx', 'Rx', f.type)}</select></label>
        <span class="count" id="exam-count">${rows.length === all.length ? plural(all.length, 'exam', 'exams') : `${rows.length} of ${plural(all.length, 'exam', 'exams')}`}${f.q || f.status !== 'all' || f.type !== 'all' ? ` <button class="btn-link" data-act="clear-filters">Clear filters</button>` : ''}</span>
      </div>
      ${S.sel.length ? `<div class="bulkbar" id="bulk-bar"><span class="bb-count"><b>${S.sel.length}</b> selected${outOfView ? ` <span class="muted">(${outOfView} not in this view)</span>` : ''}</span>
        <div class="bb-actions"><button class="btn btn-sm btn-outline" id="bulk-off" data-act="bulk" data-mode="off" ${nOff ? '' : 'disabled'}>Deactivate ${nOff}</button><button class="btn btn-sm btn-outline" id="bulk-on" data-act="bulk" data-mode="on" ${nOn ? '' : 'disabled'}>Activate ${nOn}</button><button class="btn-link" data-act="clear-sel" id="bulk-clear">Clear selection</button></div></div>` : ''}
      ${rows.length ? `<table class="tbl" id="exam-table"><thead><tr>
        <th class="ck">${pick.length ? `<button class="cbtn" data-act="sel-all" id="sel-all" aria-label="Select every exam in this view">${cb(headState)}</button>` : ''}</th>
        <th>Exam ID</th><th>Title</th><th>Price</th><th>Question Count</th><th>Last Sent <span class="chip-new">Proposal</span></th><th>Active Exam</th><th>Actions</th></tr></thead><tbody>${body}</tbody></table>`
        : `<div class="empty" id="exam-table">No exams match these filters</div>`}
      ${clinic().service === 'gfe' ? dnote('Greyed-out rows', `${esc(clinic().name)} is set up for Good Faith Exams only, so its Rx exams are greyed out and can't be selected. That matches today's disabled row menu.`) : ''}
      <div class="card" id="exam-history"><h3>Recent changes</h3><p class="small muted" style="margin:0">Who turned exams on or off, and when. It covers every location on the account.</p><ul class="history">${hist || '<li><span class="muted">No changes yet.</span></li>'}</ul></div>
      ${dnote('Proposal, beyond the idea', '<b>Last Sent</b> and <b>Recent changes</b> are additions. Last Sent tells an Admin what is safe to turn off; Recent changes answers "who turned this exam off?" See the Decisions panel.')}
    </div>`;
  }

  /* ------------------------------------------------------------------ invite page */
  const CTYPES = [
    { id: 'gfe', name: 'Good Faith Exam & Orders' },
    { id: 'rx', name: 'QualiphyRx Packages: Consultation + Medication Delivery Made Easy' },
    { id: 'uc', name: 'Urgent Care Visit: Consultation + Prescription Sent to Your Pharmacy' },
    { id: 'cp', name: 'Choose Your Pharmacy (Consultation and Prescription Only)' },
  ];
  function invitePage() {
    const iv = S.invite; const ci = iv.clinic; const c = clinic(ci);
    const rxLocked = c.service === 'gfe';
    const type = iv.type === 'rx' && rxLocked ? 'gfe' : iv.type;
    const pool = S.exams.filter((e) => (type === 'rx' ? e.rx : !e.rx) && !locked(e, ci));
    const avail = pool.filter((e) => e.active).sort((a, b) => (a.tpl === b.tpl ? byTitle(a, b) : a.tpl === 'c' ? -1 : 1));
    const hidden = pool.filter((e) => !e.active).length;
    const cards = CTYPES.map((t) => {
      const lk = t.id === 'rx' && rxLocked;
      const on = t.id === type;
      return `<button class="ctype${on ? ' on' : ''}${lk ? ' lk' : ''}" data-act="${t.id === 'gfe' || t.id === 'rx' ? (lk ? 'noop-lock' : 'ctype') : 'noop'}" data-type="${t.id}"><span class="radio"></span><span class="ct-name">${esc(t.name)}</span>${lk ? `<span class="ct-lock">${I('lock')}Needs the Rx agreement</span>` : ''}</button>`;
    }).join('');
    return `<div class="page inv">
      ${dnote('In this demo', 'Only the part of Invite Patient that this change touches: the <b>exam list</b>. It offers active exams only, so deactivated ones are simply gone. The patient details below it are unchanged and not shown.')}
      <div class="row2">
        <label class="fld strong"><span>Clinic ${PI('FaInfoCircle', 'info-dot')}</span><span class="pdrop wide"><select id="inv-clinic" data-bind="invite.clinic" data-num data-rerender>${D.CLINICS.map((x, i) => `<option value="${i}"${i === ci ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select>${I('chevDown')}</span></label>
        <label class="fld strong"><span>Patient State ${PI('FaInfoCircle', 'info-dot')}</span><span class="pdrop wide"><select disabled><option>${esc(c.state)}</option></select>${I('chevDown')}</span></label>
      </div>
      <div class="fld strong"><span>Consultation Type ${PI('FaInfoCircle', 'info-dot')}</span></div>
      <div class="ctypes">${cards}</div>
      <div class="fld strong"><span>Exams</span></div>
      <div class="msel" id="invite-exams"><div class="msel-head"><span>Select Exams</span>${I('chevDown')}</div>
        <div class="msel-search">${I('search')}<span>Search</span></div>
        <div class="msel-list">${avail.length ? avail.map((e) => `<div class="msel-item" data-exam="${e.id}"><span class="cb">${I('check')}</span><span>${esc(e.title)}</span>${e.tpl === 'c' ? '<span class="badge">Custom</span>' : ''}</div>`).join('') : '<div class="msel-empty">No options</div>'}</div></div>
      <div class="small muted" id="invite-count">${plural(avail.length, 'exam', 'exams')} to choose from.${hidden ? ` ${plural(hidden, 'deactivated exam is', 'deactivated exams are')} left out.` : ''}</div>
    </div>`;
  }

  /* ------------------------------------------------------------------ modals */
  function modalShell(title, tip, body, size) {
    return `<div class="modal-wrap"><div class="modal${size === 'sm' ? ' sm' : ''}" role="dialog" aria-label="${esc(title)}"><div class="modal-h"><h3>${esc(title)}${tip ? ` <span data-tip="${esc(tip)}" class="tip-down">${PI('FaInfoCircle', 'info-dot')}</span>` : ''}</h3><button class="modal-x" data-act="close-modal" aria-label="Close">${PI('IoClose')}</button></div><div class="modal-b">${body}</div></div></div>`;
  }
  function bulkModal() {
    const m = S.modal; const off = m.action === 'off'; const n = m.ids.length;
    const recent = m.ids.filter((id) => isRecent(exam(id)));
    const everyOff = off && S.exams.filter((e) => e.active && !m.ids.includes(e.id)).length === 0;
    const nLoc = D.CLINICS.length;
    const list = m.ids.map((id) => { const e = exam(id); return `<div class="xrow"><span class="xid">${e.id}</span><span class="xt">${esc(e.title)}</span>${off && isRecent(e) ? `<span class="chip chip-warn">Sent ${esc(lastLabel(e.last).toLowerCase())}</span>` : ''}</div>`; }).join('');
    const word = n === 1 ? 'Exam' : 'Exams';
    const impact = off
      ? `<li>They leave <b>Send Exam Invite</b> at all ${nLoc} locations on this account, and for your managers.</li><li>They leave the <b>exam list your integrations read</b> (website, Quidget, EMR). Integrations that already send them by exam ID keep working.</li><li>Patients who already received them can still finish.</li><li>You can activate them again at any time. Nothing is deleted.</li>`
      : `<li>They come back to <b>Send Exam Invite</b> at all ${nLoc} locations, and for your managers.</li><li>They come back to the exam list your integrations read.</li>`;
    const body = `<div class="xlist" id="bulk-list">${list}</div>
      ${off && recent.length ? `<div class="warnbox" id="recent-warn">${I('alert')}<div><b>${recent.length} of these ${recent.length === 1 ? 'was' : 'were'} sent in the last ${RECENT} days.</b> Patients may still be booking ${recent.length === 1 ? 'it' : 'them'}. <button class="btn-link" data-act="leave-recent" id="leave-recent">Leave ${recent.length === 1 ? 'it' : 'them'} out</button></div></div>` : ''}
      ${everyOff ? `<div class="errbox" id="all-warn">${I('alert')}<div><b>This turns off every exam on the account.</b> Send Exam Invite will have nothing to offer until you activate one.</div></div>` : ''}
      <div class="impact"><div class="ih">What this does</div><ul>${impact}</ul></div>
      <div class="modal-f"><button class="btn btn-outline" data-act="close-modal">Cancel</button><button class="btn btn-primary" id="confirm-bulk" data-act="apply-bulk">${off ? 'Deactivate' : 'Activate'} ${n} ${word}</button></div>`;
    return modalShell(`${off ? 'Deactivate' : 'Activate'} ${n} ${word}`, off ? D.COPY.deactivateTip : '', body);
  }

  /* ------------------------------------------------------------------ demo layer */
  function welcome() {
    return `<div class="modal-wrap"><div class="welcome" role="dialog" aria-label="Welcome">
      <div class="kick">Qualiphy · Clinic portal · Product demo</div>
      <h1>Bulk exam actions</h1>
      <p class="lede">Let a clinic Admin tick exams and turn them off, or back on, in one step. Built on today's Exams tab, with the impact spelled out before anything changes.</p>
      <div class="w-cards">
        <div class="w-card"><div class="t">Why</div>Exams are turned off one at a time today: row menu, Deactivate Exam, and the whole list reloads. Accounts with long exam lists asked for checkboxes and one button.</div>
        <div class="w-card"><div class="t">What you'll see</div><ul><li>Checkboxes, search and filters on the Exams tab</li><li>A bulk bar and one confirm dialog</li><li>Undo, a change history, and the effect on Send Exam Invite</li></ul></div>
        <div class="w-card"><div class="t">Where it stands</div>An idea, checked against the roadmap and the server code. Small to build. Seven decisions, each with a default.</div>
      </div>
      <div class="w-actions"><button class="btn btn-primary" data-act="start-wt" id="start-wt">${I('play')} Start the walkthrough (about 4 minutes)</button><button class="btn ghost" data-act="start-explore" id="start-explore">Explore on my own</button></div>
      <p class="fine">Fake data only. Not connected to any Qualiphy environment.</p>
    </div></div>`;
  }
  function jsonPreview() {
    const list = S.exams.filter((e) => e.active).sort(byTitle);
    const lines = list.slice(0, 5).map((e) => `    { "exam_id": ${e.id}, "title": "${esc(e.title)}" }`);
    return `<pre class="code" id="api-preview">GET /exam_list
{
  "exams": [
${lines.join(',\n')}${list.length > 5 ? `,\n    <span class="c">... ${list.length - 5} more active exams</span>` : ''}
  ]
}
<span class="c">${plural(S.exams.length - list.length, 'deactivated exam is', 'deactivated exams are')} left out.</span></pre>`;
  }
  function drawer() {
    const t = S.ctxTab;
    let body = '';
    if (t === 'plan') {
      body = `<h3>The problem</h3><ul>${C.problem.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <h3>The proposal</h3><ul>${C.proposal.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <h3>Requirements</h3><table class="rq"><thead><tr><th></th><th>Requirement</th><th>Passes when</th></tr></thead><tbody>${C.requirements.map((r) => `<tr><td class="rid">${esc(r.id)}</td><td>${esc(r.text)}</td><td>${esc(r.pass)}</td></tr>`).join('')}</tbody></table>
        <h3>Size</h3><p>${esc(C.size)}</p><p>${esc(C.walk.owner)}</p>
        <h3>Engineering notes</h3><ul>${C.engNotes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    } else if (t === 'fit') {
      const label = { fits: 'Fits', watch: 'Watch', prereq: 'Prerequisite' };
      body = `<p>Checked against the roadmap and the work in flight on Sep 24, 2026. Nothing clashes.</p>${C.fit.map((x) => `<div class="fit ${x.verdict}"><div class="fit-top"><span class="fit-a">${esc(x.area)}</span><span class="chip chip-${x.verdict}">${label[x.verdict]}</span></div><div class="fit-h">${esc(x.how)}</div><div class="fit-do">${esc(x.action)}</div></div>`).join('')}`;
    } else if (t === 'integrations') {
      body = `<ul>${C.integrations.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><h3>What the API exam list returns right now</h3><p class="small muted">Live from this demo's state. Deactivate or activate exams and reopen this tab.</p>${jsonPreview()}`;
    } else if (t === 'decisions') {
      body = `<p>The demo is built to every default. Each question names who answers it.</p>${C.decisions.map((d) => `<div class="dec"><div class="dec-top"><span class="dec-id">${esc(d.id)}</span><span class="dec-q">${esc(d.q)}</span><span class="chip chip-open">Open</span></div><div class="dec-who">${esc(d.who)}</div><div class="dec-a"><b>Default:</b> ${esc(d.def)} <span class="muted">Alternative: ${esc(d.alt)}</span></div><div class="dec-why">${esc(d.why)}</div></div>`).join('')}`;
    } else {
      body = `<h3>What this is</h3><p>A clickable plan for ${esc(C.title.toLowerCase())}: today's Exams tab plus the proposal, for review before any ticket is written.</p><h3>What's real and what's made up</h3><ul><li><b>From the product and the code:</b> ${esc(C.about.real)}</li><li><b>Illustrative:</b> ${esc(C.about.made)}</li><li><b>Not built:</b> ${esc(C.about.notBuilt)}</li></ul><h3>How to use it</h3><ul><li>The bottom bar switches between the Exams tab and Send Exam Invite, opens the walkthrough and this panel, and resets the demo.</li><li><b>Notes</b> hides the amber placement notes.</li><li>Changes are kept in this browser until you reset.</li></ul>`;
    }
    const tabs = [['plan', 'The plan'], ['fit', 'Fits the roadmap'], ['integrations', 'Integrations'], ['decisions', 'Decisions'], ['about', 'About the demo']];
    return `<div class="backdrop" data-act="drawer-bg"><div class="drawer" data-stop id="ctx-drawer"><div class="dr-head"><div class="dr-top"><div><div class="dr-kicker">${esc(C.kicker)}</div><h2>${esc(C.title)}</h2><div class="sub">${esc(C.status)}</div></div><button class="dr-x" data-act="drawer-close" aria-label="Close">${I('x')}</button></div><div class="dr-tabs">${tabs.map(([id, l]) => `<button class="${t === id ? 'on' : ''}" data-act="ctx-tab" data-tab="${id}">${l}</button>`).join('')}</div></div><div class="dr-body">${body}</div></div></div>`;
  }
  function bar() {
    return `<div class="bar-inner"><span class="bar-tag">Demo</span>
      <button class="bar-btn ${S.page === 'exams' ? 'on' : ''}" data-act="page" data-page="exams">${I('list')}Exams</button>
      <button class="bar-btn ${S.page === 'invite' ? 'on' : ''}" data-act="page" data-page="invite">${I('send')}Send Exam Invite</button>
      <span class="bar-sep"></span>
      <button class="bar-btn ${S.wt.on ? 'on' : ''}" data-act="wt-toggle">${I('play')}Walkthrough</button>
      <button class="bar-btn" data-act="drawer" data-tab="plan" id="bar-plan">${I('book')}Plan &amp; decisions</button>
      <button class="bar-btn" data-act="notes">${I(S.notes ? 'eye' : 'eyeOff')}Notes</button>
      <button class="bar-btn" data-act="reset">${I('refresh')}Reset</button></div>`;
  }

  /* ------------------------------------------------------------------ walkthrough */
  const toExams = (over) => { S.page = 'exams'; S.tab = 'q'; S.clinic = 0; S.filter = { q: '', status: 'all', type: 'all' }; S.menu = null; S.modal = null; Object.assign(S, over || {}); };
  const STEPS = [
    { id: 'today', title: 'Today: one exam at a time', where: 'Clinic portal › Exams › row menu', target: 'tr[data-exam="4504"] .kebab-wrap',
      body: () => `<p>Each exam has a row menu. <b>Deactivate Exam</b> turns off one exam, shows a toast, then reloads the whole list.</p><ul><li>An account with a long exam list repeats that dozens of times.</li><li>${esc(C.walk.asked)}</li></ul><p class="wt-hint">The row menu is today's, tooltip included, and it stays.</p>`,
      run() { toExams({ sel: [] }); S.menu = { id: 4504 }; } },
    { id: 'select', title: 'Pick exams with checkboxes', where: 'Exams › new checkbox column', target: '#exam-table', stay: true,
      body: () => '<p>A checkbox on every row, and one in the header that selects every row in the current view.</p><p>Greyed-out rows, exams a location can\'t send, can\'t be picked. That matches today\'s disabled row menu.</p>',
      doLabel: 'Tick two exams nobody sends',
      done: () => S.flags.picked,
      doIt() { toExams(); S.sel = [4510, 4518]; S.flags.picked = true; },
      run() { toExams({ sel: [] }); } },
    { id: 'filter', title: 'Narrow the list, then select it all', where: 'Exams › search and filters', target: '#exam-tools', stay: true,
      body: () => '<p>Search by exam ID or title, and filter by status and type. The header checkbox then selects just what\'s shown.</p><p>Here: every Rx exam, nine of them.</p>',
      doLabel: 'Show Rx exams and select all nine',
      done: () => S.flags.filtered,
      doIt() { toExams({ filter: { q: '', status: 'all', type: 'rx' } }); S.sel = RX9.slice(); S.flags.filtered = true; },
      run() { toExams({ sel: [] }); } },
    { id: 'confirm', title: 'Confirm once, with the impact spelled out', where: 'Exams › bulk bar › Deactivate', target: '.modal', stay: true,
      body: () => '<p>The bulk bar shows the count, with <b>Deactivate</b> and <b>Activate</b> for the selected exams each applies to.</p><p>Deactivate asks once and says what it touches: every location, managers, the exam list integrations read, and patients already mid-exam.</p><p><b>Three of these were sent in the last 30 days</b>, so the dialog offers to leave them out.</p>',
      doLabel: 'Leave out the recently sent exams',
      done: () => S.flags.leftOut,
      doIt() { if (!(S.modal && S.modal.kind === 'bulk')) { toExams({ filter: { q: '', status: 'all', type: 'rx' } }); S.sel = RX9.slice(); openBulk('off', RX9); } leaveOutRecent(); S.flags.leftOut = true; },
      run() { toExams({ filter: { q: '', status: 'all', type: 'rx' } }); S.sel = RX9.slice(); openBulk('off', RX9); } },
    { id: 'apply', title: 'One step, and you can undo it', where: 'Exams › confirm › toast', target: () => (S.modal ? '.modal' : '#exam-table'), stay: true,
      body: () => `<p>One request turns off all six. The rows update in place, with no full reload, and the selection clears.</p><p>The toast offers <b>Undo</b> for ${UNDO_S} seconds.</p>`,
      doLabel: 'Deactivate the six exams',
      done: () => S.flags.applied,
      doIt() { if (!(S.modal && S.modal.kind === 'bulk')) { toExams({ filter: { q: '', status: 'all', type: 'rx' } }); S.sel = SIX.slice(); openBulk('off', SIX); } applyBulk(); S.flags.applied = true; },
      run() { toExams({ filter: { q: '', status: 'all', type: 'rx' } }); S.sel = SIX.slice(); openBulk('off', SIX); } },
    { id: 'invite', title: 'Send Exam Invite only offers active exams', where: 'Send Exam Invite › Exams', target: '#invite-exams',
      body: () => '<p>The exam list on Invite Patient comes from the same place, so the six are gone from it straight away.</p><p>Only the exam picker is shown here. The rest of the form doesn\'t change.</p>',
      run() { S.page = 'invite'; S.invite = { clinic: 0, type: 'rx' }; S.menu = null; S.modal = null; } },
    { id: 'locations', title: 'Every location, not just this one', where: 'Exams › location dropdown', target: '.lh-left .pdrop',
      body: () => '<p>A deactivation belongs to the account. Switch to the Pasadena location and the same exams are off there too.</p><p>Pasadena is set up for Good Faith Exams only, so its Rx rows are greyed out as well, same as today.</p><p class="wt-hint">Per-location menus would need a schema change. That\'s question Q1.</p>',
      run() { toExams({ clinic: 2, sel: [] }); } },
    { id: 'reactivate', title: 'Bring a few back', where: 'Exams › Status: Deactivated › Activate', target: () => (S.modal ? '.modal' : '#exam-table'), stay: true,
      body: () => '<p>Filter to <b>Deactivated</b>, tick the ones you want, and choose <b>Activate</b>. Activating needs no warning, only a short confirm.</p>',
      doLabel: 'Activate Hair Loss and Tretinoin',
      done: () => S.flags.reactivated,
      doIt() { if (!(S.modal && S.modal.kind === 'bulk' && S.modal.action === 'on')) { toExams({ filter: { q: '', status: 'off', type: 'all' } }); S.sel = BACK.slice(); openBulk('on', BACK); } applyBulk(); S.flags.reactivated = true; },
      run() { toExams({ filter: { q: '', status: 'off', type: 'all' } }); S.sel = BACK.slice(); openBulk('on', BACK); } },
    { id: 'history', title: 'Every change is recorded', where: 'Exams › Recent changes', target: '#exam-history',
      body: () => '<p>Who changed what, and when, for bulk and single changes. Support can answer "who turned this exam off?" without digging.</p><p class="wt-hint">Today the system keeps only the account and a date, and turning an exam back on erases even that.</p>',
      run() { toExams({ sel: [] }); } },
    { id: 'integrations', title: 'What integrations see', where: 'Plan & decisions › Integrations', target: null,
      body: () => '<ul><li>Deactivated exams leave the exam list the API returns, which website plugins, the Quidget and EMRs read.</li><li>Invites that name them by ID still go through, so nothing live breaks.</li><li>Integrations that pull only what changed won\'t notice until the change feed carries it.</li></ul>',
      run() { S.modal = null; S.drawer = 'ctx'; S.ctxTab = 'integrations'; } },
    { id: 'fit', title: 'Where it fits', where: 'Plan & decisions › Fits the roadmap', target: null,
      body: () => `<p>Checked against the roadmap and the work in flight. Nothing clashes.</p><ul><li><b>Roles:</b> the roles plan${esc(ref('roles'))} already has a "Bulk deactivate exams" permission.</li><li><b>Integrations:</b> the exam list and the change feed, as above.</li><li><b>Prerequisite:</b> confirm hidden exams no longer reappear after an exam is edited${esc(ref('reappear'))}.</li></ul>`,
      run() { S.modal = null; S.drawer = 'ctx'; S.ctxTab = 'fit'; } },
    { id: 'decisions', title: 'What needs a decision', where: 'Plan & decisions › Decisions', target: null,
      body: () => `<p>Seven questions, each with a default the demo is built to.</p><ul>${C.decisions.map((d) => `<li><b>${esc(d.id)}:</b> ${esc(d.q)} <span class="wt-hint">Default: ${esc(d.def)}</span></li>`).join('')}</ul>`,
      run() { S.modal = null; S.drawer = 'ctx'; S.ctxTab = 'decisions'; } },
    { id: 'end', title: 'That\'s the flow', where: 'Explore freely', target: null,
      body: () => `<p>Try the rest yourself: search, switch tabs or locations, select everything, undo a change, or use a row menu.</p><p>${esc(C.walk.owner)}</p><p><b>Reset</b> in the bottom bar puts everything back.</p>`,
      run() { S.drawer = null; toExams({ sel: [] }); } },
  ];
  function ensure(i) { quiet = true; try { for (let k = 0; k < i; k++) { const st = STEPS[k]; if (st.doIt && !(st.done && st.done())) st.doIt(); } } finally { quiet = false; } }
  function goStep(i) {
    const n = Math.max(0, Math.min(STEPS.length - 1, i));
    const notes = S ? S.notes : true;
    S = fresh(); S.notes = notes; S.welcomed = true; S.wt = { on: true, step: n };
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    ensure(n); S.modal = null; S.flash = []; S.undo = null; S.menu = null;
    STEPS[n].run(); lastScrolled = -1;
  }
  function wtPanel() {
    const i = S.wt.step; const st = STEPS[i]; const n = STEPS.length; const done = st.done ? !!st.done() : false;
    const doBtn = st.doIt ? `<button class="wt-do ${done ? 'done' : ''}" data-act="wt-do" ${done ? 'disabled' : ''}>${done ? I('check') + ' Done' : I('play') + ' ' + esc(st.doLabel)}</button>${done ? '' : '<p class="wt-or">Or do it yourself on the page. Next also does it for you.</p>'}` : '';
    return `<div class="wt-top"><span class="wt-kicker">Walkthrough</span><span class="wt-count">${String(i + 1).padStart(2, '0')} / ${n}</span><button class="wt-x" data-act="wt-close" aria-label="Close the walkthrough">${I('x')}</button></div>
      <div class="wt-progress"><i style="width:${((i + 1) / n) * 100}%"></i></div>
      <div class="wt-dots">${STEPS.map((s, k) => `<button class="${k === i ? 'cur' : k < i ? 'done' : ''}" data-act="wt-goto" data-i="${k}" title="${esc(s.title)}" aria-label="Step ${k + 1}"></button>`).join('')}</div>
      <div class="wt-scroll"><div class="wt-where">${I('pin')}<span>${esc(st.where)}</span></div><h2 class="wt-title">${esc(st.title)}</h2><div class="wt-body">${st.body()}</div>${doBtn}</div>
      <div class="wt-nav"><button data-act="wt-back" ${i === 0 ? 'disabled' : ''}>${I('arrowLeft')} Back</button><button class="primary" data-act="wt-next" id="wt-next" ${i === n - 1 ? 'disabled' : ''}>Next ${I('arrowRight')}</button></div>
      <div class="wt-foot"><button data-act="wt-restart">Restart from the beginning</button><button data-act="drawer" data-tab="decisions">Decisions</button><button data-act="wt-close">Explore freely</button></div>`;
  }

  /* ------------------------------------------------------------------ actions */
  const ACT = {
    noop() { toast('Not part of this demo.', 'info'); S.menu = null; },
    'noop-lock'() { toast('This location has not signed the Rx agreement, so Rx exams are locked, as today.', 'info'); },
    page(d) { S.page = d.page; S.menu = null; S.modal = null; S.drawer = null; S.flash = []; if (d.page === 'invite') S.invite.clinic = S.clinic; window.scrollTo(0, 0); },
    tab(d) { if (S.tab !== d.tab) { S.tab = d.tab; S.sel = []; S.menu = null; } },
    menu(d) { const id = Number(d.id); S.menu = S.menu && S.menu.id === id ? null : { id }; },
    'row-toggle'(d) { rowToggle(Number(d.id)); },
    sel(d) { const id = Number(d.id); const i = S.sel.indexOf(id); if (i >= 0) S.sel.splice(i, 1); else S.sel.push(id); S.menu = null; },
    'sel-all'() {
      const pick = selectableView().map((e) => e.id);
      const allOn = pick.length && pick.every((id) => S.sel.includes(id));
      S.sel = allOn ? S.sel.filter((id) => !pick.includes(id)) : Array.from(new Set(S.sel.concat(pick)));
      S.menu = null;
    },
    'clear-sel'() { S.sel = []; },
    'clear-filters'() { S.filter = { q: '', status: 'all', type: 'all' }; },
    bulk(d) { openBulk(d.mode); },
    'leave-recent'() { leaveOutRecent(); },
    'apply-bulk'() { applyBulk(); },
    undo() { undo(); },
    ctype(d) { S.invite.type = d.type; },
    'close-modal'() { S.modal = null; },
    drawer(d) { S.drawer = 'ctx'; S.ctxTab = d.tab || 'plan'; S.menu = null; },
    'drawer-close'() { S.drawer = null; },
    'drawer-bg'() { S.drawer = null; },
    'ctx-tab'(d) { S.ctxTab = d.tab; },
    notes() { S.notes = !S.notes; },
    reset() { const on = S.wt.on; const notes = S.notes; S = fresh(); S.notes = notes; S.welcomed = true; if (on) goStep(0); toast('Demo reset.', 'info'); },
    'wt-toggle'() { if (S.wt.on) S.wt.on = false; else goStep(S.wt.step || 0); },
    'wt-next'() { const st = STEPS[S.wt.step]; if (st.stay && st.doIt && !(st.done && st.done())) { st.doIt(); lastScrolled = -1; return; } if (S.wt.step < STEPS.length - 1) goStep(S.wt.step + 1); },
    'wt-back'() { if (S.wt.step > 0) goStep(S.wt.step - 1); },
    'wt-goto'(d) { goStep(Number(d.i)); },
    'wt-do'() { const st = STEPS[S.wt.step]; if (st.doIt && !(st.done && st.done())) { st.doIt(); lastScrolled = -1; } },
    'wt-close'() { S.wt.on = false; },
    'wt-restart'() { goStep(0); },
    'start-wt'() { goStep(0); },
    'start-explore'() { const notes = S.notes; S = fresh(); S.notes = notes; S.welcomed = true; },
  };

  /* ------------------------------------------------------------------ render + events */
  const $app = document.getElementById('app'); const $ov = document.getElementById('overlay'); const $wt = document.getElementById('wt'); const $bar = document.getElementById('bar');
  function topbar() {
    if (S.page === 'invite') return `<header class="top"><h1><button class="back" data-act="page" data-page="exams" aria-label="Back to Exams">${PI('IoIosArrowRoundBack')}</button>Invite Patient</h1></header>`;
    return `<header class="top"><h1>${PI('FaNotesMedical')}Exams</h1><button class="btn btn-primary" data-act="page" data-page="invite" id="send-invite">${PI('RiMailSendFill')} Send Exam Invite</button></header>`;
  }
  function overlays() {
    if (!S.welcomed) return welcome();
    let h = '';
    if (S.drawer) h += drawer();
    if (S.modal && S.modal.kind === 'bulk') h += bulkModal();
    return h;
  }
  function afterRender() {
    if (!S.wt.on || !S.welcomed) return;
    const st = STEPS[S.wt.step]; if (!st || !st.target) return;
    const sel = typeof st.target === 'function' ? st.target() : st.target;
    const el = sel ? document.querySelector(sel) : null; if (!el) return;
    el.classList.add('wt-hl');
    if (lastScrolled !== S.wt.step) { lastScrolled = S.wt.step; requestAnimationFrame(() => el.scrollIntoView({ block: 'center', behavior: document.body.classList.contains('static') ? 'auto' : 'smooth' })); }
  }
  function render() {
    const wtOn = !!(S.wt.on && S.welcomed);
    document.body.classList.toggle('wt-open', wtOn);
    document.body.classList.toggle('notes-off', !S.notes);
    $app.innerHTML = `<div class="shell">${sidebar()}<main class="main">${topbar()}${S.page === 'invite' ? invitePage() : examsPage()}</main></div>`;
    $ov.innerHTML = overlays();
    $wt.innerHTML = wtOn ? wtPanel() : '';
    $bar.innerHTML = S.welcomed ? bar() : '';
    afterRender();
    S.flash = [];
    saveSoon();
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) { if (S.menu && !e.target.closest('[data-stop-menu]')) { S.menu = null; render(); } return; }
    if (el.dataset.act === 'drawer-bg' && e.target.closest('[data-stop]')) return;
    const fn = ACT[el.dataset.act]; if (!fn) return;
    e.preventDefault();
    if (fn(el.dataset, el, e) !== false) render();
  });
  document.addEventListener('input', (e) => {
    const el = e.target; const path = el.dataset && el.dataset.bind; if (!path || el.tagName === 'SELECT') return;
    setPath(S, path, el.value);
    if (el.id === 'exam-search') {
      const pos = el.selectionStart;
      render();
      const again = document.getElementById('exam-search');
      if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (err) { /* not a text input */ } }
    }
  });
  document.addEventListener('change', (e) => {
    const el = e.target; const path = el.dataset && el.dataset.bind; if (!path) return;
    setPath(S, path, el.dataset.num !== undefined ? Number(el.value) : el.value);
    if (path === 'clinic') { S.sel = []; S.menu = null; }
    if (el.dataset.rerender !== undefined) render(); else saveSoon();
  });
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (e.key === 'Escape') { if (S.menu) S.menu = null; else if (S.modal && S.welcomed) S.modal = null; else if (S.drawer) S.drawer = null; else return; render(); return; }
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (!S.wt.on || !S.welcomed) return;
    if (e.key === 'ArrowRight') { ACT['wt-next'](); render(); } else if (e.key === 'ArrowLeft') { ACT['wt-back'](); render(); }
  });
  window.addEventListener('beforeunload', save);

  /* ------------------------------------------------------------------ init */
  S = load() || fresh();
  if (params.has('step')) { goStep(Number(params.get('step')) || 0); }
  render();
  window.__demo = { get state() { return JSON.parse(JSON.stringify(S)); }, steps: STEPS.map((s) => s.id), RX9, SIX };
})();
