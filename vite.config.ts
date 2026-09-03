import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// RN + Vite 脚手架：
// 组件全部使用 react-native 标准 API（View/Text/Animated/ScrollView...），
// 通过 alias 把 'react-native' 映射到 'react-native-web'，即可用 Vite 打包为 H5；
// 同一套源码也可通过 Metro（RN 原生）直接运行，实现「一套代码，多端一致」。
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
  optimizeDeps: {
    include: ['react-native-web'],
  },
  server: {
    port: 5173,
    host: true,
  },
});
