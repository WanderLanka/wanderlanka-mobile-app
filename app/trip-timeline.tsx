import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';

import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

// Mock trip timeline data
const MOCK_TRIP_TIMELINE = [
  {
    id: 'trip1',
    destination: 'Kandy Cultural Triangle',
    date: '2024-06-15',
    endDate: '2024-06-18',
    duration: '3 days',
    rating: 4.8,
    photos: 15,
    type: 'Cultural',
    status: 'completed',
    highlights: ['Temple of the Tooth', 'Royal Botanical Gardens', 'Kandy Lake'],
    coverImage: null,
    cost: 25000,
  },
  {
    id: 'trip2',
    destination: 'Ella Hill Country',
    date: '2024-05-20',
    endDate: '2024-05-22',
    duration: '2 days',
    rating: 4.9,
    photos: 23,
    type: 'Adventure',
    status: 'completed',
    highlights: ['Nine Arch Bridge', 'Little Adams Peak', 'Ella Rock'],
    coverImage: null,
    cost: 18000,
  },
  {
    id: 'trip3',
    destination: 'Galle Fort Heritage',
    date: '2024-04-10',
    endDate: '2024-04-10',
    duration: '1 day',
    rating: 4.7,
    photos: 12,
    type: 'Heritage',
    status: 'completed',
    highlights: ['Dutch Fort', 'Lighthouse', 'Clock Tower'],
    coverImage: null,
    cost: 8000,
  },
  {
    id: 'trip4',
    destination: 'Sigiriya Ancient City',
    date: '2024-03-15',
    endDate: '2024-03-16',
    duration: '2 days',
    rating: 4.6,
    photos: 18,
    type: 'Historical',
    status: 'completed',
    highlights: ['Lion Rock', 'Ancient Frescoes', 'Water Gardens'],
    coverImage: null,
    cost: 15000,
  },
  {
    id: 'trip5',
    destination: 'Yala National Park',
    date: '2024-08-01',
    endDate: '2024-08-03',
    duration: '3 days',
    rating: 0,
    photos: 0,
    type: 'Wildlife',
    status: 'upcoming',
    highlights: ['Leopard Safari', 'Bird Watching', 'Camping'],
    coverImage: null,
    cost: 45000,
  },
];

const getTripTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'cultural': return Colors.primary600;
    case 'adventure': return Colors.warning;
    case 'heritage': return Colors.info;
    case 'historical': return Colors.secondary600;
    case 'wildlife': return Colors.success;
    default: return Colors.secondary400;
  }
};

const getTripStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed': return Colors.success;
    case 'upcoming': return Colors.primary600;
    case 'cancelled': return Colors.error;
    default: return Colors.secondary400;
  }
};

interface TripTimelineItemProps {
  trip: typeof MOCK_TRIP_TIMELINE[0];
  index: number;
}

const TripTimelineItem: React.FC<TripTimelineItemProps> = ({ trip, index }) => {
  const isUpcoming = trip.status === 'upcoming';
  
  return (
    <View style={styles.timelineItem}>
      {/* Timeline Line */}
      <View style={styles.timelineLine}>
        <View style={[styles.timelineDot, { backgroundColor: getTripStatusColor(trip.status) }]} />
        {index < MOCK_TRIP_TIMELINE.length - 1 && <View style={styles.timelineConnector} />}
      </View>

      {/* Trip Content */}
      <TouchableOpacity style={styles.tripCard} activeOpacity={0.8}>
        <View style={styles.tripHeader}>
          <View style={styles.tripTitleSection}>
            <Text style={styles.tripDestination}>{trip.destination}</Text>
            <Text style={styles.tripDate}>
              {new Date(trip.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
              {trip.endDate !== trip.date && 
                ` - ${new Date(trip.endDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}`
              }
            </Text>
          </View>
          
          <View style={styles.tripMeta}>
            <View style={[styles.tripTypeBadge, { backgroundColor: getTripTypeColor(trip.type) }]}>
              <Text style={styles.tripTypeBadgeText}>{trip.type}</Text>
            </View>
            <Text style={styles.tripDuration}>{trip.duration}</Text>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.tripDetails}>
          {!isUpcoming && (
            <View style={styles.tripStats}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={16} color={Colors.warning} />
                <Text style={styles.statText}>{trip.rating}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="images" size={16} color={Colors.primary600} />
                <Text style={styles.statText}>{trip.photos} photos</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="wallet" size={16} color={Colors.success} />
                <Text style={styles.statText}>Rs. {trip.cost.toLocaleString()}</Text>
              </View>
            </View>
          )}

          {/* Highlights */}
          <View style={styles.highlightsSection}>
            <Text style={styles.highlightsTitle}>
              {isUpcoming ? 'Planned Activities:' : 'Highlights:'}
            </Text>
            <View style={styles.highlightsList}>
              {trip.highlights.map((highlight, idx) => (
                <View key={idx} style={styles.highlightItem}>
                  <Ionicons 
                    name={isUpcoming ? "calendar-outline" : "checkmark-circle"} 
                    size={12} 
                    color={isUpcoming ? Colors.primary600 : Colors.success} 
                  />
                  <Text style={styles.highlightText}>{highlight}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {!isUpcoming ? (
              <>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="images-outline" size={16} color={Colors.primary600} />
                  <Text style={styles.actionButtonText}>View Photos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share-outline" size={16} color={Colors.primary600} />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="create-outline" size={16} color={Colors.primary600} />
                  <Text style={styles.actionButtonText}>Edit Plan</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.cancelButton]}>
                  <Ionicons name="close-outline" size={16} color={Colors.error} />
                  <Text style={[styles.actionButtonText, { color: Colors.error }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default function TripTimelineScreen() {
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'upcoming'>('all');

  const filteredTrips = MOCK_TRIP_TIMELINE.filter(trip => {
    if (filterStatus === 'all') return true;
    return trip.status === filterStatus;
  });

  const totalTrips = MOCK_TRIP_TIMELINE.filter(t => t.status === 'completed').length;
  const totalCost = MOCK_TRIP_TIMELINE.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.cost, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Timeline</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="filter-outline" size={24} color={Colors.primary600} />
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalTrips}</Text>
          <Text style={styles.summaryLabel}>Completed Trips</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>Rs. {(totalCost / 1000).toFixed(0)}K</Text>
          <Text style={styles.summaryLabel}>Total Spent</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {MOCK_TRIP_TIMELINE.filter(t => t.status === 'upcoming').length}
          </Text>
          <Text style={styles.summaryLabel}>Upcoming</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'completed', 'upcoming'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterTab, filterStatus === status && styles.activeFilterTab]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[
              styles.filterTabText,
              filterStatus === status && styles.activeFilterTabText
            ]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Timeline */}
      <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
        {filteredTrips.map((trip, index) => (
          <TripTimelineItem key={trip.id} trip={trip} index={index} />
        ))}
      </ScrollView>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  headerButton: {
    padding: 4,
  },
  summarySection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary600,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    textAlign: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: Colors.primary600,
  },
  filterTabText: {
    fontSize: 14,
    color: Colors.secondary600,
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: Colors.white,
  },
  timeline: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLine: {
    alignItems: 'center',
    marginRight: 16,
    paddingTop: 8,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.light300,
    minHeight: 40,
  },
  tripCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tripTitleSection: {
    flex: 1,
  },
  tripDestination: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  tripDate: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  tripMeta: {
    alignItems: 'flex-end',
  },
  tripTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  tripTypeBadgeText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600',
  },
  tripDuration: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  tripDetails: {
    gap: 12,
  },
  tripStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 12,
    color: Colors.secondary600,
    marginLeft: 4,
  },
  highlightsSection: {
    gap: 8,
  },
  highlightsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
  },
  highlightsList: {
    gap: 4,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightText: {
    fontSize: 12,
    color: Colors.secondary600,
    marginLeft: 6,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light300,
  },
  cancelButton: {
    borderColor: Colors.error,
  },
  actionButtonText: {
    fontSize: 12,
    color: Colors.primary600,
    marginLeft: 4,
    fontWeight: '500',
  },
});
