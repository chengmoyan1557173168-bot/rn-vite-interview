// Web 端入口（Vite / react-native-web）
// 原生 RN 端请使用 src/index.js 通过 AppRegistry 启动，两者共享同一套 App 组件。
import { AppRegistry } from 'react-native';
import { createRoot } from 'react-dom/client';
import App from './App';

// react-native-web 的 Animated 实现内部引用了 global，浏览器环境需补全
(window as any).global = window;

AppRegistry.registerComponent('Main', () => App);

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<App />);
}
