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
  RoleSelector,
  ThemedText,
  ThemedView
} from '../../components';
import React, { useState } from 'react';

import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { UserRole } from '../../types';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function SignUpScreen() {
  const { signUp, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: null as UserRole | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      await signUp(
        formData.username,
        formData.email,
        formData.password,
        formData.role!
      );
      
      Alert.alert(
        'Registration Successful!',
        'Your account has been created successfully. You can now log in.',
        [{ text: 'OK', onPress: () => router.push('./login') }]
      );
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        error instanceof Error ? error.message : 'An error occurred during registration. Please try again.'
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

  const handleRoleSelect = (role: UserRole) => {
    setFormData(prev => ({ ...prev, role }));
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: '' }));
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
              Create Your Account
            </ThemedText>
            <ThemedText variant="default" style={styles.subtitle}>
              Join WanderLanka community and discover the beauty of Sri Lanka with local guides
            </ThemedText>
          </ThemedView>

          <View style={styles.form}>
            <CustomTextInput
              label="Username"
              value={formData.username}
              onChangeText={(value) => handleFieldChange('username', value)}
              error={errors.username}
              placeholder="Enter your username"
              leftIcon="person"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <CustomTextInput
              label="Email"
              value={formData.email}
              onChangeText={(value) => handleFieldChange('email', value)}
              error={errors.email}
              placeholder="Enter your email"
              leftIcon="mail"
              keyboardType="email-address"
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
            <Text style={styles.helperText}>
              Must be at least 6 characters with uppercase, lowercase, and number
            </Text>

            <CustomTextInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleFieldChange('confirmPassword', value)}
              error={errors.confirmPassword}
              placeholder="Confirm your password"
              leftIcon="lock-closed"
              isPassword
            />

            <RoleSelector
              selectedRole={formData.role}
              onRoleSelect={handleRoleSelect}
              error={errors.role}
            />

            <CustomButton
              title="Create Account"
              onPress={handleSignUp}
              loading={isLoading}
              style={styles.signUpButton}
            />

            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('./login')}>
                <Text style={styles.loginLink}>Log in</Text>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 15,
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
  helperText: {
    fontSize: 12,
    color: Colors.secondary400,
    marginTop: -12,
    marginBottom: 16,
    paddingHorizontal: 4,
    fontFamily: 'Inter',
  },
  signUpButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPromptText: {
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
