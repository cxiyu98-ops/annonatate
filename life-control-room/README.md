# 人生后台 / Life Control Room

纯 HTML、CSS、Vanilla JavaScript 与 localStorage。无框架、后端、登录或外部数据接口。

## 运行

直接打开 `index.html`，或在此目录运行 `python3 -m http.server 8000` 后访问 http://localhost:8000 。所有资源使用相对路径，支持 GitHub Pages 子目录。本项目部署于 `annonatate/life-control-room/`，不修改仓库原 Jekyll 页面、配置或 Windows 宠物工作流。

## 房间 → 单控制台

默认显示房间。左、中、右三台显示器是独立按钮，分别进入计划台、执行台、状态台；没有中间的三列控制台页面。每次只显示一个 `.monitor`，其余使用 hidden 和 inert 隐藏并阻止键盘进入，DOM 与草稿保留。

- 计划台：今日要事、Inbox、日程。
- 执行台：当前主线、当前任务、专注计时、下一步。
- 状态台：情绪天气、今日状态、支线任务、休息模式。

房间显示器实时读取现有数据：未完成今日要事数、Inbox 数、当日后续日程、当前任务、剩余计时、主线进度、情绪、精力与已完成支线数。预览数字不硬编码，不为视觉示例修改用户数据。日程没有日期字段，按当前伦敦时间匹配今日剩余项目；没有后续日程时明确显示空状态。

点击某台显示器后，场景围绕所选位置推进、对应显示器点亮，界面在约 850ms 内淡入。只用 CSS transform/transition/opacity。减少动态效果时跳过缩放并缩短切换。每台控制台都有「← 返回房间」，顶部三项可直接切换控制台。房间人物与窗户仍有轻量状态信息卡；没有增加新产品功能。

## 模块与编辑

控制台主界面展示本台模块；点击模块展开完整内容，`← 返回控制台` 返回。点击条目在本台控制台内编辑，保存后回到模块，取消或 Escape 返回且不保存。跨控制台切换与往返房间保留浏览位置和未保存草稿；刷新不保留草稿，默认回到房间。

原有增删改、收集项转任务、设置当前任务、完成同步、主线切换、下一步、情绪、状态滑块、支线与休息模式继续使用既有数据和操作逻辑。

## 修改位置

- `index.html`：房间中三处独立显示器按钮及三个控制台的模块容器。
- `scripts/home.js`：显示器实时摘要、进入/返回、人物和窗户信息卡；只维护视图状态，不复制业务数据。
- `scripts/screens.js`：`consoleMeta` 定义控制台身份；`focusScreen()` 确保只显示一台；`renderOverviews()` 定义每台的模块布局内容；原有模块详情与编辑器管理仍在此。
- `styles/design-system.css`：统一 Noto Sans SC / 系统无衬线字体、共享颜色、圆角与间距变量。
- `styles/console.css`：三台显示器摘要、控制台身份色、原有卡片布局与层级基础，以及 `#planning / #execution / #status .screen-overview` 各自的 CSS Grid 布局。所选显示器的缩放原点、点亮样式也在这里。
- `styles/home.css`：保留的房间场景、热点、信息卡，以及 `.entering-room` / `.console-visible` / `.leaving-room` 的基础过渡。
- `assets/icons/console-icons.svg`：同一套几何线性 SVG 图标；房间预览、完整控制台和模块标题复用。
- `assets/images/room-home.svg`、`operator-back.svg`：既有房间和人物插画，本次保留。
- `scripts/ui.js`：模块渲染与共享编辑字段。
- `scripts/state.js`：`LCR.seed()` 示例内容、来源引用、活动日志和保存逻辑。
- `scripts/timer.js`：开始/暂停/重置和刷新恢复。
- `scripts/app.js`：既有业务操作。

新增未来模块时先在 HTML 添加容器，再接入 state、screens 的模块映射/渲染和 app 的操作；本轮未加入模块定制等未来功能。

## 数据保持

localStorage 键仍为 `life-control-room.v1`，模型和已有业务状态没有迁移或重置。每次有效修改保存到当前来源的浏览器存储；计时用剩余时间快照和开始时间戳计算，换控制台或回房间不暂停。进入休息模式才暂停，退出不会自动开始。

当前任务以来源类型和 ID 引用原条目，完成后同步原任务并记录活动；活动最多保留 100 条。若需查看修改后的种子，可手动删除此键后刷新；修改种子不会覆盖已有数据。

## 验证

Chromium + Playwright 已验证：三台真实摘要和独立入口、每次仅一台可见、约 850ms 过渡、减少动态效果、任务 CRUD 与来源同步、跨控制台草稿、计时跨视图连续运行与刷新恢复、主线、Inbox、日程校验、情绪/状态、支线/休息、localStorage，以及 1440/1100/900/390px 布局，无 JavaScript 运行错误。浏览器验证在本地 HTTP 完成；当前云浏览器不支持 file:// 导航，因此没有宣称验证 file://。


## Visual Redesign v1：暖色日式编辑插画

本轮仅改变视觉和与画面一致的描述文字。所有模块、导航、数据绑定和 localStorage 模型保留；state/app/screens/timer/ui 脚本未改动。home.js 仅把信息卡中的静态夜景描述改为日光插画描述。

- `styles/design-system.css`：统一主题变量。`--ivory / --ink / --orange / --moss / --sky / --butter / --clay` 是基础色；`--surface-*` 是模块色块；`--font-ui / --font-number / --weight-*` 控制文字；`--space-* / --radius-* / --line-* / --shadow-*` 控制间距、圆角、边界和阴影。
- `styles/editorial.css`：最后加载的视觉层，统一房间、屏幕摘要、三台控制台、详情和编辑器。保留既有 Grid 模块结构与响应式断点，不增加新功能。
- `assets/images/room-home.svg`：按建筑、光影、窗景、家具与物件分组的平面插画，硬边投影表达右上方日光。显示器仍是可交互 HTML 元素，人物仍是独立 SVG。
- `assets/images/operator-back.svg`：简化的人物与椅子背影；透明图像边缘不占用显示器点击区域。
- `assets/images/editorial-hills.svg`：仅用于主线卡片的小幅色块插画，不重复铺设装饰图。
- `assets/icons/console-icons.svg`：复用原 symbol ID 的统一几何线性图标，保留全部现有绑定。
- `index.html`：只加载新视觉样式并更新插画替代文字；原交互 DOM 与 ID 保持。

SVG 物件填色采用同一套主题色。由于外链 SVG 不继承网页 CSS 变量，修改插画时在对应命名分组内调整填色；不需要编辑导航或业务脚本。

验证包含完整 Chromium 原功能回归、房间人物/窗户信息卡、取消编辑后状态完全一致、1440/1100/900/390px 布局、SVG XML 合法性及业务脚本校验值比对。
