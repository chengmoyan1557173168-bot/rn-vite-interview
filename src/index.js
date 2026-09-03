// 原生 React Native 入口（Metro）：
// 若要在 iOS/Android 上运行，复制本文件为 index.js，
// 并执行 `npx react-native start` 即可加载同一套 App 组件。
import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('Main', () => App);
