import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme';
import { addresses, AddressItem, AddressTag } from '../data/addresses';

// ============================================================
// 题目一：还原左侧视觉稿（地址选择列表）
//
// 节能实现（二分查找 + 测量期隐藏）：
//  - 地址文本与尾部提示标签内联在同一个 Text 元素中（同行流，不拆 flex 块）
//  - 用一个隐藏测量 Text（无 numberOfLines）渲染指定长度的地址，onLayout 测真实高度
//  - 二分查找最大可容纳长度：完整地址能放下则不截短；否则在 [0, fullLen) 内二分，
//    每次测量中间长度的高度，调整边界，约 log2(n) 次渲染即可收敛（远优于逐字截短 O(n)）
//  - 测量完成前可见 Text 不渲染，用户看不到「先全显示再截取」的闪烁过程
//  - 行首标签字数不固定，内联在地址 Text 中，宽度随内容自适应
// 全部使用 react-native 标准 API，RN 原生 / H5 表现一致
// ============================================================

const LINE_HEIGHT = 23;
const MAX_TWO_LINE_HEIGHT = LINE_HEIGHT * 2 + 10; // 两行高度 + 标签行高差异余量

type Phase = 'init' | 'searching' | 'done';

// 内联标签
function InlineTag({ tag }: { tag: AddressTag }) {
  return (
    <Text style={[styles.inlineTag, { color: tag.color, backgroundColor: tag.bg }]}>
      {tag.label}
    </Text>
  );
}

// 单选圈
function RadioCircle({ selected }: { selected?: boolean }) {
  return (
    <View style={[styles.radio, selected && styles.radioOn]}>
      {selected ? <View style={styles.radioDot} /> : null}
    </View>
  );
}

// 编辑图标
function EditIcon() {
  return (
    <View style={styles.editIcon}>
      <Text style={styles.editIconText}>✎</Text>
    </View>
  );
}

// 渲染地址 Text 内容（行首标签 + 地址文本 + 省略号 + 尾部提示）
function renderAddressContent(item: AddressItem, addressText: string, truncated: boolean) {
  return (
    <>
      {item.tags.map((t) => (
        <InlineTag key={t.label} tag={t} />
      ))}
      {addressText}
      {truncated ? <Text style={styles.ellipsis}>…</Text> : null}
      {item.extra ? (
        <Text style={[styles.extraInline, item.extra.danger ? styles.extraInlineDanger : null]}>
          {item.extra.text}
        </Text>
      ) : null}
    </>
  );
}

// 单条地址
function AddressRow({ item }: { item: AddressItem }) {
  const fullAddress = item.address;
  const fullLen = fullAddress.length;

  const [phase, setPhase] = useState<Phase>('init');
  const [currentLen, setCurrentLen] = useState(fullLen); // 隐藏测量 Text 当前渲染的长度
  const [bestLen, setBestLen] = useState(0); // 二分查找得到的最大可行长度
  const [ready, setReady] = useState(false); // 测量完成，可显示可见 Text
  const [tick, setTick] = useState(0); // 高度未就绪时的轮询触发

  const boundsRef = useRef({ low: 0, high: fullLen });
  const measureHeightRef = useRef(0);

  // 地址数据变化时重置
  useEffect(() => {
    setPhase('init');
    setCurrentLen(fullLen);
    setBestLen(0);
    setReady(false);
    boundsRef.current = { low: 0, high: fullLen };
  }, [fullAddress, fullLen]);

  // 隐藏测量 Text onLayout：记录真实高度
  const handleMeasureLayout = (e: any) => {
    measureHeightRef.current = e.nativeEvent.layout.height;
  };

  // 二分查找状态机：init（测完整地址）→ searching（二分收敛）→ done
  useEffect(() => {
    if (phase === 'done') return;
    const timer = setTimeout(() => {
      const h = measureHeightRef.current;
      if (h === 0) {
        setTick((t) => t + 1); // 高度尚未测量，轮询重试
        return;
      }
      const fits = h <= MAX_TWO_LINE_HEIGHT;

      if (phase === 'init') {
        if (fits) {
          // 完整地址就能放下，不截短
          setBestLen(fullLen);
          setReady(true);
          setPhase('done');
        } else {
          // 完整地址超两行，开始二分查找
          boundsRef.current = { low: 0, high: fullLen - 1 };
          const mid = Math.floor((0 + fullLen - 1) / 2);
          setCurrentLen(Math.max(0, mid));
          setPhase('searching');
        }
      } else if (phase === 'searching') {
        let { low, high } = boundsRef.current;
        if (fits) {
          // currentLen 可行，记录并尝试更长
          setBestLen(currentLen);
          low = currentLen + 1;
        } else {
          // currentLen 不可行，尝试更短
          high = currentLen - 1;
        }
        boundsRef.current = { low, high };
        if (low > high) {
          // 二分收敛，bestLen 即为最大可行长度
          setReady(true);
          setPhase('done');
        } else {
          const mid = Math.floor((low + high) / 2);
          setCurrentLen(Math.max(0, mid));
        }
      }
    }, 16);
    return () => clearTimeout(timer);
  }, [phase, currentLen, fullLen, tick]);

  // 最终显示的地址文本与截短标记
  const displayAddress = ready ? fullAddress.slice(0, bestLen) : '';
  const truncated = ready && bestLen < fullLen;

  return (
    <TouchableOpacity activeOpacity={0.7} style={styles.row}>
      <RadioCircle selected={item.selected} />

      <View style={styles.body}>
        {/* 地址行：最小高度两行，避免测量期间跳动 */}
        <View style={styles.addressRow}>
          {/* 隐藏测量 Text：key 随 currentLen 变化强制重建，确保 onLayout 重新触发 */}
          <Text
            key={currentLen}
            style={[styles.address, styles.measureText]}
            onLayout={handleMeasureLayout}
          >
            {renderAddressContent(item, fullAddress.slice(0, currentLen), currentLen < fullLen)}
          </Text>

          {/* 可见 Text：测量完成后才渲染，避免闪烁 */}
          {ready ? (
            <Text style={styles.address}>
              {renderAddressContent(item, displayAddress, truncated)}
            </Text>
          ) : null}
        </View>

        <Text style={styles.phone} numberOfLines={1}>
          {item.phone}
        </Text>
      </View>

      <EditIcon />
    </TouchableOpacity>
  );
}

export default function Q1AddressList() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>选择收货地址</Text>
        <Text style={styles.headerSub}>题目一 · 地址列表视觉稿还原</Text>
      </View>
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {addresses.map((item) => (
          <AddressRow key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.line,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.textMain },
  headerSub: { fontSize: 12, color: Colors.textSub, marginTop: 4 },
  list: { flex: 1 },
  listContent: { paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.line,
  },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#C9C9C9',
    marginTop: 2, marginRight: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  body: { flex: 1, marginRight: 12 },
  // 地址行：相对定位 + 最小高度两行，避免测量期间跳动
  addressRow: {
    position: 'relative',
    minHeight: LINE_HEIGHT * 2,
  },
  address: {
    fontSize: 16,
    color: Colors.textMain,
    fontWeight: '500',
    lineHeight: LINE_HEIGHT,
  },
  // 隐藏测量 Text：绝对定位、不可见、不占空间
  measureText: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    opacity: 0,
  },
  // 内联标签（行首）
  inlineTag: {
    fontSize: 11,
    fontWeight: '500',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 6,
  },
  // 省略号
  ellipsis: { fontSize: 16, color: Colors.textMain },
  // 内联尾部提示
  extraInline: {
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
    overflow: 'hidden',
  },
  extraInlineDanger: {
    color: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: '#FFF5F4',
    fontWeight: '500',
  },
  phone: { marginTop: 12, fontSize: 13, color: Colors.textSub },
  editIcon: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1, borderColor: '#FFD9D6',
    backgroundColor: '#FFF1F0',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  editIconText: { fontSize: 14, color: Colors.primary },
  tip: {
    paddingHorizontal: 16, paddingTop: 12,
    fontSize: 12, color: Colors.textSub, lineHeight: 18,
  },
});
