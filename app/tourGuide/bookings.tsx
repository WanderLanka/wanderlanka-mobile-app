import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { ThemedText } from '../../components';
import Calendar from '../../components/Calendar';
import { Booking as CalendarBooking } from '../../types/Calendar.types';
import { BookingService, TourPackageBookingItem } from '../../services/booking';
import { GuideService } from '../../services/guide';

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState<'booked' | 'pending'>('booked');
  const [showCalendar, setShowCalendar] = useState(false);
  const [items, setItems] = useState<TourPackageBookingItem[]>([]);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    let mount = true;
    const load = async () => {
      try {
        const guideId = await GuideService.getCurrentGuideId();
        if (!guideId) throw new Error('Guide profile not found');
        const res = await BookingService.listTourPackageBookings({ guideId: String(guideId) });
        if (res?.success && Array.isArray(res.data) && mount) setItems(res.data as any);
        else if (mount) setItems([]);
      } catch (e) {
        console.error('Failed to load guide bookings:', e);
        if (mount) setItems([]);
      } finally {
        // no-op
      }
    };
    load();
    return () => { mount = false; };
  }, []);

  const bookings = useMemo(() => {
    // Map backend items to calendar booking shape
    const toPrettyDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const toTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return items.map((it): CalendarBooking => {
      // Map backend status to calendar status
      let calendarStatus: 'booked' | 'pending';
      if (it.status === 'confirmed' || it.status === 'approved') {
        calendarStatus = 'booked';
      } else {
        calendarStatus = 'pending';
      }
      
      return {
        id: String(it._id),
        clientName: it.packageTitle, // no client name available; show packageTitle
        clientEmail: '',
        tourType: it.packageTitle,
        date: toPrettyDate(it.startDate),
        time: toTime(it.startDate),
        duration: `${Math.max(1, Math.ceil((new Date(it.endDate).getTime() - new Date(it.startDate).getTime())/(1000*60*60*24)))} days`,
        location: it.packageSlug || 'Tour Package',
        amount: Number(it.pricing?.totalAmount || 0),
        status: calendarStatus,
        groupSize: Number(it.peopleCount || 1),
        specialRequests: it.notes || undefined,
      };
    });
  }, [items]);

  const filteredBookings = bookings.filter(booking => booking.status === activeTab);

  const handleDaySelect = (day: Date, bookingsForDay: CalendarBooking[]) => {
    // Calendar component now handles showing the DayBookings modal internally
    console.log(`Selected ${day.toDateString()} with ${bookingsForDay.length} bookings`);
  };

  const handleCalendarClose = () => {
    setShowCalendar(false);
  };

  const handleBookingAction = async (bookingId: string, action: 'approve' | 'decline' | 'contact') => {
    try {
      setActingId(bookingId);
      if (action === 'approve') {
        const res = await BookingService.approveTourPackageBooking(bookingId);
        if (!res?.success) {
          const errorData = res as any;
          // Check if it's a date conflict error (409)
          if (errorData?.error?.includes('not available') || errorData?.conflict) {
            const conflict = errorData.conflict;
            let conflictMessage = 'You already have a booking on the selected dates.';
            
            if (conflict) {
              const startDate = new Date(conflict.startDate).toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric' 
              });
              const endDate = new Date(conflict.endDate).toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric' 
              });
              conflictMessage = `You already have a ${conflict.status} booking for "${conflict.packageTitle}" from ${startDate} to ${endDate}.\n\nYou cannot approve this request as it overlaps with your existing booking.`;
            }
            
            Alert.alert(
              'Booking Conflict',
              conflictMessage,
              [
                { 
                  text: 'Decline This Request', 
                  style: 'destructive',
                  onPress: () => handleBookingAction(bookingId, 'decline')
                },
                { text: 'OK', style: 'cancel' }
              ]
            );
          } else {
            throw new Error(errorData?.error || 'Failed to approve');
          }
        } else {
          Alert.alert('Approved', 'Booking was approved. The client can now proceed with payment.');
        }
      } else if (action === 'decline') {
        const res = await BookingService.cancelTourPackageBooking(bookingId);
        if (!res?.success) throw new Error((res as any)?.error || 'Failed to decline');
        Alert.alert('Declined', 'Booking request has been declined.');
      } else if (action === 'contact') {
        // Placeholder for contact flow (chat/phone)
        Alert.alert('Contact', 'Contacting client feature coming soon.');
      }
      // Reload after action
      const gid = await GuideService.getCurrentGuideId();
      if (gid) {
        const res = await BookingService.listTourPackageBookings({ guideId: String(gid) });
        if (res?.success && Array.isArray(res.data)) setItems(res.data as any);
      }
    } catch (e: any) {
      console.error(`Failed to ${action} booking`, e);
      Alert.alert('Action Failed', e?.message || 'Please try again.');
    } finally {
      setActingId(null);
    }
  };

  const renderBookingCard = (booking: CalendarBooking) => {
    const backendStatus = items.find(it => String(it._id) === String(booking.id))?.status;
    const statusPill = (() => {
      switch (backendStatus) {
        case 'approved':
          return { label: 'Approved', bg: Colors.info, text: Colors.white };
        case 'pending':
          return { label: 'Pending', bg: Colors.warning, text: Colors.white };
        case 'confirmed':
          return { label: 'Booked', bg: Colors.success, text: Colors.white };
        case 'cancelled':
          return { label: 'Cancelled', bg: Colors.error, text: Colors.white };
        default:
          return undefined;
      }
    })();
    const disabled = actingId === booking.id;

    return (<View key={booking.id} style={styles.bookingCard}>
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
          {statusPill && (
            <View style={[styles.statusPill, { backgroundColor: statusPill.bg }]}>
              <Text style={[styles.statusPillText, { color: statusPill.text }]}>{statusPill.label}</Text>
            </View>
          )}
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
        {backendStatus === 'pending' ? (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, styles.approveButton, disabled && styles.actionButtonDisabled]}
              onPress={() => handleBookingAction(booking.id, 'approve')}
              disabled={disabled}
            >
              <Ionicons name="checkmark" size={18} color={Colors.white} />
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.declineButton, disabled && styles.actionButtonDisabled]}
              onPress={() => handleBookingAction(booking.id, 'decline')}
              disabled={disabled}
            >
              <Ionicons name="close" size={18} color={Colors.error} />
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </>
        ) : backendStatus === 'approved' ? (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, styles.declineButton, disabled && styles.actionButtonDisabled]}
              onPress={() => handleBookingAction(booking.id, 'decline')}
              disabled={disabled}
            >
              <Ionicons name="close" size={18} color={Colors.error} />
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.contactButton]}
              onPress={() => handleBookingAction(booking.id, 'contact')}
            >
              <Ionicons name="chatbubble" size={18} color={Colors.primary600} />
              <Text style={styles.contactButtonText}>Contact Client</Text>
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
    </View>);
  };

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

  // New styles for status pill and disabled action state
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginHorizontal: 8,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonDisabled: {
    opacity: 0.5,
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