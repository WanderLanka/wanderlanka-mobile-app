import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { CalendarProps, Booking } from '../types/Calendar.types';
import DayBookings from './DayBookings';

export default function Calendar({ bookings, onClose, onDaySelect }: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'year'>('month');
  const [showDayBookings, setShowDayBookings] = useState(false);
  const [selectedDayBookings, setSelectedDayBookings] = useState<Booking[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date());

  // Helper function to parse booking date and match with calendar date
  const parseBookingDate = (dateString: string): Date => {
    // Handle formats like "July 20, 2025", "Aug 2, 2025", "Dec 25, 2025"
    const cleanDateString = dateString.replace(',', '');
    return new Date(cleanDateString);
  };

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date): Booking[] => {
    return bookings.filter(booking => {
      const bookingDate = parseBookingDate(booking.date);
      return (
        bookingDate.getDate() === date.getDate() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Generate days for month view
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

  // Generate months for year view
  const getMonthsInYear = (year: number) => {
    const months = [];
    for (let month = 0; month < 12; month++) {
      months.push(new Date(year, month, 1));
    }
    return months;
  };

  // Navigation functions
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
      setSelectedDayDate(day);
      setSelectedDayBookings(bookingsForDay);
      setShowDayBookings(true);
    }
    // Still call the original callback if provided
    if (onDaySelect) {
      onDaySelect(day, bookingsForDay);
    }
  };

  const handleCloseDayBookings = () => {
    setShowDayBookings(false);
  };

  const handleBookingPress = (booking: Booking) => {
    console.log("Booking pressed:", booking.id);
    // You can add more logic here for handling booking press
  };

  // Render calendar header
  const renderCalendarHeader = () => (
    <View style={calendarStyles.calendarHeader}>
      <TouchableOpacity 
        onPress={() => calendarView === 'month' ? navigateMonth('prev') : navigateYear('prev')}
        style={calendarStyles.calendarNavButton}
      >
        <Ionicons name="chevron-back" size={20} color={Colors.primary600} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => setCalendarView(calendarView === 'month' ? 'year' : 'month')}
        style={calendarStyles.calendarTitle}
      >
        <Text style={calendarStyles.calendarTitleText}>
          {calendarView === 'month' 
            ? selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : selectedDate.getFullYear().toString()
          }
        </Text>
        <Ionicons name="chevron-down" size={16} color={Colors.primary600} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => calendarView === 'month' ? navigateMonth('next') : navigateYear('next')}
        style={calendarStyles.calendarNavButton}
      >
        <Ionicons name="chevron-forward" size={20} color={Colors.primary600} />
      </TouchableOpacity>
    </View>
  );

  // Render month view
  const renderMonthView = () => {
    const days = getDaysInMonth(selectedDate);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <View style={calendarStyles.monthView}>
        {/* Legend */}
        <View style={calendarStyles.legend}>
          <View style={calendarStyles.legendItem}>
            <View style={[calendarStyles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={calendarStyles.legendText}>Confirmed</Text>
          </View>
          <View style={calendarStyles.legendItem}>
            <View style={[calendarStyles.legendDot, { backgroundColor: Colors.warning }]} />
            <Text style={calendarStyles.legendText}>Pending</Text>
          </View>
          <View style={calendarStyles.legendItem}>
            <View style={[calendarStyles.legendDot, { backgroundColor: Colors.primary100 }]} />
            <Text style={calendarStyles.legendText}>Today</Text>
          </View>
        </View>

        {/* Day names header */}
        <View style={calendarStyles.dayNamesRow}>
          {dayNames.map((dayName) => (
            <Text key={dayName} style={calendarStyles.dayNameText}>
              {dayName}
            </Text>
          ))}
        </View>
        
        {/* Calendar grid */}
        <View style={calendarStyles.calendarGrid}>
          {days.map((day, index) => {
            if (!day) {
              return <View key={index} style={calendarStyles.emptyDay} />;
            }
            
            const bookingsForDay = getBookingsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const hasBookings = bookingsForDay.length > 0;
            const confirmedCount = bookingsForDay.filter(b => b.status === 'booked').length;
            const pendingCount = bookingsForDay.filter(b => b.status === 'pending').length;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  calendarStyles.calendarDay,
                  isToday && calendarStyles.todayDay,
                  hasBookings && calendarStyles.dayWithBookings
                ]}
                onPress={() => selectDay(day)}
                activeOpacity={0.7}
                disabled={!hasBookings}
              >
                <Text style={[
                  calendarStyles.dayText,
                  isToday && calendarStyles.todayText,
                  hasBookings && calendarStyles.dayWithBookingsText
                ]}>
                  {day.getDate()}
                </Text>
                {hasBookings && (
                  <View style={calendarStyles.bookingIndicators}>
                    {confirmedCount > 0 && (
                      <View style={[calendarStyles.bookingDot, calendarStyles.confirmedDot]}>
                        <Text style={calendarStyles.bookingDotText}>{confirmedCount}</Text>
                      </View>
                    )}
                    {pendingCount > 0 && (
                      <View style={[calendarStyles.bookingDot, calendarStyles.pendingDot]}>
                        <Text style={calendarStyles.bookingDotText}>{pendingCount}</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Render year view
  const renderYearView = () => {
    const months = getMonthsInYear(selectedDate.getFullYear());
    
    return (
      <ScrollView style={calendarStyles.yearView} showsVerticalScrollIndicator={false}>
        <View style={calendarStyles.monthsGrid}>
          {months.map((month, index) => {
            const monthBookings = bookings.filter(booking => {
              const bookingDate = parseBookingDate(booking.date);
              return (
                bookingDate.getMonth() === month.getMonth() && 
                bookingDate.getFullYear() === month.getFullYear()
              );
            });
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  calendarStyles.monthItem,
                  monthBookings.length > 0 && calendarStyles.monthWithBookings
                ]}
                onPress={() => selectMonth(month)}
                activeOpacity={0.7}
              >
                <Text style={[
                  calendarStyles.monthText,
                  monthBookings.length > 0 && calendarStyles.monthWithBookingsText
                ]}>
                  {month.toLocaleDateString('en-US', { month: 'short' })}
                </Text>
                {monthBookings.length > 0 && (
                  <View style={calendarStyles.monthBookingIndicator}>
                    <Text style={calendarStyles.monthBookingIndicatorText}>
                      {monthBookings.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={calendarStyles.calendarContainer}>
      {/* Header with close button */}
      <View style={calendarStyles.header}>
        <Text style={calendarStyles.headerTitle}>Calendar</Text>
        <TouchableOpacity onPress={onClose} style={calendarStyles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.secondary600} />
        </TouchableOpacity>
      </View>

      {/* Calendar content */}
      {renderCalendarHeader()}
      {calendarView === 'month' ? renderMonthView() : renderYearView()}
      
      {/* Close button at bottom */}
      <TouchableOpacity style={calendarStyles.closeCalendarButton} onPress={onClose}>
        <Text style={calendarStyles.closeCalendarText}>Close Calendar</Text>
      </TouchableOpacity>

      {/* DayBookings Modal */}
      {showDayBookings && (
        <DayBookings
          selectedDate={selectedDayDate}
          bookings={selectedDayBookings}
          onClose={handleCloseDayBookings}
          onBookingPress={handleBookingPress}
        />
      )}
    </View>
  );
}

const calendarStyles = StyleSheet.create({
  calendarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    zIndex: 1000,
    paddingTop: 50, // Account for status bar
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary700,
  },

  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.secondary50,
  },

  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },

  calendarNavButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.secondary50,
  },

  calendarTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.secondary50,
    borderRadius: 12,
    marginBottom: 16,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  legendText: {
    fontSize: 12,
    color: Colors.secondary700,
    fontWeight: '500',
  },

  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
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
    borderRadius: 8,
    marginVertical: 2,
  },

  todayDay: {
    backgroundColor: Colors.primary100,
  },

  dayWithBookings: {
    backgroundColor: Colors.primary100,
  },

  dayText: {
    fontSize: 16,
    color: Colors.secondary700,
    fontWeight: '500',
  },

  todayText: {
    color: Colors.primary700,
    fontWeight: '700',
  },

  dayWithBookingsText: {
    color: Colors.success,
    fontWeight: '600',
  },

  bookingDot: {
    backgroundColor: Colors.success,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },

  bookingIndicators: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 2,
    gap: 2,
  },

  confirmedDot: {
    backgroundColor: Colors.success,
  },

  pendingDot: {
    backgroundColor: Colors.warning,
  },

  bookingDotText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600',
  },

  yearView: {
    flex: 1,
    paddingHorizontal: 20,
  },

  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 20,
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
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
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
    marginHorizontal: 20,
    marginBottom: 20,
  },

  closeCalendarText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});