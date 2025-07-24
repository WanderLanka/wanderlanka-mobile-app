import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomButton, CustomTextInput, ThemedText } from '../../../components';
import { Colors } from '../../../constants/Colors';
import { useBooking } from '../../../context/BookingContext';

export default function PaymentScreen() {
  const { bookings, getTotalAmount, clearAllBookings } = useBooking();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '4242 4242 4242 4242',
    expiryDate: '12/28',
    cvv: '123', 
    cardholderName: 'John Doe', 
    email: 'john.doe@example.com', 
  });

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').substr(0, 19); 
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setPaymentForm(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const validateForm = () => {
    if (!paymentForm.cardNumber || paymentForm.cardNumber.replace(/\s/g, '').length < 16) {
      Alert.alert('Error', 'Please enter a valid card number');
      return false;
    }
    if (!paymentForm.expiryDate || paymentForm.expiryDate.length < 5) {
      Alert.alert('Error', 'Please enter a valid expiry date');
      return false;
    }
    if (!paymentForm.cvv || paymentForm.cvv.length < 3) {
      Alert.alert('Error', 'Please enter a valid CVV');
      return false;
    }
    if (!paymentForm.cardholderName.trim()) {
      Alert.alert('Error', 'Please enter the cardholder name');
      return false;
    }
    if (!paymentForm.email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }
    return true;
  };

  const simulatePayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLoading(false);
    
    // Simulate successful payment
    Alert.alert(
      'Payment Successful! 🎉',
      `Your booking has been confirmed!\n\nTransaction ID: TXN${Date.now()}\nAmount Paid: $${getTotalAmount()}\n\nConfirmation details have been sent to ${paymentForm.email}`,
      [
        {
          text: 'View Bookings',
          onPress: () => {
            clearAllBookings();
            router.replace('/(travelerTabs)/myActivity');
          }
        }
      ]
    );
  };

  const totalAmount = getTotalAmount();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.secondary700} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Secure Payment</ThemedText>
        <View style={styles.headerRight}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.primary600} />
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

      {/* Payment Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="receipt-outline" size={24} color={Colors.primary600} />
          <ThemedText style={styles.summaryTitle}>Payment Summary</ThemedText>
        </View>
        
        <View style={styles.summaryContent}>
          {bookings.accommodation.length > 0 && (
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Accommodation ({bookings.accommodation.length})</ThemedText>
              <ThemedText style={styles.summaryValue}>${bookings.accommodation.reduce((sum, b) => sum + (b.totalPrice || 0), 0)}</ThemedText>
            </View>
          )}
          
          {bookings.transport.length > 0 && (
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Transportation ({bookings.transport.length})</ThemedText>
              <ThemedText style={styles.summaryValue}>${bookings.transport.reduce((sum, b) => sum + (b.totalPrice || 0), 0)}</ThemedText>
            </View>
          )}
          
          {bookings.guides.length > 0 && (
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Tour Guides ({bookings.guides.length})</ThemedText>
              <ThemedText style={styles.summaryValue}>${bookings.guides.reduce((sum, b) => sum + (b.totalPrice || 0), 0)}</ThemedText>
            </View>
          )}
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>Total Amount</ThemedText>
            <ThemedText style={styles.totalValue}>${totalAmount}</ThemedText>
          </View>
        </View>
      </View>

      {/* Payment Form */}
      <View style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <Ionicons name="card-outline" size={24} color={Colors.primary600} />
          <ThemedText style={styles.paymentTitle}>Payment Details</ThemedText>
          <View style={styles.stripeBadge}>
            <ThemedText style={styles.stripeBadgeText}>Powered by Stripe</ThemedText>
          </View>
        </View>

        <View style={styles.formContainer}>
          {/* Card Number */}
          <CustomTextInput
            label="Card Number"
            placeholder="1234 5678 9012 3456"
            value={paymentForm.cardNumber}
            onChangeText={(text) => handleInputChange('cardNumber', text)}
            keyboardType="numeric"
            maxLength={19}
            leftIcon="card-outline"
          />

          {/* Expiry and CVV */}
          <View style={styles.rowInputs}>
            <CustomTextInput
              label="Expiry Date"
              placeholder="MM/YY"
              value={paymentForm.expiryDate}
              onChangeText={(text) => handleInputChange('expiryDate', text)}
              keyboardType="numeric"
              maxLength={5}
              leftIcon="calendar-outline"
              containerStyle={{ flex: 1 }}
            />

            <CustomTextInput
              label="CVV"
              placeholder="123"
              value={paymentForm.cvv}
              onChangeText={(text) => handleInputChange('cvv', text)}
              keyboardType="numeric"
              maxLength={4}
              isPassword={true}
              leftIcon="lock-closed-outline"
              containerStyle={{ flex: 1 }}
            />
          </View>

          {/* Cardholder Name */}
          <CustomTextInput
            label="Cardholder Name"
            placeholder="John Doe"
            value={paymentForm.cardholderName}
            onChangeText={(text) => handleInputChange('cardholderName', text)}
            autoCapitalize="words"
            leftIcon="person-outline"
          />

          {/* Email */}
          <CustomTextInput
            label="Email Address"
            placeholder="john@example.com"
            value={paymentForm.email}
            onChangeText={(text) => handleInputChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
          />
        </View>
      </View>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Ionicons name="shield-checkmark" size={20} color={Colors.primary600} />
        <ThemedText style={styles.securityText}>
          Your payment information is encrypted and secure. We use industry-standard SSL encryption.
        </ThemedText>
      </View>

      {/* Payment Button */}
      <View style={styles.paymentActions}>
        <CustomButton
          title={loading ? "Processing..." : `Pay $${totalAmount}`}
          onPress={simulatePayment}
          disabled={loading}
          loading={loading}
          variant="primary"
          size="large"
          leftIcon={loading ? undefined : <Ionicons name="lock-closed" size={20} color={Colors.white} />}
        />
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  
  scrollContainer: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  headerRight: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },
  summaryContent: {
    padding: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.secondary600,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary700,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.secondary200,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary100,
    padding: 12,
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary700,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary700,
  },

  // Payment Card
  paymentCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary200,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    flex: 1,
  },
  stripeBadge: {
    backgroundColor: Colors.secondary100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stripeBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.secondary600,
  },

  // Test Card Notice
  testCardNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    backgroundColor: Colors.primary100,
    borderRadius: 8,
  },
  testCardText: {
    fontSize: 12,
    color: Colors.primary700,
    flex: 1,
  },

  // Form
  formContainer: {
    padding: 16,
    gap: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 8,
  },

  // Security Notice
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: Colors.primary100,
    borderRadius: 8,
  },
  securityText: {
    fontSize: 12,
    color: Colors.primary700,
    flex: 1,
  },

  // Payment Actions
  paymentActions: {
    padding: 16,
  },
});
