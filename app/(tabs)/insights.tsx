import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import {
  ARTICLES,
  ALL_CATEGORIES,
  CATEGORY_COLORS,
  type Article,
  type ArticleCategory,
} from '@/lib/articles';
import { HEALTH_TESTS, type HealthTest } from '@/lib/tests';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Featured hero card ───────────────────────────────────────────────────────

function FeaturedCard({ article }: { article: Article }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[featStyles.card, { backgroundColor: article.color }]}
      onPress={() => router.push(`/article/${article.id}`)}
      activeOpacity={0.88}
    >
      {/* Large decorative icon — top-right, partially cropped */}
      <View style={featStyles.iconDecor} pointerEvents="none">
        <Ionicons name={article.icon as IoniconName} size={128} color="rgba(255,255,255,0.16)" />
      </View>

      {/* Category tag */}
      <View style={featStyles.tag}>
        <Text style={featStyles.tagText}>{article.category}</Text>
      </View>

      <Text style={featStyles.title}>{article.title}</Text>
      <Text style={featStyles.excerpt} numberOfLines={2}>{article.excerpt}</Text>

      <View style={featStyles.footer}>
        <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.75)" />
        <Text style={featStyles.readTime}>{article.readMinutes} min read</Text>
        <View style={featStyles.readBtn}>
          <Text style={[featStyles.readBtnText, { color: article.color }]}>Read</Text>
          <Ionicons name="arrow-forward" size={12} color={article.color} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const featStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    overflow: 'hidden',
    ...Shadow.md,
  },
  iconDecor: {
    position: 'absolute',
    right: -24,
    top: -24,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: FontSize.xs, fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  title: {
    fontSize: FontSize.xl, fontWeight: '800',
    color: '#fff', lineHeight: 30,
  },
  excerpt: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.80)',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  readTime: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    flex: 1,
  },
  readBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#fff',
    borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  readBtnText: { fontSize: FontSize.xs, fontWeight: '700' },
});

// ─── Article card ─────────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: Article }) {
  const router = useRouter();
  const accent = CATEGORY_COLORS[article.category];

  return (
    <TouchableOpacity
      style={cardStyles.card}
      onPress={() => router.push(`/article/${article.id}`)}
      activeOpacity={0.82}
    >
      {/* Icon thumbnail */}
      <View style={[cardStyles.thumb, { backgroundColor: accent + '18' }]}>
        <Ionicons name={article.icon as IoniconName} size={28} color={accent} />
      </View>

      <View style={cardStyles.body}>
        {/* Category + read time */}
        <View style={cardStyles.meta}>
          <View style={[cardStyles.catTag, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
            <Text style={[cardStyles.catText, { color: accent }]}>{article.category}</Text>
          </View>
          <Text style={cardStyles.readTime}>
            <Ionicons name="time-outline" size={11} color={Colors.textTertiary} />
            {' '}{article.readMinutes} min
          </Text>
        </View>

        <Text style={cardStyles.title} numberOfLines={2}>{article.title}</Text>
        <Text style={cardStyles.excerpt} numberOfLines={2}>{article.excerpt}</Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} style={cardStyles.arrow} />
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  thumb: {
    width: 76,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    padding: Spacing.md,
    gap: 4,
  },
  meta: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, marginBottom: 2,
  },
  catTag: {
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1,
  },
  catText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  readTime: { fontSize: 10, color: Colors.textTertiary },
  title: {
    fontSize: FontSize.base, fontWeight: '700',
    color: Colors.text, lineHeight: 20,
  },
  excerpt: {
    fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 17,
  },
  arrow: {
    marginRight: Spacing.sm,
  },
});

// ─── Test card ────────────────────────────────────────────────────────────────

const TEST_CARD_W = 158;

function TestCard({ test, onPress }: { test: HealthTest; onPress: () => void }) {
  return (
    <TouchableOpacity style={testStyles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={[testStyles.iconWrap, { backgroundColor: test.color + '18' }]}>
        <Ionicons name={test.icon as IoniconName} size={30} color={test.color} />
      </View>
      <Text style={testStyles.title} numberOfLines={2}>{test.title}</Text>
      <Text style={testStyles.meta}>
        {test.questions.length} questions · ~{test.estimatedMinutes} min
      </Text>
      <View style={[testStyles.startBtn, { backgroundColor: test.color }]}>
        <Text style={testStyles.startBtnText}>Start</Text>
        <Ionicons name="arrow-forward" size={11} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const testStyles = StyleSheet.create({
  card: {
    width: TEST_CARD_W,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.sm, fontWeight: '700',
    color: Colors.text, lineHeight: 19,
  },
  meta: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4,
    borderRadius: Radius.full,
    paddingVertical: 7,
    marginTop: 2,
  },
  startBtnText: { fontSize: FontSize.xs, fontWeight: '700', color: '#fff' },
});

// ─── Test card separator ──────────────────────────────────────────────────────

function TestSeparator() {
  return <View style={{ width: Spacing.sm }} />;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<ArticleCategory | null>(null);

  const featured = ARTICLES[0];
  const filtered = activeCategory
    ? ARTICLES.filter((a) => a.category === activeCategory)
    : ARTICLES.slice(1);
  const showFeatured = activeCategory === null;


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Page header */}
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Evidence-based heart health</Text>
      </View>

      {/* Category chips
          Fixed-height outer View is the key: it prevents the scroll row from
          being compressed by the surrounding flex layout, so chips always have
          enough vertical room to show their full text. */}
      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
        >
          {([null, ...ALL_CATEGORIES] as (ArticleCategory | null)[]).map((item) => {
            const isActive = item === activeCategory;
            const color    = item ? CATEGORY_COLORS[item] : Colors.text;
            return (
              <TouchableOpacity
                key={item ?? 'all'}
                style={[
                  styles.chip,
                  isActive && { backgroundColor: color, borderColor: color },
                ]}
                onPress={() => setActiveCategory(isActive ? null : item)}
                activeOpacity={0.75}
              >
                <Text
                  style={[styles.chipText, isActive && styles.chipTextActive]}
                  numberOfLines={1}
                >
                  {item ?? 'All'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Featured hero */}
        {showFeatured && <FeaturedCard article={featured} />}

        {/* Health assessments strip */}
        {showFeatured && (
          <>
            <Text style={styles.sectionLabel}>Health Assessments</Text>
            <FlatList<HealthTest>
              horizontal
              data={HEALTH_TESTS}
              keyExtractor={(t) => t.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.testsContainer}
              ItemSeparatorComponent={TestSeparator}
              renderItem={({ item }) => (
                <TestCard test={item} onPress={() => router.push(`/test/${item.id}`)} />
              )}
              scrollEnabled
              nestedScrollEnabled
            />
          </>
        )}

        {/* Articles section */}
        <Text style={styles.sectionLabel}>
          {activeCategory ? `${activeCategory} Articles` : 'More to read'}
        </Text>

        {filtered.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}

        <View style={{ height: Spacing.xxl + 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    marginBottom: 4,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: 2 },

  // Chips — fixed-height wrapper + horizontal ScrollView
  chipsWrap: {
    height: 54,    // explicit height; chips + vertical padding fit comfortably
  },
  chipsContent: {
    paddingHorizontal: Spacing.md,
    alignItems: 'center',   // centres chips vertically inside the 54-pt height
    flexDirection: 'row',
  },
  chip: {
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,  // spacing between chips — no gap needed
  },
  chipText: {
    fontSize: FontSize.sm, fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: { color: '#fff' },

  // Main scroll
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },

  sectionLabel: {
    fontSize: FontSize.xs, fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },

  // Tests horizontal strip
  testsContainer: {
    paddingBottom: Spacing.md,
  },
});
