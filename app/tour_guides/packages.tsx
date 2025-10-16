import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { ThemedText } from '../../components/ThemedText';
import { GuideService, PackageListItem } from '../../services/guide';
import { ListingService } from '../../services';
import { toAbsoluteImageUrl } from '../../utils/imageUrl';

export default function GuidePackagesListScreen() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [packages, setPackages] = useState<PackageListItem[]>([]);
  const [guideName, setGuideName] = useState<string>('');
  const [, setGuideId] = useState<string | null>(null);
  const [guideAvatar, setGuideAvatar] = useState<string | null>(null);

  const resolveGuideAndLoad = async () => {
    setError(null);
    setLoading(true);
    try {
      const providedGuideId = (params.guideId as string) || null;
      const username = (params.username as string) || (params.title as string) || '';
      let gId: string | null = providedGuideId;
      let gName = '';

      if (!gId) {
        // Try fetch by username/title
        try {
          const res = await ListingService.getGuideByUsername(decodeURIComponent(username));
          const data: any = res?.data || {};
          gId = data?._id || null;
          gName = `${data?.guideDetails?.firstName || data?.details?.firstName || ''} ${data?.guideDetails?.lastName || data?.details?.lastName || ''}`.trim() || data?.username || '';
          const avatarRaw = data?.guideDetails?.avatar || data?.details?.avatar || data?.avatar || (Array.isArray(data?.reviews) ? data?.reviews?.[0]?.profileImage : '') || '';
          setGuideAvatar(avatarRaw ? toAbsoluteImageUrl(avatarRaw) : null);
        } catch {
          // ignore and leave as null
        }
      }
      setGuideId(gId);
      if (gName) setGuideName(gName);

      const res2 = await GuideService.listPackages({ limit: 100, isActive: true, guideId: gId || undefined });
      setPackages(res2.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load packages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    resolveGuideAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await resolveGuideAndLoad();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <ThemedText variant="title" style={styles.headerTitle}>All Tour Packages</ThemedText>
      </View>

      {guideName ? (
        <View style={styles.profileRow}>
          {guideAvatar ? (
            <Image source={{ uri: guideAvatar }} style={styles.avatar} onError={(e) => console.warn('Guide avatar failed:', guideAvatar, e.nativeEvent?.error)} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={18} color={Colors.secondary500} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.subtitleName}>{guideName}</Text>
            <Text style={styles.subtitleCount}>{packages.length} packages</Text>
          </View>
        </View>
      ) : null}

      {loading && (
        <View style={{ padding: 20 }}>
          <ActivityIndicator />
        </View>
      )}
      {error && (
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ color: Colors.error }}>{error}</Text>
        </View>
      )}

      <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.list}>
          {packages.map((pkg) => {
            const imgRaw = (pkg as any).coverImage || (pkg.images && pkg.images[0]) || '';
            const img = imgRaw ? toAbsoluteImageUrl(imgRaw) : '';
            return (
              <TouchableOpacity
                key={String(pkg._id || pkg.slug)}
                style={styles.card}
                onPress={() => router.push({ pathname: '/packages/[slug]', params: { slug: String(pkg.slug || pkg._id) } })}
              >
                <View style={styles.cardImageWrap}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.cardImage} onError={(e) => console.warn('Package image failed:', img, e.nativeEvent?.error)} />
                  ) : (
                    <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                      <Ionicons name="image" size={22} color={Colors.secondary500} />
                    </View>
                  )}
                  {/* Overlay badges */}
                  <View style={[styles.badge, styles.badgeLeft]}>
                    <Ionicons name="time" size={12} color={Colors.white} />
                    <Text style={styles.badgeText}>{pkg.durationDays}d</Text>
                  </View>
                  <View style={[styles.badge, styles.badgeRight]}>
                    <Ionicons name="pricetag" size={12} color={Colors.white} />
                    <Text style={styles.badgeText}>{(pkg.pricing?.currency || 'LKR')} {(pkg.pricing?.amount || 0).toLocaleString()}</Text>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{pkg.title}</Text>
                  {!!(pkg as any).tags && Array.isArray((pkg as any).tags) && (pkg as any).tags.length > 0 && (
                    <View style={styles.tagsRow}>
                      {((pkg as any).tags as string[]).slice(0, 3).map((t, i) => (
                        <View key={`${t}-${i}`} style={styles.tagChip}><Text style={styles.tagText}>{t}</Text></View>
                      ))}
                    </View>
                  )}
                  <Text style={styles.unitText}>{pkg.pricing?.perPerson ? 'per person' : 'per group'}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {!loading && packages.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="cube" size={48} color={Colors.secondary400} />
              <Text style={styles.emptyTitle}>No packages yet</Text>
              <Text style={styles.emptyText}>This guide hasn&apos;t published any tours yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.secondary50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primary700,
  },
  backBtn: { marginRight: 12, padding: 6 },
  headerTitle: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  subtitle: { color: Colors.primary800, marginTop: 8, marginHorizontal: 16, fontSize: 14 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, marginHorizontal: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.secondary100 },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  subtitleName: { color: Colors.primary800, fontSize: 16, fontWeight: '700' },
  subtitleCount: { color: Colors.secondary600, fontSize: 12, marginTop: 2 },
  list: { padding: 16 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },
  cardImageWrap: { position: 'relative' },
  cardImage: { width: '100%', height: 160, backgroundColor: Colors.secondary100 },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary800, marginBottom: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.secondary700, fontWeight: '500' },
  badge: { position: 'absolute', top: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12 },
  badgeLeft: { left: 8 },
  badgeRight: { right: 8 },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: '700', marginLeft: 4 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  tagChip: { backgroundColor: Colors.secondary100, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  tagText: { fontSize: 11, color: Colors.secondary700, fontWeight: '600' },
  unitText: { fontSize: 11, color: Colors.secondary500, marginTop: 4, fontStyle: 'italic' },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary800, marginTop: 8 },
  emptyText: { fontSize: 13, color: Colors.secondary600, marginTop: 4 },
});
