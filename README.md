# 前端机试 v20260813 · RN + Vite 脚手架

本仓库用于完成「前端机试_v20260813」三道题：

| 题目 | 内容 | 落地位置 |
|---|---|---|
| 题目一 | 还原视觉稿（地址选择列表：标签自适应宽度、地址最多两行、标签可在行首或第二行结尾≤50%） | `src/components/Q1AddressList.tsx` |
| 题目二 | 还原动效（券浮层上下滑动 + 领券暴涨 1~4 张 + 抛物线落点居中 + 新券高亮闪烁） | `src/components/Q2CouponSheet.tsx` |
| 题目三 | 邮件正文回答「平时如何使用 AI 工具」 | `docs/ANSWER_Q3.md` |

## 技术栈与多端策略

- **React Native**：全部组件使用 RN 标准 API（`View / Text / Animated / ScrollView / StyleSheet`），不依赖任何平台私有能力。
- **Vite + react-native-web**：`vite.config.ts` 中把 `react-native` alias 到 `react-native-web`，同一套源码用 Vite 打包即为 H5。
- **原生 RN**：`src/index.js` 通过 `AppRegistry` 注册，可用 Metro 直接跑 iOS / Android，组件代码零改动。
- **其余端（微信/支付宝/抖音小程序）**：由于组件全部为纯 RN 组件，可直接接入 Taro（React 语法）或复制组件逻辑到各小程序框架；核心布局与动画均只依赖 RN 基础组件，跨端表现一致。

> 题目要求「最终代码在 RN、微信、H5、支付宝、抖音的表现尽可能一致；时间不足完成 2 端即可」。本仓库以 **RN + H5** 两端落地（代码可在两端零改动运行）。

## 快速开始

```bash
npm install
npm run dev      # H5 开发预览 → http://localhost:5173
npm run build    # 打包 H5 产物（dist/）
npm run preview  # 预览构建产物
```

## 目录结构

```
.
├── index.html                 # H5 入口
├── vite.config.ts             # Vite + react-native alias
├── src/
│   ├── main.tsx               # H5 入口（createRoot 渲染）
│   ├── index.js               # 原生 RN 入口（AppRegistry，Metro 用）
│   ├── App.tsx                # 两题切换
│   ├── theme.ts               # 主题色板
│   ├── data/
│   │   ├── addresses.ts       # 题目一：地址数据（含标签位置规则）
│   │   └── coupons.ts         # 题目二：优惠券数据
│   └── components/
│       ├── Q1AddressList.tsx  # 题目一：地址列表
│       └── Q2CouponSheet.tsx  # 题目二：券浮层 + 领券动效
└── docs/
    ├── ANSWER_Q3.md           # 题目三：AI 使用回答（可直接用于邮件正文）
    ├── AI_PROMPTS.md          # 本次开发使用的 AI 提示词与 harness 说明
    └── PROBLEM_NOTES.md       # 题目拆解与实现说明
```

## 题目一实现说明（地址列表）

- 标签宽度随字数自适应（`padding` 包裹 + `flexShrink: 0`）。
- 标签位置支持 `start`（行首）与 `end`（第二行结尾）；`end` 标签 `maxWidth: '50%'`。
- 地址最多两行（`line1` / `line2`，各 `numberOfLines={1}` + 省略号）。
- 第二行右侧支持附加提示（红色倒计时等）。
- 已还原视觉稿全部 6 条数据，含选中态（红色单选圆点）与「04:59 后餐厅停止接单」重点行。

## 题目二实现说明（券浮层动效）

1. 券浮层从底部滑入（`translateY` 动画），遮罩淡入，点击遮罩/× 关闭。
2. 券列表在 `ScrollView` 内上下滑动。
3. 点击「一键领券」→ 按钮变「领券中...」→ 弹出「成功领取 N 张券」。
4. **暴涨 1~4 张新券**：随机 N，从可领券中随机选 N 张作为目标。
5. **抛物线红包**：红色「券」图标从 toast 中心飞出，`x` 线性、`y` 按上抛-下落曲线（`y(p) = y0 + (y1-y0)p² - 4·lift·p(1-p)`），**落点精确落在目标券图正中间**（通过 `onLayout` 记录券位置 + 当前 `scrollY` 计算可视坐标）。
6. **新券高亮闪烁**：红包落地后目标券变「已领取」并高亮闪烁 3 次。
7. 底部按钮变「再看一次」，点击重置本次领取以便重复观看动画。

## 交互验证

- 题目一：切换到底部 Tab「题目一 · 地址列表」查看完整列表。
- 题目二：切到「题目二 · 券浮层动效」→ 点击「打开优惠中心」→ 点击「一键领券」观看暴涨动画，可反复点击「再看一次」重放。
