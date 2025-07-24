import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { ThemedText, CustomTextInput } from '../../components';
import CreatePackageComponent from '../../components/create-package';

interface TourPackage {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  maxGroupSize: number;
  difficulty: 'Easy' | 'Moderate' | 'Challenging' | 'Expert';
  category: 'Cultural' | 'Adventure' | 'Nature' | 'Historical' | 'Beach' | 'City Tour' | 'Wildlife';
  highlights: string[];
  included: string[];
  excluded: string[];
  itinerary: { time: string; activity: string; location: string }[];
  images: string[];
  bookingsCount: number;
  rating: number;
  reviewsCount: number;
  isActive: boolean;
  seasonalPricing?: { season: string; price: number }[];
  availableDates: string[];
  cancellationPolicy: string;
  meetingPoint: string;
  languages: string[];
  requirements: string[];
}

export default function PackagesScreen() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy] = useState<'popular' | 'newest' | 'price_low' | 'price_high'>('popular');

  const categories = ['All', 'Cultural', 'Adventure', 'Nature', 'Historical', 'Beach', 'City Tour', 'Wildlife'];

  const packages: TourPackage[] = [
    {
      id: '1',
      name: 'Sacred Kandy Cultural Experience',
      description: 'Explore the spiritual heart of Sri Lanka with visits to Temple of the Tooth, cultural performances, and traditional crafts workshops.',
      duration: '6 hours',
      price: 15000,
      maxGroupSize: 8,
      difficulty: 'Easy',
      category: 'Cultural',
      highlights: [
        'Temple of the Tooth Relic visit',
        'Traditional Kandyan dance performance',
        'Local artisan workshops',
        'Royal Botanical Gardens'
      ],
      included: [
        'Professional guide',
        'Temple entrance fees',
        'Traditional lunch',
        'Transportation',
        'Cultural show tickets'
      ],
      excluded: [
        'Personal expenses',
        'Tips',
        'Additional snacks',
        'Souvenir purchases'
      ],
      itinerary: [
        { time: '9:00 AM', activity: 'Pick up from hotel', location: 'Kandy' },
        { time: '9:30 AM', activity: 'Temple of the Tooth visit', location: 'Temple Complex' },
        { time: '11:00 AM', activity: 'Royal Botanical Gardens', location: 'Peradeniya' },
        { time: '1:00 PM', activity: 'Traditional lunch', location: 'Local restaurant' },
        { time: '2:30 PM', activity: 'Artisan workshops', location: 'Craft village' },
        { time: '4:00 PM', activity: 'Cultural dance performance', location: 'Cultural center' }
      ],
      images: ['kandy1.jpg', 'kandy2.jpg', 'kandy3.jpg'],
      bookingsCount: 45,
      rating: 4.8,
      reviewsCount: 23,
      isActive: true,
      availableDates: ['2024-12-20', '2024-12-22', '2024-12-25'],
      cancellationPolicy: 'Free cancellation up to 24 hours before the tour',
      meetingPoint: 'Kandy City Center',
      languages: ['English', 'Sinhala', 'Tamil'],
      requirements: ['Comfortable walking shoes', 'Modest clothing for temple visits']
    },
    {
      id: '2',
      name: 'Ella Rock Sunrise Adventure',
      description: 'Early morning hike to witness breathtaking sunrise views from Ella Rock, one of Sri Lanka\'s most iconic viewpoints.',
      duration: '8 hours',
      price: 22000,
      maxGroupSize: 6,
      difficulty: 'Challenging',
      category: 'Adventure',
      highlights: [
        'Spectacular sunrise views',
        'Ella Rock summit hike',
        'Nine Arch Bridge visit',
        'Local tea plantation tour'
      ],
      included: [
        'Professional hiking guide',
        'Safety equipment',
        'Breakfast on the mountain',
        'Transportation',
        'Tea plantation visit'
      ],
      excluded: [
        'Hiking boots (can be rented)',
        'Personal hiking gear',
        'Lunch',
        'Additional refreshments'
      ],
      itinerary: [
        { time: '4:30 AM', activity: 'Pick up and drive to starting point', location: 'Ella' },
        { time: '5:00 AM', activity: 'Begin hiking to Ella Rock', location: 'Trailhead' },
        { time: '6:30 AM', activity: 'Sunrise viewing', location: 'Ella Rock Summit' },
        { time: '8:00 AM', activity: 'Mountain breakfast', location: 'Summit' },
        { time: '9:30 AM', activity: 'Descent and Nine Arch Bridge', location: 'Bridge area' },
        { time: '11:00 AM', activity: 'Tea plantation visit', location: 'Local plantation' }
      ],
      images: ['ella1.jpg', 'ella2.jpg', 'ella3.jpg'],
      bookingsCount: 32,
      rating: 4.9,
      reviewsCount: 18,
      isActive: true,
      availableDates: ['2024-12-19', '2024-12-21', '2024-12-24'],
      cancellationPolicy: 'Free cancellation up to 48 hours before the tour',
      meetingPoint: 'Ella Train Station',
      languages: ['English', 'Sinhala'],
      requirements: ['Good physical fitness', 'Hiking experience recommended', 'Warm clothing for early morning']
    },
    {
      id: '3',
      name: 'Galle Fort Heritage Walk',
      description: 'Discover the colonial charm of Galle Fort with its Dutch architecture, narrow streets, and stunning ocean views.',
      duration: '4 hours',
      price: 12000,
      maxGroupSize: 10,
      difficulty: 'Easy',
      category: 'Historical',
      highlights: [
        'UNESCO World Heritage site',
        'Dutch colonial architecture',
        'Lighthouse and ramparts',
        'Local artisan galleries'
      ],
      included: [
        'Professional guide',
        'Fort entrance',
        'Historical documentation',
        'Gallery visits',
        'Refreshments'
      ],
      excluded: [
        'Meals',
        'Shopping',
        'Museum entrance fees',
        'Personal expenses'
      ],
      itinerary: [
        { time: '2:00 PM', activity: 'Meet at fort entrance', location: 'Galle Fort' },
        { time: '2:15 PM', activity: 'Historical overview', location: 'Main gate' },
        { time: '3:00 PM', activity: 'Ramparts walk', location: 'Fort walls' },
        { time: '4:00 PM', activity: 'Lighthouse visit', location: 'Lighthouse area' },
        { time: '4:30 PM', activity: 'Artisan galleries', location: 'Pedlar Street' },
        { time: '5:30 PM', activity: 'Sunset viewing', location: 'Flag Rock' }
      ],
      images: ['galle1.jpg', 'galle2.jpg', 'galle3.jpg'],
      bookingsCount: 67,
      rating: 4.7,
      reviewsCount: 34,
      isActive: false,
      availableDates: ['2024-12-23', '2024-12-26', '2024-12-29'],
      cancellationPolicy: 'Free cancellation up to 12 hours before the tour',
      meetingPoint: 'Galle Fort Main Gate',
      languages: ['English', 'German', 'French'],
      requirements: ['Comfortable walking shoes', 'Sun protection']
    }
  ];

  const filteredPackages = packages.filter(pkg => {
    const matchesTab = activeTab === 'all' || 
                     (activeTab === 'active' && pkg.isActive) || 
                     (activeTab === 'draft' && !pkg.isActive);
    const matchesCategory = selectedCategory === 'All' || pkg.category === selectedCategory;
    const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pkg.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesCategory && matchesSearch;
  });

  const sortedPackages = [...filteredPackages].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.bookingsCount - a.bookingsCount;
      case 'newest':
        return b.id.localeCompare(a.id);
      case 'price_low':
        return a.price - b.price;
      case 'price_high':
        return b.price - a.price;
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
        setShowCreateForm(true);
        break;
      case 'duplicate':
        Alert.alert('Duplicate Package', 'Create a copy of this package?');
        break;
      case 'delete':
        Alert.alert(
          'Delete Package',
          'Are you sure you want to delete this package? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete:', packageId) }
          ]
        );
        break;
      case 'toggle':
        // Toggle active/inactive status
        console.log('Toggle package status:', packageId);
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

  const renderPackageCard = (pkg: TourPackage) => (
    <View key={pkg.id} style={styles.packageCard}>
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
          <Text style={styles.packageName} numberOfLines={2}>{pkg.name}</Text>
          <View style={styles.packageMeta}>
            <View style={styles.metaItem}>
              <Ionicons name={getCategoryIcon(pkg.category)} size={14} color={Colors.primary600} />
              <Text style={styles.metaText}>{pkg.category}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={14} color={Colors.secondary500} />
              <Text style={styles.metaText}>{pkg.duration}</Text>
            </View>
          </View>
          <View style={styles.packageStats}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={14} color={Colors.warning} />
              <Text style={styles.statText}>{pkg.rating}</Text>
              <Text style={styles.statSubText}>({pkg.reviewsCount})</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="calendar" size={14} color={Colors.success} />
              <Text style={styles.statText}>{pkg.bookingsCount}</Text>
              <Text style={styles.statSubText}>bookings</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.packagePrice}>
          <Text style={styles.priceAmount}>Rs. {pkg.price.toLocaleString()}</Text>
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
          {pkg.highlights.slice(0, 3).map((highlight, index) => (
            <View key={index} style={styles.highlightItem}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.highlightText}>{highlight}</Text>
            </View>
          ))}
          {pkg.highlights.length > 3 && (
            <Text style={styles.moreHighlights}>+{pkg.highlights.length - 3} more</Text>
          )}
        </View>
      </View>

      {/* Package Actions */}
      <View style={styles.packageActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handlePackageAction(pkg.id, 'edit')}
        >
          <Ionicons name="create" size={18} color={Colors.primary600} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handlePackageAction(pkg.id, 'duplicate')}
        >
          <Ionicons name="copy" size={18} color={Colors.secondary600} />
          <Text style={styles.actionButtonText}>Duplicate</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.toggleButton]}
          onPress={() => handlePackageAction(pkg.id, 'toggle')}
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
          onPress={() => handlePackageAction(pkg.id, 'delete')}
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
        <CreatePackageComponent onClose={() => setShowCreateForm(false)} />
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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