import {
  ActivityIndicator,
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
import React, { useEffect, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { myTripsApi } from '../../utils/itineraryApi';

const { width } = Dimensions.get('window');

export default function SavedPlansScreen() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch saved plans on component mount and when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchSavedPlans();
    }, [])
  );

  const fetchSavedPlans = async () => {
    try {
      setIsLoading(true);
      const response = await myTripsApi.getTripsByCategory('saved');
      
      if (response.success && response.data) {
        setSavedPlans(response.data.trips || []);
      }
    } catch (error) {
      console.error('Error fetching saved plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filters = [
    { id: 'all', label: 'All Plans', count: savedPlans.length },
  ];

  const filteredPlans = savedPlans;

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
              params: { itineraryId: plan._id, mode: 'edit' }
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
                itineraryId: plan._id 
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

        <View style={styles.planFooter}>
          <View style={styles.planStats}>
            <View style={styles.planStat}>
              <Ionicons name="location" size={14} color={Colors.primary600} />
              <ThemedText style={styles.planStatText}>
                {plan.placesCount || 0} places
              </ThemedText>
            </View>
            <View style={styles.planStat}>
              <Ionicons name="calendar" size={14} color={Colors.success} />
              <ThemedText style={styles.planStatText}>
                {plan.dayPlansCount || 0} days
              </ThemedText>
            </View>
            {plan.hasRoute && (
              <View style={styles.planStat}>
                <Ionicons name="navigate" size={14} color={Colors.success} />
                <ThemedText style={styles.planStatText}>Route Ready</ThemedText>
              </View>
            )}
          </View>
          
          <ThemedText style={styles.planLastModified}>
            Updated {new Date(plan.lastModified || plan.updatedAt).toLocaleDateString()}
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
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary600} />
          <ThemedText style={styles.loadingText}>Loading your saved plans...</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredPlans}
          renderItem={renderPlanCard}
          keyExtractor={(item) => item._id}
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
      )}
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

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.secondary600,
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
