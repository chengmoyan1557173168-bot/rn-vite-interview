// 全局主题色板（两题共用）
export const Colors = {
  primary: '#FF3B30', // 品牌红（按钮 / 选中态 / 强调）
  primaryDark: '#E0352B',
  danger: '#FF3B30',
  bg: '#F4F5F7', // 页面背景
  card: '#FFFFFF',
  textMain: '#1A1A1A', // 主文字
  textSub: '#999999', // 次要文字
  textPrice: '#FF3B30',
  line: '#F0F0F0',
  mask: 'rgba(0,0,0,0.45)',
  highlight: '#FFE9E7', // 券高亮底色
};

// 标签配色（题目一：标签字数不固定、颜色各异，宽度自适应）
export const TagColors = {
  red: { color: '#FF3B30', bg: '#FFEFEE' },
  orange: { color: '#FF7A00', bg: '#FFF3E6' },
  blue: { color: '#3B82F6', bg: '#EEF4FF' },
  gray: { color: '#666666', bg: '#F0F0F0' },
  green: { color: '#00A862', bg: '#E8F8F0' },
  purple: { color: '#8B5CF6', bg: '#F3EFFF' },
} as const;
