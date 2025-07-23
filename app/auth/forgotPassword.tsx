import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants/Colors';

import { CustomButton, CustomTextInput, ThemedText, ThemedView } from '../../components';


export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSendResetLink = () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 2000); // Simulate API call
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView style={styles.header}>
           <TouchableOpacity onPress={() => router.push('./login')} style={styles.backButtonIcon}>
                <View style={styles.backButtonCircle}>
                <Ionicons name="arrow-back" size={24} color={Colors.primary700} />
                </View>
            </TouchableOpacity>
            <Image
              source={require('../../assets/images/wander_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText variant="title" style={styles.title}>
              Forgot Password?
            </ThemedText>
            <ThemedText variant="default" style={styles.subtitle}>
              Enter your email address and we&apos;ll send you a reset link.
            </ThemedText>
          </ThemedView>

          <View style={styles.form}>
            {!submitted ? (
              <>
                <CustomTextInput
                  label="Email Address"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    setError('');
                  }}
                  error={error}
                  placeholder="Enter your email"
                  leftIcon="mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <CustomButton
                  title="Send Reset Link"
                  onPress={handleSendResetLink}
                  loading={isLoading}
                  style={styles.submitButton}
                />
              </>
            ) : (
              <View style={styles.successMessage}>
                <Text style={styles.successText}>
                  A password reset link has been sent to your email.
                </Text>
                <CustomButton
                  title="Back to Login"
                  onPress={() => router.replace('./login')}
                  style={styles.backButton}
                />
              </View>
            )}
          </View>
        </ScrollView>
        <View style={[styles.loginPrompt, { paddingBottom: insets.bottom + 15 }]}>
          <Text style={styles.loginPromptText}>Remember password? </Text>
          <TouchableOpacity onPress={() => router.replace('./login')}>
            <Text style={styles.loginLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
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
    fontWeight: '800',
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
  successText: {
    fontSize: 16,
    color: Colors.primary700,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 24,
  },
  successMessage: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 32,
  },
  backButton: {
    marginTop: 12,
    width: '100%',
  },
 backButtonIcon: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10,
    padding: 8,
  },
  backButtonCircle: {
    backgroundColor: Colors.primary100,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

