/* Room Home is presentation state only. Entering/leaving never mutates saved data,
   timer state, screen navigation, or unfinished editor drafts. */
(() => {
  const home = document.getElementById('room-home');
  const dashboard = document.getElementById('dashboard-layer');
  const entries = [...document.querySelectorAll('[data-enter-console]')];
  let selectedConsole = 'execution';
  const back = document.getElementById('return-room-home');
  const popover = document.getElementById('room-popover');
  const clock = document.getElementById('room-clock');
  let view = 'home', busy = false, source = null, popoverType = null;
  const timeText = () => new Date().toLocaleTimeString('en-GB', {
    timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit'
  });
  const updateTime = () => {
    clock.textContent = timeText(); clock.dateTime = new Date().toISOString();
    if (popoverType === 'environment') {
      const value = document.getElementById('environment-time');
      if (value) value.textContent = timeText();
    }
  };
  const closePopover = (restoreFocus = true) => {
    popover.hidden = true; popoverType = null;
    source?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) source?.focus({ preventScroll: true });
    source = null;
  };
  const showPopover = (type, button) => {
    if (busy) return;
    if (popoverType === type) { closePopover(); return; }
    closePopover(false); source = button; popoverType = type;
    const e = LCR.escape;
    const quest = LCR.find('quest', LCR.state.execution.activeMainQuestId);
    const values = type === 'operator' ? [
      ['当前主线', quest?.title || '尚未设置'],
      ['当前任务', LCR.current()?.title || '暂无当前任务'],
      ['情绪天气', LCR.state.status.moodWeather],
      ['休息模式', LCR.state.status.restMode ? '已开启' : '未开启']
    ] : [['当前时间', timeText()], ['视觉模式', '城市夜晚'], ['城市 / 天气', '城市夜景 · 天气信息暂未接入']];
    document.getElementById('room-popover-title').textContent = type === 'operator' ? '当前状态' : '窗外环境';
    document.getElementById('room-popover-content').innerHTML = values.map(([key, value], i) =>
      `<div><dt>${key}</dt><dd${type === 'environment' && i === 0 ? ' id="environment-time"' : ''}>${e(value)}</dd></div>`).join('');
    button.setAttribute('aria-expanded', 'true'); popover.dataset.type = type;
    popover.hidden = false; document.getElementById('close-room-popover').focus({ preventScroll: true });
  };
  const switchView = (next, consoleName = selectedConsole) => {
    if (busy || next === view) return;
    busy = true; closePopover(false);
    // Both layers are untabbable during the transition; only the final layer is revealed.
    home.inert = true; dashboard.inert = true;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduceMotion ? 30 : 850;
    if (next === 'dashboard') {
      selectedConsole = consoleName; LCR.focusScreen(consoleName);
      entries.forEach(button => button.classList.toggle('picked-monitor', button.dataset.enterConsole === consoleName));
      document.body.classList.add('entering-room');
      setTimeout(() => {
        dashboard.hidden = false;
        requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('console-visible')));
      }, reduceMotion ? 0 : 400);
    } else {
      home.hidden = false; document.body.classList.add('leaving-room', 'room-return-start');
      requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('room-return-start')));
    }
    setTimeout(() => {
      view = next; document.body.dataset.appView = next;
      home.hidden = next !== 'home'; dashboard.hidden = next !== 'dashboard';
      home.inert = next !== 'home'; dashboard.inert = next !== 'dashboard';
      document.body.classList.remove('entering-room', 'leaving-room', 'console-visible', 'room-return-start');
      busy = false; (next === 'home' ? entries.find(button => button.dataset.enterConsole === selectedConsole) : back).focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, duration);
  };
  entries.forEach(button => button.addEventListener('click', () => switchView('dashboard', button.dataset.enterConsole)));
  LCR.returnRoom = () => switchView('home');
  document.getElementById('brand-return-room').addEventListener('click', event => { event.preventDefault(); switchView('home'); });
  back.addEventListener('click', () => switchView('home'));
  document.querySelectorAll('[data-room-popover]').forEach(button =>
    button.addEventListener('click', () => showPopover(button.dataset.roomPopover, button)));
  document.getElementById('close-room-popover').addEventListener('click', () => closePopover());
  document.addEventListener('click', event => {
    if (!popover.hidden && !popover.contains(event.target) && !event.target.closest('[data-room-popover]')) closePopover(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && view === 'home' && !popover.hidden) { event.preventDefault(); closePopover(); }
  });
  const updatePreviewTimer = () => {
    const element = document.getElementById('room-preview-timer');
    if (!element) return;
    const seconds = LCR.remaining();
    element.textContent = String(Math.floor(seconds / 60)).padStart(2,'0') + ':' + String(seconds % 60).padStart(2,'0');
    element.classList.toggle('is-running', LCR.state.execution.timer.running);
  };
  const renderMonitorPreviews = () => {
    const s = LCR.state, e = LCR.escape;
    const quest = LCR.find('quest', s.execution.activeMainQuestId), task = LCR.current();
    const now = timeText();
    const next = [...s.planning.schedule].sort((a,b) => a.start.localeCompare(b.start)).find(event => event.start >= now);
    const heading = panel => `<span class="monitor-preview-heading">${LCR.icon(LCR.consoleMeta[panel].icon)}<strong>${LCR.consoleMeta[panel].title}</strong><small>0${entries.findIndex(b=>b.dataset.enterConsole===panel)+1}</small></span>`;
    document.getElementById('preview-planning').innerHTML = heading('planning') +
      `<span class="mini-counts"><span>今日要事 <b>${s.planning.keyTasks.filter(item=>!item.completed).length}</b></span><span>Inbox <b>${s.planning.inbox.length}</b></span></span><span class="mini-caption">下一日程</span><span class="mini-schedule">${next ? `<time>${e(next.start)}</time> ${e(next.title)}` : '今日暂无后续日程'}</span>`;
    document.getElementById('preview-execution').innerHTML = heading('execution') +
      `<span class="mini-caption">当前任务</span><span class="mini-current">${e(task?.title || '暂无当前任务')}</span><strong id="room-preview-timer" class="mini-timer">25:00</strong><span class="mini-quest"><span>${e(quest?.title || '尚未设置主线')}</span><b>${quest?.progress || 0}%</b></span><span class="mini-progress"><i style="width:${quest?.progress || 0}%"></i></span>`;
    document.getElementById('preview-status').innerHTML = heading('status') +
      `<span class="mini-mood">${LCR.icon('mood')}<strong>${e(s.status.moodWeather)}</strong></span><span class="mini-energy">精力 <b>${s.status.stats.energy}%</b></span><span class="mini-progress"><i style="width:${s.status.stats.energy}%"></i></span><span class="mini-side">支线任务 <b>${s.status.sideQuests.filter(item=>item.completed).length} / ${s.status.sideQuests.length}</b></span>`;
    updatePreviewTimer();
  };
  // Reuse the existing mutation and timer hooks; previews never keep a copy of task data.
  const render = LCR.render, drawTimer = LCR.drawTimer;
  LCR.render = () => { render(); renderMonitorPreviews(); };
  LCR.drawTimer = () => { drawTimer(); updatePreviewTimer(); };
  renderMonitorPreviews(); updateTime(); setInterval(() => { updateTime(); }, 1000);
})();
