import * as React from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    CustomButton,
    CustomTextInput,
    ThemedText,
    ThemedView
} from '../../components';

import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { AuthService } from '../../services/auth';

export default function VerifyOTPScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // Start resend cooldown timer
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validateOTP = (otp: string): boolean => {
    // OTP should be 6 digits
    const otpRegex = /^\d{6}$/;
    return otpRegex.test(otp);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // OTP validation
    if (!otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (!validateOTP(otp)) {
      newErrors.otp = 'Please enter a valid 6-digit OTP';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerifyOTP = async () => {
    if (!validateForm() || !email) return;

    setIsLoading(true);
    try {
      const result = await AuthService.verifyPasswordResetOTP(email, otp);
      
      if (result.success) {
        Alert.alert(
          'OTP Verified',
          'Your OTP has been verified successfully. You can now reset your password.',
          [
            {
              text: 'Continue',
              onPress: () => router.push({
                pathname: './resetPassword',
                params: { email: email, otp: otp }
              })
            }
          ]
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify OTP. Please try again.';
      
      Alert.alert(
        'Verification Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email || resendCooldown > 0) return;

    setIsLoading(true);
    try {
      const result = await AuthService.requestPasswordReset(email);
      
      if (result.success) {
        setResendCooldown(60); // 60 seconds cooldown
        Alert.alert(
          'OTP Resent',
          'A new OTP has been sent to your email address.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend OTP. Please try again.';
      
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(numericValue);
    
    // Clear error when user starts typing
    if (errors.otp) {
      setErrors(prev => ({ ...prev, otp: '' }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            
            <Image
              source={require('../../assets/images/wander_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText variant="title" style={styles.title}>
              Verify OTP
            </ThemedText>
            <ThemedText variant="default" style={styles.subtitle}>
              We&apos;ve sent a 6-digit verification code to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </ThemedText>
          </ThemedView>

          <View style={styles.form}>
            <CustomTextInput
              label="Verification Code"
              value={otp}
              onChangeText={handleFieldChange}
              error={errors.otp}
              placeholder="Enter 6-digit code"
              leftIcon="keypad"
              keyboardType="numeric"
              maxLength={6}
              style={styles.otpInput}
            />

            <CustomButton
              title="Verify Code"
              onPress={handleVerifyOTP}
              loading={isLoading}
              style={styles.verifyButton}
            />

            <View style={styles.resendSection}>
              <Text style={styles.resendText}>
                Didn&apos;t receive the code?{' '}
              </Text>
              <TouchableOpacity 
                onPress={handleResendOTP}
                disabled={resendCooldown > 0 || isLoading}
                style={styles.resendButton}
              >
                <Text style={[
                  styles.resendButtonText,
                  (resendCooldown > 0 || isLoading) && styles.resendButtonDisabled
                ]}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.helpText}>
              <Text style={styles.helpTextContent}>
                Remember your password?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('./login')}>
                <Text style={styles.loginLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    padding: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary600,
    fontWeight: '600',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary700,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  emailText: {
    fontWeight: '600',
    color: Colors.primary600,
  },
  form: {
    flex: 1,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 8,
  },
  verifyButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  resendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  resendText: {
    fontSize: 14,
    color: Colors.secondary500,
    fontFamily: 'Inter',
  },
  resendButton: {
    paddingVertical: 4,
  },
  resendButtonText: {
    fontSize: 14,
    color: Colors.primary600,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  resendButtonDisabled: {
    color: Colors.secondary400,
  },
  helpText: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpTextContent: {
    fontSize: 14,
    color: Colors.secondary500,
    fontFamily: 'Inter',
  },
  loginLink: {
    fontSize: 14,
    color: Colors.primary600,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
