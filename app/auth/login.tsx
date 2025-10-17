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

import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    identifier: '', // Can be username or email
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Identifier validation
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Username or email is required';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      const result = await login(formData.identifier, formData.password);
      
      // Check if login returned a status (non-error case)
      if (result && !result.success) {
        if (result.status === 'pending') {
          // Redirect to pending approval page for pending accounts
          router.push('./pending-approval');
          return;
        }
      }
      
      // Navigation will be handled by the auth state change in the main index
      // Let the auth context handle the role-based navigation
      router.replace('/');
       
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      const lower = errorMessage.toLowerCase();

      // If the backend responded with pending/under review, navigate to pending approval
      if (lower.includes('pending approval') || lower.includes('under review') || lower.includes('account pending')) {
        router.push('./pending-approval');
        return;
      }
      
      // Check if account is suspended or rejected
      if (lower.includes('suspended')) {
        Alert.alert(
          'Account Suspended',
          'Your account has been suspended. Please contact support for assistance.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      if (lower.includes('rejected')) {
        Alert.alert(
          'Application Rejected',
          'Your guide application has been rejected. Please contact support for more information.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Check for invalid credentials
      if (lower.includes('invalid username') || 
          lower.includes('invalid password') ||
          lower.includes('invalid credentials') ||
          lower.includes('check your credentials')) {
        
        // Set field-level errors for invalid credentials
        setErrors({
          identifier: 'Invalid username or email',
          password: 'Invalid password'
        });
        
        Alert.alert(
          'Invalid Credentials',
          'The username/email or password you entered is incorrect. Please check your credentials and try again.',
          [
            { text: 'Forgot Password?', onPress: () => router.push('./forgotPassword') },
            { text: 'Try Again', style: 'default' }
          ]
        );
        return;
      }
      
      // Check for network errors
    if (lower.includes('network') || 
      lower.includes('internet connection')) {
        Alert.alert(
          'Connection Error',
          'Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Check for server errors
    if (lower.includes('server error') || 
      lower.includes('try again later')) {
        Alert.alert(
          'Server Error',
          'Our servers are experiencing issues. Please try again in a few minutes.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Generic error for other cases
      Alert.alert(
        'Login Failed',
        errorMessage || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
            <Image
              source={require('../../assets/images/wander_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText variant="title" style={styles.title}>
              Welcome Back!
            </ThemedText>
            <ThemedText variant="default" style={styles.subtitle}>
              Sign in to continue your Sri Lankan adventure with WanderLanka
            </ThemedText>
          </ThemedView>

          <View style={styles.form}>
            <CustomTextInput
              label="Username or Email"
              value={formData.identifier}
              onChangeText={(value) => handleFieldChange('identifier', value)}
              error={errors.identifier}
              placeholder="Enter your username or email"
              leftIcon="person"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <CustomTextInput
              label="Password"
              value={formData.password}
              onChangeText={(value) => handleFieldChange('password', value)}
              error={errors.password}
              placeholder="Enter your password"
              leftIcon="lock-closed"
              isPassword
            />

            <CustomButton
              title="Log In"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
            />

            <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('./forgotPassword')}>
              <Text style={styles.forgotPasswordText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>



            <View style={styles.signUpPrompt}>
              <Text style={styles.signUpPromptText}>
                Don&#39;t have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('./signup')}>
                <Text style={styles.signUpLink}>Sign up</Text>
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
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    padding: 10,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary700,
    marginBottom: 3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  forgotPassword: {
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.primary600,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  signUpPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpPromptText: {
    fontSize: 14,
    color: Colors.secondary500,
    fontFamily: 'Inter',
  },
  signUpLink: {
    fontSize: 14,
    color: Colors.primary600,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
