import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Booking } from '../types/Calendar.types';

interface DayBookingsProps {
  selectedDate: Date;
  bookings: Booking[];
  onClose: () => void;
  onBookingPress?: (booking: Booking) => void;
}

export default function DayBookings({ 
  selectedDate, 
  bookings, 
  onClose, 
  onBookingPress 
}: DayBookingsProps) {
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getTotalEarnings = () => {
    return bookings.reduce((total, booking) => total + booking.amount, 0);
  };

  const sortedBookings = [...bookings].sort((a, b) => {
    const timeA = new Date(`1970/01/01 ${a.time}`);
    const timeB = new Date(`1970/01/01 ${b.time}`);
    return timeA.getTime() - timeB.getTime();
  });

  return (
    <View style={styles.modalContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.dateTitle}>{formatDate(selectedDate)}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{bookings.length}</Text>
              <Text style={styles.statLabel}>Tours</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>Rs. {getTotalEarnings().toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.secondary600} />
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <ScrollView style={styles.bookingsList} showsVerticalScrollIndicator={false}>
        {sortedBookings.length > 0 ? (
          sortedBookings.map((booking, index) => (
            <TouchableOpacity
              key={booking.id}
              style={[
                styles.bookingItem,
                index === sortedBookings.length - 1 && styles.lastBookingItem
              ]}
              onPress={() => onBookingPress?.(booking)}
              activeOpacity={0.7}
            >
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{booking.time}</Text>
                <Text style={styles.durationText}>{booking.duration}</Text>
                <View style={styles.statusIndicator} />
              </View>

              <View style={styles.bookingContent}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.clientName}>{booking.clientName}</Text>
                  <View style={styles.groupSizeContainer}>
                    <Ionicons name="people" size={14} color={Colors.secondary500} />
                    <Text style={styles.groupSizeText}>{booking.groupSize}</Text>
                  </View>
                </View>

                <Text style={styles.tourType}>{booking.tourType}</Text>
                
                <View style={styles.locationContainer}>
                  <Ionicons name="location" size={14} color={Colors.primary600} />
                  <Text style={styles.locationText}>{booking.location}</Text>
                </View>

                {booking.specialRequests && (
                  <View style={styles.specialRequestsContainer}>
                    <Ionicons name="alert-circle" size={14} color={Colors.warning} />
                    <Text style={styles.specialRequestsText} numberOfLines={2}>
                      {booking.specialRequests}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.amountContainer}>
                <Text style={styles.amountText}>
                  Rs. {booking.amount.toLocaleString()}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.secondary400} />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={Colors.secondary400} />
            <Text style={styles.emptyStateTitle}>No bookings</Text>
            <Text style={styles.emptyStateText}>
              You don&apos;t have any tours scheduled for this day.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    zIndex: 1100,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.primary100,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },

  headerContent: {
    flex: 1,
  },

  dateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 16,
  },

  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statItem: {
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary600,
  },

  statLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.secondary200,
    marginHorizontal: 20,
  },

  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  bookingsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  bookingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary600,
  },

  lastBookingItem: {
    marginBottom: 20,
  },

  timeContainer: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 70,
  },

  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary600,
    marginBottom: 2,
  },

  durationText: {
    fontSize: 11,
    color: Colors.secondary500,
    marginBottom: 8,
  },

  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },

  bookingContent: {
    flex: 1,
  },

  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    flex: 1,
  },

  groupSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  groupSizeText: {
    fontSize: 11,
    color: Colors.secondary600,
    marginLeft: 2,
    fontWeight: '500',
  },

  tourType: {
    fontSize: 14,
    color: Colors.secondary600,
    marginBottom: 6,
    fontWeight: '500',
  },

  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  locationText: {
    fontSize: 13,
    color: Colors.secondary500,
    marginLeft: 4,
    flex: 1,
  },

  specialRequestsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },

  specialRequestsText: {
    fontSize: 12,
    color: Colors.warning,
    marginLeft: 4,
    flex: 1,
    fontStyle: 'italic',
  },

  amountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 12,
  },

  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 4,
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
  },

  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.secondary50,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary200,
    gap: 12,
  },

  addBookingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary600,
  },

  addBookingText: {
    color: Colors.primary600,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },

  viewDayButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary600,
    paddingVertical: 12,
    borderRadius: 8,
  },

  viewDayText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});
