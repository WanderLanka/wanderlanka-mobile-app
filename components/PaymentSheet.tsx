import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { paymentService, PaymentIntentRequest } from '@/services/paymentService';

interface PaymentSheetProps {
  bookingData: PaymentIntentRequest;
  onSuccess: (confirmationNumber: string, bookingId: string) => void;
  onCancel: () => void;
}

/**
 * PaymentSheet Component
 * 
 * Handles the complete payment flow using Stripe Payment Sheet
 * 
 * @example
 * <PaymentSheet
 *   bookingData={{
 *     serviceType: 'accommodation',
 *     serviceId: 'ACC123',
 *     totalAmount: 20025,
 *     accommodationId: 'ACC123',
 *     checkInDate: '2025-11-01',
 *     checkOutDate: '2025-11-05',
 *     selectedRooms: [...],
 *     guestDetails: {...},
 *     contactInfo: {...}
 *   }}
 *   onSuccess={(confirmationNumber, bookingId) => {
 *     // Navigate to success screen
 *   }}
 *   onCancel={() => {
 *     // Go back
 *   }}
 * />
 */
export default function PaymentSheet({
  bookingData,
  onSuccess,
  onCancel,
}: PaymentSheetProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Step 1: Create payment intent on backend
      console.log('📱 Step 1: Creating payment intent...');
      const paymentIntent = await paymentService.createPaymentIntent(bookingData);

      setPaymentIntentId(paymentIntent.paymentIntentId);
      setBookingId(paymentIntent.bookingId);

      console.log('✅ Payment intent created:', {
        paymentIntentId: paymentIntent.paymentIntentId,
        bookingId: paymentIntent.bookingId,
        amount: paymentIntent.amount,
      });

      // Step 2: Initialize Stripe Payment Sheet
      console.log('📱 Step 2: Initializing payment sheet...');
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'WanderLanka',
        paymentIntentClientSecret: paymentIntent.clientSecret,
        defaultBillingDetails: {
          name: `${bookingData.contactInfo.firstName} ${bookingData.contactInfo.lastName}`,
          email: bookingData.contactInfo.email,
          phone: bookingData.contactInfo.phone,
        },
        returnURL: 'wanderlanka://payment-success',
        appearance: {
          colors: {
            primary: '#10B981', // Green color from your app
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
        console.error('❌ Payment sheet initialization failed:', initError);
        throw new Error(initError.message);
      }

      console.log('✅ Payment sheet initialized');

      // Step 3: Present Payment Sheet to user
      console.log('📱 Step 3: Presenting payment sheet...');
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        // User cancelled or payment failed
        if (paymentError.code === 'Canceled') {
          console.log('ℹ️  Payment cancelled by user');
          Alert.alert('Payment Cancelled', 'You cancelled the payment.');
          
          // Cancel payment intent on backend
          await paymentService.cancelPaymentIntent(
            paymentIntent.paymentIntentId,
            paymentIntent.bookingId
          );
          
          onCancel();
          return;
        }

        console.error('❌ Payment failed:', paymentError);
        throw new Error(paymentError.message);
      }

      console.log('✅ Payment sheet completed successfully');

      // Step 4: Confirm payment with backend
      console.log('📱 Step 4: Confirming payment with backend...');
      const confirmation = await paymentService.confirmPayment({
        paymentIntentId: paymentIntent.paymentIntentId,
        bookingId: paymentIntent.bookingId,
      });

      console.log('✅ Payment confirmed:', confirmation);

      // Step 5: Show success and navigate
      Alert.alert(
        'Payment Successful! 🎉',
        `Your booking has been confirmed.\nConfirmation: ${confirmation.data.confirmationNumber}`,
        [
          {
            text: 'View Booking',
            onPress: () => onSuccess(
              confirmation.data.confirmationNumber,
              confirmation.data.bookingId
            ),
          },
        ]
      );

    } catch (error: any) {
      console.error('❌ Payment error:', error);
      
      Alert.alert(
        'Payment Failed',
        error.message || 'An error occurred during payment. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: handlePayment,
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: onCancel,
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Payment Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Payment Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>
            {paymentService.formatAmount(
              bookingData.totalAmount - 
              paymentService.calculateServiceFee(
                bookingData.totalAmount,
                bookingData.serviceType
              ),
              'LKR'
            )}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Service Fee</Text>
          <Text style={styles.summaryValue}>
            {paymentService.formatAmount(
              paymentService.calculateServiceFee(
                bookingData.totalAmount,
                bookingData.serviceType
              ),
              'LKR'
            )}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {paymentService.formatAmount(bookingData.totalAmount, 'LKR')}
          </Text>
        </View>
      </View>

      {/* Payment Button */}
      <TouchableOpacity
        style={[styles.payButton, loading && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.payButtonText}>
            Pay {paymentService.formatAmount(bookingData.totalAmount, 'LKR')}
          </Text>
        )}
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
        disabled={loading}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>

      {/* Payment Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          🔒 Secure payment powered by Stripe
        </Text>
        <Text style={styles.infoText}>
          Your payment information is encrypted and secure
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  summaryContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  payButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
});

