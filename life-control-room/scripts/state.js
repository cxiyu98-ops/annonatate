/* One persisted state. IDs preserve links between planning and execution. */
window.LCR = {};
LCR.storageKey = 'life-control-room.v1';
LCR.seed = () => ({
 version:1,
 planning:{keyTasks:[['t1','完成产品方案','工作',90],['t2','健身 30 分钟','生活',30],['t3','和爸妈通话','生活',20],['t4','整理房间','生活',30]].map(([id,title,category,duration])=>({id,title,category,duration,priority:'普通',notes:'',completed:false})),inbox:['看完这篇行业文章','整理电脑文件','订去杭州的车票','周末买家用洗衣液'].map((title,i)=>({id:'i'+i,title,category:'生活',notes:''})),schedule:[['08:00','早餐 + 阅读'],['10:00','产品方案评审'],['12:00','午餐'],['14:00','设计沟通'],['16:00','健身'],['19:00','和爸妈通话'],['21:00','个人学习']].map(([start,title],i)=>({id:'s'+i,title,start,end:'',category:'生活',notes:''}))},
 execution:{mainQuests:[{id:'q1',title:'完成个人项目',stage:'原型设计',progress:25,milestone:'完成首页 MVP',notes:''}],activeMainQuestId:'q1',currentTask:{source:'task',id:'t1',paused:false},timer:{mode:'pomodoro',duration:1500,remaining:1500,running:false,startedAt:null},nextSteps:['整理方案思路','补充数据与案例','准备评审材料'].map((title,i)=>({id:'n'+i,title,duration:[30,45,40][i],completed:false,notes:'',category:'工作'}))},
 status:{moodWeather:'平静',moodNote:'',stats:{energy:70,focus:80,mood:60,body:75},sideQuests:['看一集喜欢的剧','整理房间','阅读 30 分钟','复盘本周'].map((title,i)=>({id:'b'+i,title,category:'生活',notes:'',completed:false})),restMode:false,restOption:'10 分钟放松'},activityLog:[]
});
LCR.storageAvailable=true;
try{const raw=localStorage.getItem(LCR.storageKey);LCR.state=raw?JSON.parse(raw):LCR.seed();if(LCR.state.version!==1||!LCR.state.planning||!LCR.state.execution||!LCR.state.status)throw Error('Unsupported state');}catch(e){LCR.state=LCR.seed();LCR.loadWarning='本地数据无法读取，已加载示例内容。';}
LCR.save=()=>{try{localStorage.setItem(LCR.storageKey,JSON.stringify(LCR.state));}catch(e){LCR.storageAvailable=false;const el=document.getElementById('save-status');if(el)el.textContent='本地存储不可用 · 本次改动仅保留在页面中';}};
LCR.id=()=> 'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
LCR.collections=()=>({task:LCR.state.planning.keyTasks,inbox:LCR.state.planning.inbox,schedule:LCR.state.planning.schedule,next:LCR.state.execution.nextSteps,side:LCR.state.status.sideQuests,quest:LCR.state.execution.mainQuests});
LCR.find=(type,id)=>LCR.collections()[type]?.find(x=>x.id===id);
LCR.current=()=>{const ref=LCR.state.execution.currentTask;return ref?LCR.find(ref.source,ref.id):null;};
LCR.log=(text)=>{LCR.state.activityLog.unshift({id:LCR.id(),text,at:Date.now()});LCR.state.activityLog=LCR.state.activityLog.slice(0,100);};
