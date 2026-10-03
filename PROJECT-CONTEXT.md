# WONDERHAO 项目交接

更新日期：2026-10-03。本文保存当前状态与长期约定；后续直接更新对应段落，不追加聊天流水账。

## 当前状态与阅读顺序

- 工作目录：`/Users/haohao/Projects/wonderhao`。
- 当前工作：基于 `main` / `c432c39f` 完成 Ring 中央星环水景与内庭改造，离岸海沟地标 The Cube，以及 The Sphere 贯通中庭／直达底层楼梯／八柱环形步道／水下探照灯和画面闪烁修复，尚未提交、推送或部署。已有交接文档和同期品牌改动已保留。
- 本轮开工检查：分支 `main`，HEAD 为 `c432c39f`；工作区包含尚未提交的 Ring、Cube 与品牌改动，均已保留。该基线此前已推送，本轮场景改造未部署。
- `c432c39f` 包含普通建筑、植被、地表和交通工具的统一精细化，以及截图、日志、测量文件和临时截图脚本清理。
- 没有已确认的未完成开发任务。下一步以用户的新需求为准；已知限制不自动构成开发待办。
- 新对话先检查实际 Git 状态、分支和提交，阅读 [AGENTS.md](AGENTS.md) 与本文；按任务查阅 [设计约定](DESIGN.md)、[验收记录](CITY-WORLD-ACCEPTANCE.md) 和 [交互约定](UX-CONTRACT.md)。
- [旧城市规格](CITY-WORLD-NEXT-SPEC.md) 是历史设计资料。其旧基线、缺陷、待办与开场提示不能直接代表当前状态；以当前源码和最近验收记录核实。

## 画面目标与已落实的设计

- 面向海湾、三面环山的可探索城市；城市密度、地貌、街区和滨水设施共同形成连续空间。远景、中景、可到达近景都要成立。
- 建筑、场地、自然环境和交通工具采用统一的精细风格化尺度与材质。提高品质时同步考虑加载、合批、LOD 与轻量档成本。
- **The Ring**：向内收拢的幕墙与屋顶；内庭中央为八角石座、金属星环与水蓝发光核心的浅池装置，取代旧轴线亭。外围是四片弧形花园、弧形座椅、同心石铺广场及四条对角水渠；主轴通道保持开敞。两档模型均保留，屋顶内外边缘连续紫色霓虹及 B1/B2 不变。
- **The Sphere**：原显示名称 Coastal Observatory 已改名；保持完整直径 70m 球体与连接栈桥；上下半球统一透明玻璃、细框架与银色环带。旧中央海底基础及栈桥独立桩已移除；水线处新增 6.8m 宽环形步道，恰好八根支柱落至海床。外缘下方八盏固定探照灯照射海底和鱼群，两档均保留。内部为上下贯通中庭，七层周边楼廊通过连续旋转楼梯连接到球底观景层；没有封闭水线楼板。海面可近距离俯视，水下允许仰视；两档保留全部台阶。先进入海面视角，再通过现有按钮下潜。
- **The Cube**：位于 [980, -36, 1120] 的 56m 完整无缝立方体，顶部水下 8m；下部埋入海床、东侧嵌进岩壁，洁净表面无门窗／附着物。夜间整体发冷白光，海面有受深度衰减的透光轮廓。目录和潜水中心可达，沿用潜水装备与返回流程；尺寸和海沟源为 `city-plan.ts`，渲染入口为 `TheCube.tsx`。
- **教堂街区**：参考新加坡 CHIJMES 的白色哥特式礼堂、开放拱廊、古典建筑、中央草坪与餐饮庭院；是适应现有场地的设计，非测绘复刻。
- **机场与海岸**：机场有塔台、跑道及滑行指示灯；海湾有沙滩、遮阳伞、餐饮和休闲设施。工业港、客运邮轮／渡轮泊位和小艇码头分区。
- **普通城市与交通**：实体窗台、共享竖框和一致的玻璃响应；草地、土石、干湿沙滩、枝叶与海岸浪花细节；汽车、巴士、飞机及船舶补充曲面与机械设施，并按材质合批。

## 必须保留的体验与工程约束

- 保留 13 个真实项目的内容及 slug、既有二维页面、联系入口、opening、World Pass、Ring B1/B2、潜水及返回流程。
- 默认拖拽平移，显式旋转与缩放；拖动不误开详情、详情滚动不影响背景，键盘交互与焦点恢复保持可用。
- 世界采用米制、Y-up、北为负 Z。尺寸、几何、基础、热点、相机、水线和交通路线必须保持一致；移动地标时同步整套契约。
- 灯光位置与功率不由镜头邻近选择驱动，避免拖动时跳闪。局部灯、环境、夜景光场和 Bloom 保持有界预算。后处理采用单采样 HDR + FXAA，避免多采样 resolve 的透明空帧；建筑聚焦淡化使用 alphaHash，不再依赖 alphaToCoverage。
- 修改资产生成源后重新生成必要运行资源，不手改大量重复输出；标准和轻量资产保留同一空间构图与建筑身份。
- 首次揭幕必须等待必需场景资源及 GPU 准备完成；资源失败要保留遮罩和恢复入口。
- 自主完成最小完整改动、实际验证与最终 diff 检查；避免无关重构和依赖升级。
- 收尾清理临时截图、日志和一次性脚本，保留必要源码、资产源、运行资源和有效回归测试。
- 提交、推送与部署遵循本次用户请求；旧对话的一次授权不扩展成未来自动操作。部署须有明确请求。

## 按任务定位源码

| 范围 | 入口 |
| --- | --- |
| 地形、路网、岸线与布局 | [city-plan.ts](lib/world/city-plan.ts)、[城市生成器](scripts/build-city.mjs) |
| 建筑与区域资产 | [city-architecture.ts](lib/world/city-architecture.ts)、[city-assets.ts](lib/world/city-assets.ts) |
| 地标尺寸、模型源与加载 | [landmark-spec.json](lib/world/landmark-spec.json)、[Blender 生成源](scripts/build-landmarks.py)、[LandmarkAsset.tsx](components/world/LandmarkAsset.tsx)；运行模型位于 `public/world/models/` |
| 离岸立方体与海沟 | [TheCube.tsx](components/world/TheCube.tsx)、[city-plan.ts](lib/world/city-plan.ts)、[CoastalWater.tsx](components/world/CoastalWater.tsx)；海面透光、海床与水下几何共用尺寸及地形源 |
| 项目映射、相机与加载揭幕 | [city-buildings.ts](lib/world/city-buildings.ts)、[CameraRig.tsx](components/world/CameraRig.tsx)、[ScenePreparation.tsx](components/world/ScenePreparation.tsx)、[WorldApp.tsx](components/world/WorldApp.tsx) |
| 地表、植被与合批 | [surface-materials.ts](lib/world/surface-materials.ts)、[vegetation.ts](lib/world/vegetation.ts)、[CityTerrain.tsx](components/world/CityTerrain.tsx) |
| 交通路线、模型与动画 | [city-life.ts](lib/world/city-life.ts)、[transport-geometry.ts](lib/world/transport-geometry.ts)、[CityLife.tsx](components/world/CityLife.tsx) |

## 验证方法与已知限制

- 命令以当前 `package.json` 为准：`npm test`、`npm run typecheck`、`npm run lint`、`npm run check:content`、`npm run build:static -- --webpack`、`git diff --check`。按改动风险选择检查；城市资产修改后运行 `npm run generate:city`。静态构建的 prebuild 也会生成城市资产。
- Next.js 采用当前安装版本；写相关代码前阅读 `node_modules/next/dist/docs/` 中对应指南，保留 `AGENTS.md` 自动生成区块。
- 视觉改动必须检查生产构建的实际浏览器效果，覆盖相关近景、昼夜、必要天气、标准／轻量档和窄屏；不能仅凭构建通过宣称视觉正确。
- 最近已完成的 Ring 内庭验收：44/44 测试、类型检查、相关 ESLint、内容检查和 webpack 生产构建通过；浏览器覆盖标准／轻量档、昼夜、雨天、390px 窄屏，以及 B1/B2 切换和返回外庭，无新增脚本／WebGL 错误。详见验收记录；窄屏为桌面浏览器模拟。
- The Cube 验收：46/46 测试、类型检查、相关 ESLint、内容检查、webpack 生产构建与设计静态审计通过；实测两档水下昼夜、海面夜间透光、目录／装备／下潜／返回、连续拉近防穿模及 390px 轻量构图。无脚本或 shader 错误；海面透光为有界折射近似，未做真机性能认证。两档立方体均为 12 三角面，局部水下地形分别为 43,008／10,752 三角面。
- The Sphere 更新验收：52/52 测试、类型检查、相关 ESLint、内容检查和生产构建通过；两档导出几何检查覆盖上下贯通视线、直达底层台阶、开放平台入口、完整玻璃、连续步道与八柱。生产浏览器标准／轻量档逐帧检查 1,032／504 帧无透明空帧或黑屏，灯光回归、俯视／仰视及窄屏流程通过。当前两档为 653,636／250,538 三角面、21,231,572／8,277,488 bytes，各 10 个材质批次；完整内部增加资源体积，未做真机性能认证。
- 玻璃反射主要来自环境贴图，水面灯光反射采用共享光场近似；窗内深度表现不等于可进入的完整室内。
- 城市统一细化基线的同视角三角面数增加约 21–26%，机场与港口绘制次数下降。本次 Ring 资产标准档 162,980 三角面／5,249,504 bytes，轻量档 61,922 三角面／2,300,452 bytes，均为 13 个材质批次；未进行真机帧率测试。
- 既有 `THREE.Clock` 弃用警告仍在；最近全仓 ESLint 记录有 WorldPass 的两个既有未使用导入警告。遇到它们先核实当前依赖与代码，不进行无关升级。

## 新对话 prompt

```text
请继续 /Users/haohao/Projects/wonderhao。

先检查 Git 工作区、当前分支和提交，阅读 AGENTS.md 与 PROJECT-CONTEXT.md；根据本次任务按需查阅设计和验收记录。上次已推送基线为 c432c39f，但以实际仓库状态为准。CITY-WORLD-NEXT-SPEC.md 是历史规格，不要将其中旧缺陷直接当成当前待办。

遵循项目设计与保留约束，自主完成最小完整改动和必要的实际验证。视觉改动检查浏览器效果及标准／轻量档；收尾清理临时截图和日志。不自动部署。

本次任务：【填写新需求】
```
