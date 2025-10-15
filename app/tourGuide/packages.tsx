import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  Modal,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { ThemedText, CustomTextInput } from '../../components';
import CreatePackageComponent from '../../components/create-package';
import { GuideService, PackageListItem } from '../../services/guide';

// Removed local TourPackage interface; using PackageListItem from service

export default function PackagesScreen() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy] = useState<'popular' | 'newest' | 'price_low' | 'price_high'>('popular');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packages, setPackages] = useState<PackageListItem[]>([]);
  const [editingPackage, setEditingPackage] = useState<PackageListItem | null>(null);

  const categories = ['All', 'Cultural', 'Adventure', 'Nature', 'Historical', 'Beach', 'City Tour', 'Wildlife'];

  // Data load
  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const isActive = activeTab === 'all' ? undefined : activeTab === 'active';
      const guideId = await GuideService.getCurrentGuideId();
      const res = await GuideService.listPackages({ limit: 50, isActive, guideId: guideId || undefined });
      setPackages(res.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPackages();
    setRefreshing(false);
  };

  const filteredPackages = packages.filter((pkg: any) => {
    const matchesTab = activeTab === 'all' || 
                     (activeTab === 'active' && pkg.isActive) || 
                     (activeTab === 'draft' && !pkg.isActive);
    const matchesCategory = selectedCategory === 'All' || (pkg.tags || []).includes(selectedCategory);
    const matchesSearch = (pkg.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (pkg.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesCategory && matchesSearch;
  });

  const sortedPackages = [...filteredPackages].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'popular':
        return ((b as any).bookingsCount || 0) - ((a as any).bookingsCount || 0);
      case 'newest':
        return (b._id || b.slug || '').localeCompare(a._id || a.slug || '');
      case 'price_low':
        return (a.pricing?.amount || 0) - (b.pricing?.amount || 0);
      case 'price_high':
        return (b.pricing?.amount || 0) - (a.pricing?.amount || 0);
      default:
        return 0;
    }
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return Colors.success;
      case 'Moderate': return Colors.warning;
      case 'Challenging': return Colors.error;
      case 'Expert': return Colors.secondary700;
      default: return Colors.secondary500;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Cultural': return 'library';
      case 'Adventure': return 'trail-sign';
      case 'Nature': return 'leaf';
      case 'Historical': return 'time';
      case 'Beach': return 'water';
      case 'City Tour': return 'business';
      case 'Wildlife': return 'paw';
      default: return 'compass';
    }
  };

  const handlePackageAction = (packageId: string, action: 'edit' | 'duplicate' | 'delete' | 'toggle') => {
    switch (action) {
      case 'edit':
        // Show create form for editing
        {
          const pkg = packages.find(p => String(p._id || p.slug) === packageId) || null;
          setEditingPackage(pkg);
          setShowCreateForm(true);
        }
        break;
      case 'duplicate':
        Alert.alert('Duplicate Package', 'Create a copy of this package?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Duplicate', onPress: async () => {
            const pkg = packages.find(p => String(p._id || p.slug) === packageId);
            if (!pkg) return;
            try {
              await GuideService.insertPackage({
                title: `${pkg.title} (Copy)`,
                description: pkg.description,
                durationDays: pkg.durationDays,
                tags: pkg.tags,
                images: pkg.images,
                includes: (pkg as any).includes,
                excludes: (pkg as any).excludes,
                pricing: pkg.pricing,
                itinerary: (pkg as any).itinerary,
                isActive: pkg.isActive,
              });
              fetchPackages();
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to duplicate');
            }
          }}
        ]);
        break;
      case 'delete':
        Alert.alert(
          'Delete Package',
          'Are you sure you want to delete this package? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
              try {
                await GuideService.deletePackage(packageId);
                fetchPackages();
              } catch (e: any) {
                Alert.alert('Error', e?.message || 'Failed to delete');
              }
            } }
          ]
        );
        break;
      case 'toggle':
        // Toggle active/inactive status
        const pkg = packages.find(p => String(p._id || p.slug) === packageId);
        if (!pkg) return;
        GuideService.updatePackage(packageId, { isActive: !pkg.isActive })
          .then(fetchPackages)
          .catch((e) => Alert.alert('Error', e?.message || 'Failed to update status'));
        break;
    }
  };

  const handleCreateFromTemplate = (template: string) => {
    setShowCreateModal(false);
    setShowCreateForm(true);
  };

  const handleCreateFromScratch = () => {
    setShowCreateModal(false);
    setShowCreateForm(true);
  };

  const renderPackageCard = (pkg: any) => (
    <View key={String(pkg._id || pkg.slug)} style={styles.packageCard}>
      {/* Package Header */}
      <View style={styles.packageHeader}>
        <View style={styles.packageImageContainer}>
          <View style={styles.packageImagePlaceholder}>
            <Ionicons name="image" size={32} color={Colors.secondary400} />
          </View>
          <View style={styles.packageBadges}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(pkg.difficulty) }]}>
              <Text style={styles.difficultyText}>{pkg.difficulty}</Text>
            </View>
            {!pkg.isActive && (
              <View style={styles.draftBadge}>
                <Text style={styles.draftText}>Draft</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.packageInfo}>
          <Text style={styles.packageName} numberOfLines={2}>{pkg.title}</Text>
          <View style={styles.packageMeta}>
            <View style={styles.metaItem}>
              <Ionicons name={getCategoryIcon((pkg.tags && pkg.tags[0]) || 'Package') as any} size={14} color={Colors.primary600} />
              <Text style={styles.metaText}>{(pkg.tags && pkg.tags[0]) || 'Package'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={14} color={Colors.secondary500} />
              <Text style={styles.metaText}>{pkg.durationDays} days</Text>
            </View>
          </View>
          <View style={styles.packageStats}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={14} color={Colors.warning} />
              <Text style={styles.statText}>{pkg.rating || 0}</Text>
              <Text style={styles.statSubText}>({pkg.reviewsCount || 0})</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="calendar" size={14} color={Colors.success} />
              <Text style={styles.statText}>{pkg.bookingsCount || 0}</Text>
              <Text style={styles.statSubText}>bookings</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.packagePrice}>
          <Text style={styles.priceAmount}>LKR {(pkg.pricing?.amount || 0).toLocaleString()}</Text>
          <Text style={styles.priceUnit}>per group</Text>
        </View>
      </View>

      {/* Package Description */}
      <Text style={styles.packageDescription} numberOfLines={2}>
        {pkg.description}
      </Text>

      {/* Package Highlights */}
      <View style={styles.highlightsSection}>
        <Text style={styles.sectionTitle}>Highlights</Text>
        <View style={styles.highlightsList}>
          {(pkg.highlights || []).slice(0, 3).map((highlight: string, index: number) => (
            <View key={`${highlight}-${index}`} style={styles.highlightItem}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.highlightText}>{highlight}</Text>
            </View>
          ))}
          {Array.isArray(pkg.highlights) && pkg.highlights.length > 3 && (
            <Text style={styles.moreHighlights}>+{(pkg.highlights.length - 3)} more</Text>
          )}
        </View>
      </View>

      {/* Package Actions */}
      <View style={styles.packageActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handlePackageAction(String(pkg._id || pkg.slug), 'edit')}
        >
          <Ionicons name="create" size={18} color={Colors.primary600} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handlePackageAction(String(pkg._id || pkg.slug), 'duplicate')}
        >
          <Ionicons name="copy" size={18} color={Colors.secondary600} />
          <Text style={styles.actionButtonText}>Duplicate</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.toggleButton]}
          onPress={() => handlePackageAction(String(pkg._id || pkg.slug), 'toggle')}
        >
          <Ionicons 
            name={pkg.isActive ? 'pause' : 'play'} 
            size={18} 
            color={pkg.isActive ? Colors.warning : Colors.success} 
          />
          <Text style={[styles.actionButtonText, { 
            color: pkg.isActive ? Colors.warning : Colors.success 
          }]}>
            {pkg.isActive ? 'Pause' : 'Activate'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handlePackageAction(String(pkg._id || pkg.slug), 'delete')}
        >
          <Ionicons name="trash" size={18} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCreatePackageModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Package</Text>
          <TouchableOpacity>
            <Text style={styles.modalSave}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalSectionTitle}>Package Templates</Text>
          
          <TouchableOpacity 
            style={styles.templateCard}
            onPress={() => handleCreateFromTemplate('Cultural')}
          >
            <Ionicons name="library" size={24} color={Colors.primary600} />
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>Cultural Experience</Text>
              <Text style={styles.templateDescription}>Temple visits, cultural shows, local experiences</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.secondary400} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.templateCard}
            onPress={() => handleCreateFromTemplate('Adventure')}
          >
            <Ionicons name="trail-sign" size={24} color={Colors.primary600} />
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>Adventure Tour</Text>
              <Text style={styles.templateDescription}>Hiking, climbing, outdoor activities</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.secondary400} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.templateCard}
            onPress={() => handleCreateFromTemplate('Nature')}
          >
            <Ionicons name="leaf" size={24} color={Colors.primary600} />
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>Nature & Wildlife</Text>
              <Text style={styles.templateDescription}>National parks, wildlife spotting, nature walks</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.secondary400} />
          </TouchableOpacity>
          
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <TouchableOpacity style={styles.createFromScratchButton} onPress={handleCreateFromScratch}>
            <Ionicons name="add-circle" size={24} color={Colors.primary600} />
            <Text style={styles.createFromScratchText}>Create from scratch</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderCreatePackageForm = () => {
    return (
      <Modal
        visible={showCreateForm}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowCreateForm(false)}
      >
        <CreatePackageComponent 
          onClose={() => { setShowCreateForm(false); fetchPackages(); setEditingPackage(null); }}
          defaultValues={editingPackage ? {
            name: editingPackage.title,
            description: editingPackage.description || '',
            duration: `${editingPackage.durationDays || 1} days`,
            price: String(editingPackage.pricing?.amount || ''),
            category: (editingPackage.tags && editingPackage.tags[0]) as any,
            included: (editingPackage as any).includes || [],
            excluded: (editingPackage as any).excludes || [],
            itinerary: ((editingPackage as any).itinerary || []).map((it: any) => ({ time: '', activity: it.title, location: it.description || '' })),
            isActive: editingPackage.isActive,
          } : undefined}
          // @ts-ignore - extend to support updates via route params if needed
          idOrSlug={editingPackage ? String(editingPackage._id || editingPackage.slug) : undefined}
        />
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <ThemedText variant="title" style={styles.headerTitle}>Tour Packages</ThemedText>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <CustomTextInput
          label=""
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search packages..."
          leftIcon="search"
          containerStyle={styles.searchInput}
        />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.activeCategoryChip
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.activeCategoryChipText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All
          </Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{packages.length}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active
          </Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>
              {packages.filter(p => p.isActive).length}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'draft' && styles.activeTab]}
          onPress={() => setActiveTab('draft')}
        >
          <Text style={[styles.tabText, activeTab === 'draft' && styles.activeTabText]}>
            Draft
          </Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>
              {packages.filter(p => !p.isActive).length}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sortButton}>
          <Ionicons name="swap-vertical" size={20} color={Colors.secondary600} />
        </TouchableOpacity>
      </View>

      {/* Packages List */}
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.content}>
          {sortedPackages.length > 0 ? (
            sortedPackages.map(renderPackageCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cube" size={64} color={Colors.light300} />
              <Text style={styles.emptyStateTitle}>No packages found</Text>
              <Text style={styles.emptyStateText}>
                {activeTab === 'all' 
                  ? 'Start creating your first tour package to attract travelers'
                  : `No ${activeTab} packages match your current filters`}
              </Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.emptyStateButtonText}>Create Package</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Package Modal */}
      {renderCreatePackageModal()}
      
      {/* Create Package Form */}
      {renderCreatePackageForm()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    fontFamily: 'Sans-Serif',
  },

  addButton: {
    backgroundColor: Colors.primary600,
    borderRadius: 8,
    padding: 8,
  },

  filtersContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },

  searchInput: {
    marginBottom: 16,
  },

  categoriesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },

  categoryChip: {
    backgroundColor: Colors.secondary100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },

  activeCategoryChip: {
    backgroundColor: Colors.primary600,
  },

  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary600,
  },

  activeCategoryChipText: {
    color: Colors.white,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },

  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: Colors.secondary50,
  },

  activeTab: {
    backgroundColor: Colors.primary600,
  },

  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary600,
    marginRight: 6,
  },

  activeTabText: {
    color: Colors.white,
  },

  tabBadge: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },

  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary700,
  },

  sortButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.secondary50,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    padding: 20,
  },

  packageCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  packageHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },

  packageImageContainer: {
    position: 'relative',
    marginRight: 16,
  },

  packageImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.secondary100,
    justifyContent: 'center',
    alignItems: 'center',
  },

  packageBadges: {
    position: 'absolute',
    top: -8,
    right: -8,
    flexDirection: 'column',
  },

  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },

  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },

  draftBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  draftText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },

  packageInfo: {
    flex: 1,
  },

  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 8,
    lineHeight: 22,
  },

  packageMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },

  metaText: {
    fontSize: 12,
    color: Colors.secondary500,
    marginLeft: 4,
  },

  packageStats: {
    flexDirection: 'row',
  },

  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },

  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary600,
    marginLeft: 4,
  },

  statSubText: {
    fontSize: 10,
    color: Colors.secondary400,
    marginLeft: 2,
  },

  packagePrice: {
    alignItems: 'flex-end',
  },

  priceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.success600,
  },

  priceUnit: {
    fontSize: 12,
    color: Colors.secondary500,
  },

  packageDescription: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
    marginBottom: 16,
  },

  highlightsSection: {
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 8,
  },

  highlightsList: {
    backgroundColor: Colors.secondary50,
    borderRadius: 8,
    padding: 12,
  },

  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  highlightText: {
    fontSize: 12,
    color: Colors.secondary600,
    marginLeft: 8,
    flex: 1,
  },

  moreHighlights: {
    fontSize: 12,
    color: Colors.primary600,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },

  packageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary100,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.secondary50,
  },

  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.secondary600,
    marginLeft: 4,
  },

  toggleButton: {
    backgroundColor: Colors.light100,
  },

  deleteButton: {
    backgroundColor: Colors.light100,
    paddingHorizontal: 8,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },

  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.secondary600,
    marginTop: 16,
    marginBottom: 8,
  },

  emptyStateText: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },

  emptyStateButton: {
    backgroundColor: Colors.primary600,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },

  emptyStateButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },

  modalCancel: {
    fontSize: 16,
    color: Colors.secondary600,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },

  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
  },

  modalContent: {
    flex: 1,
    padding: 20,
  },

  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 16,
  },

  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light100,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  templateInfo: {
    flex: 1,
    marginLeft: 16,
  },

  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 4,
  },

  templateDescription: {
    fontSize: 14,
    color: Colors.secondary500,
    lineHeight: 20,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light200,
  },

  dividerText: {
    fontSize: 14,
    color: Colors.secondary500,
    marginHorizontal: 16,
  },

  createFromScratchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.light300,
    borderStyle: 'dashed',
  },

  createFromScratchText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
    marginLeft: 12,
  },
});