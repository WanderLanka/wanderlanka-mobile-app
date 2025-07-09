import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { ThemedText } from '../../components';

interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  tourType: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  amount: number;
  status: 'booked' | 'pending';
  groupSize: number;
  specialRequests?: string;
}

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState<'booked' | 'pending'>('booked');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'year'>('month');
  const [selectedDayBookings, setSelectedDayBookings] = useState<Booking[]>([]);
  const [showDayBookings, setShowDayBookings] = useState(false);

  const bookings: Booking[] = [
    {
      id: '1',
      clientName: 'Sarah Johnson',
      clientEmail: 'sarah.johnson@email.com',
      tourType: 'Cultural Heritage Tour',
      date: 'Dec 18, 2024',
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
      date: 'Dec 20, 2024',
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
      date: 'Dec 25, 2024',
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
      date: 'Dec 22, 2024',
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
      date: 'Dec 28, 2024',
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
      date: 'Dec 30, 2024',
      time: '9:30 AM',
      duration: '7 hours',
      location: 'Nuwara Eliya',
      amount: 16500,
      status: 'pending',
      groupSize: 5
    }
  ];

  const filteredBookings = bookings.filter(booking => booking.status === activeTab);

  // Calendar helper functions
  const getBookingsForDate = (date: Date) => {
    const dateString = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    return bookings.filter(booking => 
      booking.status === 'booked' && 
      booking.date.replace(',', '') === dateString.replace(',', '')
    );
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getMonthsInYear = (year: number) => {
    const months = [];
    for (let month = 0; month < 12; month++) {
      months.push(new Date(year, month, 1));
    }
    return months;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setFullYear(newDate.getFullYear() - 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setSelectedDate(newDate);
  };

  const selectMonth = (month: Date) => {
    setSelectedDate(month);
    setCalendarView('month');
  };

  const selectDay = (day: Date) => {
    const bookingsForDay = getBookingsForDate(day);
    if (bookingsForDay.length > 0) {
      setSelectedDayBookings(bookingsForDay);
      setShowDayBookings(true);
    }
  };

  const renderCalendarHeader = () => (
    <View style={styles.calendarHeader}>
      <TouchableOpacity 
        onPress={() => calendarView === 'month' ? navigateMonth('prev') : navigateYear('prev')}
        style={styles.calendarNavButton}
      >
        <Ionicons name="chevron-back" size={20} color={Colors.primary600} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => setCalendarView(calendarView === 'month' ? 'year' : 'month')}
        style={styles.calendarTitle}
      >
        <Text style={styles.calendarTitleText}>
          {calendarView === 'month' 
            ? selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : selectedDate.getFullYear().toString()
          }
        </Text>
        <Ionicons name="chevron-down" size={16} color={Colors.primary600} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => calendarView === 'month' ? navigateMonth('next') : navigateYear('next')}
        style={styles.calendarNavButton}
      >
        <Ionicons name="chevron-forward" size={20} color={Colors.primary600} />
      </TouchableOpacity>
    </View>
  );

  const renderMonthView = () => {
    const days = getDaysInMonth(selectedDate);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <View style={styles.monthView}>
        {/* Day names header */}
        <View style={styles.dayNamesRow}>
          {dayNames.map((dayName) => (
            <Text key={dayName} style={styles.dayNameText}>
              {dayName}
            </Text>
          ))}
        </View>
        
        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {days.map((day, index) => {
            if (!day) {
              return <View key={index} style={styles.emptyDay} />;
            }
            
            const bookingsForDay = getBookingsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const hasBookings = bookingsForDay.length > 0;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  isToday && styles.todayDay,
                  hasBookings && styles.dayWithBookings
                ]}
                onPress={() => selectDay(day)}
              >
                <Text style={[
                  styles.dayText,
                  isToday && styles.todayText,
                  hasBookings && styles.dayWithBookingsText
                ]}>
                  {day.getDate()}
                </Text>
                {hasBookings && (
                  <View style={styles.bookingDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderYearView = () => {
    const months = getMonthsInYear(selectedDate.getFullYear());
    
    return (
      <View style={styles.yearView}>
        {months.map((month, index) => {
          const monthBookings = bookings.filter(booking => {
            const bookingDate = new Date(booking.date);
            return bookingDate.getMonth() === month.getMonth() && 
                   bookingDate.getFullYear() === month.getFullYear() &&
                   booking.status === 'booked';
          });
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.monthItem,
                monthBookings.length > 0 && styles.monthWithBookings
              ]}
              onPress={() => selectMonth(month)}
            >
              <Text style={[
                styles.monthText,
                monthBookings.length > 0 && styles.monthWithBookingsText
              ]}>
                {month.toLocaleDateString('en-US', { month: 'short' })}
              </Text>
              {monthBookings.length > 0 && (
                <View style={styles.monthBookingIndicator}>
                  <Text style={styles.monthBookingIndicatorText}>
                    {monthBookings.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderCalendar = () => (
    <View style={styles.calendarContainer}>
      {renderCalendarHeader()}
      {calendarView === 'month' ? renderMonthView() : renderYearView()}
      <TouchableOpacity 
        style={styles.closeCalendarButton}
        onPress={() => setShowCalendar(false)}
      >
        <Text style={styles.closeCalendarText}>Close</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDayBookingsModal = () => (
    <View style={styles.dayBookingsModal}>
      <View style={styles.dayBookingsHeader}>
        <Text style={styles.dayBookingsTitle}>
          Bookings for {selectedDayBookings.length > 0 ? selectedDayBookings[0].date : ''}
        </Text>
        <TouchableOpacity 
          style={styles.closeDayBookingsButton}
          onPress={() => setShowDayBookings(false)}
        >
          <Ionicons name="close" size={24} color={Colors.secondary600} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.dayBookingsList}>
        {selectedDayBookings.map((booking) => (
          <View key={booking.id} style={styles.dayBookingItem}>
            <View style={styles.dayBookingTime}>
              <Text style={styles.dayBookingTimeText}>{booking.time}</Text>
            </View>
            <View style={styles.dayBookingDetails}>
              <Text style={styles.dayBookingClient}>{booking.clientName}</Text>
              <Text style={styles.dayBookingTour}>{booking.tourType}</Text>
              <Text style={styles.dayBookingLocation}>📍 {booking.location}</Text>
            </View>
            <View style={styles.dayBookingAmount}>
              <Text style={styles.dayBookingAmountText}>
                Rs. {booking.amount.toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

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
        <TouchableOpacity 
          style={styles.calendarButton} 
          onPress={() => setShowCalendar(!showCalendar)}
        >
          <Ionicons name="calendar" size={24} color={Colors.primary600} />
        </TouchableOpacity>
        <ThemedText variant="title" style={styles.headerTitle}>Bookings</ThemedText>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color={Colors.secondary700} />
        </TouchableOpacity>
      </View>

      {/* Calendar Modal */}
      {showCalendar && renderCalendar()}

      {/* Day Bookings Modal */}
      {showDayBookings && renderDayBookingsModal()}

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
  },

  headerLeft: {
    width: 40, // Same width as filter button for balance
  },

  calendarButton: {
    padding: 8,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary700,
    flex: 1,
    textAlign: 'center',
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

  // Calendar styles
  calendarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    zIndex: 1000,
    padding: 20,
  },

  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
    marginBottom: 20,
  },

  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.secondary50,
  },

  calendarTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary100,
  },

  calendarTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary700,
    marginRight: 8,
  },

  monthView: {
    flex: 1,
  },

  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },

  dayNameText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary500,
    paddingVertical: 8,
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  emptyDay: {
    width: '14.28%',
    height: 50,
  },

  calendarDay: {
    width: '14.28%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  todayDay: {
    backgroundColor: Colors.primary100,
    borderRadius: 8,
  },

  dayWithBookings: {
    backgroundColor: Colors.primary100,
    borderRadius: 8,
  },

  dayText: {
    fontSize: 16,
    color: Colors.secondary700,
  },

  todayText: {
    color: Colors.primary700,
    fontWeight: '600',
  },

  dayWithBookingsText: {
    color: Colors.success,
    fontWeight: '600',
  },

  bookingIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.success,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bookingIndicatorText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600',
  },

  yearView: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  monthItem: {
    width: '30%',
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: Colors.secondary50,
    position: 'relative',
  },

  monthWithBookings: {
    backgroundColor: Colors.primary100,
    borderWidth: 2,
    borderColor: Colors.success,
  },

  monthText: {
    fontSize: 16,
    color: Colors.secondary700,
    fontWeight: '600',
  },

  monthWithBookingsText: {
    color: Colors.success,
  },

  monthBookingIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.success,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  monthBookingIndicatorText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },

  closeCalendarButton: {
    backgroundColor: Colors.primary600,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },

  closeCalendarText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Day booking dot indicator
  bookingDot: {
    position: 'absolute',
    bottom: 4,
    alignSelf: 'center',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },

  // Day bookings modal styles
  dayBookingsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    zIndex: 1100,
    padding: 20,
  },

  dayBookingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
    marginBottom: 20,
  },

  dayBookingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    flex: 1,
  },

  closeDayBookingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.secondary50,
  },

  dayBookingsList: {
    flex: 1,
  },

  dayBookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary600,
  },

  dayBookingTime: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },

  dayBookingTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary600,
  },

  dayBookingDetails: {
    flex: 1,
  },

  dayBookingClient: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 2,
  },

  dayBookingTour: {
    fontSize: 14,
    color: Colors.secondary600,
    marginBottom: 2,
  },

  dayBookingLocation: {
    fontSize: 12,
    color: Colors.secondary500,
  },

  dayBookingAmount: {
    alignItems: 'flex-end',
  },

  dayBookingAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.success,
  },
});