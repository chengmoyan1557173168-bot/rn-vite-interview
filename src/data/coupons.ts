// 题目二 · 券浮层数据
// 券状态：claimable(可领) / claimed(已领取) / use(可立即使用) / unavailable(当前不可用)
export type CouponStatus = 'claimable' | 'claimed' | 'use' | 'unavailable';

export interface Coupon {
  id: string;
  name: string;
  price: string; // 面额/价格展示
  validity: string; // 有效期
  status: CouponStatus;
  tags?: string[]; // 角标：APP专享 / 白金会员享 / 新品尝鲜
  rule?: string; // 规则说明
  icon: string; // 券图占位（emoji 商品图）
  iconBg: string; // 券图底色
}

// 默认展示的 4 张券（用户已有的券：已领取 / 可使用）
export const coupons: Coupon[] = [
  {
    id: 'c1',
    name: '美味经典芝士风情皇家卷边披萨披萨',
    price: '39.9元',
    validity: '2025.10.29-11.29',
    status: 'claimed',
    icon: '🍕',
    iconBg: '#FFF3E6',
  },
  {
    id: 'c2',
    name: '香辣劲爆鸡米花小份10块',
    price: '10元',
    validity: '2025.10.29-2026.11.29',
    status: 'use',
    tags: ['APP专享', '白金会员享'],
    icon: '🍗',
    iconBg: '#FFEFEE',
  },
  {
    id: 'c3',
    name: '招牌香辣鸡腿堡经典套餐',
    price: '19.9元',
    validity: '2025.10.29-11.29',
    status: 'claimed',
    tags: ['新品尝鲜'],
    rule: '今日剩余3次；每周三可用',
    icon: '🍔',
    iconBg: '#EEF4FF',
  },
  {
    id: 'c4',
    name: '冰爽可乐大杯',
    price: '5元',
    validity: '2025.10.29-2026.11.29',
    status: 'use',
    tags: ['APP专享'],
    icon: '🥤',
    iconBg: '#E8F8F0',
  },
];

// 可领取券池：点击「每月领券」后从中随机选 1~4 张新增到列表
export const claimablePool: Coupon[] = [
  {
    id: 'p1',
    name: '葡式蛋挞（2只装）',
    price: '8元',
    validity: '2025.10.29-11.29',
    status: 'claimable',
    tags: ['白金会员享'],
    icon: '🥧',
    iconBg: '#FFF3E6',
  },
  {
    id: 'p2',
    name: '椒盐小酥肉大份',
    price: '15元',
    validity: '2025.10.29-2026.11.29',
    status: 'claimable',
    tags: ['APP专享'],
    rule: '仅限堂食',
    icon: '🍖',
    iconBg: '#F3EFFF',
  },
  {
    id: 'p3',
    name: '缤纷水果沙拉',
    price: '12元',
    validity: '2025.10.29-11.29',
    status: 'claimable',
    tags: ['新品尝鲜'],
    rule: '当前餐厅不可用',
    icon: '🥗',
    iconBg: '#F0F0F0',
  },
  {
    id: 'p4',
    name: '香辣鸡翅（4只装）',
    price: '18元',
    validity: '2025.10.29-11.29',
    status: 'claimable',
    tags: ['APP专享'],
    icon: '🍗',
    iconBg: '#FFEFEE',
  },
  {
    id: 'p5',
    name: '芝士薯条大份',
    price: '9元',
    validity: '2025.10.29-2026.11.29',
    status: 'claimable',
    icon: '🍟',
    iconBg: '#FFF3E6',
  },
  {
    id: 'p6',
    name: '抹茶冰淇淋',
    price: '6元',
    validity: '2025.10.29-11.29',
    status: 'claimable',
    tags: ['新品尝鲜'],
    icon: '🍦',
    iconBg: '#E8F8F0',
  },
];
