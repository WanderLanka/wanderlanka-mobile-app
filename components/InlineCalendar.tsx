import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface InlineCalendarProps {
  onDaySelect: (day: Date) => void;
  selectedDate?: Date | null;
}

export const InlineCalendar: React.FC<InlineCalendarProps> = ({ onDaySelect, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
          
          return (
            <TouchableOpacity
              key={`day-${index}`}
              style={[
                styles.calendarDay,
                isToday && styles.todayDay,
                isSelected && styles.selectedDay,
                isPast && styles.pastDay
              ]}
              onPress={() => !isPast && selectDay(day)}
              activeOpacity={0.7}
              disabled={isPast}
            >
              <Text style={[
                styles.dayText,
                isToday && styles.todayText,
                isSelected && styles.selectedText,
                isPast && styles.pastText
              ]}>
                {day.getDate()}
              </Text>
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
});
