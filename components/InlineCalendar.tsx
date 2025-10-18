import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface InlineCalendarProps {
  onDaySelect: (day: Date) => void;
  selectedDate?: Date | null;
  unavailableDates?: string[]; // Array of dates in 'YYYY-MM-DD' format
  packageDuration?: number; // Number of days for the package
}

export const InlineCalendar: React.FC<InlineCalendarProps> = ({ 
  onDaySelect, 
  selectedDate, 
  unavailableDates = [],
  packageDuration = 1 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Create a Set for faster lookups
  const unavailableDatesSet = React.useMemo(() => {
    return new Set(unavailableDates);
  }, [unavailableDates]);

  // Check if a date range conflicts with unavailable dates
  const isDateRangeUnavailable = React.useCallback((startDate: Date): boolean => {
    for (let i = 0; i < packageDuration; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(startDate.getDate() + i);
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      if (unavailableDatesSet.has(checkDateStr)) {
        return true;
      }
    }
    return false;
  }, [packageDuration, unavailableDatesSet]);

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

  // Navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentMonth(newDate);
  };

  const selectDay = (day: Date) => {
    onDaySelect(day);
  };

  const days = getDaysInMonth(currentMonth);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  return (
    <View style={styles.container}>
      {/* Calendar Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigateMonth('prev')}
          style={styles.navButton}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.primary600} />
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        
        <TouchableOpacity 
          onPress={() => navigateMonth('next')}
          style={styles.navButton}
        >
          <Ionicons name="chevron-forward" size={20} color={Colors.primary600} />
        </TouchableOpacity>
      </View>

      {/* Legend */}
      {unavailableDates.length > 0 && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: Colors.primary600 }]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#fee2e2', borderColor: '#fecaca' }]} />
            <Text style={styles.legendText}>Unavailable</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: Colors.primary100, borderColor: Colors.primary300 }]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
        </View>
      )}

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
            return <View key={`empty-${index}`} style={styles.emptyDay} />;
          }
          
          const isToday = day.toDateString() === today.toDateString();
          const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
          const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const dateStr = day.toISOString().split('T')[0];
          const isUnavailable = unavailableDatesSet.has(dateStr) || isDateRangeUnavailable(day);

          const onPressDay = () => {
            if (isPast) return;
            if (isUnavailable) {
              // Build a helpful message depending on single-day vs range conflict
              if (unavailableDatesSet.has(dateStr)) {
                Alert.alert(
                  'Date Unavailable',
                  'The tour guide is not available on this date. Another traveler has already booked the guide. Please select a different date.',
                  [{ text: 'OK' }]
                );
              } else {
                // Range conflict - list the conflicting dates
                const conflicting: string[] = [];
                for (let i = 0; i < packageDuration; i++) {
                  const cd = new Date(day);
                  cd.setDate(day.getDate() + i);
                  const cdStr = cd.toISOString().split('T')[0];
                  if (unavailableDatesSet.has(cdStr)) conflicting.push(cdStr);
                }
                const formatted = conflicting
                  .map(ds => {
                    const d = new Date(ds + 'T00:00:00');
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  })
                  .join(', ');
                Alert.alert(
                  'Date Range Unavailable',
                  `This ${packageDuration}-day package includes dates when the guide is already booked:\n\n${formatted}\n\nPlease select a different start date.`,
                  [{ text: 'OK' }]
                );
              }
              return;
            }
            selectDay(day);
          };
          
          return (
            <TouchableOpacity
              key={`day-${index}`}
              style={[
                styles.calendarDay,
                isToday && styles.todayDay,
                isSelected && styles.selectedDay,
                isPast && styles.pastDay,
                isUnavailable && styles.unavailableDay
              ]}
              onPress={onPressDay}
              activeOpacity={0.7}
              disabled={isPast}
            >
              <Text style={[
                styles.dayText,
                isToday && styles.todayText,
                isSelected && styles.selectedText,
                isPast && styles.pastText,
                isUnavailable && styles.unavailableText
              ]}>
                {day.getDate()}
              </Text>
              {isUnavailable && !isPast && (
                <View style={styles.unavailableIndicator}>
                  <Ionicons name="close-circle" size={10} color={Colors.error} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.secondary50,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary800,
    fontFamily: 'Inter',
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayNameText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary500,
    paddingVertical: 4,
    fontFamily: 'Inter',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: '14.28%',
    height: 44,
  },
  calendarDay: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  todayDay: {
    backgroundColor: Colors.primary100,
    borderWidth: 1,
    borderColor: Colors.primary300,
  },
  selectedDay: {
    backgroundColor: Colors.primary600,
  },
  pastDay: {
    opacity: 0.3,
  },
  unavailableDay: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    opacity: 0.6,
  },
  dayText: {
    fontSize: 14,
    color: Colors.secondary700,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  todayText: {
    color: Colors.primary700,
    fontWeight: '700',
  },
  selectedText: {
    color: Colors.white,
    fontWeight: '700',
  },
  pastText: {
    color: Colors.secondary400,
  },
  unavailableText: {
    color: Colors.error,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  unavailableIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  unavailableDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.error,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.secondary50,
    borderRadius: 12,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  legendText: {
    fontSize: 11,
    color: Colors.secondary700,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
