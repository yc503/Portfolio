# 作品集静态站

> 线上地址：https://yc503.github.io/Portfolio/

挂 GitHub Pages 用的纯静态站：**零构建、零依赖、零外部请求**，六个文件，克隆下来双击就能看。

```
site/
├── index.html    骨架（页眉、个人资料、两个页面容器）
├── styles.css    全部样式（含深浅双主题、响应式、打印样式）
├── data.js       全部内容 ← 改内容只改这里
├── app.js        渲染 + 页面路由 + 主题切换
└── motion.js     两处粒子：首屏浮尘 + 架构链路（工厂，两页各一张）
```

## 页面结构

两个分页共用页眉与页脚，用 **hash 路由**切换，不重新加载：

| 地址 | 内容 |
|---|---|
| `#/profile`（默认） | 个人资料：**项目以外**的个人信息——自我介绍、方向、概况、工具链 |
| `#/projects` | 个人项目：**全部项目**（含大肥鱼），前面是首屏读数、四层链路与架构图 |

- 直接开 `#/projects` 也能进，地址栏可分享，浏览器前进/后退可用。
- 切换时标题会跟着变（`document.title`），导航项的当前态走 `aria-current`。
- **隐藏页里的画布尺寸是 0**，所以切回来时必须重建——由 `PORTFOLIO.onPageShown` 触发，
  平时则靠 `ResizeObserver` 兜底。
- 关键读数（`DATA.readout`）在资料页当引子、在项目页当首屏，两处共用同一份数据。

## 本地预览

```bash
cd site && python -m http.server 8137
```

然后打开 `http://127.0.0.1:8137`。

> 直接双击 `index.html` 也能看，但用本地服务器更接近线上行为。

## 发布到 GitHub Pages

### 方式一：独立仓库（推荐）

1. 在 GitHub 新建一个仓库，比如 `portfolio`
2. 把 `site/` 里的**四个文件**拷到仓库根目录
3. 提交推送
4. 仓库 **Settings → Pages → Source** 选 `Deploy from a branch`，分支选 `main`、目录选 `/ (root)`，保存
5. 等一两分钟，访问 `https://<你的用户名>.github.io/portfolio/`

### 方式二：用户主页仓库

新建名为 `<你的用户名>.github.io` 的仓库，把四个文件放根目录，访问 `https://<你的用户名>.github.io/`。

### 自定义域名

在仓库根加一个 `CNAME` 文件，内容写你的域名；然后在域名服务商处把 CNAME 指向 `<你的用户名>.github.io`。

## 自定义

| 位置 | 改什么 |
|---|---|
| `data.js` 的 `DATA.profile.about` 与 `.facts` | **要你自己填**：自我介绍三段、概况四项。现在放的是 `【待填】` 占位 |
| `data.js` 的 `DATA.profile` 其余字段 | 姓名、职位、自述、方向、邮箱与 GitHub。**页眉、资料页与页脚都读这里**，改一处即可 |
| `data.js` 的 `DATA.projects` | 个人项目页的项目列表（含大肥鱼） |
| `data.js` 的 `DATA.personal` | 大肥鱼那张链路图；它的卡片内容在 `DATA.projects` 里 |
| `data.js` 的 `DATA.readout` | 关键读数，资料页与项目页共用 |
| `index.html` 的 `<title>` 与 `description` | 站点标题与搜索引擎摘要 |
| 所有项目描述 | 已做匿名化：不含公司名、内网地址与凭据，改动时请保持 |

## 设计说明

- **调性**：仪表盘 / 规格书。冷灰纸底、发丝分隔线、等宽表格数字做大号读数。
- **强调色**：中国红（红涨绿跌），取自题材自身的语义，不是通用默认色。
- **首屏**：`把一句话变成能回测的策略。` 加四条读数——全站唯一一个「响」的元素，其余保持安静。
- **双主题**：默认跟随系统，右上角可手动切换，选择存在 localStorage。
- **无障碍**：键盘焦点可见、`prefers-reduced-motion` 下关闭全部动效、语义化标签、跳转链接。
- **字体**：全部用系统字体栈（中文 PingFang / 微软雅黑，数字等宽），**不加载任何外部字体**——国内访问不会被墙，首屏也不会闪。

## 加一个新项目

在 `data.js` 的 `DATA.projects` 数组里加一个对象即可，HTML 与 CSS 都不用动：

```js
{
  id: 'unique-id',
  tag: '分类',
  title: '项目标题',
  role: '我的角色',
  lede: '一句话背景',
  spec: [['数字', '说明'], ['数字', '说明']],
  blocks: [
    { h: '我的动作', kind: 'do',   items: ['…'] },
    { h: '难点',     kind: 'hard', items: ['…'] }
  ],
  result: '结果（可用 <b>加粗</b>）'
}
```

`kind: 'hard'` 的块会带一条红色竖线，用来标出最难啃的部分。

## 架构与能力（粒子链路）

`data.js` 的 `DATA.arch` 定义节点与边，`motion.js` 把它们画成一张会流动的图：

- **粒子 = 沿链路走的请求**。选中某层时，与它相连的边变红且粒子加速——表示这条边正在被讨论。
- **节点是真按钮**（不是画在 canvas 里），所以键盘可达、可读屏、文字清晰。
- **反馈闭环**画成弧线，避免与正向边重叠；窄屏下弧线外扩量会自动加大，绕开中间的节点。
- **节点位置**在 `motion.js` 的 `LAYOUT` 里，宽屏与窄屏各一套归一化坐标（0~1）。

### 和项目卡片的双向联动

节点上的 `proj` 字段指向项目卡片的 `id`，两边就自动接上了：

- **架构图 → 卡片**：选中某层后，面板出现「跳到项目 ↓」，点了会滚到对应卡片、给它一层定位高亮、并把焦点交给它（键盘能接着用）。
- **卡片 → 架构图**：有对应节点的项目卡片会多一个「在架构图里看 ↑」，点了滚回架构图并选中那一层。

```js
{ id: 'llm', label: '模型算力', sub: '私有化模型网关', proj: 'gateway' }
//                                                     ↑ 项目卡片 id
```

**不写 `proj` 就不联动**，面板不会出现跳转入口，卡片也不会出现回链——「终端」节点就是这样：
它不是独立作品，而是作为「单一执行通道」写进了产品本体那张卡。

> 注意两套 id 不是一回事：项目 id 是 `gateway`，架构节点 id 是 `llm`。
> 跨模块调用统一走 `window.PORTFOLIO`（`jumpToProject` / `selectArch`），
> **不要用 `window.DATA` 取内容**——`data.js` 用的是顶层 `const`，不会挂到 `window` 上。

加一层就改 `DATA.arch.nodes`（记得在 `LAYOUT.wide` 和 `LAYOUT.narrow` 里各补一个坐标），
加一条边就改 `DATA.arch.edges`：

```js
{ from: 'agent', to: 'eval' }                    // 直线
{ from: 'eval',  to: 'agent', arc: true, label: '反馈闭环' }  // 弧线
```

## 性能与无障碍

- 画布按 `devicePixelRatio` 缩放（上限 2），高分屏不糊。
- 区块滚出视野或标签页切到后台时**停帧**（`IntersectionObserver` + `document.hidden`），不白烧 CPU。
- 帧率上限约 60fps（16ms 节流）。
- `prefers-reduced-motion: reduce` 时**完全不跑动画**，只画一帧静态图，交互仍然可用。
- 主题切换用 `MutationObserver` 监听 `data-theme`，粒子颜色跟着换，不需要刷新。
