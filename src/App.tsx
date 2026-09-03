import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { Colors } from './theme';
import Q1AddressList from './components/Q1AddressList';
import Q2CouponSheet from './components/Q2CouponSheet';

type Tab = 'q1' | 'q2';

export default function App() {
  const [tab, setTab] = useState<Tab>('q1');
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      {/* 顶部 Tab */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, tab === 'q1' && styles.tabActive]} onPress={() => setTab('q1')}>
          <Text style={[styles.tabText, tab === 'q1' && styles.tabTextActive]}>题目一 · 地址列表</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'q2' && styles.tabActive]} onPress={() => setTab('q2')}>
          <Text style={[styles.tabText, tab === 'q2' && styles.tabTextActive]}>题目二 · 券浮层动效</Text>
        </TouchableOpacity>
      </View>

      {tab === 'q1' ? (
        <Q1AddressList />
      ) : (
        <View style={styles.q2Wrap}>
          {/* 简化商家页背景（还原视频里的主页面） */}
          <View style={styles.shopBg}>
            <View style={styles.shopInfo}>
              <View style={styles.shopAvatar}>
                <Text style={styles.shopAvatarText}>新</Text>
              </View>
              <View style={styles.shopTextCol}>
                <Text style={styles.shopName}>新美罗 · 徐汇区肇嘉浜路店</Text>
                <Text style={styles.shopDist}>距您 9.6km · 营业中</Text>
              </View>
              <TouchableOpacity style={styles.shopBtn}>
                <Text style={styles.shopBtnText}>预约</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.shopHint}>商家菜单 / 商品列表区域（示意）</Text>

            <View style={styles.q2Entry}>
              <Text style={styles.q2EntryTitle}>优惠中心</Text>
              <Text style={styles.q2EntryDesc}>
                券浮层上下滑动 · 领券暴涨 1~4 张新券 · 抛物线落点居中 · 新券高亮闪烁
              </Text>
              <TouchableOpacity style={styles.openBtn} activeOpacity={0.85} onPress={() => setSheetVisible(true)}>
                <Text style={styles.openBtnText}>打开优惠中心</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <Q2CouponSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEEE',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSub,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  q2Wrap: {
    flex: 1,
  },
  shopBg: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  shopAvatar: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shopAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  shopTextCol: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textMain,
  },
  shopDist: {
    fontSize: 12,
    color: Colors.textSub,
    marginTop: 3,
  },
  shopBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  shopBtnText: {
    color: Colors.primary,
    fontSize: 13,
  },
  shopHint: {
    textAlign: 'center',
    color: '#C8C8C8',
    fontSize: 13,
    paddingVertical: 80,
  },
  q2Entry: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 14,
    backgroundColor: '#F8F9FB',
    alignItems: 'center',
  },
  q2EntryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textMain,
  },
  q2EntryDesc: {
    fontSize: 12,
    color: Colors.textSub,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 16,
  },
  openBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 22,
    paddingHorizontal: 40,
    paddingVertical: 11,
  },
  openBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
