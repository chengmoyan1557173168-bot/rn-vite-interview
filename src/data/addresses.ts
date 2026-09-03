// 题目一 · 地址列表数据
// 视觉稿还原：6 条地址，覆盖
//  - 地址是一个整体文本元素（自动换行，最多两行），不是独立的两行字段
//  - 标签字数不固定（宽度自适应），内联在地址文本中
//  - 标签可在行首（start），也可在第二行作为结尾（end，宽度 ≤ 50%）
//  - 第二行右侧可带附加提示（如「04:59 后餐厅停止接单」，紧跟地址文本）
// 注：视觉稿中「地址未超过一行展示 / 超过固定长度折行3」等为设计演示占位文本，
//     真实地址数据不包含这些占位，折行效果由地址文本长度自然产生。

export interface AddressTag {
  label: string;
  color: string; // 文字颜色
  bg: string; // 标签底色
  position?: 'start' | 'end'; // 默认 start：行首；end：文本流末尾（折行后落在第二行结尾）
}

export interface AddressItem {
  id: string;
  selected?: boolean;
  tags: AddressTag[];
  address: string; // 地址整体文本（单个元素内自动换行）
  extra?: { text: string; danger?: boolean }; // 紧跟地址的附加提示（如停止接单倒计时）
  phone: string; // 联系人 + 脱敏手机号
}

export const addresses: AddressItem[] = [
  {
    id: 'a1',
    tags: [
      { label: '常用', color: '#3B82F6', bg: '#EEF4FF' },
      { label: '公司', color: '#666666', bg: '#F0F0F0' },
    ],
    address: '上海市徐汇区肇嘉浜路99弄1号',
    phone: '张先生 112****3838',
  },
  {
    id: 'a2',
    tags: [
      { label: '上次下单', color: '#00A862', bg: '#E8F8F0' },
      { label: '学校', color: '#8B5CF6', bg: '#F3EFFF' },
    ],
    address: '北京市海淀区中关村大街27号',
    phone: '张先生 11212343838',
  },
  {
    // 重点：第三行 —— 地址整体换行两行（超长尾部省略）+ 紧跟的红色倒计时提示
    id: 'a3',
    tags: [
      { label: '距离最近', color: '#FF3B30', bg: '#FFEFEE' },
      { label: '父母家', color: '#FF7A00', bg: '#FFF3E6' },
    ],
    address: '上海市徐汇区肇嘉浜路99弄城开YOYO联合办公 6楼上海市徐汇区肇嘉浜路99弄',
    extra: { text: '04:59 后餐厅停止接单', danger: true },
    phone: '张先生 112****3838',
  },
  {
    // 第四行：「家」标签在行首（与距离最近并列），地址超长折两行
    id: 'a4',
    tags: [
      { label: '距离最近', color: '#FF3B30', bg: '#FFEFEE' },
      { label: '家', color: '#FF7A00', bg: '#FFF3E6' },
    ],
    address: '辽宁省大连市甘井子区大连湾街道阳光花园小区A区7号楼3单元502室',
    phone: '张先生 112****3838',
  },
  {
    // 选中态：红色勾选（视觉稿最后第二条被选中）
    id: 'a5',
    selected: true,
    tags: [
      { label: '常用', color: '#3B82F6', bg: '#EEF4FF' },
      { label: '公司', color: '#666666', bg: '#F0F0F0' },
    ],
    address: '上海市徐汇区肇嘉浜路99弄城开YOYO联合办公 6楼',
    phone: '张先生 112****3838',
  },
  {
    // 无标签：仅地址整体两行
    id: 'a6',
    tags: [],
    address: '北京市朝阳区望京街道阜通东大街6号院方恒国际中心B座15层1508室',
    phone: '张先生 112****3838',
  },
];
