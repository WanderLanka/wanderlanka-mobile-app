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
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { AuthService } from '../../services/auth';

export default function ResetPasswordScreen() {
  const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password: string): { isValid: boolean; message?: string } => {
    // Minimum 8 characters
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }

    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }

    // At least one number
    if (!/\d/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }

    // At least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character' };
    }

    return { isValid: true };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // New password validation
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else {
      const passwordValidation = validatePassword(formData.newPassword);
      if (!passwordValidation.isValid) {
        newErrors.newPassword = passwordValidation.message || 'Invalid password';
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm() || !email || !otp) return;

    setIsLoading(true);
    try {
      const result = await AuthService.resetPassword(email, otp, formData.newPassword);
      
      if (result.success) {
        Alert.alert(
          'Password Reset Successful',
          'Your password has been successfully reset. Please log in with your new password.',
          [
            {
              text: 'Continue to Login',
              onPress: () => router.replace('./login')
            }
          ]
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password. Please try again.';
      
      Alert.alert(
        'Reset Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getPasswordStrength = (password: string): { strength: string; color: string } => {
    if (password.length === 0) return { strength: '', color: Colors.secondary400 };
    
    const validation = validatePassword(password);
    if (validation.isValid) {
      return { strength: 'Strong', color: Colors.success };
    }
    
    if (password.length >= 6) {
      return { strength: 'Medium', color: Colors.warning };
    }
    
    return { strength: 'Weak', color: Colors.error };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

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
              Reset Password
            </ThemedText>
            <ThemedText variant="default" style={styles.subtitle}>
              Create a new password for your account. Make sure it&apos;s strong and secure.
            </ThemedText>
          </ThemedView>

          <View style={styles.form}>
            <CustomTextInput
              label="New Password"
              value={formData.newPassword}
              onChangeText={(value) => handleFieldChange('newPassword', value)}
              error={errors.newPassword}
              placeholder="Enter your new password"
              leftIcon="lock-closed"
              isPassword
            />

            {formData.newPassword.length > 0 && (
              <View style={styles.passwordStrengthContainer}>
                <Text style={styles.passwordStrengthLabel}>Password Strength:</Text>
                <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.strength}
                </Text>
              </View>
            )}

            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <Text style={[styles.requirement, formData.newPassword.length >= 8 && styles.requirementMet]}>
                • At least 8 characters
              </Text>
              <Text style={[styles.requirement, /[A-Z]/.test(formData.newPassword) && styles.requirementMet]}>
                • One uppercase letter
              </Text>
              <Text style={[styles.requirement, /[a-z]/.test(formData.newPassword) && styles.requirementMet]}>
                • One lowercase letter
              </Text>
              <Text style={[styles.requirement, /\d/.test(formData.newPassword) && styles.requirementMet]}>
                • One number
              </Text>
              <Text style={[styles.requirement, /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) && styles.requirementMet]}>
                • One special character
              </Text>
            </View>

            <CustomTextInput
              label="Confirm New Password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleFieldChange('confirmPassword', value)}
              error={errors.confirmPassword}
              placeholder="Confirm your new password"
              leftIcon="lock-closed"
              isPassword
            />

            <CustomButton
              title="Reset Password"
              onPress={handleResetPassword}
              loading={isLoading}
              style={styles.resetButton}
            />

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
    marginBottom: 30,
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
  form: {
    flex: 1,
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  passwordStrengthLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    fontWeight: '500',
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  passwordRequirements: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  requirementsTitle: {
    fontSize: 12,
    color: Colors.secondary600,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirement: {
    fontSize: 11,
    color: Colors.secondary500,
    marginBottom: 4,
  },
  requirementMet: {
    color: Colors.success,
    fontWeight: '500',
  },
  resetButton: {
    marginTop: 8,
    marginBottom: 24,
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
