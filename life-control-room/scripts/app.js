/* Application actions. No imports: scripts work from file:// and GitHub Pages. */
LCR.focus=LCR.focusScreen;
LCR.activate=(type,id)=>{let item=LCR.find(type,id);if(!item)return;if(type==='inbox'){LCR.state.planning.inbox=LCR.state.planning.inbox.filter(x=>x.id!==id);Object.assign(item,{priority:'普通',duration:25,completed:false});LCR.state.planning.keyTasks.push(item);type='task';}item.completed=false;LCR.pauseTimer();LCR.state.execution.currentTask={source:type,id,paused:LCR.state.status.restMode};LCR.log('设置当前任务：'+item.title);LCR.refresh();LCR.close();LCR.toast('已设为当前任务');};
LCR.complete=()=>{const task=LCR.current();if(!task)return;task.completed=true;LCR.log('完成任务：'+task.title);LCR.state.execution.currentTask=null;LCR.pauseTimer();LCR.refresh();LCR.toast('任务已完成');};
LCR.rest=()=>{const s=LCR.state.status;s.restMode=!s.restMode;if(s.restMode){LCR.pauseTimer();if(LCR.state.execution.currentTask)LCR.state.execution.currentTask.paused=true;}LCR.log(s.restMode?'开启休息模式 · '+s.restOption:'退出休息模式');LCR.refresh();};
LCR.submit=()=>{
 const form=document.getElementById('editor-form');if(!form.reportValidity())return false;const {type,id}=LCR.editing,data=Object.fromEntries(new FormData(form));
 if(type==='mood'){LCR.state.status.moodWeather=LCR.editing.mood;LCR.state.status.moodNote=data.moodNote.trim();LCR.log('修改情绪天气：'+LCR.editing.mood);}
 else if(type==='stats'){Object.keys(LCR.statNames).forEach(k=>LCR.state.status.stats[k]=Number(data[k]));}
 else{data.title=data.title.trim();if(!data.title){form.elements.title.setCustomValidity('请输入标题');form.elements.title.reportValidity();return false;}if(data.end&&data.end<=data.start){form.elements.end.setCustomValidity('结束时间应晚于开始时间');form.elements.end.reportValidity();return false;}
 if('duration'in data)data.duration=Number(data.duration);if('progress'in data)data.progress=Number(data.progress);if(type==='task'||type==='next')data.completed=form.elements.completed.checked;
 if(id){const item=LCR.find(type,id),wasCompleted=item.completed;Object.assign(item,data);if(data.completed&&!wasCompleted)LCR.log('完成任务：'+item.title);if(data.completed&&LCR.state.execution.currentTask?.id===id){LCR.state.execution.currentTask=null;LCR.pauseTimer();}}
 else{data.id=LCR.id();if(type==='side')data.completed=false;LCR.collections()[type].push(data);if(type==='quest'&&!LCR.state.execution.activeMainQuestId)LCR.state.execution.activeMainQuestId=data.id;}
 }
 LCR.refresh();LCR.close();LCR.toast('已保存');return true;
};
document.addEventListener('click',event=>{
 const b=event.target.closest('button,a');if(!b)return;
 if(b.dataset.nav){event.preventDefault();LCR.focus(b.dataset.nav);}
 if(b.dataset.add)LCR.open(b.dataset.add);
 if(b.dataset.edit)LCR.open(b.dataset.edit,b.dataset.id);
 if(b.dataset.mood){LCR.editing.mood=b.dataset.mood;document.querySelectorAll('[data-mood]').forEach(x=>x.classList.toggle('selected',x===b));}
 if(b.dataset.restOption){LCR.state.status.restOption=b.dataset.restOption;LCR.refresh();}
 if(b.dataset.selectQuest){LCR.state.execution.activeMainQuestId=b.dataset.selectQuest;LCR.refresh();LCR.close();}
 if(b.dataset.editQuest)LCR.open('quest',b.dataset.editQuest);
 const action=b.dataset.modalAction;if(!action)return;
 const {type,id}=LCR.editing;
 if(action==='cancel')LCR.close();
 if(action==='addQuest')LCR.open('quest');
 if(action==='delete'){const items=LCR.collections()[type],index=items.findIndex(x=>x.id===id);if(index>=0)items.splice(index,1);if(LCR.state.execution.currentTask?.id===id){LCR.state.execution.currentTask=null;LCR.pauseTimer();}if(type==='quest'&&LCR.state.execution.activeMainQuestId===id)LCR.state.execution.activeMainQuestId=items[0]?.id||null;LCR.refresh();LCR.close();LCR.toast('已删除');}
 if(action==='activate'){if(LCR.submit())LCR.activate(type,id);}
 if(action==='convert'){if(!LCR.submit())return;const item=LCR.find('inbox',id);LCR.state.planning.inbox=LCR.state.planning.inbox.filter(x=>x.id!==id);Object.assign(item,{duration:25,priority:'普通',completed:false});LCR.state.planning.keyTasks.push(item);LCR.refresh();LCR.toast('已移到今日要事');}
 if(action==='resetQuest')document.getElementById('editor-form').elements.progress.value=0;
 if(action==='complete'){if(!LCR.submit())return;const item=LCR.find(type,id);if(!item.completed){item.completed=true;LCR.log('完成任务：'+item.title);}if(LCR.state.execution.currentTask?.id===id){LCR.state.execution.currentTask=null;LCR.pauseTimer();}LCR.refresh();LCR.toast('任务已完成');}
 if(action==='pause'){if(LCR.submit()){if(LCR.state.execution.currentTask)LCR.state.execution.currentTask.paused=true;LCR.pauseTimer();LCR.refresh();}}
 if(action==='return'){if(!LCR.submit())return;const task=LCR.current();if(task&&LCR.state.execution.currentTask.source==='next'){LCR.state.execution.nextSteps=LCR.state.execution.nextSteps.filter(x=>x.id!==task.id);task.priority='普通';LCR.state.planning.keyTasks.push(task);}LCR.state.execution.currentTask=null;LCR.pauseTimer();LCR.refresh();LCR.focus('planning');}
});
document.addEventListener('change',event=>{const c=event.target;if(!c.dataset.check)return;const item=LCR.find(c.dataset.check,c.dataset.id);item.completed=c.checked;if(c.checked)LCR.log((c.dataset.check==='side'?'完成支线任务：':'完成任务：')+item.title);if(c.checked&&LCR.state.execution.currentTask?.id===item.id){LCR.state.execution.currentTask=null;LCR.pauseTimer();}LCR.refresh();});
document.addEventListener('submit',event=>{if(!event.target.closest('.inline-editor'))return;event.preventDefault();LCR.selectEditor(event.target.closest('.monitor').id);LCR.submit();});
document.addEventListener('input',event=>{if(!event.target.closest('.inline-editor'))return;LCR.selectEditor(event.target.closest('.monitor').id);event.target.setCustomValidity?.('');if(event.target.type==='range')document.getElementById('value-'+event.target.name).value=event.target.value;});

document.getElementById('main-quest').onclick=()=>LCR.open('quest',LCR.state.execution.activeMainQuestId);
document.getElementById('switch-quest').onclick=()=>LCR.open('quests');
document.getElementById('current-task').onclick=()=>{const ref=LCR.state.execution.currentTask;if(ref)LCR.open(ref.source,ref.id,true);else{LCR.focus('planning');LCR.toast('在计划台选择任务并设为当前任务');}};
document.getElementById('complete-task').onclick=LCR.complete;
document.getElementById('pause-task').onclick=()=>{if(LCR.state.status.restMode)return LCR.toast('当前处于休息模式');const ref=LCR.state.execution.currentTask;if(ref){ref.paused=!ref.paused;if(ref.paused)LCR.pauseTimer();LCR.refresh();}};
document.getElementById('timer-start').onclick=LCR.startTimer;document.getElementById('timer-pause').onclick=LCR.pauseTimer;document.getElementById('timer-reset').onclick=LCR.resetTimer;
document.getElementById('weather').onclick=()=>LCR.open('mood');document.getElementById('edit-stats').onclick=()=>LCR.open('stats');document.getElementById('toggle-rest').onclick=LCR.rest;
const updateClock=()=>{const now=new Date();document.getElementById('date').textContent=now.toLocaleDateString('zh-CN',{timeZone:'Europe/London',month:'long',day:'numeric',weekday:'long'});document.getElementById('clock').textContent=now.toLocaleTimeString('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit'});};
if(LCR.state.status.restMode&&LCR.state.execution.timer.running)LCR.pauseTimer();LCR.render();LCR.tick();updateClock();setInterval(()=>{LCR.tick();updateClock();},1000);window.addEventListener('pagehide',LCR.save);if(LCR.loadWarning)LCR.toast(LCR.loadWarning);
