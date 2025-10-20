import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { InlineCalendar } from './InlineCalendar';
import { BookingService } from '../services/booking';
import { BookingDataManager, ConfirmedBooking } from '../utils/BookingDataManager';
import { StorageService } from '../services/storage';
import { PackageListItem, GuideService } from '../services/guide';
import { router } from 'expo-router';

export type BookingModalProps = {
  visible: boolean;
  pkg: PackageListItem;
  onClose: () => void;
  onBooked?: (bookingId?: string) => void;
};

export default function BookingModal({ visible, pkg, onClose, onBooked }: BookingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [participants, setParticipants] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const totalSteps = 3;
  const maxGroupSize = pkg?.maxGroupSize || 0;
  const perPerson = !!pkg?.pricing?.perPerson;
  const unitAmount = pkg?.pricing?.amount || 0;
  const currency = pkg?.pricing?.currency || 'LKR';
  const durationDays = pkg?.durationDays || 1;
  const guideId = (pkg as any)?.guideId;

  useEffect(() => {
    if (!startDate) { setEndDate(null); return; }
    const d = new Date(startDate);
    const e = new Date(d);
    e.setDate(d.getDate() + Math.max(0, durationDays - 1));
    setEndDate(e);
  }, [startDate, durationDays]);

  useEffect(() => {
    (async () => {
      try {
        const user = await StorageService.getUserData();
        const accessToken = await StorageService.getAccessToken();
        // Just check if user is authenticated
        console.log('Auth check:', !!(user && accessToken));
      } catch {}
    })();
  }, []);

  // Fetch guide availability when modal opens
  const loadGuideAvailability = useCallback(async () => {
    if (!guideId) return;
    
    setLoadingAvailability(true);
    try {
      // Get availability for next 3 months
      const today = new Date();
      const threeMonthsLater = new Date();
      threeMonthsLater.setMonth(today.getMonth() + 3);
      
      const response = await GuideService.getGuideAvailability(
        guideId,
        today.toISOString().split('T')[0],
        threeMonthsLater.toISOString().split('T')[0]
      );
      
      if (response.success && response.data) {
        setUnavailableDates(response.data.unavailableDates);
      }
    } catch (error) {
      console.error('Failed to load guide availability:', error);
    } finally {
      setLoadingAvailability(false);
    }
  }, [guideId]);

  useEffect(() => {
    if (visible && guideId) {
      loadGuideAvailability();
    }
  }, [visible, guideId, loadGuideAvailability]);

  const parsedParticipants = useMemo(() => {
    const n = parseInt(participants, 10);
    return isNaN(n) || n < 1 ? 1 : n;
  }, [participants]);

  const totalPrice = useMemo(() => {
    return perPerson ? unitAmount * parsedParticipants : unitAmount;
  }, [perPerson, unitAmount, parsedParticipants]);

  const onDaySelect = (d: Date) => {
    // Check if selected date is unavailable
    const dateStr = d.toISOString().split('T')[0];
    if (unavailableDates.includes(dateStr)) {
      Alert.alert(
        'Date Unavailable',
        'The tour guide is not available on this date. Another traveler has already booked the guide. Please select a different date.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check if any dates in the package duration are unavailable
    const conflictingDates: string[] = [];
    for (let i = 0; i < durationDays; i++) {
      const checkDate = new Date(d);
      checkDate.setDate(d.getDate() + i);
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      if (unavailableDates.includes(checkDateStr)) {
        conflictingDates.push(checkDateStr);
      }
    }
    
    if (conflictingDates.length > 0) {
      const formattedDates = conflictingDates.map(dateStr => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }).join(', ');
      
      Alert.alert(
        'Date Range Unavailable',
        `This ${durationDays}-day package includes dates when the guide is already booked:\n\n${formattedDates}\n\nPlease select a different start date.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    setStartDate(d);
  };

  const incrementParticipants = () => {
    const next = parsedParticipants + 1;
    if (maxGroupSize && next > maxGroupSize) return;
    setParticipants(String(next));
  };

  const decrementParticipants = () => {
    const next = Math.max(1, parsedParticipants - 1);
    setParticipants(String(next));
  };

  const handleNext = () => {
    if (currentStep === 1 && !startDate) {
      Alert.alert('Date Required', 'Please select a start date to continue');
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canGoNext = () => {
    if (currentStep === 1) return !!startDate && !!endDate;
    return true;
  };

  const submitBooking = async () => {
    // Require auth before booking
    const token = await StorageService.getAccessToken();
    if (!token) {
      Alert.alert(
        'Login required',
        'Please log in to place a booking.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Login', onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }
    if (!startDate) return Alert.alert('Missing date', 'Please select a start date');
    if (!endDate) return Alert.alert('Invalid date', 'End date could not be determined');
    if (maxGroupSize && parsedParticipants > maxGroupSize) {
      return Alert.alert('Too many participants', `Maximum allowed is ${maxGroupSize}`);
    }
    setSubmitting(true);
    try {
      const user = await StorageService.getUserData();
      const userId = user?.id || user?._id;
      if (!userId) {
        Alert.alert('Login required', 'Please log in again to continue.');
        setSubmitting(false);
        return;
      }
      const payload = {
        // Required fields (types aligned with backend Joi schema)
        userId: String(userId),
        tourPackageId: String((pkg as any)._id || (pkg as any).id || ''),
        packageTitle: String(pkg.title || ''),
        // Optional fields
        packageSlug: pkg.slug ? String(pkg.slug) : undefined,
        guideId: (pkg as any).guideId ? String((pkg as any).guideId) : undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        peopleCount: Number(parsedParticipants),
        pricing: {
          currency: String(currency || 'USD'),
          unitAmount: Number(unitAmount),
          totalAmount: Number(totalPrice),
          perPerson: Boolean(perPerson),
        },
        notes: String(notes || ''),
        paymentMethod: 'mock' as const,
        // Include cancellation policy from package
        cancellationPolicy: pkg.policies ? {
          freeCancellation: pkg.policies.freeCancellation || false,
          freeCancellationWindow: pkg.policies.freeCancellationWindow || undefined,
        } : undefined,
      };
      const res = await BookingService.createTourPackageBooking(payload as any);
      if (res?.success) {
        // Persist booking locally as pending
        try {
          const bookingIdFromApi: string | undefined = (res as any)?.data?._id || (res as any)?.data?.id;
          const transactionIdFromApi: string | undefined = (res as any)?.data?.payment?.intentId || (res as any)?.data?.transactionId;
          const confirmed: ConfirmedBooking = {
            id: bookingIdFromApi || `booking_${Date.now()}`,
            bookingId: bookingIdFromApi || `WL${Math.floor(Math.random() * 100000)}`,
            tripName: String(pkg?.title || 'Tour Package'),
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            totalAmount: Number(totalPrice),
            paymentDate: new Date().toISOString(),
            transactionId: transactionIdFromApi || `TXN${Date.now()}`,
            email: String(user?.email || ''),
            status: 'pending',
            accommodation: [],
            transport: [],
            guides: [],
            createdAt: new Date().toISOString(),
          };
          await BookingDataManager.addToUpcomingBookings([confirmed]);
        } catch (persistErr) {
          console.warn('Failed to persist booking locally:', persistErr);
        }

        Alert.alert('Booking placed', 'Your booking has been submitted and is pending guide approval.');
        onClose();
        onBooked?.((res as any)?.data?._id);
      } else {
        // Check if this is a guide availability error
        const errorMsg = res?.error || '';
        if (errorMsg.includes('not available') || errorMsg.includes('selected dates')) {
          Alert.alert(
            'Guide Unavailable',
            'The tour guide is not available on your selected dates. Another traveler has already booked this guide. Please select different dates and try again.',
            [{ text: 'OK' }]
          );
          // Reload availability
          loadGuideAvailability();
        } else {
          throw new Error(errorMsg || 'Failed to create booking');
        }
      }
    } catch (e: any) {
      const status = e?.status ?? e?.details?.statusCode ?? undefined;
      const errorMessage = e?.message || 'Please try again later';
      
      // Check if this is a guide availability error (explicit 409 or message match)
      if (status === 409 ||
          errorMessage.toLowerCase().includes('not available') || 
          errorMessage.toLowerCase().includes('selected dates') ||
          errorMessage.toLowerCase().includes('already has a confirmed booking') ||
          e?.code === 'BOOKING_CONFLICT') {
        Alert.alert(
          'Guide Unavailable',
          'The tour guide is not available on your selected dates. Another traveler has already booked this guide during this time. Please select different dates and try again.',
          [
            {
              text: 'View Calendar',
              onPress: () => {
                // Reload availability and go back to step 1
                loadGuideAvailability();
                setCurrentStep(1);
                setStartDate(null);
                setEndDate(null);
              }
            }
          ]
        );
      } else {
        // Error is already handled by the error state in the UI
        console.error('Booking failed:', errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.bookingSheet}>
          {/* Header with Progress */}
          <View style={styles.header}>
            <View style={styles.sheetHandle} />
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
                <Ionicons name="close" size={24} color={Colors.secondary600} />
              </TouchableOpacity>
            </View>
            
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              {[1, 2, 3].map((step) => (
                <View key={step} style={styles.progressStepContainer}>
                  <View style={[
                    styles.progressDot,
                    currentStep >= step && styles.progressDotActive,
                    currentStep === step && styles.progressDotCurrent
                  ]}>
                    {currentStep > step ? (
                      <Ionicons name="checkmark" size={14} color={Colors.white} />
                    ) : (
                      <Text style={[
                        styles.progressDotText,
                        currentStep >= step && styles.progressDotTextActive
                      ]}>{step}</Text>
                    )}
                  </View>
                  {step < 3 && (
                    <View style={[
                      styles.progressLine,
                      currentStep > step && styles.progressLineActive
                    ]} />
                  )}
                </View>
              ))}
            </View>
            
            <View style={styles.headerContent}>
              <Text style={styles.stepTitle}>
                {currentStep === 1 && 'Select Dates & Travelers'}
                {currentStep === 2 && 'Special Requests'}
                {currentStep === 3 && 'Review Booking'}
              </Text>
              <Text style={styles.stepSubtitle}>
                Step {currentStep} of {totalSteps}
              </Text>
            </View>
          </View>

          {/* Step Content */}
          <View style={styles.content}>
            {/* Step 1: Date & Participants */}
            {currentStep === 1 && (
              <ScrollView 
                style={styles.stepContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.stepScrollContent}
              >
                <View style={styles.packageInfo}>
                  <Ionicons name="briefcase" size={20} color={Colors.primary600} />
                  <Text style={styles.packageTitle} numberOfLines={2}>{pkg?.title}</Text>
                </View>

                {/* Date Selection */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="calendar" size={18} color={Colors.primary600} />
                    <Text style={styles.sectionTitle}>Select Start Date</Text>
                  </View>
                  
                  {loadingAvailability && (
                    <View style={styles.availabilityLoading}>
                      <Text style={styles.availabilityLoadingText}>Loading guide availability...</Text>
                    </View>
                  )}
                  
                  {!loadingAvailability && unavailableDates.length > 0 && (
                    <View style={styles.availabilityInfo}>
                      <Ionicons name="information-circle" size={16} color={Colors.info} />
                      <Text style={styles.availabilityInfoText}>
                        {durationDays > 1 
                          ? `Dates marked in red are unavailable. For this ${durationDays}-day package, all dates in the range must be available.`
                          : 'Dates marked in red are unavailable (guide already booked)'
                        }
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.calendarWrapper}>
                    <InlineCalendar 
                      selectedDate={startDate}
                      unavailableDates={unavailableDates}
                      packageDuration={durationDays}
                      onDaySelect={(d: Date) => {
                        onDaySelect(d);
                      }} 
                    />
                  </View>

                  {startDate && endDate && (
                    <View style={styles.dateSelectedCard}>
                      <View style={styles.dateSelectedRow}>
                        <View style={styles.dateSelectedItem}>
                          <Ionicons name="calendar" size={16} color={Colors.primary600} />
                          <View style={styles.dateSelectedInfo}>
                            <Text style={styles.dateSelectedLabel}>Start Date</Text>
                            <Text style={styles.dateSelectedValue}>
                              {startDate.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </Text>
                          </View>
                        </View>
                        <Ionicons name="arrow-forward" size={16} color={Colors.secondary400} />
                        <View style={styles.dateSelectedItem}>
                          <Ionicons name="calendar-outline" size={16} color={Colors.primary600} />
                          <View style={styles.dateSelectedInfo}>
                            <Text style={styles.dateSelectedLabel}>End Date</Text>
                            <Text style={styles.dateSelectedValue}>
                              {endDate.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {!!pkg.durationDays && (
                        <View style={styles.durationInfo}>
                          <Ionicons name="time" size={14} color={Colors.primary700} />
                          <Text style={styles.durationText}>
                            {pkg.durationDays} {pkg.durationDays === 1 ? 'day' : 'days'} trip
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Participants */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="people" size={18} color={Colors.primary600} />
                    <Text style={styles.sectionTitle}>Number of Participants</Text>
                  </View>
                  <View style={styles.participantsCard}>
                    <TouchableOpacity 
                      style={[styles.participantBtn, parsedParticipants <= 1 && styles.participantBtnDisabled]} 
                      onPress={decrementParticipants} 
                      disabled={parsedParticipants <= 1}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="remove" size={24} color={parsedParticipants <= 1 ? Colors.secondary400 : Colors.white} />
                    </TouchableOpacity>
                    <View style={styles.participantCenter}>
                      <Text style={styles.participantValue}>{participants}</Text>
                      <Text style={styles.participantLabel}>
                        {parsedParticipants === 1 ? 'Participant' : 'Participants'}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.participantBtn} 
                      onPress={incrementParticipants}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add" size={24} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                  {maxGroupSize > 0 && (
                    <Text style={styles.helperText}>Maximum {maxGroupSize} participants allowed</Text>
                  )}
                </View>
              </ScrollView>
            )}

            {/* Step 2: Special Requests */}
            {currentStep === 2 && (
              <ScrollView 
                style={styles.stepContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.stepScrollContent}
              >
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="create" size={18} color={Colors.primary600} />
                    <Text style={styles.sectionTitle}>Special Requests</Text>
                  </View>
                  <Text style={styles.sectionDescription}>
                    Let us know if you have any dietary requirements, accessibility needs, or special occasions.
                  </Text>
                  <View style={styles.notesCardLarge}>
                    <TextInput
                      style={styles.notesInputLarge}
                      placeholder="E.g., Vegetarian meals, wheelchair access, celebrating anniversary..."
                      placeholderTextColor={Colors.secondary400}
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      textAlignVertical="top"
                      maxLength={500}
                    />
                    <View style={styles.notesFooter}>
                      <Ionicons name="information-circle-outline" size={14} color={Colors.secondary400} />
                      <Text style={styles.notesCounter}>{notes.length}/500 characters</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>Quick suggestions:</Text>
                  <View style={styles.suggestionChips}>
                    {['Dietary preferences', 'Accessibility needs', 'Child-friendly options', 'Photography preferences'].map((suggestion) => (
                      <TouchableOpacity 
                        key={suggestion}
                        style={styles.suggestionChip}
                        onPress={() => {
                          if (!notes.includes(suggestion)) {
                            setNotes(notes ? `${notes}, ${suggestion}` : suggestion);
                          }
                        }}
                      >
                        <Text style={styles.suggestionChipText}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <ScrollView 
                style={styles.stepContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.stepScrollContent}
              >
                <View style={styles.reviewSection}>
                  <View style={styles.reviewHeader}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary600} />
                    <Text style={styles.reviewTitle}>Review Your Booking</Text>
                  </View>

                  {/* Package Details */}
                  <View style={styles.reviewCard}>
                    <View style={styles.reviewCardHeader}>
                      <Ionicons name="briefcase-outline" size={18} color={Colors.primary600} />
                      <Text style={styles.reviewCardTitle}>Package</Text>
                    </View>
                    <Text style={styles.reviewPackageName}>{pkg?.title}</Text>
                  </View>

                  {/* Dates */}
                  <View style={styles.reviewCard}>
                    <View style={styles.reviewCardHeader}>
                      <Ionicons name="calendar-outline" size={18} color={Colors.primary600} />
                      <Text style={styles.reviewCardTitle}>Travel Dates</Text>
                    </View>
                    <View style={styles.reviewDateRow}>
                      <View style={styles.reviewDateItem}>
                        <Text style={styles.reviewDateLabel}>Check-in</Text>
                        <Text style={styles.reviewDateValue}>
                          {startDate?.toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color={Colors.secondary400} />
                      <View style={styles.reviewDateItem}>
                        <Text style={styles.reviewDateLabel}>Check-out</Text>
                        <Text style={styles.reviewDateValue}>
                          {endDate?.toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Participants */}
                  <View style={styles.reviewCard}>
                    <View style={styles.reviewCardHeader}>
                      <Ionicons name="people-outline" size={18} color={Colors.primary600} />
                      <Text style={styles.reviewCardTitle}>Participants</Text>
                    </View>
                    <Text style={styles.reviewValue}>
                      {parsedParticipants} {parsedParticipants === 1 ? 'Participant' : 'Participants'}
                    </Text>
                  </View>

                  {/* Special Requests */}
                  {notes && (
                    <View style={styles.reviewCard}>
                      <View style={styles.reviewCardHeader}>
                        <Ionicons name="create-outline" size={18} color={Colors.primary600} />
                        <Text style={styles.reviewCardTitle}>Special Requests</Text>
                      </View>
                      <Text style={styles.reviewNotes}>{notes}</Text>
                    </View>
                  )}

                  {/* Price Summary */}
                  <View style={styles.reviewPriceCard}>
                    <View style={styles.reviewCardHeader}>
                      <Ionicons name="wallet-outline" size={18} color={Colors.primary600} />
                      <Text style={styles.reviewCardTitle}>Price Summary</Text>
                    </View>
                    <View style={styles.priceBreakdown}>
                      {perPerson ? (
                        <>
                          <View style={styles.priceBreakdownRow}>
                            <Text style={styles.priceBreakdownLabel}>
                              {currency} {unitAmount.toLocaleString()} × {parsedParticipants} {parsedParticipants === 1 ? 'person' : 'people'}
                            </Text>
                            <Text style={styles.priceBreakdownValue}>
                              {currency} {(parsedParticipants * unitAmount).toLocaleString()}
                            </Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <View style={styles.priceBreakdownRow}>
                            <Text style={styles.priceBreakdownLabel}>
                              Package price (per group)
                            </Text>
                            <Text style={styles.priceBreakdownValue}>
                              {currency} {unitAmount.toLocaleString()}
                            </Text>
                          </View>
                          <View style={styles.priceBreakdownRow}>
                            <Text style={styles.priceBreakdownSubtext}>
                              For {parsedParticipants} {parsedParticipants === 1 ? 'person' : 'people'}
                            </Text>
                          </View>
                        </>
                      )}
                      <View style={styles.priceDividerLarge} />
                      <View style={styles.priceTotalRow}>
                        <Text style={styles.priceTotalLabel}>Total Amount</Text>
                        <Text style={styles.priceTotalValue}>
                          {currency} {totalPrice.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>

          {/* Navigation Footer */}
          <View style={styles.navigationFooter}>
            {currentStep > 1 ? (
              <TouchableOpacity 
                style={styles.navBtnSecondary} 
                onPress={handlePrevious}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={20} color={Colors.primary600} />
                <Text style={styles.navBtnSecondaryText}>Previous</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.navBtnSecondary} 
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={Colors.secondary600} />
                <Text style={styles.navBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
            )}

            {currentStep < totalSteps ? (
              <TouchableOpacity 
                style={[styles.navBtnPrimary, !canGoNext() && styles.navBtnDisabled]}
                onPress={handleNext}
                disabled={!canGoNext()}
                activeOpacity={0.7}
              >
                <Text style={styles.navBtnPrimaryText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.navBtnPrimary, submitting && styles.navBtnDisabled]}
                onPress={submitBooking}
                disabled={submitting}
                activeOpacity={0.7}
              >
                {submitting ? (
                  <Text style={styles.navBtnPrimaryText}>Processing...</Text>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                    <Text style={styles.navBtnPrimaryText}>Confirm Booking</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bookingSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
    flex: 1,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  
  // Header & Progress
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
    backgroundColor: Colors.white,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.secondary200,
    marginBottom: 16,
  },
  headerTop: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: Colors.secondary50,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  progressStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary100,
    borderWidth: 2,
    borderColor: Colors.secondary200,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressDotActive: {
    backgroundColor: Colors.primary600,
    borderColor: Colors.primary600,
  },
  progressDotCurrent: {
    backgroundColor: Colors.primary600,
    borderColor: Colors.primary600,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  progressDotText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary500,
  },
  progressDotTextActive: {
    color: Colors.white,
  },
  progressLine: {
    width: 50,
    height: 3,
    backgroundColor: Colors.secondary200,
    marginHorizontal: 6,
    borderRadius: 2,
  },
  progressLineActive: {
    backgroundColor: Colors.primary600,
  },
  headerContent: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary800,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: Colors.secondary500,
    fontWeight: '600',
  },

  // Content Area
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
  },
  stepScrollContent: {
    padding: 24,
    paddingBottom: 40,
  },

  // Package Info
  packageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.primary100,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primary100,
  },
  packageTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary800,
    fontFamily: 'Inter',
  },

  // Section Styles
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary700,
    fontFamily: 'Inter',
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.secondary600,
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: 'Inter',
  },

  // Date Display
  availabilityLoading: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.secondary50,
    borderRadius: 12,
    marginBottom: 12,
  },
  availabilityLoadingText: {
    fontSize: 14,
    color: Colors.secondary600,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#eff6ff', // Light blue background
    borderRadius: 12,
    marginBottom: 12,
  },
  availabilityInfoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.secondary700,
    lineHeight: 18,
    fontFamily: 'Inter',
  },
  calendarWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    maxHeight: 450,
  },
  dateSelectedCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateSelectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dateSelectedInfo: {
    flex: 1,
  },
  dateSelectedLabel: {
    fontSize: 11,
    color: Colors.secondary500,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dateSelectedValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary800,
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary100,
  },
  durationText: {
    fontSize: 13,
    color: Colors.primary700,
    fontWeight: '600',
  },

  // Participants
  participantsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 28,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  participantBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary600,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  participantBtnDisabled: {
    backgroundColor: Colors.secondary200,
    shadowOpacity: 0,
    elevation: 0,
  },
  participantCenter: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  participantValue: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary800,
    marginBottom: 4,
  },
  participantLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary600,
  },
  helperText: {
    fontSize: 13,
    color: Colors.secondary500,
    marginTop: 12,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'Inter',
  },

  // Notes
  notesCardLarge: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notesInputLarge: {
    fontSize: 15,
    color: Colors.primary800,
    minHeight: 140,
    lineHeight: 22,
    fontFamily: 'Inter',
  },
  notesFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary100,
  },
  notesCounter: {
    fontSize: 12,
    color: Colors.secondary400,
    fontWeight: '600',
    fontFamily: 'Inter',
  },

  // Suggestions
  suggestionsContainer: {
    marginTop: 24,
  },
  suggestionsTitle: {
    fontSize: 13,
    color: Colors.secondary600,
    fontWeight: '700',
    marginBottom: 12,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.secondary50,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.secondary200,
  },
  suggestionChipText: {
    fontSize: 13,
    color: Colors.primary700,
    fontWeight: '600',
  },

  // Review Section
  reviewSection: {
    gap: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary700,
    fontFamily: 'Inter',
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  reviewCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Inter',
  },
  reviewPackageName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary800,
    lineHeight: 22,
    fontFamily: 'Inter',
  },
  reviewDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  reviewDateItem: {
    flex: 1,
  },
  reviewDateLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: 'Inter',
  },
  reviewDateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary800,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary800,
    fontFamily: 'Inter',
  },
  reviewNotes: {
    fontSize: 14,
    color: Colors.secondary700,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  reviewPriceCard: {
    backgroundColor: Colors.primary100,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: Colors.primary100,
  },
  priceBreakdown: {
    gap: 12,
  },
  priceBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceBreakdownLabel: {
    fontSize: 14,
    color: Colors.secondary700,
    fontWeight: '600',
  },
  priceBreakdownValue: {
    fontSize: 14,
    color: Colors.primary800,
    fontWeight: '700',
  },
  priceBreakdownSubtext: {
    fontSize: 12,
    color: Colors.secondary500,
    fontStyle: 'italic',
    marginTop: 4,
  },
  priceDividerLarge: {
    height: 2,
    backgroundColor: Colors.primary100,
  },
  priceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary800,
  },
  priceTotalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary600,
  },

  // Navigation Footer
  navigationFooter: {
    flexDirection: 'row',
    gap: 16,
    padding: 24,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary100,
    backgroundColor: Colors.white,
    shadowColor: Colors.secondary700,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  navBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.secondary200,
    backgroundColor: Colors.white,
  },
  navBtnSecondaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary700,
  },
  navBtnPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.primary600,
    shadowColor: Colors.primary600,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  navBtnPrimaryText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  navBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
});
