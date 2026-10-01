# 夜景灯光修订 — 2026-10-01

依据用户提供的夜景照片，采用冷蓝环境、暖色道路、疏密有别的窗光；保留现有城市、交互和白昼参数。此次在已有未提交的城市重建工作上继续修改，HEAD 仍为 `112233c8`，未提交、推送或部署。

## 修改与画面证据

- 路面：沿道路方向叠加的柔和照明，替换重复白色圆斑；主路、支路、山路亮度分级，公共空间保留少量冷光。[总览](docs/night-lighting/overview.jpg)、[街道](docs/night-lighting/street.jpg)。
- 建筑：发光限制在独立窗格内，保留窗框、暗层与水平屋顶；稳定的建筑色温与楼层/房间占用率，避免整面随机方块发光。[立面](docs/night-lighting/facade.jpg)。
- 环境：冷蓝天空、雾与反射环境，压低海水、地面与山体亮度，让窗光和道路主导视觉。[天际线](docs/night-lighting/skyline.jpg)。
- 保留：白昼参数、几何、内容、项目入口均未在此修订改动；浏览器完成夜→昼→夜往返。[白昼](docs/night-lighting/day-roundtrip.jpg)。
- 手机：390 × 844、轻量模式、减少动态下实际显示与日夜切换正常。[手机夜景](docs/night-lighting/mobile-low.jpg)。这是桌面 Chrome 的窄屏模拟，非实体手机性能测试。

## 验证

- `npm test` **32/32**，`git diff --check` 通过。
- `npm run typecheck`、`npm run lint`、`npm run build:static -- --webpack` 通过，19 个静态页面生成。
- 默认 Turbopack 构建被当前环境禁止内部端口绑定；沿用仓库上一轮验收使用的 Webpack 构建完成验证，未修改构建配置。
- UI strict audit：0 findings；浏览器没有 JavaScript/WebGL 错误，保留既有 Three.Clock 弃用警告。
- 1440 × 960、DPR 1、Headless Chrome 154，本地生产构建，31.1 秒实际 render-frame 采样，包含拖动：1,863 个帧间隔，P50 **16.7 ms**、P95 **22.0 ms**、P99 **23.1 ms**、最大 **25.2 ms**。完整结果见 [performance.json](docs/night-lighting/performance.json)。移动相机时 draw calls 最大 1,045，不将这些本机结果宣称为所有设备 60 fps。
- 新构建首次进入约 **8.48 秒**；同浏览器再次标准模式进入 **1.44 秒**；首次轻量模式 shader 变体约 **6.70 秒**。首轮编译仍有等待，完整准备遮罩保留。后两次数据见 [startup.json](docs/night-lighting/startup.json)。
- 单个照明场从 512² 增为 1024² RGBA，约增加 3 MiB 原始纹理占用，覆盖机场走廊；沿用实例批次和现有两盏局部点光源。没有新增依赖或逐灯实时阴影。这是程序化照明近似，不是照片级光照、全场景反射或路径追踪。

此次代码范围：`night-lighting.ts`、`surface-materials.ts` 与四个现有场景组件（CityTerrain、CoastalEnvironment、CityReflections、CoastalWater）。生成城市版本仍为 `82283b403561`。此前城市重建的完整验收保留在 `CITY-WORLD-ACCEPTANCE.md`，本报告只补充夜景修订证据。
