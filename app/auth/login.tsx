import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { 
  CustomTextInput, 
  CustomButton,
  ThemedView,
  ThemedText
} from '../../components';

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
      await login(formData.identifier, formData.password);
      
      // Navigation will be handled by the auth state change
      router.replace('../dashboard');
    } catch (error) {
      Alert.alert(
        'Login Failed',
        error instanceof Error ? error.message : 'Invalid credentials. Please try again.'
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
            <ThemedText variant="title" style={styles.title}>
              Welcome Back
            </ThemedText>
            <ThemedText variant="default" style={styles.subtitle}>
              Sign in to continue your Sri Lankan adventure
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

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <View style={styles.signUpPrompt}>
              <Text style={styles.signUpPromptText}>
                Don't have an account?{' '}
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
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary700,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
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
    marginBottom: 32,
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
