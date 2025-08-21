import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { CustomButton, ThemedText } from '../../components';
import React, { useState } from 'react';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

// Mock data for saved trip plans
const SAVED_PLANS = [
  {
    id: 'plan1',
    title: 'Cultural Triangle Adventure',
    destination: 'Anuradhapura, Polonnaruwa & Sigiriya',
    duration: '5 Days, 4 Nights',
    created: '2024-07-15',
    lastModified: '2024-07-20',
    thumbnail: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=400',
    description: 'Explore ancient kingdoms and UNESCO World Heritage sites',
    places: ['Anuradhapura', 'Polonnaruwa', 'Sigiriya', 'Dambulla'],
    estimatedBudget: '$450',
    difficulty: 'Moderate',
    tags: ['History', 'Culture', 'Adventure'],
    isPublic: true,
    likes: 24,
    saves: 156,
  },
  {
    id: 'plan2',
    title: 'Hill Country Tea Trail',
    destination: 'Kandy, Nuwara Eliya & Ella',
    duration: '4 Days, 3 Nights',
    created: '2024-07-10',
    lastModified: '2024-07-18',
    thumbnail: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400',
    description: 'Journey through misty mountains and tea plantations',
    places: ['Kandy', 'Nuwara Eliya', 'Ella', 'Haputale'],
    estimatedBudget: '$380',
    difficulty: 'Easy',
    tags: ['Nature', 'Tea', 'Scenic'],
    isPublic: false,
    likes: 18,
    saves: 89,
  },
  {
    id: 'plan3',
    title: 'Southern Coast Paradise',
    destination: 'Galle, Mirissa & Tangalle',
    duration: '6 Days, 5 Nights',
    created: '2024-07-05',
    lastModified: '2024-07-16',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400',
    description: 'Beach relaxation and whale watching adventure',
    places: ['Galle', 'Mirissa', 'Tangalle', 'Weligama'],
    estimatedBudget: '$520',
    difficulty: 'Easy',
    tags: ['Beach', 'Wildlife', 'Relaxation'],
    isPublic: true,
    likes: 31,
    saves: 203,
  },
];

export default function SavedPlansScreen() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const filters = [
    { id: 'all', label: 'All Plans', count: 3 },
    { id: 'public', label: 'Public', count: 2 },
    { id: 'private', label: 'Private', count: 1 },
  ];

  const filteredPlans = SAVED_PLANS.filter(plan => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'public') return plan.isPublic;
    if (selectedFilter === 'private') return !plan.isPublic;
    return true;
  });

  const handlePlanPress = (plan: any) => {
    Alert.alert(
      'Open Plan',
      `Would you like to edit "${plan.title}" or use it for a new trip?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Edit Plan', 
          onPress: () => {
            // Navigate to itinerary editing
            router.push({
              pathname: '/planning/itinerary',
              params: { planId: plan.id, mode: 'edit' }
            });
          }
        },
        { 
          text: 'Start Trip', 
          onPress: () => {
            // Navigate to route selection with this plan
            router.push({
              pathname: '/planning/route-selection',
              params: { 
                destination: plan.destination,
                planId: plan.id 
              }
            });
          }
        },
      ]
    );
  };

  const handleDeletePlan = (planId: string) => {
    Alert.alert(
      'Delete Plan',
      'Are you sure you want to delete this saved plan? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Handle deletion logic here
            console.log('Deleting plan:', planId);
          }
        },
      ]
    );
  };

  const renderPlanCard = ({ item: plan }: { item: any }) => (
    <TouchableOpacity 
      style={styles.planCard}
      onPress={() => handlePlanPress(plan)}
      activeOpacity={0.7}
    >
      <View style={styles.planImageContainer}>
        <Image 
          source={{ uri: plan.thumbnail }} 
          style={styles.planImage}
          resizeMode="cover"
        />
        <View style={styles.planImageOverlay}>
          <View style={styles.planDuration}>
            <Ionicons name="time" size={14} color={Colors.white} />
            <ThemedText style={styles.planDurationText}>{plan.duration}</ThemedText>
          </View>
          <View style={styles.planVisibility}>
            <Ionicons 
              name={plan.isPublic ? "globe" : "lock-closed"} 
              size={14} 
              color={Colors.white} 
            />
          </View>
        </View>
      </View>

      <View style={styles.planContent}>
        <View style={styles.planHeader}>
          <ThemedText style={styles.planTitle} numberOfLines={1}>
            {plan.title}
          </ThemedText>
          <TouchableOpacity 
            style={styles.planOptionsButton}
            onPress={() => handleDeletePlan(plan.id)}
          >
            <Ionicons name="ellipsis-vertical" size={16} color={Colors.secondary500} />
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.planDestination} numberOfLines={1}>
          {plan.destination}
        </ThemedText>
        
        <ThemedText style={styles.planDescription} numberOfLines={2}>
          {plan.description}
        </ThemedText>

        <View style={styles.planTags}>
          {plan.tags.slice(0, 3).map((tag: string, index: number) => (
            <View key={index} style={styles.planTag}>
              <ThemedText style={styles.planTagText}>{tag}</ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.planFooter}>
          <View style={styles.planStats}>
            <View style={styles.planStat}>
              <Ionicons name="heart" size={14} color={Colors.error} />
              <ThemedText style={styles.planStatText}>{plan.likes}</ThemedText>
            </View>
            <View style={styles.planStat}>
              <Ionicons name="bookmark" size={14} color={Colors.primary600} />
              <ThemedText style={styles.planStatText}>{plan.saves}</ThemedText>
            </View>
            <View style={styles.planStat}>
              <Ionicons name="wallet" size={14} color={Colors.success} />
              <ThemedText style={styles.planStatText}>{plan.estimatedBudget}</ThemedText>
            </View>
          </View>
          
          <ThemedText style={styles.planLastModified}>
            Updated {new Date(plan.lastModified).toLocaleDateString()}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.secondary700} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.headerTitle}>Saved Plans</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {filteredPlans.length} itineraries ready to use
          </ThemedText>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="add" size={24} color={Colors.primary600} />
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        style={styles.filtersScroll}
      >
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterPill,
              selectedFilter === filter.id && styles.filterPillActive
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <ThemedText style={[
              styles.filterPillText,
              selectedFilter === filter.id && styles.filterPillTextActive
            ]}>
              {filter.label} ({filter.count})
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Plans List */}
      <FlatList
        data={filteredPlans}
        renderItem={renderPlanCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.plansList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={64} color={Colors.secondary400} />
            <ThemedText style={styles.emptyStateTitle}>No Saved Plans</ThemedText>
            <ThemedText style={styles.emptyStateDescription}>
              Start planning your next adventure and save your itineraries here
            </ThemedText>
            <CustomButton
              title="Create New Plan"
              variant="primary"
              size="medium"
              onPress={() => router.push('/planning')}
              style={styles.emptyStateButton}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: 2,
  },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filters
  filtersScroll: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.secondary100,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    height: 35,
    marginBottom: 8,
  },
  filterPillActive: {
    backgroundColor: Colors.primary600,
    borderColor: Colors.primary600,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary600,
  },
  filterPillTextActive: {
    color: Colors.white,
  },

  // Plans List
  plansList: {
    padding: 20,
    gap: 16,
  },
  planCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  planImageContainer: {
    position: 'relative',
    height: 120,
  },
  planImage: {
    width: '100%',
    height: '100%',
  },
  planImageOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  planDurationText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '500',
  },
  planVisibility: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 6,
    borderRadius: 12,
  },

  // Plan Content
  planContent: {
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
    flex: 1,
    marginRight: 8,
  },
  planOptionsButton: {
    padding: 4,
  },
  planDestination: {
    fontSize: 14,
    color: Colors.primary600,
    fontWeight: '500',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
    marginBottom: 12,
  },
  
  // Tags
  planTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  planTag: {
    backgroundColor: Colors.primary100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planTagText: {
    fontSize: 12,
    color: Colors.primary700,
    fontWeight: '500',
  },

  // Footer
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planStats: {
    flexDirection: 'row',
    gap: 16,
  },
  planStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planStatText: {
    fontSize: 12,
    color: Colors.secondary600,
    fontWeight: '500',
  },
  planLastModified: {
    fontSize: 12,
    color: Colors.secondary400,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary600,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 32,
  },
});
