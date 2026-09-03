import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Modal,
} from 'react-native';
import { Colors } from '../theme';
import { Coupon, CouponStatus, coupons as seedCoupons, claimablePool } from '../data/coupons';

// ============================================================
// 题目二：还原左侧动效（优惠券浮层）
// 触发逻辑（严格按视频）：
//  - 列表顶部有一张「每月领券」卡片，点击它触发领券暴涨
//  - 点击后：底部按钮变为「领券中...」
//  - 完成后：弹出「成功领取 N 张券」，红包从「每月领券」处分裂、横向散开飞向各目标券正中
//  - 落地后：领到的券变「已领取」并高亮闪烁几次；「每月领券」卡片消失
//  - 底部按钮变为「再看一次」，点击后重置整个页面
//  - 普通券的「领券」按钮与底部「一键领券」均不是暴涨触发点
// 两阶段动画：阶段1到分列位置 → 卡片消失 → 读取最新布局 → 阶段2飞向券图中心（定位100%准确）
// 全部使用 react-native 标准 API（Animated），RN 原生 / H5 表现一致
// ============================================================

const { width: SCREEN_W } = Dimensions.get('window');
const PACKET_SIZE = 46;
const MAX_CLAIM = 4;
const SPREAD_GAP = 55; // 向右分列的间距
const PHASE1_DURATION = 1800; // 阶段1：出发→分列位置（慢）
const PHASE2_DURATION = 1200; // 阶段2：分列位置→券图中心

interface PacketConfig {
  key: number;
  fromX: number; // 绝对坐标（红包左上角）
  fromY: number;
  toX: number;
  toY: number;
  duration: number;
  scaleFrom: number;
  scaleTo: number;
  rotateFrom: string;
  rotateTo: string;
  lift: number; // 抛物线高度
  targetId: string;
}

// ---------- 通用飞行红包：from→to 直线/抛物线动画 ----------
function FlyingPacket({ cfg, onDone }: { cfg: PacketConfig; onDone: (id: string) => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  const doneRef = useRef(false);

  const handleDone = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone(cfg.targetId);
  }, [cfg.targetId, onDone]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [cfg.fromX, cfg.toX],
  });

  // 抛物线 y：中间抬高 lift
  const translateY = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [cfg.fromY, cfg.fromY - cfg.lift, cfg.toY],
  });

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [cfg.scaleFrom, cfg.scaleTo],
  });

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [cfg.rotateFrom, cfg.rotateTo],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.15, 1],
    outputRange: [0, 1, 1],
  });

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: cfg.duration,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) handleDone();
    });
    // 兜底：duration + 150ms 后强制完成，防止 Animated 回调偶发未触发导致红包残留
    const timer = setTimeout(handleDone, cfg.duration + 150);
    return () => {
      anim.stop();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.packet,
        {
          left: 0,
          top: 0,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }, { rotate }],
        },
      ]}
    >
      <Text style={styles.packetText}>券</Text>
    </Animated.View>
  );
}

// ---------- 每月领券卡片（列表顶部，暴涨触发点） ----------
function MonthlyClaimCard({ visible, claiming, onLayout, onPress }: {
  visible: boolean;
  claiming: boolean;
  onLayout: (y: number, h: number) => void;
  onPress: () => void;
}) {
  if (!visible) return null;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={claiming}
      onPress={onPress}
      style={styles.monthlyCard}
      onLayout={(e) => onLayout(e.nativeEvent.layout.y, e.nativeEvent.layout.height)}
    >
      <View style={styles.monthlyIcon}>
        <Text style={styles.monthlyIconText}>🎁</Text>
      </View>
      <View style={styles.monthlyInfo}>
        <Text style={styles.monthlyTitle}>每月领券</Text>
        <Text style={styles.monthlyDesc}>每月可领专属券包，最高可领4张</Text>
      </View>
      <View style={[styles.monthlyBtn, claiming && styles.monthlyBtnDisabled]}>
        <Text style={styles.monthlyBtnText}>{claiming ? '领券中...' : '立即领取'}</Text>
      </View>
      </TouchableOpacity>
  );
}

// ---------- 普通券卡片 ----------
interface CouponCardProps {
  coupon: Coupon;
  flashKey: number;
  onLayout: (id: string, x: number, y: number, w: number, h: number) => void;
  onFlashDone: (id: string) => void;
}

function CouponCard({ coupon, flashKey, onLayout, onFlashDone }: CouponCardProps) {
  const flash = useRef(new Animated.Value(0)).current;
  const prevFlashKey = useRef(0);

  useEffect(() => {
    if (flashKey <= 0 || flashKey === prevFlashKey.current) return;
    prevFlashKey.current = flashKey;
    flash.setValue(0);
    const breathe = () =>
      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: 140, useNativeDriver: false }),
        Animated.timing(flash, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]);
    Animated.sequence([breathe(), breathe(), breathe()]).start(() => onFlashDone(coupon.id));
  }, [flashKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusMap: Record<CouponStatus, { label: string; disabled: boolean }> = {
    claimable: { label: '领券', disabled: true },
    claimed: { label: '已领取', disabled: true },
    use: { label: '立即使用', disabled: true },
    unavailable: { label: '不可用', disabled: true },
  };
  const { label, disabled } = statusMap[coupon.status];
  const isClaimed = coupon.status === 'claimed';

  return (
    <View
      style={styles.couponCard}
      onLayout={(e) => {
        const { x, y, width, height } = e.nativeEvent.layout;
        onLayout(coupon.id, x, y, width, height);
      }}
    >
      <Animated.View pointerEvents="none" style={[styles.flashOverlay, { opacity: flash }]} />
      <View style={[styles.couponIcon, { backgroundColor: coupon.iconBg }]}>
        <Text style={styles.couponIconText}>{coupon.icon}</Text>
        {isClaimed ? (
          <View style={styles.claimedStamp}>
            <Text style={styles.claimedStampText}>已领取</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.couponInfo}>
        <Text style={styles.couponName} numberOfLines={2}>
          {coupon.name}
        </Text>
        <View style={styles.couponMetaRow}>
          <Text style={styles.couponPrice}>{coupon.price}</Text>
          <Text style={styles.couponValidity} numberOfLines={1}>
            {coupon.validity}
          </Text>
        </View>
        {coupon.tags && coupon.tags.length ? (
          <View style={styles.couponTags}>
            {coupon.tags.map((t) => (
              <View key={t} style={styles.couponTag}>
                <Text style={styles.couponTagText}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {coupon.rule ? (
          <Text style={styles.couponRule} numberOfLines={1}>
            规则说明：{coupon.rule}
          </Text>
        ) : null}
      </View>
      <View style={styles.couponAction}>
        <View style={[styles.couponBtn, disabled && styles.couponBtnDisabled]}>
          <Text style={[styles.couponBtnText, disabled && styles.couponBtnTextDisabled]}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

// ---------- 主组件：券浮层 ----------
interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function Q2CouponSheet({ visible, onClose }: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>(seedCoupons);
  const [phase, setPhase] = useState<'idle' | 'claiming' | 'success'>('idle');
  const [monthlyVisible, setMonthlyVisible] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [phase1Packets, setPhase1Packets] = useState<PacketConfig[]>([]);
  const [phase2Packets, setPhase2Packets] = useState<PacketConfig[]>([]);
  const [claimedFlash, setClaimedFlash] = useState<Record<string, number>>({});

  const sheetAnim = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;
  const listLayouts = useRef<Record<string, { x: number; y: number; w: number; h: number }>>({});
  const monthlyLayout = useRef<{ y: number; h: number }>({ y: 0, h: 100 });
  const scrollYVal = useRef(0);
  const overlaySize = useRef({ w: SCREEN_W, h: 0 });
  const claimedPool = useRef<Coupon[]>([]);
  const claimedCount = useRef(0);
  const pendingFlash = useRef<string[]>([]);
  const flashCounter = useRef(0);
  // 动画状态（跨阶段共享）
  const animState = useRef({
    targets: [] as Coupon[],
    startX: 0,
    startY: 0,
    midX: 0,
    midY: 0,
    cardOccupy: 0,
    phase1Done: 0,
    phase2Started: false,
    // 阶段1启动时记录的券布局快照（卡片在时的位置），阶段2统一用此值减 cardOccupy
    targetLayouts: {} as Record<string, { x: number; y: number; h: number }>,
  });

  useEffect(() => {
    if (visible) {
      sheetAnim.setValue(0);
      Animated.timing(sheetAnim, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    } else {
      Animated.timing(sheetAnim, { toValue: 0, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: false }).start();
    }
  }, [visible]);

  const recordListLayout = useCallback((id: string, x: number, y: number, w: number, h: number) => {
    listLayouts.current[id] = { x, y, w, h };
  }, []);

  const recordMonthlyLayout = useCallback((y: number, h: number) => {
    monthlyLayout.current = { y, h };
  }, []);

  const recordOverlay = useCallback((e: any) => {
    const { width, height } = e.nativeEvent.layout;
    overlaySize.current = { w: width, h: height };
  }, []);

  // 阶段2单个红包落地：目标券变为已领取 + 高亮闪烁，红包消失
  const onPhase2Done = useCallback((id: string) => {
    flashCounter.current += 1;
    const batch = flashCounter.current;
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'claimed' as CouponStatus } : c)));
    setClaimedFlash((prev) => ({ ...prev, [id]: batch }));
    setPhase2Packets((prev) => prev.filter((p) => p.targetId !== id));
  }, []);

  // 阶段1全部结束：每月领券卡片消失 → 等待200ms → 启动阶段2（用卡片在时的布局提前减去上移距离，定位准确）
  const onPhase1Done = useCallback((_id: string) => {
    const st = animState.current;
    if (st.phase2Started) return; // 防重入：阶段2已启动则忽略后续回调
    st.phase1Done += 1;
    if (st.phase1Done < st.targets.length) return;
    st.phase2Started = true; // 标记阶段2已启动，防止重复执行

    // 每月领券卡片消失（无动画）
    setMonthlyVisible(false);

    // 等待200ms让React渲染完成，然后启动阶段2
    // 注意：卡片消失后券上移，但 onLayout 可能不触发（纯位置变化），
    // 所以用卡片在时的布局 lay.y 提前减去 cardOccupy（卡片高度+margin）得到卡片消失后的真实位置
    setTimeout(() => {
      const p2 = st.targets.map((t, idx) => {
        const snap = st.targetLayouts[t.id] ?? { x: 12, y: 100, h: 96 };
        const cur = listLayouts.current[t.id];
        const yChanged = cur && Math.abs(cur.y - snap.y) > 1;
        const finalX = yChanged ? cur.x : snap.x;
        const finalY = yChanged ? cur.y : snap.y - st.cardOccupy;
        // 图标在行内垂直居中，中心 = 卡片y + 卡片高度/2（高度不随卡片消失而变化）
        const cardH = (yChanged ? cur.h : snap.h) || 96;
        const centerX = finalX + 48 - PACKET_SIZE / 2;
        const centerY = finalY + cardH / 2 - scrollYVal.current - PACKET_SIZE / 2;
        return {
          key: Date.now() + 1000 + idx,
          fromX: st.midX + idx * SPREAD_GAP - PACKET_SIZE / 2,
          fromY: st.midY - PACKET_SIZE / 2,
          toX: centerX,
          toY: centerY,
          duration: PHASE2_DURATION,
          scaleFrom: 1,
          scaleTo: 1,
          rotateFrom: '0deg',
          rotateTo: '-45deg',
          lift: 60,
          targetId: t.id,
        };
      });
      setPhase1Packets([]);
      setPhase2Packets(p2);
      // 兜底：阶段2动画结束后500ms强制清空所有红包，防止回调未触发导致残留
      setTimeout(() => {
        setPhase1Packets([]);
        setPhase2Packets([]);
      }, PHASE2_DURATION + 500);
    }, 200);
  }, []);

  // 点击「每月领券」触发暴涨
  const handleClaimMonthly = useCallback(() => {
    if (phase !== 'idle' || !monthlyVisible) return;

    setPhase('claiming');

    setTimeout(() => {
      // 从可领取券池随机选 1~4 张
      const n = Math.min(Math.max(1, Math.floor(Math.random() * MAX_CLAIM) + 1), claimablePool.length);
      const targets = [...claimablePool].sort(() => Math.random() - 0.5).slice(0, n);
      claimedPool.current = targets;
      claimedCount.current = n;

      // 新增券插入列表顶部
      setCoupons((prev) => [
        ...targets.map((t) => ({ ...t, status: 'claimable' as CouponStatus })),
        ...prev,
      ]);

      const boxW = overlaySize.current.w;
      const ml = monthlyLayout.current;
      // 起点：每月领券卡片顶部 2/3 处（水平居中）
      const startX = boxW / 2 - PACKET_SIZE / 2;
      const startY = ml.y - scrollYVal.current + (ml.h * 2) / 3 - PACKET_SIZE / 2;
      // 分列基准：每月领券卡片中心
      const midX = boxW / 2 - PACKET_SIZE / 2;
      const midY = ml.y - scrollYVal.current + ml.h / 2 - PACKET_SIZE / 2;

      // 保存到 animState（跨阶段共享）
      const cardOccupy = ml.h + 12; // 卡片消失后券上移距离（卡片高度 + marginVertical 6*2）
      const st = animState.current;
      st.targets = targets;
      st.startX = startX;
      st.startY = startY;
      st.midX = midX;
      st.midY = midY;
      st.cardOccupy = cardOccupy;
      st.phase1Done = 0;
      st.phase2Started = false;

      // 防重入：布局轮询与5秒兜底都会调用 launch，只允许真正启动一次，
      // 否则兜底定时器会在动画结束后重新挂载一批红包，造成残留闪现
      let launched = false;
      const launch = () => {
        if (launched) return;
        launched = true;
        // 记录卡片在时的券布局快照（含高度，用于计算图标垂直居中位置）
        const snap: Record<string, { x: number; y: number; h: number }> = {};
        for (const t of targets) {
          const l = listLayouts.current[t.id];
          if (l) snap[t.id] = { x: l.x, y: l.y, h: l.h };
        }
        st.targetLayouts = snap;

        // 阶段1：从起点向右分列到卡片中心位置，scale 从 0→1
        const p1 = targets.map((t, idx) => ({
          key: Date.now() + idx,
          fromX: startX,
          fromY: startY,
          toX: midX + idx * SPREAD_GAP,
          toY: midY,
          duration: PHASE1_DURATION,
          scaleFrom: 0,
          scaleTo: 1,
          rotateFrom: '0deg',
          rotateTo: '0deg',
          lift: 0,
          targetId: t.id,
        }));
        setPhase1Packets(p1);
        pendingFlash.current = targets.map((t) => t.id);
      };

      // 轮询：连续2次检测到布局相同才启动
      let stableCount = 0;
      let lastSnapshot = '';
      const waitLayout = setInterval(() => {
        const allReady = targets.every((t) => listLayouts.current[t.id]);
        if (!allReady) { stableCount = 0; return; }
        const snapshot = targets.map((t) => {
          const l = listLayouts.current[t.id];
          return `${t.id}:${l.x},${l.y}`;
        }).join('|');
        if (snapshot === lastSnapshot) {
          stableCount += 1;
        } else {
          stableCount = 1;
          lastSnapshot = snapshot;
        }
        if (stableCount >= 2) {
          clearInterval(waitLayout);
          launch();
        }
      }, 60);

      // 兜底：5秒后强制启动
      setTimeout(() => {
        clearInterval(waitLayout);
        launch();
      }, 5000);
    }, 800);
  }, [phase, monthlyVisible]);

  // 单张券闪烁结束：所有券闪烁结束后才提示成功领券
  const onFlashDone = useCallback((id: string) => {
    pendingFlash.current = pendingFlash.current.filter((x) => x !== id);
    if (pendingFlash.current.length > 0) return;
    setToast(`成功领取 ${claimedCount.current} 张券`);
    toastAnim.setValue(0);
    Animated.timing(toastAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.back(1.6)), useNativeDriver: false }).start();
    setTimeout(() => {
      setToast(null);
      setPhase1Packets([]);
      setPhase2Packets([]);
      setPhase('success');
    }, 1500);
  }, []);

  // 「再看一次」：重置整个页面
  const handleReplay = useCallback(() => {
    const pool = claimedPool.current;
    setCoupons((prev) => prev.filter((c) => !pool.some((p) => p.id === c.id)));
    // 清掉被移除券的布局缓存，防止下次领取时读到上一轮的过期位置
    pool.forEach((p) => delete listLayouts.current[p.id]);
    animState.current.targetLayouts = {};
    claimedPool.current = [];
    claimedCount.current = 0;
    setClaimedFlash({});
    setMonthlyVisible(true);
    setPhase('idle');
    setToast(null);
    setPhase1Packets([]);
    setPhase2Packets([]);
  }, []);

  const sheetTranslateY = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [560, 0] });
  const tabs = ['我的优惠券', '付费会员', '代金券', '领券'];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Animated.View
          style={[styles.mask, { opacity: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }]}
        >
          <TouchableOpacity style={styles.maskTouch} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
          <View style={styles.grabber} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetTitle}>优惠中心</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tabBar}>
              {tabs.map((t, i) => (
                <Text key={t} style={[styles.tab, i === tabs.length - 1 && styles.tabActive]}>
                  {t}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.listWrapper} onLayout={recordOverlay}>
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(e: any) => {
                scrollYVal.current = e.nativeEvent.contentOffset.y;
              }}
            >
              <MonthlyClaimCard
                visible={monthlyVisible}
                claiming={phase === 'claiming'}
                onLayout={recordMonthlyLayout}
                onPress={handleClaimMonthly}
              />

              {coupons.map((c) => (
                <CouponCard
                  key={c.id}
                  coupon={c}
                  flashKey={claimedFlash[c.id] ?? 0}
                  onLayout={recordListLayout}
                  onFlashDone={onFlashDone}
                />
              ))}
              <View style={styles.listFooter}>
                <Text style={styles.listFooterText}>— 已展示全部优惠券 —</Text>
              </View>
            </ScrollView>

            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              {toast ? (
                <Animated.View
                  style={[
                    styles.toast,
                    {
                      opacity: toastAnim,
                      transform: [{ scale: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
                    },
                  ]}
                >
                  <Text style={styles.toastText}>{toast}</Text>
                </Animated.View>
              ) : null}
              {phase1Packets.map((p) => (
                <FlyingPacket key={p.key} cfg={p} onDone={onPhase1Done} />
              ))}
              {phase2Packets.map((p) => (
                <FlyingPacket key={p.key} cfg={p} onDone={onPhase2Done} />
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={phase !== 'success'}
              onPress={phase === 'success' ? handleReplay : undefined}
              style={[
                styles.footerBtn,
                phase === 'claiming' && styles.footerBtnLoading,
                phase === 'idle' && styles.footerBtnIdle,
              ]}
            >
              <Text style={styles.footerBtnText}>
                {phase === 'claiming' ? '领券中...' : phase === 'success' ? '再看一次' : '一键领券'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  mask: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.mask },
  maskTouch: { flex: 1 },
  sheet: {
    backgroundColor: '#F6F7F9',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9D9D9',
    marginTop: 8,
  },
  sheetHeader: { backgroundColor: '#FFFFFF', paddingBottom: 4 },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  sheetTitle: { fontSize: 17, fontWeight: '600', color: Colors.textMain },
  closeBtn: {
    position: 'absolute',
    right: 14,
    top: 6,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 24, color: Colors.textSub },
  tabBar: { flexDirection: 'row', paddingHorizontal: 8 },
  tab: { flex: 1, textAlign: 'center', fontSize: 14, color: Colors.textSub, paddingVertical: 8 },
  tabActive: { color: Colors.primary, fontWeight: '600', borderBottomWidth: 2, borderBottomColor: Colors.primary },
  listWrapper: { height: 430 },
  list: { flex: 1 },
  listContent: { paddingVertical: 8 },

  monthlyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F4',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFD9D6',
  },
  monthlyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE8E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  monthlyIconText: { fontSize: 26 },
  monthlyInfo: { flex: 1 },
  monthlyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textMain },
  monthlyDesc: { fontSize: 12, color: Colors.textSub, marginTop: 3 },
  monthlyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  monthlyBtnDisabled: { backgroundColor: '#FFA9A4' },
  monthlyBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginVertical: 5,
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
  flashOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFDDD9' },
  couponIcon: {
    width: 72,
    height: 72,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  couponIconText: { fontSize: 34 },
  claimedStamp: {
    position: 'absolute',
    right: -14,
    top: 22,
    backgroundColor: 'rgba(255,59,48,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.primary,
    transform: [{ rotate: '-18deg' }],
  },
  claimedStampText: { fontSize: 10, color: Colors.primary },
  couponInfo: { flex: 1, marginRight: 8 },
  couponName: { fontSize: 14, fontWeight: '500', color: Colors.textMain, lineHeight: 19 },
  couponMetaRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 5 },
  couponPrice: { fontSize: 18, fontWeight: '700', color: Colors.primary, marginRight: 8 },
  couponValidity: { fontSize: 11, color: Colors.textSub },
  couponTags: { flexDirection: 'row', marginTop: 6 },
  couponTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: '#FFF1F0',
    marginRight: 6,
  },
  couponTagText: { fontSize: 10, color: Colors.primary },
  couponRule: { fontSize: 11, color: Colors.textSub, marginTop: 6 },
  couponAction: { marginLeft: 4 },
  couponBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  couponBtnDisabled: { backgroundColor: '#F0F0F0' },
  couponBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
  couponBtnTextDisabled: { color: '#B0B0B0' },
  listFooter: { alignItems: 'center', paddingVertical: 14 },
  listFooterText: { fontSize: 12, color: '#C0C0C0' },

  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEEEEE',
  },
  footerBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnLoading: { backgroundColor: '#FFA9A4' },
  footerBtnIdle: { backgroundColor: '#F0F0F0' },
  footerBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  toast: {
    position: 'absolute',
    alignSelf: 'center',
    top: 30,
    backgroundColor: 'rgba(26,26,26,0.86)',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  toastText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  packet: {
    position: 'absolute',
    width: PACKET_SIZE,
    height: PACKET_SIZE,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  packetText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
});
