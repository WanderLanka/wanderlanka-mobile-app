import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Image, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { ThemedText } from '../../components/ThemedText';
import { GuideService, PackageListItem } from '../../services/guide';
import BookingModal from '../../components/BookingModal';
import { toAbsoluteImageUrl } from '../../utils/imageUrl';

export default function PackageDetailScreen() {
  const { slug } = useLocalSearchParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pkg, setPkg] = useState<PackageListItem | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [viewerVisible, setViewerVisible] = useState<boolean>(false);
  const scrollY = new Animated.Value(0);
  // Booking UI state
  const [bookingVisible, setBookingVisible] = useState<boolean>(false);
  // state moved into BookingModal; keep only modal visibility here

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await GuideService.getPackage(String(slug));
        if (isMounted) setPkg(res.data);
      } catch (e: any) {
        if (isMounted) setError(e?.message || 'Failed to load package');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [slug]);

  // contact prefill handled inside BookingModal

  // Derived booking helpers
  const perPerson = !!pkg?.pricing?.perPerson;
  const unitAmount = pkg?.pricing?.amount || 0;
  const currency = pkg?.pricing?.currency || 'LKR';

  // Compute end date from start date and duration
  // end date calculation moved into BookingModal

  // booking logic handled inside BookingModal

  const imagesAbs: string[] = (() => {
    const raw: string[] = [];
    if (pkg?.coverImage) raw.push(pkg.coverImage);
    if (Array.isArray(pkg?.images)) raw.push(...(pkg?.images as string[]));
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const r of raw) {
      const key = String(r).replace(/^https?:\/\/[^/]+/i, '');
      if (!seen.has(key)) { seen.add(key); unique.push(r); }
    }
    return unique.map(toAbsoluteImageUrl);
  })();
  const cover = imagesAbs[activeIndex] || '';

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.header, { backgroundColor: scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: ['transparent', Colors.primary700],
        extrapolate: 'clamp',
      }) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <View style={styles.backBtnCircle}>
            <Ionicons name="arrow-back" size={22} color={Colors.primary800} />
          </View>
        </TouchableOpacity>
        <Animated.View style={{ opacity: headerOpacity }}>
          <ThemedText variant="title" style={styles.headerTitle}>Package Details</ThemedText>
        </Animated.View>
      </Animated.View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary600} />
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {pkg && (
        <Animated.ScrollView 
          style={{ flex: 1 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {/* Hero Image */}
          {cover ? (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setViewerVisible(true)}>
              <Image source={{ uri: cover }} style={styles.hero} onError={(e) => console.warn('Hero image failed:', cover, e.nativeEvent?.error)} />
              <View style={styles.imageOverlay}>
                <View style={styles.imageBadge}>
                  <Ionicons name="images" size={14} color={Colors.white} />
                  <Text style={styles.imageBadgeText}>{imagesAbs.length}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.hero, styles.heroPlaceholder]}>
              <Ionicons name="image-outline" size={48} color={Colors.secondary400} />
            </View>
          )}

          {/* Gallery Thumbnails */}
          {imagesAbs.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryRow} contentContainerStyle={styles.galleryContent}>
              {imagesAbs.map((img, idx) => (
                <TouchableOpacity 
                  key={`${img}-${idx}`} 
                  style={[styles.thumbWrapper, activeIndex === idx && styles.thumbActive]} 
                  onPress={() => setActiveIndex(idx)} 
                  onLongPress={() => { setActiveIndex(idx); setViewerVisible(true); }}
                >
                  <Image source={{ uri: img }} style={styles.thumbImage} onError={(e) => console.warn('Thumb image failed:', img, e.nativeEvent?.error)} />
                  {activeIndex === idx && (
                    <View style={styles.thumbOverlay}>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Main Content Card */}
          <View style={styles.contentCard}>
            {/* Title & Quick Info */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>{pkg.title}</Text>
              
              <View style={styles.quickInfoGrid}>
                <View style={styles.infoCard}>
                  <View style={styles.infoIconWrapper}>
                    <Ionicons name="calendar-outline" size={18} color={Colors.primary600} />
                  </View>
                  <Text style={styles.infoLabel}>Duration</Text>
                  <Text style={styles.infoValue}>{pkg.durationDays} days</Text>
                </View>
                
                <View style={styles.infoCard}>
                  <View style={styles.infoIconWrapper}>
                    <Ionicons name="people-outline" size={18} color={Colors.primary600} />
                  </View>
                  <Text style={styles.infoLabel}>Group Size</Text>
                  <Text style={styles.infoValue}>Up to {pkg.maxGroupSize || 'N/A'}</Text>
                </View>
              </View>

              {/* Price Card */}
              <View style={styles.priceCard}>
                <View style={styles.priceHeader}>
                  <Ionicons name="pricetag" size={20} color={Colors.primary600} />
                  <Text style={styles.priceLabel}>Package Price</Text>
                </View>
                <View style={styles.priceRow}>
                  <View>
                    <Text style={styles.priceAmount}>{pkg.pricing?.currency || 'LKR'} {(pkg.pricing?.amount || 0).toLocaleString()}</Text>
                    <Text style={styles.priceUnit}>{pkg.pricing?.perPerson ? 'per person' : 'per group'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Overview */}
            {!!pkg.description && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrapper}>
                    <Ionicons name="document-text-outline" size={18} color={Colors.primary600} />
                  </View>
                  <Text style={styles.sectionTitle}>Overview</Text>
                </View>
                <Text style={styles.paragraph}>{pkg.description}</Text>
              </View>
            )}

            {/* Details */}
            {!!pkg.details && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrapper}>
                    <Ionicons name="information-circle-outline" size={18} color={Colors.primary600} />
                  </View>
                  <Text style={styles.sectionTitle}>Details</Text>
                </View>
                <Text style={styles.paragraph}>{pkg.details}</Text>
              </View>
            )}

            {/* Itinerary */}
            {Array.isArray(pkg.itinerary) && pkg.itinerary.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrapper}>
                    <Ionicons name="map-outline" size={18} color={Colors.primary600} />
                  </View>
                  <Text style={styles.sectionTitle}>Itinerary</Text>
                </View>
                {pkg.itinerary.map((item, idx) => (
                  <View key={idx} style={styles.itineraryItem}>
                    <View style={styles.itineraryHeader}>
                      <View style={styles.dayBadge}>
                        <Text style={styles.dayBadgeText}>Day {item.day}</Text>
                      </View>
                    </View>
                    <Text style={styles.itineraryTitle}>{item.title}</Text>
                    {!!item.description && <Text style={styles.itineraryDesc}>{item.description}</Text>}
                  </View>
                ))}
              </View>
            )}

            {/* Included/Excluded Grid */}
            {((Array.isArray(pkg.includes) && pkg.includes.length > 0) || (Array.isArray(pkg.excludes) && pkg.excludes.length > 0)) && (
              <View style={styles.section}>
                <View style={styles.includesGrid}>
                  {(Array.isArray(pkg.includes) && pkg.includes.length > 0) && (
                    <View style={styles.includesCard}>
                      <View style={styles.includesHeader}>
                        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                        <Text style={styles.includesTitle}>Included</Text>
                      </View>
                      {pkg.includes.map((inc, i) => (
                        <View key={i} style={styles.bulletRow}>
                          <View style={styles.bulletDot} />
                          <Text style={styles.bulletText}>{inc}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {(Array.isArray(pkg.excludes) && pkg.excludes.length > 0) && (
                    <View style={styles.excludesCard}>
                      <View style={styles.includesHeader}>
                        <Ionicons name="close-circle" size={20} color={Colors.error} />
                        <Text style={styles.includesTitle}>Excluded</Text>
                      </View>
                      {pkg.excludes.map((exc, i) => (
                        <View key={i} style={styles.bulletRow}>
                          <View style={styles.bulletDot} />
                          <Text style={styles.bulletText}>{exc}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Policies */}
            {pkg.policies && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrapper}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary600} />
                  </View>
                  <Text style={styles.sectionTitle}>Policies</Text>
                </View>
                <View style={styles.policiesCard}>
                  {pkg.policies.freeCancellation && (
                    <View style={styles.policyRow}>
                      <Ionicons name="calendar-clear-outline" size={16} color={Colors.success} />
                      <Text style={styles.policyText}>Free cancellation: {pkg.policies.freeCancellationWindow?.replaceAll('_', ' ')}</Text>
                    </View>
                  )}
                  {!!pkg.policies.meetingPoint && (
                    <View style={styles.policyRow}>
                      <Ionicons name="location-outline" size={16} color={Colors.primary600} />
                      <Text style={styles.policyText}>Meeting point: {pkg.policies.meetingPoint}</Text>
                    </View>
                  )}
                  {!!pkg.policies.text && (
                    <View style={styles.policyRow}>
                      <Ionicons name="document-text-outline" size={16} color={Colors.secondary600} />
                      <Text style={styles.policyText}>{pkg.policies.text}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      )}

  {/* Image Viewer Modal */}
      <Modal visible={viewerVisible} transparent animationType="fade" onRequestClose={() => setViewerVisible(false)}>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerVisible(false)}>
            <View style={styles.viewerCloseBtn}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <View style={styles.viewerCenter}>
            {cover ? (
              <Image source={{ uri: cover }} style={styles.viewerImage} resizeMode="contain" />
            ) : null}
          </View>
          {imagesAbs.length > 1 && (
            <>
              <TouchableOpacity style={[styles.navBtn, styles.navLeft]} onPress={() => setActiveIndex((i) => (i - 1 + imagesAbs.length) % imagesAbs.length)}>
                <Ionicons name="chevron-back" size={28} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.navBtn, styles.navRight]} onPress={() => setActiveIndex((i) => (i + 1) % imagesAbs.length)}>
                <Ionicons name="chevron-forward" size={28} color={Colors.white} />
              </TouchableOpacity>
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>{activeIndex + 1} / {imagesAbs.length}</Text>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Calendar is handled within BookingModal */}

      {/* Floating Footer */}
      {pkg && (
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerPriceSection}>
              <Text style={styles.footerPriceLabel}>Price</Text>
              <Text style={styles.footerPrice}>{currency} {unitAmount.toLocaleString()}</Text>
              <Text style={styles.footerUnit}>{perPerson ? 'per person' : 'per group'}</Text>
            </View>
            <TouchableOpacity style={styles.bookBtn} onPress={() => setBookingVisible(true)}>
              <Text style={styles.bookText}>Book Now</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Booking Modal */}
      {pkg && (
        <BookingModal
          visible={bookingVisible}
          pkg={pkg}
          onClose={() => setBookingVisible(false)}
          onBooked={() => { /* could navigate to a booking screen later */ }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.secondary50 },
  header: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: 50,
    paddingBottom: 12,
  },
  backBtn: { marginRight: 12 },
  backBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { marginTop: 16, fontSize: 16, color: Colors.error, textAlign: 'center' },
  
  hero: { width: '100%', height: 320, backgroundColor: Colors.secondary200 },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    padding: 16,
  },
  imageBadge: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  imageBadgeText: { color: Colors.white, fontSize: 12, fontWeight: '600' },
  
  galleryRow: { 
    marginTop: -40,
    paddingHorizontal: 16,
  },
  galleryContent: { paddingRight: 16 },
  thumbWrapper: { 
    width: 80, 
    height: 80, 
    borderRadius: 12, 
    overflow: 'hidden', 
    marginRight: 12, 
    borderWidth: 3, 
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbActive: { borderColor: Colors.primary600 },
  thumbImage: { width: '100%', height: '100%', backgroundColor: Colors.secondary100 },
  thumbOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  contentCard: {
    backgroundColor: Colors.white,
    marginTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
  },
  
  titleSection: { paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.primary800, marginBottom: 20, lineHeight: 32 },
  
  quickInfoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.secondary50,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  infoLabel: { fontSize: 11, color: Colors.secondary600, marginBottom: 4, fontWeight: '500' },
  infoValue: { fontSize: 15, fontWeight: '700', color: Colors.primary800 },
  
  priceCard: {
    backgroundColor: Colors.primary100,
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.primary100,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  priceLabel: { fontSize: 13, fontWeight: '600', color: Colors.primary700 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  priceAmount: { fontSize: 28, fontWeight: '800', color: Colors.primary800 },
  priceUnit: { fontSize: 13, color: Colors.secondary600, marginTop: 2 },
  
  section: { marginTop: 28, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary800 },
  paragraph: { fontSize: 15, color: Colors.primary700, lineHeight: 24 },
  
  itineraryItem: { 
    marginBottom: 12, 
    padding: 16, 
    backgroundColor: Colors.secondary50, 
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary600,
  },
  itineraryHeader: { marginBottom: 8 },
  dayBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary600,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dayBadgeText: { fontSize: 11, color: Colors.white, fontWeight: '700', textTransform: 'uppercase' },
  itineraryTitle: { fontSize: 16, color: Colors.primary800, fontWeight: '700', marginTop: 4 },
  itineraryDesc: { fontSize: 14, color: Colors.primary700, marginTop: 6, lineHeight: 20 },
  
  includesGrid: { gap: 16 },
  includesCard: {
    backgroundColor: Colors.success100,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.success600,
  },
  excludesCard: {
    backgroundColor: Colors.secondary50,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },
  includesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  includesTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary800 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary600,
    marginTop: 6,
    marginRight: 10,
  },
  bulletText: { fontSize: 14, color: Colors.primary800, flex: 1, lineHeight: 20 },
  
  policiesCard: {
    backgroundColor: Colors.secondary50,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  policyText: { fontSize: 14, color: Colors.primary700, flex: 1, lineHeight: 20 },
  
  footer: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: Colors.white,
    paddingHorizontal: 20, 
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1, 
    borderTopColor: Colors.secondary200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerPriceSection: { flex: 1 },
  footerPriceLabel: { fontSize: 11, color: Colors.secondary600, marginBottom: 2, fontWeight: '500' },
  footerPrice: { fontSize: 22, fontWeight: '800', color: Colors.primary800 },
  footerUnit: { fontSize: 12, color: Colors.secondary500, marginTop: 2 },
  bookBtn: { 
    backgroundColor: Colors.primary600, 
    paddingHorizontal: 28, 
    paddingVertical: 14, 
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  
  // Booking Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  bookingSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary800,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: Colors.secondary600,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    backgroundColor: Colors.secondary50,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: { flex: 1 },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: Colors.secondary100,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },
  chipText: {
    fontSize: 12,
    color: Colors.secondary700,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: Colors.primary600,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
  },

  // Viewer
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.97)' },
  viewerClose: { position: 'absolute', top: 50, right: 16, zIndex: 2 },
  viewerCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  viewerImage: { width: '100%', height: '100%' },
  navBtn: { 
    position: 'absolute', 
    top: '50%', 
    marginTop: -28, 
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  navLeft: { left: 16 },
  navRight: { right: 16 },
  imageCounter: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageCounterText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
});