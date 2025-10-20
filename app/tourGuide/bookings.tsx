import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '../../components';
import Calendar from '../../components/Calendar';
import { Booking as CalendarBooking } from '../../types/Calendar.types';
import { BookingService, TourPackageBookingItem } from '../../services/booking';
import { GuideService } from '../../services/guide';
import { UserService, UserProfile } from '../../services/user';

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState<'booked' | 'pending'>('booked');
  const [showCalendar, setShowCalendar] = useState(false);
  const [items, setItems] = useState<TourPackageBookingItem[]>([]);
  const [actingId, setActingId] = useState<string | null>(null);
  const [travelerDetails, setTravelerDetails] = useState<Record<string, UserProfile>>({});
  const [selectedTraveler, setSelectedTraveler] = useState<{ traveler: UserProfile | null, booking: TourPackageBookingItem | null } | null>(null);

  useEffect(() => {
    let mount = true;
    const load = async () => {
      try {
        const guideId = await GuideService.getCurrentGuideId();
        if (!guideId) throw new Error('Guide profile not found');
        const res = await BookingService.listTourPackageBookings({ guideId: String(guideId) });
        if (res?.success && Array.isArray(res.data) && mount) {
          setItems(res.data as any);
          
          // Fetch traveler details for each booking
          const bookings = res.data as TourPackageBookingItem[];
          const userIds = [...new Set(bookings.map(b => b.userId).filter(Boolean))];
          
          const detailsMap: Record<string, UserProfile> = {};
          await Promise.all(
            userIds.map(async (userId) => {
              try {
                const userRes = await UserService.getUserById(String(userId));
                if (userRes.success && userRes.data) {
                  detailsMap[String(userId)] = userRes.data;
                }
              } catch {
                console.warn('Failed to fetch user details for:', userId);
              }
            })
          );
          
          if (mount) setTravelerDetails(detailsMap);
        }
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
    // Expand multi-day bookings into per-day calendar entries
    const toPrettyDate = (iso: string | Date) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const toTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const expanded: CalendarBooking[] = [];
    for (const it of items) {
      const start = new Date(it.startDate);
      const end = new Date(it.endDate);

      const status: 'booked' | 'pending' = (it.status === 'confirmed' || it.status === 'approved') ? 'booked' : 'pending';
      const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1); // inclusive

      for (let i = 0; i < totalDays; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        const isoDay = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
        expanded.push({
          id: `${String(it._id)}:${day.toISOString().split('T')[0]}`,
          clientName: it.packageTitle,
          clientEmail: '',
          tourType: it.packageTitle,
          date: toPrettyDate(day),
          isoDate: isoDay,
          time: i === 0 ? toTime(it.startDate) : 'All day',
          duration: `${Math.max(1, Math.ceil((new Date(it.endDate).getTime() - new Date(it.startDate).getTime()) / (1000 * 60 * 60 * 24)))} days`,
          location: it.packageSlug || 'Tour Package',
          amount: Number(it.pricing?.totalAmount || 0),
          status,
          groupSize: Number(it.peopleCount || 1),
          specialRequests: it.notes || undefined,
        });
      }
    }
    return expanded;
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
        // Show contact details modal
        const booking = items.find(it => String(it._id) === bookingId);
        if (booking) {
          const traveler = booking.userId ? travelerDetails[String(booking.userId)] : null;
          setSelectedTraveler({ traveler, booking });
        }
        return; // Don't reload after opening contact modal
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

  const handleCall = (phone: string) => {
    if (phone && phone !== 'N/A') {
      Linking.openURL(`tel:${phone}`).catch(() => {
        Alert.alert('Error', 'Unable to make phone call');
      });
    }
  };

  const handleEmail = (email: string) => {
    if (email) {
      Linking.openURL(`mailto:${email}`).catch(() => {
        Alert.alert('Error', 'Unable to open email client');
      });
    }
  };

  const renderBookingCard = (booking: CalendarBooking) => {
    // Extract the actual booking ID (remove date suffix like :2025-11-01)
    const actualBookingId = booking.id.split(':')[0];
    
    // Find the backend item using the actual booking ID
    const backendItem = items.find(it => String(it._id) === actualBookingId);
    const backendStatus = backendItem?.status;
    
    // Get traveler details from user service
    const traveler = backendItem?.userId ? travelerDetails[String(backendItem.userId)] : null;
    
    // Get client info - prioritize traveler details from user service
    const backendAny = backendItem as any;
    const clientName = traveler 
      ? UserService.getDisplayName(traveler)
      : (backendAny?.guestDetails?.fullName || backendAny?.contactInfo?.name || booking.clientName);
    const clientEmail = traveler?.email || backendAny?.guestDetails?.email || backendAny?.contactInfo?.email || booking.clientEmail;
    const clientPhone = traveler?.phone || backendAny?.guestDetails?.phone || backendAny?.contactInfo?.phone;
    
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
    const disabled = actingId === actualBookingId;
    
    // Debug logging for troubleshooting
    if (!backendStatus) {
      console.log('⚠️ No backend status found for booking:', {
        displayId: booking.id,
        actualId: actualBookingId,
        availableIds: items.map(it => String(it._id))
      });
    }

    return (<View key={booking.id} style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.clientInfo}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientInitial}>
              {clientName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.clientDetails}>
            <Text style={styles.clientName}>{clientName}</Text>
            {clientEmail && <Text style={styles.clientEmail}>{clientEmail}</Text>}
            {clientPhone && (
              <View style={styles.phoneRow}>
                <Ionicons name="call" size={12} color={Colors.secondary500} />
                <Text style={styles.clientPhone}>{UserService.formatPhoneNumber(clientPhone)}</Text>
              </View>
            )}
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
              onPress={() => handleBookingAction(actualBookingId, 'approve')}
              disabled={disabled}
            >
              <Ionicons name="checkmark" size={18} color={Colors.white} />
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.declineButton, disabled && styles.actionButtonDisabled]}
              onPress={() => handleBookingAction(actualBookingId, 'decline')}
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
              onPress={() => handleBookingAction(actualBookingId, 'decline')}
              disabled={disabled}
            >
              <Ionicons name="close" size={18} color={Colors.error} />
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.contactButton]}
              onPress={() => handleBookingAction(actualBookingId, 'contact')}
            >
              <Ionicons name="chatbubble" size={18} color={Colors.primary600} />
              <Text style={styles.contactButtonText}>Contact Client</Text>
            </TouchableOpacity>
          </>
        ) : backendStatus === 'confirmed' ? (
          <TouchableOpacity 
            style={[styles.actionButton, styles.contactButton]}
            onPress={() => handleBookingAction(actualBookingId, 'contact')}
          >
            <Ionicons name="chatbubble" size={18} color={Colors.primary600} />
            <Text style={styles.contactButtonText}>Contact Client</Text>
          </TouchableOpacity>
        ) : backendStatus === 'cancelled' ? (
          <View style={styles.cancelledMessage}>
            <Text style={styles.cancelledText}>This booking has been cancelled</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.actionButton, styles.contactButton]}
            onPress={() => handleBookingAction(actualBookingId, 'contact')}
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

      {/* Traveler Contact Details Modal */}
      <Modal
        visible={!!selectedTraveler}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedTraveler(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseBtn} 
              onPress={() => setSelectedTraveler(null)}
            >
              <Ionicons name="close" size={28} color={Colors.primary600} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Traveler Contact</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 40 }}>
            {selectedTraveler?.traveler ? (
              <>
                {/* Traveler Profile Card */}
                <View style={styles.contactCard}>
                  <View style={styles.contactHeader}>
                    <View style={styles.largeAvatar}>
                      <Text style={styles.largeInitial}>
                        {UserService.getDisplayName(selectedTraveler.traveler).charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.travelerName}>
                      {UserService.getDisplayName(selectedTraveler.traveler)}
                    </Text>
                    <Text style={styles.travelerRole}>
                      {selectedTraveler.traveler.role === 'traveller'
                        ? 'Traveler' 
                        : selectedTraveler.traveler.role.replace('_', ' ')}
                    </Text>
                  </View>

                  {/* Contact Information */}
                  <View style={styles.contactSection}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>

                    {/* Email */}
                    {selectedTraveler.traveler.email && (
                      <TouchableOpacity 
                        style={styles.contactItem}
                        onPress={() => handleEmail(selectedTraveler.traveler!.email)}
                      >
                        <View style={styles.contactIconWrapper}>
                          <Ionicons name="mail" size={20} color={Colors.primary600} />
                        </View>
                        <View style={styles.contactTextWrapper}>
                          <Text style={styles.contactLabel}>Email</Text>
                          <Text style={styles.contactValue}>{selectedTraveler.traveler.email}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.secondary400} />
                      </TouchableOpacity>
                    )}

                    {/* Phone */}
                    {selectedTraveler.traveler.phone && (
                      <TouchableOpacity 
                        style={styles.contactItem}
                        onPress={() => handleCall(selectedTraveler.traveler!.phone!)}
                      >
                        <View style={styles.contactIconWrapper}>
                          <Ionicons name="call" size={20} color={Colors.success} />
                        </View>
                        <View style={styles.contactTextWrapper}>
                          <Text style={styles.contactLabel}>Phone</Text>
                          <Text style={styles.contactValue}>
                            {UserService.formatPhoneNumber(selectedTraveler.traveler.phone)}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.secondary400} />
                      </TouchableOpacity>
                    )}

                    {/* Username */}
                    <View style={styles.contactItem}>
                      <View style={styles.contactIconWrapper}>
                        <Ionicons name="person" size={20} color={Colors.info} />
                      </View>
                      <View style={styles.contactTextWrapper}>
                        <Text style={styles.contactLabel}>Username</Text>
                        <Text style={styles.contactValue}>{selectedTraveler.traveler.username}</Text>
                      </View>
                    </View>

                    {/* Account Status */}
                    <View style={styles.contactItem}>
                      <View style={styles.contactIconWrapper}>
                        <Ionicons 
                          name={selectedTraveler.traveler.isActive ? "checkmark-circle" : "close-circle"} 
                          size={20} 
                          color={selectedTraveler.traveler.isActive ? Colors.success : Colors.error} 
                        />
                      </View>
                      <View style={styles.contactTextWrapper}>
                        <Text style={styles.contactLabel}>Account Status</Text>
                        <Text style={[
                          styles.contactValue,
                          { color: selectedTraveler.traveler.isActive ? Colors.success : Colors.error }
                        ]}>
                          {selectedTraveler.traveler.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Booking Information */}
                  {selectedTraveler.booking && (
                    <View style={styles.contactSection}>
                      <Text style={styles.sectionTitle}>Booking Details</Text>

                      <View style={styles.contactItem}>
                        <View style={styles.contactIconWrapper}>
                          <Ionicons name="calendar" size={20} color={Colors.primary600} />
                        </View>
                        <View style={styles.contactTextWrapper}>
                          <Text style={styles.contactLabel}>Tour Package</Text>
                          <Text style={styles.contactValue}>{selectedTraveler.booking.packageTitle}</Text>
                        </View>
                      </View>

                      <View style={styles.contactItem}>
                        <View style={styles.contactIconWrapper}>
                          <Ionicons name="calendar-outline" size={20} color={Colors.primary600} />
                        </View>
                        <View style={styles.contactTextWrapper}>
                          <Text style={styles.contactLabel}>Travel Dates</Text>
                          <Text style={styles.contactValue}>
                            {new Date(selectedTraveler.booking.startDate).toLocaleDateString('en-US', { 
                              month: 'short', day: 'numeric', year: 'numeric' 
                            })}
                            {' → '}
                            {new Date(selectedTraveler.booking.endDate).toLocaleDateString('en-US', { 
                              month: 'short', day: 'numeric', year: 'numeric' 
                            })}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.contactItem}>
                        <View style={styles.contactIconWrapper}>
                          <Ionicons name="people" size={20} color={Colors.primary600} />
                        </View>
                        <View style={styles.contactTextWrapper}>
                          <Text style={styles.contactLabel}>Group Size</Text>
                          <Text style={styles.contactValue}>
                            {selectedTraveler.booking.peopleCount} {selectedTraveler.booking.peopleCount === 1 ? 'person' : 'people'}
                          </Text>
                        </View>
                      </View>

                      {selectedTraveler.booking.notes && (
                        <View style={styles.notesContainer}>
                          <Text style={styles.notesLabel}>Special Requests</Text>
                          <Text style={styles.notesText}>{selectedTraveler.booking.notes}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Quick Actions */}
                  <View style={styles.quickActions}>
                    {selectedTraveler.traveler.phone && (
                      <TouchableOpacity 
                        style={styles.quickActionBtn}
                        onPress={() => handleCall(selectedTraveler.traveler!.phone!)}
                      >
                        <Ionicons name="call" size={24} color={Colors.white} />
                        <Text style={styles.quickActionText}>Call</Text>
                      </TouchableOpacity>
                    )}
                    
                    {selectedTraveler.traveler.email && (
                      <TouchableOpacity 
                        style={[styles.quickActionBtn, { backgroundColor: Colors.info }]}
                        onPress={() => handleEmail(selectedTraveler.traveler!.email)}
                      >
                        <Ionicons name="mail" size={24} color={Colors.white} />
                        <Text style={styles.quickActionText}>Email</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="person-circle-outline" size={64} color={Colors.secondary400} />
                <Text style={styles.noDataText}>No traveler information available</Text>
                <Text style={styles.noDataSubtext}>
                  Unable to load traveler details for this booking
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },

  clientPhone: {
    fontSize: 13,
    color: Colors.secondary600,
    fontWeight: '500',
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

  cancelledMessage: {
    flex: 1,
    padding: 12,
    backgroundColor: Colors.light100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelledText: {
    fontSize: 14,
    color: Colors.secondary500,
    fontStyle: 'italic',
  },

  // Contact Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },

  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary100,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary700,
  },

  modalContent: {
    flex: 1,
  },

  contactCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },

  contactHeader: {
    alignItems: 'center',
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
    marginBottom: 24,
  },

  largeAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: Colors.primary600,
  },

  largeInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.primary700,
  },

  travelerName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 4,
  },

  travelerRole: {
    fontSize: 14,
    color: Colors.secondary500,
    textTransform: 'capitalize',
  },

  contactSection: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },

  contactIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  contactTextWrapper: {
    flex: 1,
  },

  contactLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  contactValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },

  notesContainer: {
    backgroundColor: Colors.secondary50,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },

  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondary600,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  notesText: {
    fontSize: 14,
    color: Colors.secondary700,
    lineHeight: 20,
  },

  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },

  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  quickActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },

  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },

  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary600,
    marginTop: 16,
    textAlign: 'center',
  },

  noDataSubtext: {
    fontSize: 14,
    color: Colors.secondary500,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});