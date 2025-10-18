import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Booking } from '../../types/Calendar.types';
import Calendar from '../../components/Calendar';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemedText } from '../../components';

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState<'booked' | 'pending'>('booked');
  const [showCalendar, setShowCalendar] = useState(false);

  const bookings: Booking[] = [
    {
      id: '1',
      clientName: 'Sarah Johnson',
      clientEmail: 'sarah.johnson@email.com',
      tourType: 'Cultural Heritage Tour',
      date: 'July 20, 2025',
      time: '9:00 AM',
      duration: '6 hours',
      location: 'Kandy Temple Complex',
      amount: 15000,
      status: 'booked',
      groupSize: 4,
      specialRequests: 'Vegetarian lunch preferred'
    },
    {
      id: '2',
      clientName: 'Mike Chen',
      clientEmail: 'mike.chen@email.com',
      tourType: 'Adventure Hiking',
      date: 'July 25, 2025',
      time: '6:00 AM',
      duration: '8 hours',
      location: 'Ella Rock Trail',
      amount: 22000,
      status: 'booked',
      groupSize: 2
    },
    {
      id: '3',
      clientName: 'Emma Wilson',
      clientEmail: 'emma.wilson@email.com',
      tourType: 'Beach & Wildlife',
      date: 'Dec 25, 2025',
      time: '8:00 AM',
      duration: '10 hours',
      location: 'Mirissa & Yala National Park',
      amount: 28000,
      status: 'booked',
      groupSize: 6
    },
    {
      id: '4',
      clientName: 'James Rodriguez',
      clientEmail: 'james.rodriguez@email.com',
      tourType: 'Mountain Adventure',
      date: 'Aug 2, 2025',
      time: '7:00 AM',
      duration: '12 hours',
      location: 'Adams Peak',
      amount: 18000,
      status: 'pending',
      groupSize: 3,
      specialRequests: 'Need transportation from hotel'
    },
    {
      id: '5',
      clientName: 'Lisa Parker',
      clientEmail: 'lisa.parker@email.com',
      tourType: 'Cultural Experience',
      date: 'Aug 20, 2025',
      time: '10:00 AM',
      duration: '5 hours',
      location: 'Galle Fort & Surroundings',
      amount: 12000,
      status: 'pending',
      groupSize: 2
    },
    {
      id: '6',
      clientName: 'David Kim',
      clientEmail: 'david.kim@email.com',
      tourType: 'Tea Plantation Tour',
      date: 'Aug 30, 2025',
      time: '9:30 AM',
      duration: '7 hours',
      location: 'Nuwara Eliya',
      amount: 16500,
      status: 'pending',
      groupSize: 5
    }
  ];

  const filteredBookings = bookings.filter(booking => booking.status === activeTab);

  const handleDaySelect = (day: Date, bookingsForDay: Booking[]) => {
    // Calendar component now handles showing the DayBookings modal internally
    console.log(`Selected ${day.toDateString()} with ${bookingsForDay.length} bookings`);
  };

  const handleCalendarClose = () => {
    setShowCalendar(false);
  };

  const handleBookingAction = (bookingId: string, action: 'approve' | 'decline' | 'contact') => {
    // Handle booking actions
    console.log(`${action} booking ${bookingId}`);
  };

  const renderBookingCard = (booking: Booking) => (
    <View key={booking.id} style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.clientInfo}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientInitial}>
              {booking.clientName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.clientDetails}>
            <Text style={styles.clientName}>{booking.clientName}</Text>
            <Text style={styles.clientEmail}>{booking.clientEmail}</Text>
          </View>
        </View>
        <View style={styles.bookingAmount}>
          <Text style={styles.amountText}>Rs. {booking.amount.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.tourInfo}>
        <View style={styles.tourHeader}>
          <Text style={styles.tourType}>{booking.tourType}</Text>
          <View style={styles.groupSizeContainer}>
            <Ionicons name="people" size={14} color={Colors.secondary500} />
            <Text style={styles.groupSize}>{booking.groupSize} people</Text>
          </View>
        </View>
        
        <View style={styles.tourDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={16} color={Colors.primary600} />
            <Text style={styles.detailText}>{booking.date}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time" size={16} color={Colors.primary600} />
            <Text style={styles.detailText}>{booking.time} ({booking.duration})</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location" size={16} color={Colors.primary600} />
            <Text style={styles.detailText}>{booking.location}</Text>
          </View>
        </View>

        {booking.specialRequests && (
          <View style={styles.specialRequests}>
            <Text style={styles.specialRequestsLabel}>Special Requests:</Text>
            <Text style={styles.specialRequestsText}>{booking.specialRequests}</Text>
          </View>
        )}
      </View>

      <View style={styles.bookingActions}>
        {booking.status === 'pending' ? (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleBookingAction(booking.id, 'approve')}
            >
              <Ionicons name="checkmark" size={18} color={Colors.white} />
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => handleBookingAction(booking.id, 'decline')}
            >
              <Ionicons name="close" size={18} color={Colors.error} />
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={[styles.actionButton, styles.contactButton]}
            onPress={() => handleBookingAction(booking.id, 'contact')}
          >
            <Ionicons name="chatbubble" size={18} color={Colors.primary600} />
            <Text style={styles.contactButtonText}>Contact Client</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <ThemedText variant="title" style={styles.headerTitle}>Bookings</ThemedText>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.calendarButton} 
            onPress={() => setShowCalendar(true)}
          >
            <Ionicons name="calendar" size={24} color={Colors.primary600} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={24} color={Colors.secondary700} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar Component */}
      {showCalendar && (
        <Calendar
          bookings={bookings}
          onClose={handleCalendarClose}
          onDaySelect={handleDaySelect}
        />
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'booked' && styles.activeTab]}
          onPress={() => setActiveTab('booked')}
        >
          <Text style={[styles.tabText, activeTab === 'booked' && styles.activeTabText]}>
            Booked
          </Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>
              {bookings.filter(b => b.status === 'booked').length}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending
          </Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>
              {bookings.filter(b => b.status === 'pending').length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {filteredBookings.length > 0 ? (
            filteredBookings.map(renderBookingCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons 
                name={activeTab === 'booked' ? 'calendar-outline' : 'hourglass-outline'} 
                size={48} 
                color={Colors.secondary400} 
              />
              <Text style={styles.emptyStateText}>
                No {activeTab} bookings found
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {activeTab === 'booked' 
                  ? 'Your confirmed bookings will appear here' 
                  : 'Pending booking requests will appear here'}
              </Text>
            </View>
          )}
        </View>
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

  calendarButton: {
    padding: 8,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    fontFamily: 'Sans-Serif',
  },

  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  filterButton: {
    padding: 8,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: Colors.secondary50,
  },

  activeTab: {
    backgroundColor: Colors.primary600,
  },

  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary600,
    marginRight: 8,
  },

  activeTabText: {
    color: Colors.white,
  },

  tabBadge: {
    backgroundColor: Colors.secondary200,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },

  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary700,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    padding: 20,
  },

  bookingCard: {
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

  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  clientInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary700,
  },

  clientDetails: {
    flex: 1,
  },

  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 2,
  },

  clientEmail: {
    fontSize: 14,
    color: Colors.secondary500,
  },

  bookingAmount: {
    alignItems: 'flex-end',
  },

  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.success,
  },

  tourInfo: {
    marginBottom: 20,
  },

  tourHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  tourType: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    flex: 1,
  },

  groupSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  groupSize: {
    fontSize: 12,
    color: Colors.secondary600,
    marginLeft: 4,
  },

  tourDetails: {
    backgroundColor: Colors.secondary50,
    borderRadius: 12,
    padding: 16,
  },

  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  detailText: {
    fontSize: 14,
    color: Colors.secondary700,
    marginLeft: 8,
    flex: 1,
  },

  specialRequests: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.light100,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },

  specialRequestsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning,
    marginBottom: 4,
  },

  specialRequestsText: {
    fontSize: 14,
    color: Colors.secondary700,
    fontStyle: 'italic',
  },

  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },

  approveButton: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },

  approveButtonText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: 4,
  },

  declineButton: {
    backgroundColor: Colors.white,
    borderColor: Colors.error,
  },

  declineButtonText: {
    color: Colors.error,
    fontWeight: '600',
    marginLeft: 4,
  },

  contactButton: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary600,
  },

  contactButtonText: {
    color: Colors.primary600,
    fontWeight: '600',
    marginLeft: 4,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },

  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary600,
    marginTop: 16,
    textAlign: 'center',
  },

  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.secondary500,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});