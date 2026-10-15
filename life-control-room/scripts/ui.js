/* Shared module rendering and in-screen item editor. Text is always escaped. */
LCR.escape=(value)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
LCR.moods={'晴朗':'☀','平静':'☁','多云':'☁','小雨':'☂','焦虑':'〰','疲惫':'☾'};
LCR.statNames={energy:'精力',focus:'专注',mood:'心情',body:'身体'};
LCR.render=()=>{
 const s=LCR.state,e=LCR.escape,$=id=>document.getElementById(id);
 const rows=(items,type)=>items.map(x=>`<div class="task-row ${x.completed?'done':''}">${type==='inbox'?'<span class="bullet">·</span>':`<input type="checkbox" data-check="${type}" data-id="${e(x.id)}" aria-label="完成 ${e(x.title)}" ${x.completed?'checked':''}>`}<button class="row-button" data-edit="${type}" data-id="${e(x.id)}"><span>${e(x.title)}</span>${type==='task'?`<span class="tag">${e(x.category)}</span>`:''}</button></div>`).join('')||'<div class="empty">这里暂时没有内容</div>';
 $('tasks').innerHTML=rows(s.planning.keyTasks,'task');$('task-count').textContent=`${s.planning.keyTasks.filter(x=>x.completed).length} / ${s.planning.keyTasks.length}`;
 $('inbox').innerHTML=rows(s.planning.inbox,'inbox');$('inbox-count').textContent=s.planning.inbox.length+' 项';
 $('schedule').innerHTML=[...s.planning.schedule].sort((a,b)=>a.start.localeCompare(b.start)).map(x=>`<button class="schedule-row" data-edit="schedule" data-id="${e(x.id)}"><time>${e(x.start)}</time><span>${e(x.title)}</span></button>`).join('')||'<div class="empty">今日暂无日程</div>';
 const q=LCR.find('quest',s.execution.activeMainQuestId);
 $('main-quest').innerHTML=q?`<strong>${e(q.title)}</strong><div class="quest-meta"><span>当前阶段 · ${e(q.stage)}</span><span>${q.progress}%</span></div><div class="progress"><i style="width:${q.progress}%"></i></div><small>下一里程碑 → ${e(q.milestone)}</small>`:'添加你的第一条主线';
 const t=LCR.current(),paused=s.status.restMode||s.execution.currentTask?.paused;
 $('current-task').innerHTML=t?`<strong>${e(t.title)}</strong><div class="current-meta"><span class="tag">${e(t.category||'工作')}</span><span>◷ ${t.duration||25} 分钟</span><span>${e(t.priority||'普通')}</span></div>`:'<strong>暂时没有当前任务</strong><span class="muted">从计划台选择一件事，开始就好。</span>';
 $('task-status').textContent=t?(paused?'● 已暂停':'● 当前进行中'):'待选择';$('complete-task').disabled=!t;$('pause-task').disabled=!t;$('pause-task').textContent=paused?'继续任务':'暂停';
 $('next-steps').innerHTML=s.execution.nextSteps.map((x,i)=>`<div class="next-row ${x.completed?'done':''}"><span class="number">${x.completed?'✓':i+1}</span><button class="row-button" data-edit="next" data-id="${e(x.id)}"><span>${e(x.title)}</span><small class="muted">${x.duration} 分钟</small></button></div>`).join('')||'<div class="empty">留出下一小步</div>';
 $('weather').innerHTML=`<div class="section-heading"><h3>${LCR.icon?LCR.icon('mood'):''} 情绪天气</h3><span class="muted">点击调整 ↗</span></div><div class="weather-main"><div class="weather-art">${LCR.moods[s.status.moodWeather]}</div><div><strong>${e(s.status.moodWeather)}</strong><p>${e(s.status.moodNote||'此刻的感受，由你定义')}</p></div></div><div class="weather-footer">${Object.entries(LCR.moods).map(([name,icon])=>`<span class="${name===s.status.moodWeather?'active':''}" title="${name}">${icon}</span>`).join('')}</div>`;
 $('stats').innerHTML=Object.entries(LCR.statNames).map(([key,name])=>`<div class="stat-row"><span>${name}</span><div class="stat-bar"><i style="width:${s.status.stats[key]}%"></i></div><small>${s.status.stats[key]}%</small></div>`).join('');
 $('side-quests').innerHTML=rows(s.status.sideQuests,'side');$('side-count').textContent=`${s.status.sideQuests.filter(x=>x.completed).length} / ${s.status.sideQuests.length}`;
 document.body.classList.toggle('rest-mode',s.status.restMode);$('global-status').textContent=s.status.restMode?'☾ 休息模式已开启':'● 控制室已就绪';$('toggle-rest').textContent=s.status.restMode?'☀ 退出休息模式':'☾ 进入休息模式';
 document.querySelectorAll('[data-rest-option]').forEach(b=>b.classList.toggle('selected',b.dataset.restOption===s.status.restOption));
 $('activity-log').innerHTML=s.activityLog.map(x=>`<div class="log-row"><time>${new Date(x.at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</time><span>${e(x.text)}</span></div>`).join('')||'<span class="empty">暂无活动记录</span>';$('log-count').textContent=s.activityLog.length?`· ${s.activityLog.length}`:'';
 LCR.renderOverviews?.();
 LCR.drawTimer();
};
LCR.toast=(message)=>{const t=document.getElementById('toast');t.textContent=message;t.classList.add('show');clearTimeout(LCR.toastTimeout);LCR.toastTimeout=setTimeout(()=>t.classList.remove('show'),2300);};
LCR.refresh=()=>{LCR.save();LCR.render();};
LCR.field=(name,label,value='',type='text',extra='')=>`<label class="field">${label}<input name="${name}" type="${type}" value="${LCR.escape(value)}" ${extra}></label>`;
LCR.notes=(value)=>`<label class="field">备注<textarea name="notes">${LCR.escape(value)}</textarea></label>`;
LCR.button=(action,label,cls='secondary')=>`<button type="button" data-modal-action="${action}" class="${cls}">${label}</button>`;
LCR.open=(type,id=null,asCurrent=false)=>{
 LCR.prepareEditor(type,asCurrent);
 LCR.editing={type,id,asCurrent};const item=LCR.find(type,id)||{},f=LCR.field,b=LCR.button;
 const names={task:'今日要事',inbox:'收集项',schedule:'日程',next:'下一步',side:'支线任务',quest:'主线',mood:'情绪天气',stats:'今日状态',quests:'切换主线'};
 document.getElementById('editor-title').textContent=(id?'编辑':type==='quests'||type==='mood'||type==='stats'?'':'添加')+names[type];
 let fields='',actions=b('cancel','取消');
 if(['task','inbox','schedule','next','side','quest'].includes(type)){
 fields=f('title',type==='inbox'?'内容':'标题',item.title||'','text','required maxlength="120"');
 if(type!=='quest')fields+=f('category','分类',item.category||'生活','text','maxlength="30"');
 if(type==='task')fields+=`<label class="field">优先级<select name="priority">${['普通','重要','紧急'].map(p=>`<option ${p===item.priority?'selected':''}>${p}</option>`).join('')}</select></label>`;
 if(type==='task'||type==='next')fields+=f('duration','预计时长（分钟）',item.duration??25,'number','min="1" max="1440" required');
 if(type==='schedule')fields+=`<div class="field-group">${f('start','开始时间',item.start||'09:00','time','required')}${f('end','结束时间（可选）',item.end||'','time')}</div>`;
 if(type==='quest')fields+=f('stage','当前阶段',item.stage||'')+f('progress','进度（0–100）',item.progress??0,'number','min="0" max="100" required')+f('milestone','下一里程碑',item.milestone||'');
 if(type==='task'||type==='next')fields+=`<label class="field"><span><input name="completed" type="checkbox" ${item.completed?'checked':''}> 已完成</span></label>`;
 fields+=LCR.notes(item.notes||'');
 if(id)actions+=b('delete','删除','danger');
 if(id&&type==='inbox')actions+=b('convert','移到今日要事');
 if(id&&['task','inbox','next'].includes(type))actions+=b('activate','设为当前任务');
 if(id&&type==='quest')actions+=b('resetQuest','重置进度');
 if(id&&['task','next'].includes(type))actions+=b('complete','完成');
 if(asCurrent){actions+=b('pause','暂停')+b('return','返回计划台');document.getElementById('editor-title').textContent='当前任务 · 编辑';}
 actions+='<button type="submit" class="primary">'+(id?'保存':'添加')+'</button>';
 }else if(type==='mood'){
 fields=`<div class="mood-grid">${Object.entries(LCR.moods).map(([name,icon])=>`<button type="button" class="mood-choice ${name===LCR.state.status.moodWeather?'selected':''}" data-mood="${name}"><span>${icon}</span>${name}</button>`).join('')}</div>`+f('moodNote','简短记录（可选）',LCR.state.status.moodNote,'text','maxlength="80"');LCR.editing.mood=LCR.state.status.moodWeather;actions+='<button type="submit" class="primary">保存</button>';
 }else if(type==='stats'){
 fields=Object.entries(LCR.statNames).map(([key,name])=>f(key,`${name} <output id="value-${key}">${LCR.state.status.stats[key]}</output>`,LCR.state.status.stats[key],'range','min="0" max="100"')).join('');actions+='<button type="submit" class="primary">保存</button>';
 }else if(type==='quests'){
 fields=LCR.state.execution.mainQuests.map(q=>`<div class="quest-choice"><button type="button" data-select-quest="${LCR.escape(q.id)}">${q.id===LCR.state.execution.activeMainQuestId?'● ':''}${LCR.escape(q.title)}<small>${LCR.escape(q.stage)} · ${q.progress}%</small></button><button type="button" class="text-button" data-edit-quest="${LCR.escape(q.id)}">编辑</button></div>`).join('');actions+=b('addQuest','＋ 添加主线','primary');
 }
 document.getElementById('editor-fields').innerHTML=fields;document.getElementById('editor-actions').innerHTML=actions;LCR.mountEditor(type,asCurrent);
};
LCR.close=()=>LCR.closeInline();
