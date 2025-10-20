import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, Image, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { Colors } from '../../constants/Colors';
import { BookingService, TourPackageBookingItem } from '../../services/booking';
import { GuideService, PackageListItem } from '../../services/guide';
import { paymentService } from '../../services/paymentService';
import { ThemedText } from '../../components';
import guideIcon from '../../assets/images/guide.png';

export default function BookingDetailsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const bookingId = (params.id as string) || '';
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<TourPackageBookingItem | null>(null);
  const [guide, setGuide] = useState<any>(null);
  const [packageDetails, setPackageDetails] = useState<PackageListItem | null>(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // Fetch booking from API
        const res = await BookingService.getBooking(String(bookingId));
        const data = (res?.success && (res as any).data) ? (res as any).data as TourPackageBookingItem : undefined;
        
        if (!data) {
          if (mounted) {
            setBooking(null);
            setLoading(false);
          }
          return;
        }

        if (mounted) setBooking(data);

        // Fetch guide details if guideId exists
        if (data.guideId) {
          try {
            const guideRes = await GuideService.getGuide(data.guideId);
            if (mounted && guideRes?.data) setGuide(guideRes.data);
          } catch (e) {
            console.warn('Failed to fetch guide details:', e);
          }
        }

        // Fetch package details if tourPackageId or packageSlug exists
        if (data.tourPackageId || data.packageSlug) {
          try {
            const pkgIdentifier = data.packageSlug || data.tourPackageId;
            const pkgRes = await GuideService.getPackage(pkgIdentifier);
            if (mounted && pkgRes?.data) setPackageDetails(pkgRes.data);
          } catch (e) {
            console.warn('Failed to fetch package details:', e);
          }
        }
      } catch (e) {
        console.error('Failed to load booking details:', e);
        if (mounted) setBooking(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [bookingId]);

  const handlePayment = async () => {
    if (!booking) return;

    setProcessingPayment(true);

    try {
      console.log('💳 Starting Stripe payment flow for booking:', booking._id);

      // Step 1: Create payment intent with booking data
      const paymentIntentData = {
        bookingId: booking._id,  // Include existing booking ID
        serviceType: 'guide' as const,
        serviceId: booking.tourPackageId || booking.packageSlug || '',
        serviceProvider: booking.guideId || '',
        totalAmount: booking.pricing?.totalAmount || 0,
        bookingDetails: {
          tourDate: booking.startDate,
          duration: `${Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`,
          groupSize: booking.peopleCount || 1,
          specialRequests: booking.notes || '',
          currency: booking.pricing?.currency || 'LKR',
        },
        contactInfo: {
          email: (booking as any).guestDetails?.email || (booking as any).contactInfo?.email || 'guest@example.com',
          phone: (booking as any).guestDetails?.phone || (booking as any).contactInfo?.phone || 'N/A',
          firstName: (booking as any).guestDetails?.fullName?.split(' ')[0] || 'Guest',
          lastName: (booking as any).guestDetails?.fullName?.split(' ').slice(1).join(' ') || '',
        },
        guestDetails: (booking as any).guestDetails,
        tourPackageId: booking.tourPackageId,
        packageSlug: booking.packageSlug,
        guideId: booking.guideId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        peopleCount: booking.peopleCount,
        notes: booking.notes,
      };

      console.log('📤 Creating payment intent with data:', {
        bookingId: booking._id,
        amount: paymentIntentData.totalAmount,
        serviceType: paymentIntentData.serviceType,
      });

      const paymentIntent = await paymentService.createPaymentIntent(paymentIntentData);

      console.log('✅ Payment intent created:', {
        paymentIntentId: paymentIntent.paymentIntentId,
        clientSecret: paymentIntent.clientSecret ? '***' : 'missing',
      });

      // Step 2: Initialize Stripe Payment Sheet
      console.log('🎨 Initializing payment sheet...');
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'WanderLanka',
        paymentIntentClientSecret: paymentIntent.clientSecret,
        defaultBillingDetails: {
          name: paymentIntentData.contactInfo.firstName + ' ' + paymentIntentData.contactInfo.lastName,
          email: paymentIntentData.contactInfo.email,
          phone: paymentIntentData.contactInfo.phone,
        },
        returnURL: 'wanderlanka://payment-success',
        appearance: {
          colors: {
            primary: Colors.primary600,
            background: '#FFFFFF',
            componentBackground: '#F3F4F6',
            componentBorder: '#E5E7EB',
            componentDivider: '#E5E7EB',
            primaryText: '#1F2937',
            secondaryText: '#6B7280',
            componentText: '#1F2937',
            placeholderText: '#9CA3AF',
          },
          shapes: {
            borderRadius: 12,
            borderWidth: 1,
          },
        },
      });

      if (initError) {
        console.error('❌ Payment sheet init error:', initError);
        throw new Error(initError.message);
      }

      console.log('✅ Payment sheet initialized');

      // Step 3: Present Payment Sheet
      console.log('📱 Presenting payment sheet to user...');
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code === 'Canceled') {
          console.log('ℹ️ User cancelled payment');
          Alert.alert('Payment Cancelled', 'You cancelled the payment.');
          
          // Cancel payment intent on backend
          if (paymentIntent.paymentIntentId && paymentIntent.bookingId) {
            await paymentService.cancelPaymentIntent(
              paymentIntent.paymentIntentId,
              paymentIntent.bookingId
            );
          }
          return;
        }

        console.error('❌ Payment error:', paymentError);
        throw new Error(paymentError.message);
      }

      console.log('✅ Payment sheet completed successfully');

      // Step 4: Confirm payment with backend
      console.log('🔄 Confirming payment with backend...');
      const confirmation = await paymentService.confirmPayment({
        paymentIntentId: paymentIntent.paymentIntentId,
        bookingId: paymentIntent.bookingId,
      });

      console.log('✅ Payment confirmed:', confirmation);

      // Update local booking state to confirmed
      setBooking({
        ...booking,
        status: 'confirmed',
      });

      // Show success message
      Alert.alert(
        'Payment Successful! 🎉',
        `Your booking has been confirmed.\nConfirmation: ${confirmation.data.confirmationNumber}\n\nYou can now view your itinerary and contact the tour guide.`,
        [
          {
            text: 'View Details',
            onPress: () => {
              // Reload the booking to get updated details
              const load = async () => {
                const res = await BookingService.getBooking(String(bookingId));
                const data = (res?.success && (res as any).data) ? (res as any).data : null;
                if (data) setBooking(data);
              };
              load();
            },
          },
        ]
      );

    } catch (error: any) {
      console.error('❌ Payment flow error:', error);
      
      Alert.alert(
        'Payment Failed',
        error.message || 'Unable to process payment. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: () => handlePayment(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const statusBadge = useMemo(() => {
    // Return { bg, text } for status badge styling
    switch (booking?.status) {
      case 'pending':
        return { bg: Colors.warning, text: Colors.white, label: 'Pending' };
      case 'approved':
        return { bg: Colors.info, text: Colors.white, label: 'Approved' };
      case 'confirmed':
        return { bg: Colors.success, text: Colors.white, label: 'Confirmed' };
      case 'completed':
        return { bg: Colors.secondary400, text: Colors.white, label: 'Completed' };
      case 'cancelled':
        return { bg: Colors.error, text: Colors.white, label: 'Cancelled' };
      case 'declined':
        return { bg: Colors.error, text: Colors.white, label: 'Declined' };
      default:
        return { bg: Colors.secondary200, text: Colors.secondary700, label: 'Unknown' };
    }
  }, [booking?.status]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.statusBarBackground, { height: insets.top }]} />
        <View style={styles.centerFill}>
          <ActivityIndicator color={Colors.primary600} />
          <ThemedText style={{ marginTop: 8, color: Colors.secondary500 }}>Loading booking…</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.statusBarBackground, { height: insets.top }]} />
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.white} />
            <Text style={styles.headerTitle}>Booking Details</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerFill}>
          <ThemedText style={{ fontSize: 16, color: Colors.secondary600 }}>Booking not found</ThemedText>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(travelerTabs)/bookNow')}>
            <Text style={styles.primaryButtonText}>Go to Book Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      
      {/* Modern Header with Gradient */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card - Package Info */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconWrapper}>
              <Image source={guideIcon} style={styles.heroIconImage} />
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusBadge.bg }]}>
              <Text style={[styles.statusPillText, { color: statusBadge.text }]}>
                {statusBadge.label.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text style={styles.packageTitle}>{booking.packageTitle}</Text>
          
          <View style={styles.heroDateRow}>
            <View style={styles.dateBlock}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary600} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <Text style={styles.dateValue}>{formatDate(booking.startDate)}</Text>
              </View>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateBlock}>
              <Ionicons name="calendar" size={18} color={Colors.primary600} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.dateLabel}>End Date</Text>
                <Text style={styles.dateValue}>{formatDate(booking.endDate)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tour Guide Card */}
        {guide && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-circle" size={24} color={Colors.primary600} />
              <Text style={styles.cardTitle}>Tour Guide</Text>
            </View>
            <View style={styles.guideInfo}>
              <View style={styles.guideAvatar}>
                <Text style={styles.guideInitial}>
                  {(guide.name || guide.username || 'G').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guideName}>{guide.name || guide.username || 'Guide'}</Text>
                {guide.email && <Text style={styles.guideContact}>{guide.email}</Text>}
                {guide.phone && <Text style={styles.guideContact}>{guide.phone}</Text>}
              </View>
            </View>
            {guide.bio && <Text style={styles.guideBio}>{guide.bio}</Text>}
          </View>
        )}

        {/* Package Details Card */}
        {packageDetails && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle" size={24} color={Colors.primary600} />
              <Text style={styles.cardTitle}>Package Details</Text>
            </View>
            
            {packageDetails.description && (
              <Text style={styles.packageDescription}>{packageDetails.description}</Text>
            )}

            {packageDetails.durationDays && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color={Colors.secondary500} />
                <Text style={styles.infoText}>{packageDetails.durationDays} Days</Text>
              </View>
            )}

            {packageDetails.locations && packageDetails.locations.length > 0 && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color={Colors.secondary500} />
                <Text style={styles.infoText}>{packageDetails.locations.join(', ')}</Text>
              </View>
            )}

            {packageDetails.maxGroupSize && (
              <View style={styles.infoRow}>
                <Ionicons name="people-outline" size={18} color={Colors.secondary500} />
                <Text style={styles.infoText}>Max {packageDetails.maxGroupSize} people</Text>
              </View>
            )}

            {packageDetails.highlights && packageDetails.highlights.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.listTitle}>✨ Highlights</Text>
                {packageDetails.highlights.map((item, idx) => (
                  <Text key={idx} style={styles.listItem}>• {item}</Text>
                ))}
              </View>
            )}

            {packageDetails.includes && packageDetails.includes.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.listTitle}>✓ What&apos;s Included</Text>
                {packageDetails.includes.map((item, idx) => (
                  <Text key={idx} style={styles.listItem}>• {item}</Text>
                ))}
              </View>
            )}

            {packageDetails.excludes && packageDetails.excludes.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.listTitle}>✗ What&apos;s Excluded</Text>
                {packageDetails.excludes.map((item, idx) => (
                  <Text key={idx} style={styles.listItem}>• {item}</Text>
                ))}
              </View>
            )}

            {packageDetails.requirements && packageDetails.requirements.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.listTitle}>📋 Requirements</Text>
                {packageDetails.requirements.map((item, idx) => (
                  <Text key={idx} style={styles.listItem}>• {item}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Booking Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt" size={24} color={Colors.primary600} />
            <Text style={styles.cardTitle}>Booking Information</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <Text style={styles.detailValue}>{booking._id}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Number of People</Text>
            <Text style={styles.detailValue}>{booking.peopleCount} {booking.peopleCount === 1 ? 'person' : 'people'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booked On</Text>
            <Text style={styles.detailValue}>{formatDate(booking.createdAt)}</Text>
          </View>

          {booking.notes && (
            <>
              <View style={styles.divider} />
              <Text style={styles.notesLabel}>Special Requests</Text>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </>
          )}
        </View>

        {/* Payment Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="card" size={24} color={Colors.primary600} />
            <Text style={styles.cardTitle}>Payment Details</Text>
          </View>
          
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Unit Price</Text>
            <Text style={styles.pricingValue}>
              {booking.pricing.currency} {booking.pricing.unitAmount.toLocaleString()}
              {booking.pricing.perPerson && ' / person'}
            </Text>
          </View>

          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Quantity</Text>
            <Text style={styles.pricingValue}>{booking.peopleCount}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              {booking.pricing.currency} {booking.pricing.totalAmount.toLocaleString()}
            </Text>
          </View>

          {booking.payment && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Status</Text>
                <View style={[styles.paymentBadge, { 
                  backgroundColor: booking.payment.status === 'succeeded' ? Colors.success : Colors.warning 
                }]}>
                  <Text style={styles.paymentBadgeText}>
                    {(booking.payment.status || 'pending').toUpperCase()}
                  </Text>
                </View>
              </View>
              {booking.payment.intentId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID</Text>
                  <Text style={[styles.detailValue, { fontSize: 12 }]}>{booking.payment.intentId}</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Actions */}
        {booking.status === 'approved' && (
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={[styles.primaryButton, processingPayment && styles.disabledButton]} 
              onPress={handlePayment}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <>
                  <ActivityIndicator size="small" color={Colors.white} />
                  <Text style={styles.primaryButtonText}>Processing...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="card-outline" size={20} color={Colors.white} />
                  <Text style={styles.primaryButtonText}>Proceed to Payment</Text>
                </>
              )}
            </TouchableOpacity>
            
            {guide && (
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => {
                  // TODO: Open chat or contact modal
                  console.log('Contact guide:', guide.name || guide.username);
                }}
              >
                <Ionicons name="chatbubble-outline" size={20} color={Colors.primary600} />
                <Text style={styles.secondaryButtonText}>Contact Tour Guide</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {booking.status === 'confirmed' && (
          <View style={styles.actionSection}>
            {guide && (
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => {
                  // TODO: Open chat or contact modal
                  console.log('Contact guide:', guide.name || guide.username);
                }}
              >
                <Ionicons name="chatbubble-ellipses" size={20} color={Colors.white} />
                <Text style={styles.primaryButtonText}>Contact Tour Guide</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.outlineButton}
              onPress={() => {
                setShowItineraryModal(true);
              }}
            >
              <Ionicons name="map-outline" size={20} color={Colors.primary600} />
              <Text style={styles.outlineButtonText}>View Itinerary</Text>
            </TouchableOpacity>
          </View>
        )}

        {booking.status === 'pending' && (
          <View style={styles.actionSection}>
            <View style={styles.infoBox}>
              <Ionicons name="time-outline" size={24} color={Colors.warning} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.infoBoxTitle}>Awaiting Approval</Text>
                <Text style={styles.infoBoxText}>
                  Your booking request has been sent to the tour guide. You&apos;ll be notified once approved.
                </Text>
              </View>
            </View>
            
            {guide && (
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => {
                  console.log('Contact guide:', guide.name || guide.username);
                }}
              >
                <Ionicons name="chatbubble-outline" size={20} color={Colors.primary600} />
                <Text style={styles.secondaryButtonText}>Contact Tour Guide</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {booking.status === 'cancelled' && (
          <View style={styles.actionSection}>
            <View style={[styles.infoBox, { backgroundColor: Colors.error + '10', borderColor: Colors.error }]}>
              <Ionicons name="close-circle" size={24} color={Colors.error} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.infoBoxTitle, { color: Colors.error }]}>Booking Cancelled</Text>
                <Text style={styles.infoBoxText}>
                  This booking has been cancelled. If you have any questions, please contact support.
                </Text>
              </View>
            </View>
          </View>
        )}

        {booking.status === 'declined' && (
          <View style={styles.actionSection}>
            <View style={[styles.infoBox, { backgroundColor: Colors.error + '10', borderColor: Colors.error }]}>
              <Ionicons name="close-circle" size={24} color={Colors.error} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.infoBoxTitle, { color: Colors.error }]}>Booking Declined</Text>
                <Text style={styles.infoBoxText}>
                  The tour guide has declined your booking request. Please try booking another tour package or contact the guide for more information.
                </Text>
              </View>
            </View>
            {guide && (
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => {
                  console.log('Contact guide:', guide.name || guide.username);
                }}
              >
                <Ionicons name="chatbubble-outline" size={20} color={Colors.primary600} />
                <Text style={styles.secondaryButtonText}>Contact Tour Guide</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {booking.status === 'completed' && (
          <View style={styles.actionSection}>
            <View style={[styles.infoBox, { backgroundColor: Colors.success + '10', borderColor: Colors.success }]}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.infoBoxTitle, { color: Colors.success }]}>Tour Completed</Text>
                <Text style={styles.infoBoxText}>
                  Hope you enjoyed your tour! Please consider leaving a review for the guide.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Itinerary Modal */}
      <Modal
        visible={showItineraryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowItineraryModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseBtn} 
              onPress={() => setShowItineraryModal(false)}
            >
              <Ionicons name="close" size={28} color={Colors.primary600} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Tour Itinerary</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Itinerary Content */}
          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Package Title with Guide Icon */}
            <View style={styles.itineraryHeader}>
              <View style={styles.itineraryIconWrapper}>
                <Image source={guideIcon} style={styles.itineraryIconImage} />
              </View>
              <Text style={styles.itineraryPackageTitle}>{booking?.packageTitle}</Text>
              {packageDetails?.durationDays && (
                <View style={styles.itineraryDuration}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.secondary600} />
                  <Text style={styles.itineraryDurationText}>
                    {packageDetails.durationDays} {packageDetails.durationDays === 1 ? 'Day' : 'Days'}
                  </Text>
                </View>
              )}
            </View>

            {/* Itinerary Days */}
            {packageDetails?.itinerary && packageDetails.itinerary.length > 0 ? (
              packageDetails.itinerary
                .sort((a, b) => a.day - b.day)
                .map((item, index) => (
                  <View key={index} style={styles.itineraryDayCard}>
                    <View style={styles.dayNumberWrapper}>
                      <Text style={styles.dayNumber}>Day {item.day}</Text>
                    </View>
                    <View style={styles.dayContent}>
                      <Text style={styles.dayTitle}>{item.title}</Text>
                      {item.description && (
                        <Text style={styles.dayDescription}>{item.description}</Text>
                      )}
                    </View>
                    {/* Timeline connector (not for last item) */}
                    {index < packageDetails.itinerary!.length - 1 && (
                      <View style={styles.timelineConnector} />
                    )}
                  </View>
                ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="map-outline" size={48} color={Colors.secondary400} />
                <Text style={styles.emptyStateText}>No itinerary available</Text>
              </View>
            )}

            {/* Additional Info */}
            {packageDetails?.policies?.meetingPoint && (
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name="location" size={20} color={Colors.primary600} />
                  <Text style={styles.infoCardTitle}>Meeting Point</Text>
                </View>
                <Text style={styles.infoCardText}>{packageDetails.policies.meetingPoint}</Text>
              </View>
            )}

            {guide && (
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name="person-circle" size={20} color={Colors.primary600} />
                  <Text style={styles.infoCardTitle}>Your Tour Guide</Text>
                </View>
                <Text style={styles.infoCardText}>
                  {guide.name || guide.username}
                </Text>
                {guide.phone && (
                  <View style={styles.guideContactRow}>
                    <Ionicons name="call-outline" size={16} color={Colors.secondary600} />
                    <Text style={styles.guideContactText}>{guide.phone}</Text>
                  </View>
                )}
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
    backgroundColor: Colors.secondary50 
  },
  statusBarBackground: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: Colors.primary800, 
    zIndex: 10 
  },
  headerBar: { 
    backgroundColor: Colors.primary800, 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backBtn: { 
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { 
    color: Colors.white, 
    fontSize: 18, 
    fontWeight: '700',
  },
  content: { 
    flex: 1,
  },
  centerFill: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },

  // Hero Card
  heroCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: `${Colors.primary600}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIconImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  packageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 16,
    lineHeight: 28,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary50,
    borderRadius: 12,
    padding: 12,
  },
  dateBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.secondary200,
    marginHorizontal: 12,
  },
  dateLabel: {
    fontSize: 11,
    color: Colors.secondary500,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 13,
    color: Colors.secondary700,
    fontWeight: '700',
  },

  // Card Styles
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.secondary100,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.secondary700,
  },

  // Guide Info
  guideInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  guideAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary700,
  },
  guideName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  guideContact: {
    fontSize: 13,
    color: Colors.secondary500,
  },
  guideBio: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary100,
  },

  // Package Details
  packageDescription: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.secondary700,
  },
  listSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary100,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 13,
    color: Colors.secondary600,
    marginBottom: 4,
    paddingLeft: 8,
  },

  // Detail Rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.secondary500,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: Colors.secondary700,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.secondary100,
    marginVertical: 12,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 8,
    marginTop: 8,
  },
  notesText: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
    backgroundColor: Colors.secondary50,
    padding: 12,
    borderRadius: 8,
  },

  // Pricing
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  pricingLabel: {
    fontSize: 14,
    color: Colors.secondary600,
  },
  pricingValue: {
    fontSize: 14,
    color: Colors.secondary700,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary600,
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },

  // Actions
  actionSection: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primary600,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary600,
  },
  secondaryButtonText: {
    color: Colors.primary600,
    fontSize: 15,
    fontWeight: '700',
  },
  outlineButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.secondary200,
  },
  outlineButtonText: {
    color: Colors.primary600,
    fontSize: 15,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.warning + '10',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  infoBoxTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 13,
    color: Colors.secondary600,
    lineHeight: 18,
  },
  actionHint: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Modal Styles
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
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

  // Itinerary Header
  itineraryHeader: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  itineraryIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.primary600}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  itineraryIconImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  itineraryPackageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary700,
    textAlign: 'center',
    marginBottom: 12,
  },
  itineraryDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  itineraryDurationText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary700,
  },

  // Itinerary Day Cards
  itineraryDayCard: {
    position: 'relative',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary600,
  },
  dayNumberWrapper: {
    marginBottom: 12,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayContent: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.secondary700,
    marginBottom: 8,
  },
  dayDescription: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
  },
  timelineConnector: {
    position: 'absolute',
    left: 0,
    bottom: -16,
    width: 4,
    height: 16,
    backgroundColor: Colors.primary100,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.secondary500,
    marginTop: 16,
    fontWeight: '500',
  },

  // Info Cards in Modal
  infoCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.secondary700,
  },
  infoCardText: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
  },
  guideContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  guideContactText: {
    fontSize: 13,
    color: Colors.secondary600,
  },
});
