# Stripe Payment Setup - Mobile App

This guide will help you set up Stripe payment processing in the WanderLanka mobile app.

## 📦 Installation

### Step 1: Install Stripe React Native SDK

```bash
cd wanderlanka-mobile-app
npx expo install @stripe/stripe-react-native
```

### Step 2: Get Stripe Publishable Key

You need the **Stripe Publishable Key** (starts with `pk_test_` for test mode).

For test mode, you can get it from:
- Stripe Dashboard: https://dashboard.stripe.com/test/apikeys
- Or use this test publishable key that matches your secret key

**Test Publishable Key** (matches your secret key):
```
pk_test_51SJuV30wtdJrCVBfXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

> ⚠️ **Note**: Replace the X's with the actual publishable key from your Stripe Dashboard

### Step 3: Configure Stripe Provider

Update `app/_layout.tsx` to wrap your app with StripeProvider:

```typescript
import { StripeProvider } from '@stripe/stripe-react-native';

// Add your Stripe publishable key here
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SJuV30wtdJrCVBfXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

export default function RootLayout() {
  return (
    <StripeProvider 
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.wanderlanka" // For Apple Pay (optional)
    >
      {/* Your existing app content */}
      <Stack>
        {/* ... your screens */}
      </Stack>
    </StripeProvider>
  );
}
```

## 🚀 Usage

### Basic Payment Flow

Here's how to implement a payment in your booking flow:

```typescript
import { useStripe } from '@stripe/stripe-react-native';
import { paymentService } from '@/services/paymentService';

export default function BookingScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const handleBookingPayment = async () => {
    try {
      setLoading(true);

      // 1. Create payment intent
      const paymentIntent = await paymentService.createPaymentIntent({
        serviceType: 'accommodation',
        serviceId: 'ACC123',
        totalAmount: 20025,
        accommodationId: 'ACC123',
        checkInDate: '2025-11-01',
        checkOutDate: '2025-11-05',
        selectedRooms: [
          {
            roomType: 'Deluxe',
            quantity: 2,
            pricePerNight: 5000
          }
        ],
        guestDetails: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+94771234567'
        },
        contactInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+94771234567'
        }
      });

      // 2. Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentIntent.clientSecret,
        merchantDisplayName: 'WanderLanka',
      });

      if (initError) {
        Alert.alert('Error', initError.message);
        return;
      }

      // 3. Present payment sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code === 'Canceled') {
          Alert.alert('Cancelled', 'Payment was cancelled');
        } else {
          Alert.alert('Error', paymentError.message);
        }
        return;
      }

      // 4. Confirm payment with backend
      const confirmation = await paymentService.confirmPayment({
        paymentIntentId: paymentIntent.paymentIntentId,
        bookingId: paymentIntent.bookingId,
      });

      // 5. Success!
      Alert.alert(
        'Success!',
        \`Booking confirmed: \${confirmation.data.confirmationNumber}\`
      );

      // Navigate to booking details
      router.push(\`/bookings/\${confirmation.data.bookingId}\`);

    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Button 
        title="Pay Now" 
        onPress={handleBookingPayment}
        disabled={loading}
      />
    </View>
  );
}
```

### Using the PaymentSheet Component

We've created a ready-to-use `PaymentSheet` component:

```typescript
import PaymentSheet from '@/components/PaymentSheet';

export default function CheckoutScreen({ route }) {
  const { bookingData } = route.params;

  return (
    <PaymentSheet
      bookingData={bookingData}
      onSuccess={(confirmationNumber, bookingId) => {
        // Navigate to success screen
        router.push({
          pathname: '/bookings/[id]',
          params: { id: bookingId }
        });
      }}
      onCancel={() => {
        // Go back to previous screen
        router.back();
      }}
    />
  );
}
```

## 🧪 Testing

### Test Cards

Use these test card numbers:

| Card Number         | Scenario                       |
|---------------------|--------------------------------|
| 4242 4242 4242 4242 | Success                        |
| 4000 0025 0000 3155 | Requires 3D Secure             |
| 4000 0000 0000 9995 | Declined (insufficient funds)  |
| 4000 0000 0000 0069 | Expired card                   |

- **Expiry**: Any future date (e.g., 12/28)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

### Test the Payment Flow

1. Start the booking service:
   ```bash
   cd ../booking-service
   npm start
   ```

2. Start the mobile app:
   ```bash
   npm start
   # Press 'i' for iOS or 'a' for Android
   ```

3. Make a test booking and use the test card `4242 4242 4242 4242`

## 📱 Platform-Specific Setup

### iOS

No additional setup required! The Stripe SDK works out of the box.

### Android

Add the following to `android/app/build.gradle`:

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        minSdkVersion 21
        // ... rest of config
    }
}
```

## 🔧 Troubleshooting

### "Stripe not configured" Error

**Problem**: Backend returns "Stripe not configured"

**Solution**: 
1. Check that `.env` file exists in `booking-service`
2. Verify `STRIPE_SECRET_KEY` is set correctly
3. Restart the booking service

### Payment Sheet Doesn't Open

**Problem**: Payment sheet doesn't appear

**Solution**:
1. Verify `@stripe/stripe-react-native` is installed
2. Check that `StripeProvider` wraps your app in `_layout.tsx`
3. Ensure publishable key is correct
4. Check console for errors

### "Invalid client secret" Error

**Problem**: Payment intent creation fails

**Solution**:
1. Ensure backend is running on correct IP
2. Check `config.ts` has correct IP address (should be `172.20.10.2`)
3. Verify authentication token is valid
4. Check network connectivity

### Webhook Events Not Received

**Problem**: Payment succeeds but booking not confirmed

**Solution**:
1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Run webhook forwarding: `stripe listen --forward-to localhost:3009/payments/webhook`
3. Add webhook secret to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`
4. Restart booking service

## 🔒 Security

- ✅ Never commit `.env` files
- ✅ Never expose secret keys in mobile app
- ✅ Always use publishable key in frontend
- ✅ Validate payment amounts on backend
- ✅ Use HTTPS in production

## 📚 Resources

- [Stripe React Native Docs](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Payment Intents API](https://stripe.com/docs/api/payment_intents)

## 🎉 You're Ready!

Your mobile app is now configured for Stripe payments. Test with the provided test cards and you're good to go!

