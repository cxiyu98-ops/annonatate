/* Room Home is presentation state only. Entering/leaving never mutates saved data,
   timer state, screen navigation, or unfinished editor drafts. */
(() => {
  const home = document.getElementById('room-home');
  const dashboard = document.getElementById('dashboard-layer');
  const enter = document.getElementById('enter-control-room');
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
  const switchView = (next) => {
    if (busy || next === view) return;
    busy = true; closePopover(false);
    // Both layers are untabbable during the transition; only the final layer is revealed.
    home.inert = true; dashboard.inert = true;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduceMotion ? 30 : 1000;
    if (next === 'dashboard') {
      document.body.classList.add('entering-room');
      setTimeout(() => {
        dashboard.hidden = false;
        requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('console-visible')));
      }, reduceMotion ? 0 : 520);
    } else {
      home.hidden = false; document.body.classList.add('leaving-room', 'room-return-start');
      requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('room-return-start')));
    }
    setTimeout(() => {
      view = next; document.body.dataset.appView = next;
      home.hidden = next !== 'home'; dashboard.hidden = next !== 'dashboard';
      home.inert = next !== 'home'; dashboard.inert = next !== 'dashboard';
      document.body.classList.remove('entering-room', 'leaving-room', 'console-visible', 'room-return-start');
      busy = false; (next === 'home' ? enter : back).focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, duration);
  };
  enter.addEventListener('click', () => switchView('dashboard'));
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
  updateTime(); setInterval(updateTime, 1000);
})();
