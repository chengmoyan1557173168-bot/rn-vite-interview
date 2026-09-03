# AI 使用说明（本次开发用的提示词与 harness）

> 题目提交要求：「若使用 AI 工具进行开发，需要将提示词，以及相关 harness（包括但不限于 agent, skill, mcp），一并提交到 github 中，要允许我们访问到。」
> 本文件如实记录本次开发过程中使用的 AI 提示词与工具链。

## 一、用户原始需求（提示词）

```
1) "C:\Users\admin\Downloads\p.mp4" 我是让你查看这个视频 并 react native 实现这个视频里的动效
2) 直接创建一个 rn+vite 脚手架，完成 https://yumchina.feishu.cn/docx/CEzIdKBqKoRit1xqeencJtDgn8c 根据网站里的要求完成面试题
```

## 二、任务拆解（AI 的执行框架）

1. **读需求**：获取飞书文档，解析出三道题与硬性约束（多端一致 / 至少 2 端 / 提交格式 / 48h）。
2. **素材分析**：下载题目一视觉稿，用 OpenCV 拆帧分析题目二动效视频 `p.mp4`（16.43s，480x996，22.7fps），定位「券浮层滑动 → 领券 → 暴涨 → 抛物线 → 高亮」的关键帧与布局细节。
3. **技术选型**：RN + Vite 脚手架（react-native 标准 API + react-native-web alias），同一套源码 H5 与原生 RN 双端可跑。
4. **实现**：
   - 题目一：地址列表，标签宽度自适应 / 标签可在行首或第二行结尾（≤50%）/ 地址最多两行。
   - 题目二：券浮层（滑入 + 上下滑动）+ 领券暴涨 1~4 张 + 抛物线红包（落点居中）+ 新券高亮闪烁 + 「再看一次」重置。
5. **验证**：`npm run dev` 起本地 H5，逐项检查两题交互与动效，类型检查 `tsc --noEmit`。
6. **交付**：README / 提交材料 / 题目三邮件正文。

## 三、使用的 harness（工具链）

| 类别 | 具体 harness | 用途 |
|---|---|---|
| 文档读取 | lark-doc skill（docs +fetch / +media-download） | 读取飞书机试文档、下载视觉稿图片 |
| 视频分析 | OpenCV (Python) 自定义脚本 | 抽帧、帧间差分定位动效时间点、时间线缩略图 |
| 脚手架 | Vite + react-native-web + TypeScript | RN 组件一套代码，H5/原生双端 |
| 动画 | react-native Animated（x 线性 + y 上抛下落插值） | 抛物线红包、入场、高亮闪烁 |
| 验证 | `npm run dev` / `npm run build` / `tsc --noEmit` | 本地运行与类型校验 |
| 交付 | Markdown 文档 + GitHub | 提交源码与说明 |

> 注：本次未使用第三方 MCP 服务，harness 全部为上述「文档/媒体分析 skill + 本地脚本 + Vite/RN 脚手架 + 验证命令」的组合。若贵司要求可访问的 agent 定义，可将本仓库 `docs/` 与 `src/` 作为可复现输入，提示词原文即本文件第一节。

## 四、给未来 Agent / 维护者的提示（harness 可复现说明）

- 复现动效分析：对任意动效视频，用「抽帧 + 帧间差分」先定位高差异区间，再逐帧精读，避免漏看关键动画。
- 跨端一致的关键：只使用 react-native 基础组件与 Animated，禁止平台私有 API；布局用 `numberOfLines` / `maxWidth: '50%'` 等各端均支持的属性。
