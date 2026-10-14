/* Presentation state stays separate from persisted user data.
   Existing module nodes are moved, not copied: IDs and application actions remain intact. */
LCR.modules={
 task:{panel:'planning',title:'今日要事',icon:'▤',node:document.getElementById('tasks').closest('section')},
 inbox:{panel:'planning',title:'Inbox · 收集箱',icon:'▣',node:document.getElementById('inbox').closest('section')},
 schedule:{panel:'planning',title:'今日日程',icon:'▦',node:document.getElementById('schedule').closest('section')},
 quest:{panel:'execution',title:'当前主线',icon:'◇',node:document.querySelector('.quest-card')},
 current:{panel:'execution',title:'当前任务',icon:'◎',node:document.querySelector('.current-card')},
 timer:{panel:'execution',title:'专注计时',icon:'◷',node:document.querySelector('.timer-card')},
 next:{panel:'execution',title:'下一步',icon:'↳',node:document.querySelector('.next-card')},
 mood:{panel:'status',title:'情绪天气',icon:'☁',node:document.getElementById('weather')},
 stats:{panel:'status',title:'今日状态',icon:'▥',node:document.getElementById('stats').closest('section')},
 side:{panel:'status',title:'支线任务',icon:'♧',node:document.getElementById('side-quests').closest('section')},
 rest:{panel:'status',title:'休息模式',icon:'☾',node:document.querySelector('.rest-card')}
};
LCR.views={planning:null,execution:null,status:null};
LCR.screenDOM={};
for(const panel of Object.keys(LCR.views)){
 const screen=document.querySelector('#'+panel+' .screen');
 const store=document.createElement('div');store.className='module-store';store.hidden=true;
 for(const m of Object.values(LCR.modules))if(m.panel===panel)store.append(m.node);
 screen.append(store);
 const overview=document.createElement('div');overview.className='screen-overview';screen.append(overview);
 const detail=document.createElement('div');detail.className='screen-detail';detail.hidden=true;
 detail.innerHTML=`<div class="screen-breadcrumb"><button data-screen-back="${panel}">← 返回总览</button><span></span></div><div class="module-content"></div><div class="detail-hint">点击条目查看与编辑</div>`;screen.append(detail);
 const editorHost=document.createElement('div');editorHost.className='screen-editor';editorHost.hidden=true;screen.append(editorHost);
 LCR.screenDOM[panel]={screen,store,overview,detail,editorHost};
}
// Each monitor owns an editor instance. Only the active form uses shared IDs;
// parked forms keep their drafts and appearance when another monitor is edited.
LCR.editorTemplate=document.getElementById('editor').outerHTML;
LCR.editorByPanel={};
LCR.selectEditor=(panel)=>{
 for(const [owner,record] of Object.entries(LCR.editorByPanel)){
  for(const element of [record.node,...record.node.querySelectorAll('[id]')]){
   const base=element.dataset.baseId||(element.dataset.baseId=element.id);
   element.id=owner===panel?base:owner+'-'+base;
  }
 }
 LCR.editorPanel=panel;
 if(LCR.editorByPanel[panel]?.editing)LCR.editing=LCR.editorByPanel[panel].editing;
};
LCR.prepareEditor=(type,asCurrent)=>{
 const key=asCurrent?'current':type==='quests'?'quest':type,panel=LCR.modules[key].panel;
 if(!LCR.editorByPanel[panel]){
  let node;
  if(!Object.keys(LCR.editorByPanel).length)node=document.getElementById('editor');
  else{const template=document.createElement('template');template.innerHTML=LCR.editorTemplate;node=template.content.firstElementChild;}
  LCR.screenDOM[panel].editorHost.append(node);LCR.editorByPanel[panel]={node};
 }
 LCR.selectEditor(panel);
};
LCR.animateView=(element)=>{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)element.animate([{opacity:.35,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'});};
LCR.showModule=(key,focus=true)=>{
 const m=LCR.modules[key],dom=LCR.screenDOM[m.panel];
 if(!dom.editorHost.hidden){LCR.selectEditor(m.panel);LCR.closeInline(false);}
 const prev=LCR.views[m.panel];if(prev)dom.store.append(LCR.modules[prev].node);
 LCR.views[m.panel]=key;dom.detail.querySelector('.module-content').append(m.node);dom.overview.hidden=true;dom.detail.hidden=false;dom.editorHost.hidden=true;
 dom.detail.querySelector('.screen-breadcrumb span').textContent=m.title;
 dom.detail.querySelector('.detail-hint').textContent=({quest:'点击主线卡片编辑，或切换已保存的主线',current:'点击任务编辑，或直接完成与暂停',timer:'计时会在刷新后恢复',mood:'点击天气卡片调整此刻的感受',stats:'选择「编辑状态」调整数值',rest:'选择一种休息方式，再进入休息模式'})[key]||'点击条目查看与编辑';
 dom.screen.scrollTop=0;LCR.animateView(dom.detail);if(focus)dom.detail.querySelector('[data-screen-back]').focus({preventScroll:true});
};
LCR.overview=(panel,focus=true)=>{
 const dom=LCR.screenDOM[panel],key=LCR.views[panel];
 if(!dom.editorHost.hidden){LCR.selectEditor(panel);LCR.closeInline(false);}
 if(key)dom.store.append(LCR.modules[key].node);
 LCR.views[panel]=null;dom.detail.hidden=true;dom.editorHost.hidden=true;dom.overview.hidden=false;dom.screen.scrollTop=0;
 LCR.animateView(dom.overview);if(focus&&key)dom.overview.querySelector(`[data-module="${key}"]`)?.focus({preventScroll:true});
};
LCR.mountEditor=(type,asCurrent)=>{
 const key=asCurrent?'current':type==='quests'?'quest':type;
 const panel=LCR.modules[key].panel,editing=LCR.editing;
 if(LCR.views[panel]!==key)LCR.showModule(key,false);
 LCR.selectEditor(panel);LCR.editing=editing;LCR.editorByPanel[panel].editing=editing;
 const dom=LCR.screenDOM[panel],editor=LCR.editorByPanel[panel].node;
 editor.hidden=false;dom.overview.hidden=true;dom.detail.hidden=true;dom.editorHost.hidden=false;
 const form=document.getElementById('editor-form');
 form.querySelector('header .eyebrow').textContent='← '+LCR.modules[key].title+' / 编辑';
 const back=document.getElementById('close-editor');back.textContent='←';back.dataset.closeInline=panel;
 dom.screen.scrollTop=0;LCR.animateView(dom.editorHost);form.querySelector('input,select,textarea,button')?.focus({preventScroll:true});
};
LCR.closeInline=(focus=true)=>{
 if(!LCR.editorPanel)return;
 const panel=LCR.editorPanel,dom=LCR.screenDOM[panel],editor=LCR.editorByPanel[panel]?.node;
 if(!editor)return;
 editor.hidden=true;dom.editorHost.hidden=true;dom.detail.hidden=false;LCR.editorPanel=null;
 if(focus){LCR.animateView(dom.detail);dom.detail.querySelector('button')?.focus({preventScroll:true});}
};
LCR.focusScreen=(name)=>{
 document.body.classList.toggle('focus-view',name!=='home');
 document.querySelectorAll('.monitor').forEach(p=>p.classList.toggle('focused',p.id===name));
 document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('selected',b.dataset.nav===name));
 if(name==='home'){for(const p of Object.keys(LCR.views)){if(!LCR.screenDOM[p].editorHost.hidden){LCR.selectEditor(p);LCR.closeInline(false);}LCR.overview(p,false);}}
 else if(innerWidth<981)document.getElementById(name).scrollIntoView({behavior:'smooth',block:'start'});
};
LCR.renderOverviews=()=>{
 const s=LCR.state,e=LCR.escape;
 const row=(x,extra='')=>`<div class="preview-row ${x.completed?'preview-done':''}"><span class="preview-box">${x.completed?'✓':''}</span><span>${e(x.title)}</span>${extra}</div>`;
 const card=(key,meta,body,cls='')=>`<button class="overview-module ${cls}" data-module="${key}" aria-label="打开${LCR.modules[key].title}"><span class="module-heading"><span><i>${LCR.modules[key].icon}</i>${LCR.modules[key].title}</span><span class="module-meta">${meta} <b>↗</b></span></span>${body}</button>`;
 const tasks=s.planning.keyTasks,inbox=s.planning.inbox,schedule=[...s.planning.schedule].sort((a,b)=>a.start.localeCompare(b.start));
 LCR.screenDOM.planning.overview.innerHTML=card('task',`${tasks.filter(x=>x.completed).length} / ${tasks.length}`,`<div class="preview-list">${tasks.slice(0,3).map(x=>row(x)).join('')||'<p class="empty">暂无任务</p>'}</div><span class="module-foot">${tasks.length>3?`查看全部 ${tasks.length} 项`:'管理今日要事'} →</span>`,'summary-tasks')+
 card('inbox',`${inbox.length} 项`,`<div class="preview-list">${inbox.slice(0,2).map(x=>`<div class="inbox-preview">· <span>${e(x.title)}</span></div>`).join('')||'<p class="empty">收集箱是空的</p>'}</div><span class="module-foot">打开收集箱 →</span>`,'summary-inbox')+
 card('schedule',`${schedule.length} 个日程`,`<div class="schedule-preview">${schedule.slice(0,5).map(x=>`<div><time>${e(x.start)}</time><span>${e(x.title)}</span></div>`).join('')||'<p class="empty">今日暂无日程</p>'}</div><span class="module-foot">查看完整日程 →</span>`,'summary-schedule');
 const q=LCR.find('quest',s.execution.activeMainQuestId),t=LCR.current(),paused=s.status.restMode||s.execution.currentTask?.paused;
 LCR.screenDOM.execution.overview.innerHTML=card('quest',q?`${q.progress}%`:'',`<div class="quest-preview"><strong>${e(q?.title||'添加你的主线')}</strong><span>${e(q?.stage||'')}<span class="quest-stage-dot">·</span>当前阶段</span></div><div class="pixel-mountains" aria-hidden="true"><i></i><i></i><i></i><span>⚑</span></div><div class="progress"><i style="width:${q?.progress||0}%"></i></div><span class="quest-milestone">下一里程碑 → ${e(q?.milestone||'待设置')}</span>`,'summary-quest')+
 card('current',t?(paused?'已暂停':'进行中'):'待选择',`<strong class="summary-task-title">${e(t?.title||'选择一件当前任务')}</strong><div class="current-meta"><span class="tag">${e(t?.category||'计划台')}</span><span>◷ ${t?.duration||25} 分钟</span><span class="module-open">查看任务 →</span></div>`,'summary-current')+
 card('timer','番茄钟',`<div class="summary-timer"><span class="timer-mark">◷</span><strong id="overview-timer">25:00</strong><span id="overview-timer-state">准备专注</span><span class="timer-open">▶</span></div>`,'summary-timer-card')+
 card('next',`${s.execution.nextSteps.filter(x=>!x.completed).length} 项待推进`,`<div class="preview-list">${s.execution.nextSteps.slice(0,2).map((x,i)=>`<div class="preview-row"><span class="step-index">0${i+1}</span><span>${e(x.title)}</span><small>${x.duration}m</small></div>`).join('')||'<p class="empty">暂无下一步</p>'}</div><span class="module-foot">展开下一步 →</span>`,'summary-next');
 LCR.screenDOM.status.overview.innerHTML=card('mood','此刻',`<div class="weather-summary"><span class="pixel-weather ${['焦虑','疲惫'].includes(s.status.moodWeather)?'muted-weather':''}">${LCR.moods[s.status.moodWeather]}</span><div><strong>${e(s.status.moodWeather)}</strong><p>${e(s.status.moodNote||'记录此刻的感受')}</p></div></div>`,'summary-weather')+
 card('stats','0–100',`<div class="summary-stats">${Object.entries(LCR.statNames).map(([key,label])=>`<div class="stat-row"><span>${label}</span><span class="stat-bar"><i style="width:${s.status.stats[key]}%"></i></span><small>${s.status.stats[key]}%</small></div>`).join('')}</div>`,'summary-stats-card')+
 card('side',`${s.status.sideQuests.filter(x=>x.completed).length} / ${s.status.sideQuests.length}`,`<div class="preview-list">${s.status.sideQuests.slice(0,2).map(x=>row(x)).join('')||'<p class="empty">暂无支线任务</p>'}</div><span class="module-foot">查看全部支线 →</span>`,'summary-side')+
 card('rest',s.status.restMode?'已开启':'待机',`<div class="rest-summary"><span>☾</span><div><strong>${s.status.restMode?'正在休息':'给自己一点空白'}</strong><small>${e(s.status.restOption)}</small></div><b>→</b></div>`,'summary-rest');
};
// Overview clicks only enter their module; item actions are available one level deeper.
document.addEventListener('click',event=>{
 const owner=event.target.closest('.screen-editor')?.closest('.monitor')?.id;if(owner)LCR.selectEditor(owner);
 const close=event.target.closest('[data-close-inline]');if(close){LCR.selectEditor(close.dataset.closeInline);LCR.closeInline();return;}
 const module=event.target.closest('[data-module]');if(module){LCR.showModule(module.dataset.module);return;}
 const back=event.target.closest('[data-screen-back]');if(back)LCR.overview(back.dataset.screenBack);
});
document.addEventListener('keydown',event=>{
 if(event.key!=='Escape')return;
 const panel=document.activeElement?.closest('.monitor')?.id;
 if(panel&&!LCR.screenDOM[panel].editorHost.hidden){event.preventDefault();LCR.selectEditor(panel);LCR.closeInline();}
 else if(panel&&LCR.views[panel])LCR.overview(panel);
});

document.addEventListener('focusin',event=>{const panel=event.target.closest('.screen-editor')?.closest('.monitor')?.id;if(panel)LCR.selectEditor(panel);});
