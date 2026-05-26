import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { useEffect, useRef } from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors, Shadow } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Tab definitions (2 tabs only) ───────────────────────────────────────────

const TAB_ITEMS: {
  name: string;
  label: string;
  icon: IoniconName;
  iconActive: IoniconName;
}[] = [
  { name: 'index',    label: 'Home',     icon: 'home-outline', iconActive: 'home' },
  { name: 'insights', label: 'Insights', icon: 'bulb-outline', iconActive: 'bulb' },
];

// ─── Beating heart FAB ────────────────────────────────────────────────────────

function HeartFAB({ onPress }: { onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        // Lub
        Animated.timing(scale, { toValue: 1.22, duration: 110, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0,  duration: 110, useNativeDriver: true }),
        Animated.delay(70),
        // Dub
        Animated.timing(scale, { toValue: 1.14, duration: 90,  useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0,  duration: 120, useNativeDriver: true }),
        // Rest
        Animated.delay(780),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [scale]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.fabWrap}>
      <View style={styles.fab}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="heart" size={28} color="#fff" />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Custom tab bar ───────────────────────────────────────────────────────────

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const routeNames = state.routes.map((r) => r.name);
  const leftTabs  = TAB_ITEMS.slice(0, 1);
  const rightTabs = TAB_ITEMS.slice(1, 2);

  const renderTab = (item: (typeof TAB_ITEMS)[0]) => {
    const index    = routeNames.indexOf(item.name);
    const isActive = state.index === index;
    const color    = isActive ? Colors.tabActive : Colors.tabInactive;

    return (
      <TouchableOpacity
        key={item.name}
        style={styles.tabBtn}
        onPress={() => navigation.navigate(item.name)}
        activeOpacity={0.7}
      >
        <Ionicons name={isActive ? item.iconActive : item.icon} size={22} color={color} />
        <Text style={[styles.tabLabel, { color }]}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <View style={styles.tabGroup}>{leftTabs.map(renderTab)}</View>
        <View style={styles.fabPlaceholder} />
        <View style={styles.tabGroup}>{rightTabs.map(renderTab)}</View>
      </View>

      <HeartFAB onPress={() => router.push('/measure')} />
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BAR_HEIGHT = Platform.OS === 'ios' ? 84 : 64;
const FAB_SIZE   = 60;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tabBar,
    height: BAR_HEIGHT,
    paddingBottom: Platform.OS === 'ios' ? 24 : 6,
    paddingTop: 8,
    width: '100%',
    borderTopWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  tabGroup: { flex: 1, flexDirection: 'row' },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabLabel: { fontSize: 10, fontWeight: '600' },
  fabPlaceholder: { width: FAB_SIZE + 16 },

  fabWrap: {
    position: 'absolute',
    top: -(FAB_SIZE / 2) - 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#EF4444',        // red — makes the measure action pop
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.background,
    ...Shadow.lg,
  },
});
