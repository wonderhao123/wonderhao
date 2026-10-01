# 城市重建验收记录 · 2026-10-01

基线：`main / 112233c8fe8f5e846e8d9763e16cc3006340f065`，开工时已核对远端同一提交；原有未跟踪文件只有任务规格。本轮修改保留在工作区，未提交、推送或部署。预览为本机生产构建 `http://127.0.0.1:3002`。

## 实际交付

- 主城 **182 栋独立建筑**：原有 38 栋 + 新增 144 个独立地块；其中 **28 栋 ≥60m**（新增 22），新增高层 64–161m，分布于东、北、西三个街区。原有计数为办公8、医院3、校园2、图书馆1、店屋17、教堂1、寺庙1、商业设施1、住宅4。连廊连接的教学楼翼、立面零件和树木不单独计数；山地设施、Ring、港口和机场不用于凑数。
- 新地块外缘 x≈−990…880m、z≈−864…234m，实际建筑带约 **1.87×1.10km**；连同既有滨水约 **1.87×1.17km**。略超提议的1.8km宽度，用于保留河谷与机场通道，并非缩放旧模型。55条连通道路，新增支路/主路宽6–18m。
- 三面山脊与南向海湾、混合街墙和高楼簇；新增48m森林观景塔及北侧生态科考基地。塔有连续9圈坡道、斜交木构、径向托梁、栏杆与平台。两处地点沿用岛屿目录和相机导航，不虚构项目。
- 店屋、教堂/侧廊/钟楼、幼儿园等尖屋顶由墙高与檐口推导；所有同类屋顶有接缝回归检查。地形、地基、道路、路灯与相机共用测绘数据。
- 对完整建筑进行实例属性聚焦；MSAA alpha coverage弱化其他建筑和植被，保持地形、道路和岸线。无常驻项目标签；鼠标、键盘目录和触屏都能进入原有详情。
- 稳定房间窗光 + 道路光场 + 至多两盏邻近无阴影点光源构成夜景。原有WebGL、合批与资产格式保留，没有新运行依赖。
- 揭幕屏障覆盖地形/水深/所有近中远景区块/必需GLB/交通船体，之后执行 `compileAsync`、真实合成帧和GPU fence。错误不进入ready；重试、轻量与二维作品入口始终可用。

近景检查曾拦截山路整平跳变与基地道路跨越低处街道的问题：现改为连续路段影响混合，基地移到 `[600,190,-1100]`，进山路绕行北侧；新增回归验证道路中心地面误差小于0.2m。地形LOD边界加裙边，林木避开陡坡和设施基础。

## 验收矩阵

| 项目 | 已取得的证据 |
|---|---|
| 城市 | [白昼总览](docs/city-rebuild/city-day.jpg)、[地平线](docs/city-rebuild/horizon.jpg)，无项目标签；独立计数及范围见上文 |
| 地形道路 | [河谷](docs/city-rebuild/river.jpg)、[桥头](docs/city-rebuild/bridge.jpg)、[机场通道](docs/city-rebuild/airport-corridor.jpg)、山路近景；连通、坡度、桥梁净空、地基、船体/航线回归检查 |
| 建筑装配 | 店屋[正面](docs/city-rebuild/shop-front.jpg)/[背面](docs/city-rebuild/shop-back.jpg)、教堂[正面](docs/city-rebuild/church-front.jpg)/[背面](docs/city-rebuild/church-back.jpg)、[裙房](docs/city-rebuild/tower-podium.jpg)、[Ring](docs/city-rebuild/ring.jpg)、[完整球体](docs/city-rebuild/sphere.jpg)、[塔](docs/city-rebuild/forest-tower.jpg)、[基地](docs/city-rebuild/field-base.jpg) |
| 夜景 | 相同镜头的[总览](docs/city-rebuild/city-day-night.jpg)、[街道](docs/city-rebuild/shop-front-night.jpg)、[滨水](docs/city-rebuild/sphere-night.jpg)、[塔](docs/city-rebuild/forest-tower-night.jpg)、[基地](docs/city-rebuild/field-base-night.jpg) |
| 聚焦 | 实际mouse hover → 可交互卡片 → 真实项目；拖动不打开详情；目录13项，键盘Locate/Enter，Esc和焦点恢复，浏览器前进/后退；CDP真实触摸事件验证[首触聚焦](docs/city-rebuild/mobile-focus.jpg)、卡片进入、空白取消 |
| 揭幕 | 独立浏览器HTTP冷进入[遮罩](docs/city-rebuild/arrival-0.jpg)与[完整画面](docs/city-rebuild/arrival-2.jpg)连续帧；暖进入、250ms延迟/256KiB/s慢网、必需water.bin 503后Retry、轻量模式和项目/室内深链接 |
| 保留体验 | 原有13项目与slug未修改；19个静态页面构建；World Pass存储/印章/装备回归；[B1](docs/city-rebuild/b1.jpg)→[B2](docs/city-rebuild/b2.jpg)、收集装备→[海底](docs/city-rebuild/underwater.jpg)→岸上、项目深链接关闭均经浏览器实际操作；机场、客运港及工业港在12×观察下实际推进；飞机完整阶段、船舶泊位与船体净空、两条公交路线测试 |
| 工程检查 | `npm test` **32/32**；`npm run typecheck`、`npm run lint`、`npm run build:static -- --webpack`全部通过；`git diff --check`通过 |

固定镜头采用现有历史相机恢复接口，不移动建筑或隐藏缺陷。主要总览 position `[1240,1100,1400]`、target `[-60,60,-310]`；地平线 `[1300,240,1580]` / `[-50,120,-400]`；观景塔 `[-941,180,-607]` / `[-1060,144,-720]`；基地 `[711,251,-970]` / `[600,195,-1100]`。

## 性能方法与边界

设备：Apple M2 Max、64GB、macOS26.6.2；Chrome154 Headless、WebGL、localhost生产构建。只保留一个本轮活动3D场景，无CPU节流。标准1440×960/DPR1；轻量390×844/DPR1是桌面移动视口模拟，**不是真机**。

帧间隔读取合成器实际 `renderFrame` 增量，未用空转rAF充当渲染帧；每档采样至少31秒，包含探索与夜景。轻量档按需渲染，统计连续输入期间，空闲停帧不计为低FPS。

最终构建禁用HTTP缓存：完整揭幕 **1683ms**，最长主线程任务 **640ms**，传输 **4.456MB** / 解码 **9.930MB**；暖HTTP进入 **1477ms**，最长任务 **561ms**。连续帧483ms、1000ms仍遮罩且canvas opacity=0，1804ms已完整揭幕。本轮此前新浏览器测得1152ms/351ms，存在运行波动，不取最快一轮作为保证。驱动shader缓存未清除，不能将该结果当作从未运行过的GPU冷启动保证。

此前同一轮慢网实测：250ms延迟、256KiB/s，4833ms仍完整遮罩，21439ms揭幕。503必需水深资源及HTTP200损坏远景地形都保持遮罩、无revealTime，恢复资源后Retry成功；被拒绝的地形解析不会留在成功缓存中。最终稳定期数据列于下表。

| 最终稳定期指标 | 标准档 | 轻量档（持续输入） |
|---|---:|---:|
| 时长 / 实际帧间隔样本 | 31.138s / 1749 | 31.140s / 1868 |
| P50 / P95 / P99 | 17.6 / 23.7 / 25.9ms | 16.5 / 20.9 / 22.0ms |
| 最大间隔 | 74.6ms（夜景切换窗口） | 35.2ms |
| draw calls 中位 / P95 / 最大 | 495 / 708 / 1044 | 374 / 459 / 459 |
| triangles 中位 / P95 / 最大 | 1,350,774 / 2,049,808 / 2,067,384 | 891,646 / 901,758 / 901,758 |

标准白昼、探索、夜景分别为P50 16.5 / 17.8 / 18.2ms；整段约56FPS，未宣称锁定60FPS。先前完整31秒复测约52FPS，波动也保留在此。阴影刷新及相机移动会抬高draw-call峰值；缓存静态阴影、简化林木冠形和预热后再渲染已降低主要成本。夜景转换仍有一次74.6ms间隔。

轻量档本轮暖进入1182ms、最长主线程任务424ms，解码5.645MB；此次HTTP命中缓存，实际新增传输0.071MB，**不能视为轻量世界的冷传输体积**。此前禁用缓存的轻量测量为2.765MB传输/5.787MB解码。轻量按需渲染并暂停环境/交通连续动画，保留所有建筑、山脊及交互。

标准最终相机约 `[1240,1100,1400]`、target `[-60,60,-310]`；轻量从移动端适配的主城镜头连续拖动，结束约 `[1706,1391,1792]`、target `[43,60,-396]`。因此两个质量档用于各自设备视口的可用性记录，不作为严格同镜头性能比。

两档采样使用同一生产构建。其后只修正了信息卡的DOM定位与视口约束，未改变3D资源和质量参数；该修正另以390×844触屏边界断言、卡片操作和生产构建复验。

现有依赖仍产生一条Three.Clock弃用提示，未升级依赖来消除它。真实iOS/Safari、低端手机、长时显存压力，以及完全清除驱动缓存后的启动没有覆盖。新建场景与更完整的屏障和历史基线相机/ready定义不同，不能把旧4.796秒与本轮暖驱动结果直接解释为同条件加速比。

## 网上库调研与采用决策

| 官方来源 | 能解决的问题 | 本轮决策 |
|---|---|---|
| [Three WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) / [Material](https://threejs.org/docs/pages/Material.html) | `compileAsync`预热、MSAA alphaToCoverage、保留实例批次 | 使用现有0.186版本，核对本地源码/API；GPU fence确认实际渲染完成 |
| [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) | 密集复杂网格的射线/空间查询 | 当前项目只需有限结构命中体；暂不新增BVH依赖 |
| [InstancedMesh2](https://github.com/agargaro/instanced-mesh) | 实例裁剪、LOD和大量实例管理 | 有后续价值；当前已有合批且实测可用，不为此次改造迁移整个实例层 |
| [glTF Transform](https://gltf-transform.dev/) | glTF优化、压缩和资产处理 | 保留现有标准/轻量GLB流程；本轮没有新大模型，不引入额外解码器 |
| [EFFEKT Forest Tower](https://www.effekt.dk/foresttower) | 收腰结构与连续螺旋步道参考 | 只借鉴形态原则；本项目自行生成几何，无下载模型/纹理或复制代码 |

可编辑源在 `city-plan.ts`、`city-architecture.ts`、`city-assets.ts`、`MountainPlaces.tsx` 和现有地标生成脚本。`npm run generate:city`可重复生成必要部署资源（版本`82283b403561`，全部地形LOD约30MiB；浏览器按需下载，不一次传输全部）。无新增第三方资产，因此没有新增资产许可证义务；原有依赖与地标来源记录继续适用。
