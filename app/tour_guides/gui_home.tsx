import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  ActivityIndicator, 
  Animated,
  Modal, 
  RefreshControl,
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput,
  TouchableOpacity, 
  View 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomButton, ServicesTopBar, ThemedText } from '../../components';
import { ItemCard } from '../../components/ItemCard';
import { GuideService } from '../../services/guide';
import { Colors } from '../../constants/Colors';

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

type Guide = {
  _id: string;
  username: string;
  status: string;
  featured?: boolean;
  details?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    languages?: string[];
  };
  metrics?: {
    rating?: number;
    totalReviews?: number;
    totalBookings?: number;
    responseTimeMs?: number;
  };
};

const languageOptions = ['English', 'Sinhala', 'Tamil', 'French', 'German', 'Spanish'];
const expertiseOptions = ['History', 'Nature', 'Food', 'Adventure', 'Culture'];

export default function TourGuidesHomeScreen() {
  const insets = useSafeAreaInsets();
  
  // State management
  const [search, setSearch] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'reviews'>('rating');
  
  const [featuredGuides, setFeaturedGuides] = useState<Guide[]>([]);
  const [allGuides, setAllGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState<boolean>(false);
  
  // Debounced search value (500ms delay)
  const debouncedSearch = useDebounce(search, 500);
  
  // Animation values - start visible
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Filter toggle handlers
  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  };
  
  const toggleExpertise = (exp: string) => {
    setSelectedExpertise(prev => prev.includes(exp) ? prev.filter(e => e !== exp) : [...prev, exp]);
  };

  // Initial load - only run when debounced search changes
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (mounted) {
        setLoading(true);
        
        // Reset animation values before loading
        fadeAnim.setValue(0);
        slideAnim.setValue(30);
        
        const limit = showMore ? 20 : 5;
        
        try {
          const [featuredRes, allRes] = await Promise.all([
            GuideService.getFeaturedGuides({ limit, status: 'active', q: debouncedSearch || undefined }),
            GuideService.getFeaturedGuides({ limit: 100, status: 'active', q: debouncedSearch || undefined })
          ]);
          
          if (mounted) {
            if (featuredRes?.success && Array.isArray(featuredRes.data)) {
              console.log('Featured guides loaded:', featuredRes.data.length);
              setFeaturedGuides(featuredRes.data);
            } else {
              console.log('No featured guides data:', featuredRes);
              setFeaturedGuides([]);
            }
            
            if (allRes?.success && Array.isArray(allRes.data)) {
              console.log('All guides loaded:', allRes.data.length);
              setAllGuides(allRes.data);
            } else {
              console.log('No all guides data:', allRes);
              setAllGuides([]);
            }
            
            // Animate in after data is set
            Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(slideAnim, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
              }),
            ]).start();
          }
        } catch (e: any) {
          console.error('Failed to load guides:', e);
          if (mounted) {
            setError(e?.message || 'Failed to load guides');
            setFeaturedGuides([]);
            setAllGuides([]);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
    // Only re-run when debouncedSearch changes, not showMore
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Reload when showMore changes - but not on initial mount
  useEffect(() => {
    // Skip on initial mount and when loading
    if (featuredGuides.length > 0 && !loading) {
      const limit = showMore ? 20 : 5;
      
      GuideService.getFeaturedGuides({ 
        limit, 
        status: 'active',
        q: debouncedSearch || undefined 
      }).then(res => {
        if (res?.success && Array.isArray(res.data)) {
          setFeaturedGuides(res.data);
        }
      }).catch(e => {
        console.error('Failed to load featured guides:', e);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMore]);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      const limit = showMore ? 20 : 5;
      const [featuredRes, allRes] = await Promise.all([
        GuideService.getFeaturedGuides({ limit, status: 'active', q: debouncedSearch || undefined }),
        GuideService.getFeaturedGuides({ limit: 100, status: 'active', q: debouncedSearch || undefined })
      ]);
      
      if (featuredRes?.success && Array.isArray(featuredRes.data)) {
        setFeaturedGuides(featuredRes.data);
      } else {
        setFeaturedGuides([]);
      }
      
      if (allRes?.success && Array.isArray(allRes.data)) {
        setAllGuides(allRes.data);
      } else {
        setAllGuides([]);
      }
    } catch (e: any) {
      console.error('Failed to refresh guides:', e);
      setError(e?.message || 'Failed to refresh guides');
    } finally {
      setRefreshing(false);
    }
  }, [debouncedSearch, showMore]);

  // Apply client-side filters
  const filteredGuides = useMemo(() => {
    let filtered = [...allGuides];

    // Language filter
    if (selectedLanguages.length > 0) {
      filtered = filtered.filter(guide => 
        guide.details?.languages?.some(lang => 
          selectedLanguages.includes(lang)
        )
      );
    }

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter(guide => 
        (guide.metrics?.rating || 0) >= minRating
      );
    }

    // Bio/expertise filter (simple keyword match)
    if (selectedExpertise.length > 0) {
      filtered = filtered.filter(guide => 
        selectedExpertise.some(exp => 
          guide.details?.bio?.toLowerCase().includes(exp.toLowerCase())
        )
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.metrics?.rating || 0) - (a.metrics?.rating || 0);
        case 'name':
          const nameA = `${a.details?.firstName || ''} ${a.details?.lastName || ''}`.trim() || a.username;
          const nameB = `${b.details?.firstName || ''} ${b.details?.lastName || ''}`.trim() || b.username;
          return nameA.localeCompare(nameB);
        case 'reviews':
          return (b.metrics?.totalReviews || 0) - (a.metrics?.totalReviews || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allGuides, selectedLanguages, minRating, selectedExpertise, sortBy]);

  const handleApplyFilters = () => {
    setFilterVisible(false);
    // Filters are applied automatically via useMemo
  };

  const handleCancelFilters = () => {
    setFilterVisible(false);
  };

  const handleClearFilters = () => {
    setSelectedLanguages([]);
    setSelectedExpertise([]);
    setMinRating(0);
    setSortBy('rating');
  };

  // Render guide card with animation
  const renderGuideCard = (guide: Guide, index: number) => {
    const firstName = guide.details?.firstName || '';
    const lastName = guide.details?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || guide.username;
    const avatar = guide.details?.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9';
    const rating = guide.metrics?.rating || 0;
    const bio = guide.details?.bio || 'Experienced tour guide';
    const languages = guide.details?.languages || [];

    return (
      <View
        key={guide._id}
        style={styles.guideCardWrapper}
      >
        <ItemCard
          image={avatar}
          title={fullName}
          city={bio.substring(0, 50)}
          rating={rating > 0 ? rating : undefined}
          type="guide"
          style={styles.carouselCard}
        />
        {languages.length > 0 && (
          <View style={styles.languageBadges}>
            {languages.slice(0, 3).map((lang, i) => (
              <View key={i} style={styles.languageBadge}>
                <Text style={styles.languageBadgeText}>{lang}</Text>
              </View>
            ))}
            {languages.length > 3 && (
              <View style={styles.languageBadge}>
                <Text style={styles.languageBadgeText}>+{languages.length - 3}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <StatusBar style="light" translucent />
      <ServicesTopBar onProfilePress={() => {}} onNotificationsPress={() => {}} />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary600}
            colors={[Colors.primary600]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Compact Header with Integrated Search */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <ThemedText variant="title" style={styles.greeting}>Tour Guides</ThemedText>
              <ThemedText variant="caption" style={styles.caption}>
                Find expert local guides
              </ThemedText>
            </View>
            
            {/* Integrated Search Bar */}
            <View style={styles.searchRow}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={18} color={Colors.secondary500} />
                <TextInput
                  style={styles.searchTextInput}
                  placeholder="Search guides..."
                  placeholderTextColor={Colors.secondary400}
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={18} color={Colors.secondary400} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => setFilterVisible(true)}
              >
                <Ionicons name="options-outline" size={20} color={Colors.primary700} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Loading State */}
        {loading && !refreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary600} />
            <Text style={styles.loadingText}>Loading guides...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <CustomButton
              title="Try Again"
              variant="primary"
              onPress={onRefresh}
              style={styles.retryButton}
            />
          </View>
        )}

        {/* Featured Guides Section */}
        {!loading && !error && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="star" size={18} color={Colors.warning} />
                <ThemedText variant="title" style={styles.sectionTitle}>
                  Featured
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setShowMore(!showMore)}>
                <Text style={styles.seeMore}>
                  {showMore ? 'Less' : 'More'}
                </Text>
              </TouchableOpacity>
            </View>

            {featuredGuides.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.carousel}
                contentContainerStyle={styles.carouselContent}
              >
                {featuredGuides.map((guide, i) => renderGuideCard(guide, i))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={40} color={Colors.secondary400} />
                <Text style={styles.emptyText}>
                  {debouncedSearch 
                    ? 'No featured guides match your search' 
                    : 'No featured guides available'}
                </Text>
              </View>
            )}

            {/* All Guides Section */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="people" size={18} color={Colors.primary600} />
                <ThemedText style={styles.sectionTitle}>All Guides</ThemedText>
              </View>
              <Text style={styles.guideCount}>
                {filteredGuides.length}
              </Text>
            </View>

            {filteredGuides.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.carousel}
                contentContainerStyle={styles.carouselContent}
              >
                {filteredGuides.map((guide, i) => renderGuideCard(guide, i))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="file-tray-outline" size={40} color={Colors.secondary400} />
                <Text style={styles.emptyText}>No guides found</Text>
                <Text style={styles.emptySubtext}>
                  Try adjusting your search or filters
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={filterVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelFilters}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <ThemedText variant="title" style={styles.modalTitle}>Filter Guides</ThemedText>
              <TouchableOpacity onPress={handleCancelFilters}>
                <Ionicons name="close" size={24} color={Colors.secondary700} />
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* Languages */}
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalLabel}>Languages</ThemedText>
                <View style={styles.chipContainer}>
                  {languageOptions.map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      style={[styles.typeChip, selectedLanguages.includes(lang) && styles.typeChipSelected]}
                      onPress={() => toggleLanguage(lang)}
                    >
                      <Text style={[styles.typeChipText, selectedLanguages.includes(lang) && styles.typeChipTextSelected]}>
                        {lang}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Expertise */}
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalLabel}>Expertise</ThemedText>
                <View style={styles.chipContainer}>
                  {expertiseOptions.map((exp) => (
                    <TouchableOpacity
                      key={exp}
                      style={[styles.typeChip, selectedExpertise.includes(exp) && styles.typeChipSelected]}
                      onPress={() => toggleExpertise(exp)}
                    >
                      <Text style={[styles.typeChipText, selectedExpertise.includes(exp) && styles.typeChipTextSelected]}>
                        {exp}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Minimum Rating */}
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalLabel}>Minimum Rating</ThemedText>
                <View style={styles.chipContainer}>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.typeChip, minRating === r && styles.typeChipSelected]}
                      onPress={() => setMinRating(r)}
                    >
                      <Ionicons 
                        name="star" 
                        size={14} 
                        color={minRating === r ? Colors.primary800 : Colors.warning} 
                      />
                      <Text style={[styles.typeChipText, minRating === r && styles.typeChipTextSelected]}>
                        {r}+
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sort Options */}
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalLabel}>Sort By</ThemedText>
                <View style={styles.chipContainer}>
                  {[
                    { key: 'rating', label: 'Rating', icon: 'star' },
                    { key: 'name', label: 'Name', icon: 'text' },
                    { key: 'reviews', label: 'Reviews', icon: 'chatbubble' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[styles.typeChip, sortBy === option.key && styles.typeChipSelected]}
                      onPress={() => setSortBy(option.key as any)}
                    >
                      <Ionicons 
                        name={option.icon as any} 
                        size={14} 
                        color={sortBy === option.key ? Colors.primary800 : Colors.primary600} 
                      />
                      <Text style={[styles.typeChipText, sortBy === option.key && styles.typeChipTextSelected]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <CustomButton
                title="Clear All"
                variant="secondary"
                style={styles.modalActionBtn}
                onPress={handleClearFilters}
              />
              <CustomButton
                title="Apply Filters"
                variant="primary"
                style={[styles.modalActionBtn, styles.applyButton]}
                onPress={handleApplyFilters}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    zIndex: 10,
  },
  headerSection: {
    backgroundColor: Colors.white,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  headerTextContainer: {
    marginBottom: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary800,
    marginBottom: 2,
  },
  caption: {
    fontSize: 13,
    color: Colors.secondary500,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  searchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon: {
    marginRight: 0,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.secondary700,
    fontFamily: 'Inter',
  },
  clearButton: {
    padding: 2,
  },
  searchInput: {
    flex: 1,
    height: 44,
  },
  filterButton: {
    height: 44,
    width: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary100,
    borderWidth: 1,
    borderColor: Colors.primary300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.secondary600,
    fontFamily: 'Inter',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 18,
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  retryButton: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary800,
  },
  seeMore: {
    fontSize: 13,
    color: Colors.primary600,
    fontWeight: '600',
  },
  guideCount: {
    fontSize: 13,
    color: Colors.secondary500,
    fontWeight: '500',
  },
  carousel: {
    paddingLeft: 16,
    marginBottom: 16,
    minHeight: 280,
  },
  carouselContent: {
    paddingRight: 16,
    gap: 12,
    alignItems: 'center',
  },
  guideCardWrapper: {
    width: 200,
  },
  carouselCard: {
    width: 200,
    marginRight: 0,
  },
  languageBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  languageBadge: {
    backgroundColor: Colors.primary100,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  languageBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary700,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 15,
    color: Colors.secondary600,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  emptySubtext: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.secondary400,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.secondary200,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary800,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    color: Colors.primary700,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalInput: {
    flex: 1,
    padding: 10,
    marginBottom: 0,
    fontSize: 14,
    minWidth: 80,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: Colors.secondary200,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.white,
  },
  typeChipSelected: {
    borderColor: Colors.primary600,
    backgroundColor: Colors.primary100,
  },
  typeChipText: {
    color: Colors.secondary700,
    fontWeight: '500',
    fontSize: 13,
  },
  typeChipTextSelected: {
    color: Colors.primary800,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.secondary200,
    backgroundColor: Colors.white,
  },
  modalActionBtn: {
    flex: 1,
  },
  applyButton: {
    flex: 1.5,
  },
});
