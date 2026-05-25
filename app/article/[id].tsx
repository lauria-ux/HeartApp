/**
 * Article detail screen.
 * Route: /article/<article-id>
 * Navigated to from the Insights tab article cards.
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { ARTICLES, CATEGORY_COLORS } from '@/lib/articles';

export default function ArticleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const article = ARTICLES.find((a) => a.id === id);

  if (!article) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Article not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const accent = CATEGORY_COLORS[article.category];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero band */}
        <View style={[styles.hero, { backgroundColor: accent }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Category + read time */}
          <View style={styles.heroMeta}>
            <View style={styles.heroTag}>
              <Text style={styles.heroTagText}>{article.category}</Text>
            </View>
            <View style={styles.heroReadTime}>
              <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.75)" />
              <Text style={styles.heroReadTimeText}>{article.readMinutes} min read</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{article.title}</Text>
        </View>

        {/* Excerpt block */}
        <View style={styles.excerptWrap}>
          <View style={[styles.excerptBar, { backgroundColor: accent }]} />
          <Text style={styles.excerptText}>{article.excerpt}</Text>
        </View>

        {/* Article sections */}
        <View style={styles.body}>
          {article.sections.map((section, i) => (
            <View key={i} style={styles.section}>
              {section.heading && (
                <Text style={styles.sectionHeading}>{section.heading}</Text>
              )}
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}

          {/* Disclaimer footer */}
          <View style={styles.disclaimerCard}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.textTertiary} />
            <Text style={styles.disclaimerText}>
              Cardia is a wellness tool, not a medical device. The information in this article is for educational purposes only. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment.
            </Text>
          </View>

          <View style={{ height: Spacing.xxl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Hero
  hero: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroTag: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  heroTagText: {
    fontSize: FontSize.xs,
    color: '#fff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroReadTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroReadTimeText: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.75)',
  },
  heroTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 30,
  },

  // Excerpt
  excerptWrap: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  excerptBar: {
    width: 3,
    borderRadius: 2,
    alignSelf: 'stretch',
  },
  excerptText: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: 24,
    fontStyle: 'italic',
  },

  // Body
  body: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeading: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 22,
  },
  sectionBody: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // Disclaimer
  disclaimerCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-start',
    marginTop: Spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: 17,
  },

  // Not found
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
});
