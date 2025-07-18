import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { ThemedText } from './ThemedText';

interface TripDay {
  date: string;
  dayNumber: number;
  formattedDate: string;
}

interface TripDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  destination: string;
  startPoint: string;
  startDate: string;
  endDate: string;
  destinations: string[];
  tripDays: TripDay[];
  selectedDayIndex: number;
}

export const TripDetailsModal: React.FC<TripDetailsModalProps> = ({
  visible,
  onClose,
  destination,
  startPoint,
  startDate,
  endDate,
  destinations,
  tripDays,
  selectedDayIndex,
}) => {
  const tripDuration = tripDays.length;
  const currentDay = tripDays[selectedDayIndex];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <ThemedText style={styles.headerTitle}>Trip Details</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.secondary700} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerDivider} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Trip Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={20} color={Colors.primary600} />
              <ThemedText style={styles.sectionTitle}>Trip Overview</ThemedText>
            </View>
            <View style={styles.tripCard}>
              <ThemedText style={styles.tripDestination}>{destination}</ThemedText>
              <View style={styles.tripMetaRow}>
                <Ionicons name="calendar-outline" size={16} color={Colors.secondary500} />
                <ThemedText style={styles.tripMeta}>{startDate} - {endDate}</ThemedText>
              </View>
              <View style={styles.tripMetaRow}>
                <Ionicons name="time-outline" size={16} color={Colors.secondary500} />
                <ThemedText style={styles.tripMeta}>
                  {tripDuration} {tripDuration === 1 ? 'night' : 'nights'}
                </ThemedText>
              </View>
              <View style={styles.tripMetaRow}>
                <Ionicons name="navigate-outline" size={16} color={Colors.secondary500} />
                <ThemedText style={styles.tripMeta}>Starting from {startPoint}</ThemedText>
              </View>
            </View>
          </View>

          {/* Current Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bed" size={20} color={Colors.primary600} />
              <ThemedText style={styles.sectionTitle}>Current Booking</ThemedText>
            </View>
            <View style={styles.currentBookingCard}>
              <ThemedText style={styles.currentBookingTitle}>
                Day {currentDay?.dayNumber} Accommodation
              </ThemedText>
              <ThemedText style={styles.currentBookingDate}>
                Check-in: {currentDay?.formattedDate}
              </ThemedText>
              <View style={styles.bookingProgress}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${((selectedDayIndex + 1) / tripDuration) * 100}%` }
                    ]} 
                  />
                </View>
                <ThemedText style={styles.progressText}>
                  Day {selectedDayIndex + 1} of {tripDuration}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Planned Destinations */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="map" size={20} color={Colors.primary600} />
              <ThemedText style={styles.sectionTitle}>Planned Destinations</ThemedText>
            </View>
            <View style={styles.destinationsContainer}>
              {destinations.map((place, index) => (
                <View key={index} style={styles.destinationItem}>
                  <View style={styles.destinationDot} />
                  <ThemedText style={styles.destinationText}>{place}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Trip Timeline */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list" size={20} color={Colors.primary600} />
              <ThemedText style={styles.sectionTitle}>Trip Timeline</ThemedText>
            </View>
            <View style={styles.timelineContainer}>
              {tripDays.map((day, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={[
                    styles.timelineDot,
                    index === selectedDayIndex && styles.timelineDotActive,
                    index < selectedDayIndex && styles.timelineDotCompleted
                  ]} />
                  <View style={styles.timelineContent}>
                    <ThemedText style={[
                      styles.timelineDay,
                      index === selectedDayIndex && styles.timelineDayActive
                    ]}>
                      Day {day.dayNumber}
                    </ThemedText>
                    <ThemedText style={styles.timelineDate}>
                      {day.formattedDate}
                    </ThemedText>
                    {index === selectedDayIndex && (
                      <ThemedText style={styles.timelineStatus}>
                        Currently booking accommodation
                      </ThemedText>
                    )}
                  </View>
                  {index < tripDays.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Trip Stats */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart" size={20} color={Colors.primary600} />
              <ThemedText style={styles.sectionTitle}>Trip Statistics</ThemedText>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{destinations.length}</ThemedText>
                <ThemedText style={styles.statLabel}>Destinations</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{tripDuration}</ThemedText>
                <ThemedText style={styles.statLabel}>
                  {tripDuration === 1 ? 'Night' : 'Nights'}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>
                  {Math.round(((selectedDayIndex + 1) / tripDuration) * 100)}%
                </ThemedText>
                <ThemedText style={styles.statLabel}>Planned</ThemedText>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  header: {
    backgroundColor: Colors.white,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.secondary700,
  },
  closeButton: {
    padding: 4,
  },
  headerDivider: {
    height: 1,
    backgroundColor: Colors.secondary200,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  tripCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tripDestination: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.secondary700,
    marginBottom: 12,
  },
  tripMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  tripMeta: {
    fontSize: 16,
    color: Colors.secondary600,
  },
  currentBookingCard: {
    backgroundColor: Colors.primary100,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary300,
  },
  currentBookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary700,
    marginBottom: 4,
  },
  currentBookingDate: {
    fontSize: 14,
    color: Colors.primary600,
    marginBottom: 12,
  },
  bookingProgress: {
    gap: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.primary300,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary600,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Colors.primary600,
    fontWeight: '500',
  },
  destinationsContainer: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  destinationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary600,
  },
  destinationText: {
    fontSize: 16,
    color: Colors.secondary700,
    fontWeight: '500',
  },
  timelineContainer: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
  },
  timelineItem: {
    position: 'relative',
    paddingLeft: 32,
    paddingBottom: 16,
  },
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.secondary400,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  timelineDotActive: {
    backgroundColor: Colors.primary600,
  },
  timelineDotCompleted: {
    backgroundColor: Colors.success,
  },
  timelineContent: {
    gap: 2,
  },
  timelineDay: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  timelineDayActive: {
    color: Colors.primary600,
  },
  timelineDate: {
    fontSize: 14,
    color: Colors.secondary500,
  },
  timelineStatus: {
    fontSize: 12,
    color: Colors.primary600,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 20,
    width: 2,
    height: 16,
    backgroundColor: Colors.secondary200,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRightWidth: 1,
    borderRightColor: Colors.secondary200,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary600,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    textAlign: 'center',
  },
});
