# 文生叠雕生成器 (Sculpture Generator)

从 `layer-splitter-vue` 中抽取出来的独立「文生叠雕」功能。输入一段中文描述，自动润色并并行生成 5 层叠雕：每层都带有矢量化的激光切割轮廓和 UV 喷印位图，可单独下载或合成导出。

## 功能

- **AI 提示词润色**：把一句口语化描述拆成 5 层（底部前景 / 侧边前景 / 主体 / 中景 / 背景天空）结构化提示词。
- **批量生图**：调用 `fal-ai/nano-banana-2` 并行生成 5 层带黑框的合规位图。
- **自动矢量化**：L1–L4 自动走 imagetracerjs 抽取切割路径。
- **3D 叠加预览**：透视 / 鼠标拖拽 / 滚轮调层距。
- **多种导出**：单层 PNG / SVG、叠加 PNG、分组 SVG、UV+切割一体 SVG、以及每层独立的 UV+切割 SVG。
- **多画幅**：1:1 / 16:9 / 4:3（黑框自动同步）。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置 FAL key（用于生图）
cp .env.example .env.local
# 编辑 .env.local，填入 VITE_FAL_KEY=xxxx

# 3. 启动
npm run dev        # → http://localhost:5176

# 4. 打包
npm run build      # → dist/
```

`dev` / `preview` 下 `/api/ai-proxy` 由 Vite 反代到 `https://ai-gateway-test.xtool.com`；线上由 Vercel `api/ai-proxy/[...path].js` 转发，浏览器始终同源请求，避免带 `Authorization` 时的 CORS。

## Vercel 部署

1. 将本仓库导入 [Vercel](https://vercel.com)（Framework Preset 选 **Vite**，或依赖根目录的 `vercel.json`）。
2. 在 Project → Settings → Environment Variables 中为 **Production / Preview** 添加 `VITE_FAL_KEY`（与本地 `.env.local` 相同）。
3. 部署完成后访问分配的 `*.vercel.app` 域名即可。

构建产物为 `dist/`；`public/bridge.js` 会原样输出到站点根目录，供嵌入宿主页面使用。

## 目录结构

```
./
├─ index.html
├─ public/
│  └─ bridge.js                # Generator Bridge SDK（父页面通讯），构建时复制到 dist 根目录
├─ vite.config.js
├─ vercel.json                 # Vercel 构建配置
├─ package.json
└─ src/
   ├─ main.js
   ├─ App.vue                  # 顶栏 + Toast + SculpturePage
   ├─ assets/
   │  └─ black-frame.png       # 固定参考黑框
   ├─ components/
   │  └─ SculpturePage.vue     # 三栏布局：输入 / 3D 预览 / 单层卡片
   ├─ composables/
   │  └─ useSculpture.js       # 系统提示词 + 生图 + 合成 + 矢量化 + 导出
   └─ stores/
      └─ sculptureStore.js     # Pinia 状态 + pipeline 编排
```

## 依赖

- `vue` ^3.5 + `pinia`
- `@fal-ai/client` — 文生图
- `imagetracerjs` — 位图 → SVG

## 来源

从 `../layer-splitter-vue/` 中抽出，仅保留「文生叠雕」一条支线，删除了「图片分图层」相关的 TopBar / InfiniteCanvas / RightPanel / layerStore / useApi / useCanvas。
