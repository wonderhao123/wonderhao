<!-- Temporary screenshots and measurement dumps were removed on 2026-10-02; the results below record completed verification. -->
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
| 城市 | 白昼总览、地平线，无项目标签；独立计数及范围见上文 |
| 地形道路 | 河谷、桥头、机场通道、山路近景；连通、坡度、桥梁净空、地基、船体/航线回归检查 |
| 建筑装配 | 店屋正面/背面、教堂正面/背面、裙房、Ring、完整球体、塔、基地 |
| 夜景 | 相同镜头的总览、街道、滨水、塔、基地 |
| 聚焦 | 实际mouse hover → 可交互卡片 → 真实项目；拖动不打开详情；目录13项，键盘Locate/Enter，Esc和焦点恢复，浏览器前进/后退；CDP真实触摸事件验证首触聚焦、卡片进入、空白取消 |
| 揭幕 | 独立浏览器HTTP冷进入遮罩与完整画面连续帧；暖进入、250ms延迟/256KiB/s慢网、必需water.bin 503后Retry、轻量模式和项目/室内深链接 |
| 保留体验 | 原有13项目与slug未修改；19个静态页面构建；World Pass存储/印章/装备回归；B1→B2、收集装备→海底→岸上、项目深链接关闭均经浏览器实际操作；机场、客运港及工业港在12×观察下实际推进；飞机完整阶段、船舶泊位与船体净空、两条公交路线测试 |
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

## 追加：机场、休闲海湾与分区港口 · 2026-10-01

本次基于已推送的 `19517d5b` 继续，保留工作区已有的 Ring 与登岛卡片改动。新增机场塔台、573 个跑道/滑行道指示光点，以及机场/港区/海湾共 58 组实体灯具与共享照明覆盖。The Ring、13 个真实项目、原有船舶泊位/航线和潜水装备流程保持。

- 机场：高柱塔台、全景控制室、挑檐与红色信标；跑道边灯、中线、入口/末端及滑行道灯。灯色分工参考 [FAA AIM Airport Lighting](https://www.faa.gov/air_traffic/publications/aim_html/chap2_section_1.html)，属于视觉化简化，不作为机场运行规范模拟。
- 潜水海湾：约 480m 弧形沙滩；4 座餐饮休闲亭、外摆桌椅、40 顶遮阳伞与躺椅、棕榈、救生亭、排球场和皮划艇。连续步道连接潜水设施，岸坡切面与步道标高一致。球体外壳、步道和近岸水面具有夜间层次。
- 工业港：分道集装箱堆场、3 座门式岸桥、仓库、静态集装箱支线货船；保留干船坞、龙门维修吊架和原有补给船水道。
- 客运/游艇港：保留邮轮和渡轮泊位，东侧独立设置带会所、栈桥与 10 艘小艇的休闲码头；浅水基床与桩柱支撑同步建立。
- 照明：复用现有世界光场，材质本色参与泛光响应，保留最多两盏近处实时点光；机场光点为一个批次，低画质也显示。水面反光是共享光场的有界近似，未新增运行依赖。

| 验收项 | 本次证据 |
|---|---|
| 机场夜间辨识 | 跑道与停机坪、塔台近景 |
| 沙滩与休闲设施 | 白昼海湾、沙滩近景、夜间海湾 |
| 工业/休闲港分区 | 货港夜景、客运与小艇泊位 |
| 远景与轻量渲染 | 整岛夜景、390px 低画质跑道、390px 海湾 |
| 地形/航线回归 | 36/36 测试通过；新增沙滩干湿剖面、步道支撑、灯光标高与用途、游艇/货船占用范围检查；原有全船体/全航程与飞机跑道互斥检查通过 |
| 交互 | 桌面与390×844低画质视口实际操作目录→潜水区→领取装备→进入水下；正确到达 `?place=dive&scene=reef&view=underwater`；无横向溢出 |
| 工程与运行 | TypeScript、相关源文件 ESLint、webpack 生产构建、`git diff --check` 通过；桌面/低画质浏览器脚本与 WebGL 错误为0；设计静态审计0问题 |

验证采用 localhost 生产构建、桌面 Chrome 的1440×960与390×844视口，非手机真机。机场/船舶全周期由确定性路径测试覆盖；浏览器侧验证实际模型与交互，未冒称逐帧人工观看所有航程。新设施为场景内容，餐饮、租赁、排球与游艇没有新增交易或驾驶交互。本轮未提交、推送或部署。

最终海湾夜景（1440×960，标准画质）应用诊断的单次活动采样为 **60 fps / 402 draw calls / 1,298k triangles**；这是本机当前镜头的采样，不是全设备性能保证。

## 追加修复：拖动镜头时灯光跳闪 · 2026-10-01

用户 22:39 录屏中的球体顶部突亮与岸边亮斑切换已定位：`CityNight` 每帧按镜头目标选最近两盏光源，x=475→500 时将球顶 7000 强度光源替换为码头灯，x=575/600 又切换为海滩灯。修复移除镜头驱动的选择和球顶强光，两盏局部补光固定于球体登船口 `[518,6,386]` 与森林塔 `[-1060,166,-720]`；区域光场保持。

实际浏览器回归 `tests/browser/night-lighting.js`：11 个往返镜头采样、真实鼠标拖动后，两盏灯的位置、颜色、范围、强度完全一致；白昼关闭，夜间恢复；无页面错误。36/36 测试、相关 ESLint、webpack 生产构建与差异检查通过。本轮仅修复照明及补充回归/记录，未部署。

## 追加：参考图玻璃球体建筑 · 2026-10-01

原封闭金属外壳与两条粗金色环带替换为完整曲面玻璃幕墙、24 根细竖向框架、15 道银色遮阳环及固定暖光线条。底部为深色水线基座，水下半球、35m 半径、球心位置、深基座和东侧栈桥保留。首层、两层环形夹层、中庭、楼梯开口/斜梁、屋面支承柱、展示桌、休息座椅与中央信息台均为模型几何。

玻璃是唯一透明材质批次：关闭深度写入与投影，独立 shader key，采用外表面渲染；上部玻璃提高反射透明度，首层保持清晰透视。夜间室内暖光、水平灯带随昼夜模式切换；固定实时灯位保持，无镜头驱动的光源跳变。

- 37 项测试通过；新增标准/轻量模型玻璃透明度、完整球冠、遮阳环、15 圈灯带全周连续性与室内设施检查。完整球体径向法线、深水净空等旧约束继续通过。材质预算测试只为球体玻璃放行一个 BLEND 材质，其他模型仍要求不透明。
- TypeScript、相关 ESLint、webpack 生产构建与 `git diff --check` 通过。桌面和390×844浏览器视口未出现脚本/WebGL错误；潜水装备→水下→返回岸上实际操作通过，无横向溢出。低画质为桌面模拟，非手机真机。
- 拖动灯光回归再次通过：11 个往返镜头、真实鼠标拖动及昼夜开关后，两盏灯的位置/强度仍固定。
- 标准 GLB 7.39 MiB、轻量 GLB 约2.8 MiB，各10个材质批次；没有外部纹理、第三方模型或新增运行依赖。玻璃反射使用现有环境照明，不冒称城市屏幕空间反射。未提交、推送或部署。

## CHIJMES-inspired heritage precinct — 2026-10-01

Replaced the former church and plain apron with a full garden precinct within the existing city block. Includes a Gothic nave, side aisles, coloured lancets, connected flying buttresses, belfry/spire, two-storey open pointed cloisters, classical garden house with rounded bay, central lawn, dining furniture, shade parasols, boundary gates and warm fixed night illumination. Existing neighbouring temple, library, roads and project identities are preserved. This is an adapted composition, not a surveyed replica or a new indoor tour.

Reference research and design decisions: [CHIJMES analysis](docs/chijmes-quarter/design.md). Visual evidence: day, night, roof, front, rear, dragged night view, 390px lightweight view.

Validation: 39/39 tests; `npm run typecheck`; targeted ESLint; `next build --webpack`; `git diff --check`. New assertions cover open arcade geometry, solid jambs, clear lawn/entrances, scenery ownership, retained distant structure and rotated roof support. Browser production verification returned no page/console errors and no horizontal overflow. The pre-existing Three.js Clock deprecation warning remains. Near-quarter standard render sample: 343 draw calls / 980,084 triangles for the complete visible scene; no FPS claim. Corrected camera bounds for rotated wings and included narrow building volumes/spires. Temporary screenshot helper removed after verification.

No dependency added, no remote asset copied, no deployment performed.

## Shared building, landscape and transport detail — 2026-10-02

- Ordinary thin-glass facades: physical aluminium reveals, shared multi-storey mullions and projecting sills; glass roughness now applies consistently to all seven glazing colours, including rain. Original building owners, layout, camera collision solids, roads and transport state machines remain unchanged.
- Ground: grass patch/blade detail, soil/rock transitions, dry/wet sand and filtered sand ripples; surveyed terrain geometry unchanged. Trees: layered tinted crowns and branches with a simpler distant variant. Sea: irregular foam fronts along existing bathymetry.
- Transport: rebuilt car/bus bodies and fittings, smooth aircraft profile/open engine mouths/winglets/gear, cruise/ferry/cargo deck fittings and railings. Original vessel hull and transport routes retained. Body/deck geometry is merged by finish, at most eight material batches; wheels remain independently animated.


Validation: 43/43 tests; TypeScript; targeted ESLint; `next build --webpack`; `git diff --check`. Tests check finite transport geometry/normals, clearance envelopes, material batch limits, deterministic tinted crowns, simpler canopy geometry and facade ownership/shared-storey budget. The completed browser acceptance run checked standard daylight, night, rain and mobile lightweight rendering, zoom/drag and overflow. Production browser run: no script/WebGL errors or new warnings; no mobile horizontal overflow. Existing dependency `THREE.Clock` deprecation remains; full-repository ESLint has two pre-existing unused-import warnings in WorldPass.

Same-camera full-scene samples, 1440×960, reduced motion (snapshots, not a frame-rate benchmark):

| View | Before calls / triangles | After calls / triangles |
| --- | --- | --- |
| City | 241 / 1,111,766 | 242 / 1,347,734 |
| Street | 298 / 980,324 | 328 / 1,232,960 |
| Airport | 257 / 974,372 | 226 / 1,201,608 |
| Harbour | 398 / 1,153,308 | 374 / 1,424,882 |

More detail raises triangle cost about 21–26% in these views. Airport/harbour draw calls decrease through material batching. The mobile lightweight sample rendered 132 calls / 981,158 triangles; this is a desktop browser viewport, not physical-phone performance certification. Initial terrain shader reserved-word failure was repaired and the browser matrix rerun successfully; redundant per-pane frames were replaced with shared mullions before final verification. No deployment performed.

## Ring floating armillary courtyard — 2026-10-04

Removed the eight-point pedestal, bearing, cradle and fixed crown ornament, followed by all eight basin water arcs and their decorative ripple curves. The original basin and surrounding paving/gardens, building, roof lights and B1/B2 remain. The nucleus is fixed at local [0, 8.5, 0]. Four metal rings and the paired aquamarine ribbon are exported as five independent pivots at that same centre, each rotating slowly in different directions/rates. Material batching now respects pivot ownership: 13 shared materials, 22 meshes (10 moving batches). Standard / lightweight contain 141,628 / 53,799 triangles and 4,248,448 / 1,909,852 bytes. Rotation is active around the courtyard, pauses for modals and reduced motion, and uses 20 Hz invalidation in lightweight mode without enabling other ambient animation.

Validation: 55/55 tests, targeted ESLint, content validation, webpack production build including TypeScript and final diff checks passed. Geometry regression checks both exported pivot centres, the absent base, and a rotation-invariant maximum radius of 7.4 m: at least 0.56 m clearance over the water in every orientation. The existing gardens, axes, roof and Sphere tests pass. After removing the basin curves, re-exported both qualities, reran all 55 tests and the production build, and visually confirmed clean water plus continued rotation in both quality tiers. `tests/browser/ring-orbits.js` passed in production Chromium in both qualities: all five pivots rotate, stay centred at world [80, 84.5, -480], pause with settings/reduced motion and resume. Inspected both qualities in daylight/night and lightweight at 390×844; close visual checks used a temporary inspection camera, removed afterwards. No browser errors; existing Three.Clock/disposal warnings only. Earlier B1/B2 and route acceptance remains applicable; unchanged interiors were not re-tested this revision. No physical-phone performance claim. Temporary captures, probes and logs cleaned; selected preview retained outside the repository. No commit, push or deployment.

## The Cube / deep offshore trench — 2026-10-04

The perfect 56m cube now sits at [1120, -54, 1420], approximately 1.21km from The Sphere. Its top is 26m underwater; its bottom remains buried in the roughly -74m seabed and its eastern side intersects the wall rising to -34m. The unbroken, clean surface and fixed nighttime emission remain. The surface scene no longer mounts the solid or projects refracted box faces onto the water: only a soft, depth-attenuated light pool appears at night, with no daytime silhouette. This is a bounded shader approximation of diffused light.

The directory and dive-kit flow still reach the Cube. Descent opens at 30m below water (10m in portrait to clear the foreground wall); camera target limits follow the surveyed depth. Collision and return-to-shore remain. Regenerated terrain tiles, far mesh, water survey and manifest agree with the relocated trench. Both qualities retain the twelve-triangle cube and their existing terrain detail budgets. Ring, Sphere and portfolio content are unchanged.

Validation: 52/52 tests after regeneration, TypeScript, targeted ESLint, content checks, webpack production build and `git diff --check` passed. Production Chromium checks covered standard/lightweight daytime and nighttime surface/dive views. `tests/browser/cube-depth.js` verifies that the surface contains no solid, night-only water glow is enabled, descent opens at the new deep site, daytime emission is off, repeated zoom stays outside the cube, and return removes the underwater solid. The browser reports no script or shader errors; the existing THREE.Clock warning remains and replaced canvases dispose their old WebGL contexts normally. 390×844 lightweight descent/return and framing were checked with no horizontal overflow; this is desktop browser emulation, not physical-device performance certification. Temporary screenshots, logs and helper scripts were cleaned. No commit, push or deployment performed.

## The Sphere / connected atrium and stable rendering — 2026-10-03

The 70m glass sphere now contains a single vertically connected room. Removed the full waterline floor and central desk. Seven narrow perimeter balconies share a clear shaft above a bottom observation floor at local Y -32m. A continuous 3.3m-wide winding stair joins all levels, with risers at most 175mm, radial landings, twin stringers and guardrails. All treads and landings are retained without decimation in both quality tiers. The glass has the same clear opacity above and below water; the extra opaque upper-glass shader is removed. Existing water exclusion keeps the interior dry and the vertical view open.

The 6.8m promenade, exactly eight seabed piles, east airlock/landing, eight fixed searchlights and 64/24 fish remain. The Sphere now opens at the surface even with a collected dive kit; its existing descent control enters the underwater view. Close surface inspection and near-vertical viewing are enabled, and underwater rotation can look upward. Sphere/seabed collision and return-to-shore remain.

The recording showed the canvas briefly exposing the map underneath. Browser pixel probes reproduced transparent output during camera motion. A controlled A/B run found 118 affected frames among 520 with multisampled targets, and none among 446 single-sample frames. The final HDR/Bloom chain uses single-sample targets followed by FXAA; opaque focus materials use alpha hashing, preserving batched fade behavior without MSAA. No renderer monkeypatch or debug global ships. The existing research-building hover interaction was also checked in the browser.

Validation: **52/52 tests**, TypeScript, targeted ESLint, content checks and webpack production build passed. Both exported qualities pass actual triangle raycasts from the upper room to the bottom floor and the reciprocal upward view, plus continuous stair-height coverage, complete lower glazing, promenade, eight pile feet and lamp lenses. Production browser checks covered standard/lightweight surface and underwater views, day/night, close zoom and actual downward/upward orbit. The final renderer passed 1,032 standard and 504 lightweight frames with zero transparent samples or black frames; the eight-light/fish/collision regression passed in both tiers. The 390×844 lightweight view passed the kit → descent → return flow with no horizontal overflow. No script or shader errors were observed. A final exported-geometry regression also checks that a balcony can enter its stair landing through an actual gap in the outer handrail.

| Sphere asset | Triangles | Bytes | Material batches |
| --- | --- | --- | --- |
| Standard | 653,636 | 21,231,572 | 10 |
| Lightweight | 250,538 | 8,277,488 | 10 |

The complete multi-level interior increases geometry; lightweight keeps about 38% of standard triangles, with all stair treads preserved. No new package or external asset. Temporary captures, probe scripts and logs were cleaned; selected final previews are kept outside the repository. Narrow-screen checks use desktop Chromium, not a physical-phone benchmark. Existing `THREE.Clock` deprecation warning remains. No commit, push or deployment performed.

## Dive kit / conventional white equipment — 2026-10-04

Revised the equipment to the user's plain, predominantly white direction. The suit now has continuous soft sleeves/legs, rounded shoulders, dark cuffs, subtle seams and a rear zipper. A normal two-lens mask, broad white fins and a painted white cylinder with restraint bands, valve and regulator complete the kit. Small flat HAO prints remain on the suit and cylinder. Armour, holographic shaders, iridescence, screens and emissive trim were removed. The source remains `lib/world/dive-kit-model.ts`; no dependencies or external assets were added.

The inline viewer and shared inspector preserve mouse/touch rotation, arrow controls, keyboard arrows and Home/reset. Only one equipment Canvas is mounted, rendering on demand with fixed lighting. Island camera isolation, paused background and focus restoration remain unchanged. Both geometry qualities retain the complete white equipment set.

Validation of the white revision: 54/54 tests, focused geometry/material/disposal tests after the final silhouette repair, targeted ESLint, content validation, webpack production build (including TypeScript), strict UI audit (0 findings) and final diff check passed. Production Chromium sampled 31,400 / 8,288 triangles for standard / lightweight. Both qualities passed mouse and emulated touch rotation, keyboard/reset, island-camera isolation and idle demand-rendering checks. Front/back views, a 390×844 lightweight inspector and inline layout were visually checked; no horizontal overflow or navigation overlap. Escape restored focus, and collect kit → descend → return passed. No console errors. The unchanged failure/retry and reduced-motion behavior were verified in the preceding viewer implementation; they were not re-exercised for this material/geometry revision. Touch coverage is browser emulation, not physical-phone certification. Temporary captures and logs were removed; the selected preview is outside the repository. No commit, push or deployment.
