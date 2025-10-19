import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { CustomButton, ThemedText } from '../../components';
import React, { useState, useEffect } from 'react';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { myTripsApi } from '../../utils/itineraryApi';

const { width } = Dimensions.get('window');

export default function TripDetailsScreen() {
  const { tripId } = useLocalSearchParams();
  const [trip, setTrip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTripDetails();
  }, [tripId]);

  const fetchTripDetails = async () => {
    try {
      setIsLoading(true);
      const response = await myTripsApi.getTripDetails(tripId as string);
      
      if (response.success && response.data) {
        console.log('Trip details loaded:', response.data);
        setTrip(response.data);
      }
    } catch (error) {
      console.error('Error fetching trip details:', error);
      Alert.alert('Error', 'Failed to load trip details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChecklistItem = async (itemId: string, currentStatus: boolean) => {
    try {
      console.log(`Toggling checklist item ${itemId} from ${currentStatus} to ${!currentStatus}`);
      
      // Optimistic update - update UI immediately
      setTrip((prevTrip: any) => {
        if (!prevTrip) return prevTrip;
        
        return {
          ...prevTrip,
          checklist: prevTrip.checklist.map((item: any) =>
            item.id === itemId ? { ...item, completed: !currentStatus } : item
          ),
        };
      });

      // Call API to update backend
      const response = await myTripsApi.toggleChecklistItem(
        tripId as string,
        itemId,
        !currentStatus
      );

      if (!response.success) {
        // Revert on failure
        setTrip((prevTrip: any) => {
          if (!prevTrip) return prevTrip;
          
          return {
            ...prevTrip,
            checklist: prevTrip.checklist.map((item: any) =>
              item.id === itemId ? { ...item, completed: currentStatus } : item
            ),
          };
        });
        Alert.alert('Error', 'Failed to update checklist item');
      }
    } catch (error) {
      console.error('Error toggling checklist item:', error);
      // Revert on error
      setTrip((prevTrip: any) => {
        if (!prevTrip) return prevTrip;
        
        return {
          ...prevTrip,
          checklist: prevTrip.checklist.map((item: any) =>
            item.id === itemId ? { ...item, completed: currentStatus } : item
          ),
        };
      });
      Alert.alert('Error', 'Failed to update checklist item');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return Colors.success;
      case 'planned':
        return Colors.primary600;
      case 'completed':
        return Colors.secondary500;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.secondary400;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary600} />
          <ThemedText style={styles.loadingText}>Loading trip details...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
          <ThemedText style={styles.errorTitle}>Trip Not Found</ThemedText>
          <ThemedText style={styles.errorText}>
            The trip you're looking for doesn't exist or has been deleted.
          </ThemedText>
          <CustomButton
            title="Go Back"
            variant="primary"
            size="medium"
            onPress={() => router.back()}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

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
          <ThemedText style={styles.headerTitle}>Trip Details</ThemedText>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="share-outline" size={24} color={Colors.primary600} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Trip Header */}
        <View style={styles.section}>
          <View style={styles.tripHeader}>
            <ThemedText style={styles.tripTitle}>{trip.tripName}</ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) + '20' }]}>
              <ThemedText style={[styles.statusText, { color: getStatusColor(trip.status) }]}>
                {trip.status?.charAt(0).toUpperCase() + trip.status?.slice(1)}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.locationRow}>
            <View style={styles.locationItem}>
              <Ionicons name="location" size={16} color={Colors.success} />
              <ThemedText style={styles.locationText}>{trip.startLocation?.name}</ThemedText>
            </View>
            <Ionicons name="arrow-forward" size={16} color={Colors.secondary400} />
            <View style={styles.locationItem}>
              <Ionicons name="flag" size={16} color={Colors.error} />
              <ThemedText style={styles.locationText}>{trip.endLocation?.name}</ThemedText>
            </View>
          </View>
        </View>

        {/* Trip Schedule */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Schedule</ThemedText>
          <View style={styles.card}>
            <View style={styles.scheduleRow}>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary600} />
              <View style={styles.scheduleInfo}>
                <ThemedText style={styles.scheduleLabel}>Start Date</ThemedText>
                <ThemedText style={styles.scheduleValue}>
                  {new Date(trip.startDate).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </ThemedText>
              </View>
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleRow}>
              <Ionicons name="calendar" size={20} color={Colors.error} />
              <View style={styles.scheduleInfo}>
                <ThemedText style={styles.scheduleLabel}>End Date</ThemedText>
                <ThemedText style={styles.scheduleValue}>
                  {new Date(trip.endDate).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </ThemedText>
              </View>
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleRow}>
              <Ionicons name="time-outline" size={20} color={Colors.success} />
              <View style={styles.scheduleInfo}>
                <ThemedText style={styles.scheduleLabel}>Duration</ThemedText>
                <ThemedText style={styles.scheduleValue}>{trip.tripDuration} days</ThemedText>
              </View>
            </View>
            {trip.daysUntilStart > 0 && (
              <>
                <View style={styles.scheduleDivider} />
                <View style={styles.scheduleRow}>
                  <Ionicons name="hourglass-outline" size={20} color={Colors.warning} />
                  <View style={styles.scheduleInfo}>
                    <ThemedText style={styles.scheduleLabel}>Countdown</ThemedText>
                    <ThemedText style={styles.scheduleValue}>
                      {trip.daysUntilStart} days until departure
                    </ThemedText>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Statistics</ThemedText>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="location" size={28} color={Colors.primary600} />
              <ThemedText style={styles.statValue}>{trip.placesCount || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Places</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="calendar" size={28} color={Colors.success} />
              <ThemedText style={styles.statValue}>{trip.dayPlansCount || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Day Plans</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="navigate" size={28} color={Colors.warning} />
              <ThemedText style={styles.statValue}>
                {trip.selectedRoute ? '1' : '0'}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Routes</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
              <ThemedText style={styles.statValue}>{trip.completionPercentage || 0}%</ThemedText>
              <ThemedText style={styles.statLabel}>Complete</ThemedText>
            </View>
          </View>
        </View>

        {/* Selected Route */}
        {trip.selectedRoute && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Route Information</ThemedText>
            <View style={styles.card}>
              <View style={styles.routeHeader}>
                <Ionicons name="navigate-circle" size={24} color={Colors.primary600} />
                <ThemedText style={styles.routeName}>
                  {trip.selectedRoute.routeName || 'Selected Route'}
                </ThemedText>
              </View>
              
              <View style={styles.routeStatsGrid}>
                <View style={styles.routeStatCard}>
                  <Ionicons name="speedometer" size={24} color={Colors.primary600} />
                  <ThemedText style={styles.routeStatValue}>
                    {trip.selectedRoute.totalDistance || 0} km
                  </ThemedText>
                  <ThemedText style={styles.routeStatLabel}>Distance</ThemedText>
                </View>
                <View style={styles.routeStatCard}>
                  <Ionicons name="time" size={24} color={Colors.success} />
                  <ThemedText style={styles.routeStatValue}>
                    {trip.selectedRoute.estimatedDuration || 'N/A'}
                  </ThemedText>
                  <ThemedText style={styles.routeStatLabel}>Duration</ThemedText>
                </View>
                <View style={styles.routeStatCard}>
                  <Ionicons name="cash" size={24} color={Colors.warning} />
                  <ThemedText style={styles.routeStatValue}>
                    LKR {trip.selectedRoute.estimatedCost || 0}
                  </ThemedText>
                  <ThemedText style={styles.routeStatLabel}>Est. Cost</ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Checklist - organized by day */}
        {trip.checklist && trip.checklist.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Checklist ({trip.checklist.filter((item: any) => item.completed).length}/{trip.checklist.length})
            </ThemedText>
            <View style={styles.card}>
              {trip.checklist.map((item: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.checklistItem}
                  onPress={() => handleToggleChecklistItem(item.id, item.completed)}
                  activeOpacity={0.7}
                >
                  <View style={styles.checklistLeft}>
                    <Ionicons 
                      name={item.completed ? "checkmark-circle" : "ellipse-outline"} 
                      size={20} 
                      color={item.completed ? Colors.success : Colors.secondary400} 
                    />
                    <ThemedText style={[
                      styles.checklistText,
                      item.completed && styles.checklistTextCompleted
                    ]}>
                      {item.item}
                    </ThemedText>
                  </View>
                  <View style={styles.checklistDayBadge}>
                    <ThemedText style={styles.checklistDayText}>Day {item.dayNumber}</ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Notes - organized by day */}
        {trip.notes && trip.notes.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
            <View style={styles.card}>
              {trip.notes.map((note: any, index: number) => (
                <View key={index} style={styles.noteItem}>
                  <View style={styles.noteHeader}>
                    <View style={styles.noteHeaderLeft}>
                      <Ionicons name="document-text" size={16} color={Colors.primary600} />
                      <ThemedText style={styles.noteDayText}>Day {note.dayNumber}</ThemedText>
                    </View>
                    {note.dayDate && (
                      <ThemedText style={styles.noteDate}>
                        {new Date(note.dayDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </ThemedText>
                    )}
                  </View>
                  <View style={styles.noteContent}>
                    <ThemedText style={styles.noteText}>
                      {note.content}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Day Plans */}
        {trip.dayPlans && trip.dayPlans.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Day Plans ({trip.dayPlans.length})
            </ThemedText>
            {trip.dayPlans.map((day: any, index: number) => (
              <View key={index} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayNumber}>
                    <ThemedText style={styles.dayNumberText}>Day {day.dayNumber}</ThemedText>
                  </View>
                  <ThemedText style={styles.dayDate}>
                    {day.date ? new Date(day.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    }) : 'Not set'}
                  </ThemedText>
                </View>
                <View style={styles.dayPlaces}>
                  <Ionicons name="location" size={14} color={Colors.primary600} />
                  <ThemedText style={styles.dayPlacesText}>
                    {day.places?.length || 0} places planned
                  </ThemedText>
                </View>
                {day.places && day.places.length > 0 && (
                  <View style={styles.placesList}>
                    {day.places.map((place: any, placeIndex: number) => (
                      <View key={placeIndex} style={styles.placeItem}>
                        <Ionicons name="ellipse" size={8} color={Colors.primary600} />
                        <ThemedText style={styles.placeName}>{place.name}</ThemedText>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Locations */}
        {trip.locations && trip.locations.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              All Locations ({trip.locations.length})
            </ThemedText>
            {trip.locations.slice(0, 5).map((location: any, index: number) => (
              <View key={index} style={styles.locationCard}>
                <Image 
                  source={{ uri: location.imageUrl || location.image || 'https://via.placeholder.com/80' }} 
                  style={styles.locationImage}
                  resizeMode="cover"
                />
                <View style={styles.locationInfo}>
                  <ThemedText style={styles.locationName}>{location.name}</ThemedText>
                  {location.address && (
                    <View style={styles.locationAddress}>
                      <Ionicons name="location-outline" size={12} color={Colors.secondary500} />
                      <ThemedText style={styles.locationAddressText}>{location.address}</ThemedText>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.secondary400} />
              </View>
            ))}
            {trip.locations.length > 5 && (
              <TouchableOpacity style={styles.viewMoreButton}>
                <ThemedText style={styles.viewMoreText}>
                  View all {trip.locations.length} locations
                </ThemedText>
                <Ionicons name="arrow-forward" size={16} color={Colors.primary600} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <CustomButton
            title="Edit Itinerary"
            variant="outline"
            size="large"
            onPress={() => {
              router.push({
                pathname: '/planning/itinerary',
                params: { itineraryId: trip._id, mode: 'edit' }
              });
            }}
            style={styles.actionButton}
          />
          <CustomButton
            title="View on Map"
            variant="primary"
            size="large"
            onPress={() => {
              router.push({
                pathname: '/planning/map-view',
                params: { 
                  itineraryId: trip._id
                }
              });
            }}
            style={styles.actionButton}
          />
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    justifyContent: 'space-between',
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
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 12,
  },

  // Trip Header
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tripTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary700,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: Colors.secondary600,
    flex: 1,
  },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Schedule
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    marginBottom: 4,
  },
  scheduleValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: Colors.secondary100,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: (width - 52) / 2,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary700,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: 4,
  },

  // Route
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    flex: 1,
  },
  routeStatsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  routeStatCard: {
    flex: 1,
    backgroundColor: Colors.secondary50,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  routeStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
  },
  routeStatLabel: {
    fontSize: 12,
    color: Colors.secondary600,
  },

  // Checklist
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },
  checklistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checklistText: {
    fontSize: 14,
    color: Colors.secondary700,
    flex: 1,
  },
  checklistTextCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.secondary400,
  },
  checklistDayBadge: {
    backgroundColor: Colors.primary100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  checklistDayText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary600,
  },

  // Notes
  noteItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary600,
  },
  noteContent: {
    paddingLeft: 24,
  },
  noteText: {
    fontSize: 14,
    color: Colors.secondary700,
    lineHeight: 20,
  },
  noteDate: {
    fontSize: 11,
    color: Colors.secondary400,
  },

  // Day Plans
  dayCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayNumber: {
    backgroundColor: Colors.primary600,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dayNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  dayDate: {
    fontSize: 14,
    color: Colors.secondary600,
  },
  dayPlaces: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dayPlacesText: {
    fontSize: 14,
    color: Colors.secondary600,
  },
  placesList: {
    gap: 8,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeName: {
    fontSize: 14,
    color: Colors.secondary700,
  },

  // Locations
  locationCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: Colors.secondary100,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  locationAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationAddressText: {
    fontSize: 12,
    color: Colors.secondary500,
    flex: 1,
  },
  viewMoreButton: {
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary600,
  },

  // Actions
  actions: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  actionButton: {
    marginBottom: 0,
  },

  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.secondary600,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.error,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.secondary600,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    marginBottom: 0,
  },

  // Spacing
  bottomSpacing: {
    height: 40,
  },
});
