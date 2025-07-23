import React, { useState, useCallback } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  CustomButton,
  CustomTextInput,
  ThemedText,
  ThemedView
} from '../../components';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

interface GuideRegistrationData {
  firstName: string;
  lastName: string;
  nicNumber: string;
  dateOfBirth: string;
  proofDocument: {
    uri: string;
    name: string;
    type: string;
  } | null;
}

export default function GuideRegistrationScreen() {
  const { completeGuideRegistration, isLoading } = useAuth();
  const params = useLocalSearchParams() as {
    username: string;
    email: string;
    password: string;
  };

  const [formData, setFormData] = useState<GuideRegistrationData>({
    firstName: '',
    lastName: '',
    nicNumber: '',
    dateOfBirth: '',
    proofDocument: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    // NIC validation
    if (!formData.nicNumber.trim()) {
      newErrors.nicNumber = 'NIC number is required';
    } else if (!/^[0-9]{9}[vVxX]$|^[0-9]{12}$/.test(formData.nicNumber)) {
      newErrors.nicNumber = 'Please enter a valid NIC number (9 digits + V/X or 12 digits)';
    }

    // Date of birth validation
    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.dateOfBirth)) {
        newErrors.dateOfBirth = 'Please enter date in YYYY-MM-DD format';
      } else {
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) {
          newErrors.dateOfBirth = 'Must be at least 18 years old to register as a guide';
        }
      }
    }

    // Document validation
    if (!formData.proofDocument) {
      newErrors.proofDocument = 'Tour guide registration proof is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleDateChange = (event: any, date?: Date) => {
    // For Android, always close the picker after selection
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    // Only update if a date was actually selected (not dismissed)
    if (event.type === 'set' && date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      setFormData(prev => ({ ...prev, dateOfBirth: formattedDate }));
      
      if (errors.dateOfBirth) {
        setErrors(prev => ({ ...prev, dateOfBirth: '' }));
      }
      
      // For iOS, close picker when user taps "Done" or finishes selection
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    } else if (event.type === 'dismissed') {
      // User cancelled the picker
      setShowDatePicker(false);
    }
  };

  const showDatePickerModal = () => {
    // Initialize selectedDate with current dateOfBirth or a default date
    if (formData.dateOfBirth) {
      setSelectedDate(new Date(formData.dateOfBirth));
    } else {
      setSelectedDate(new Date(2000, 0, 1)); // Default to Jan 1, 2000
    }
    setShowDatePicker(true);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const document = result.assets[0];
        setFormData(prev => ({
          ...prev,
          proofDocument: {
            uri: document.uri,
            name: document.name,
            type: document.mimeType || 'application/octet-stream',
          }
        }));
        
        if (errors.proofDocument) {
          setErrors(prev => ({ ...prev, proofDocument: '' }));
        }
      }
    } catch {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await completeGuideRegistration({
        username: params.username,
        email: params.email,
        password: params.password,
        role: 'guide',
        guideDetails: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          nicNumber: formData.nicNumber,
          dateOfBirth: formData.dateOfBirth,
          proofDocument: formData.proofDocument!,
        }
      });

      Alert.alert(
        'Application Submitted!',
        'Your tour guide application has been submitted for admin review. You will receive an email notification once your account is approved.',
        [{ text: 'OK', onPress: () => router.push('./login') }]
      );
    } catch (error) {
      Alert.alert(
        'Submission Failed',
        error instanceof Error ? error.message : 'Failed to submit application. Please try again.'
      );
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
              <Ionicons name="arrow-back" size={24} color={Colors.primary700} />
            </TouchableOpacity>
            
            <Image
              source={require('../../assets/images/wander_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText variant="title" style={styles.title}>
              Tour Guide Registration
            </ThemedText>
            <ThemedText variant="default" style={styles.subtitle}>
              Complete your profile to become a certified tour guide
            </ThemedText>
          </ThemedView>

          <View style={styles.form}>
            <CustomTextInput
              label="First Name"
              value={formData.firstName}
              onChangeText={(value) => handleFieldChange('firstName', value)}
              error={errors.firstName}
              placeholder="Enter your first name"
              leftIcon="person"
              autoCapitalize="words"
            />

            <CustomTextInput
              label="Last Name"
              value={formData.lastName}
              onChangeText={(value) => handleFieldChange('lastName', value)}
              error={errors.lastName}
              placeholder="Enter your last name"
              leftIcon="person"
              autoCapitalize="words"
            />

            <CustomTextInput
              label="NIC Number"
              value={formData.nicNumber}
              onChangeText={(value) => handleFieldChange('nicNumber', value.toUpperCase())}
              error={errors.nicNumber}
              placeholder="XXXXXXXXV or XXXXXXXXXXXX"
              leftIcon="card"
              autoCapitalize="characters"
            />

            <View style={styles.datePickerSection}>
              <Text style={styles.datePickerLabel}>Date of Birth *</Text>
              <TouchableOpacity
                style={[
                  styles.datePickerButton,
                  errors.dateOfBirth && styles.datePickerButtonError
                ]}
                onPress={showDatePickerModal}
              >
                <Ionicons name="calendar" size={20} color={Colors.primary600} style={styles.datePickerIcon} />
                <Text style={[
                  styles.datePickerText,
                  formData.dateOfBirth && styles.datePickerTextSelected
                ]}>
                  {formData.dateOfBirth 
                    ? formatDisplayDate(formData.dateOfBirth)
                    : 'Select your date of birth'
                  }
                </Text>
              </TouchableOpacity>
              {errors.dateOfBirth && (
                <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
              )}
            </View>

            {showDatePicker && (
              <>
                {Platform.OS === 'ios' ? (
                  <Modal
                    transparent={true}
                    animationType="slide"
                    visible={showDatePicker}
                    onRequestClose={() => setShowDatePicker(false)}
                  >
                    <View style={styles.modalOverlay}>
                      <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                          <TouchableOpacity
                            onPress={() => setShowDatePicker(false)}
                            style={styles.modalButton}
                          >
                            <Text style={styles.modalButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <Text style={styles.modalTitle}>Select Date of Birth</Text>
                          <TouchableOpacity
                            onPress={() => {
                              if (selectedDate) {
                                const formattedDate = selectedDate.toISOString().split('T')[0];
                                setFormData(prev => ({ ...prev, dateOfBirth: formattedDate }));
                                if (errors.dateOfBirth) {
                                  setErrors(prev => ({ ...prev, dateOfBirth: '' }));
                                }
                              }
                              setShowDatePicker(false);
                            }}
                            style={styles.modalButton}
                          >
                            <Text style={[styles.modalButtonText, styles.modalButtonTextDone]}>Done</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={selectedDate || new Date(2000, 0, 1)}
                          mode="date"
                          display="spinner"
                          onChange={(event, date) => {
                            if (date) {
                              setSelectedDate(date);
                            }
                          }}
                          maximumDate={new Date()}
                          minimumDate={new Date(1940, 0, 1)}
                          style={styles.iosDatePicker}
                        />
                      </View>
                    </View>
                  </Modal>
                ) : (
                  <DateTimePicker
                    value={selectedDate || new Date(2000, 0, 1)}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1940, 0, 1)}
                  />
                )}
              </>
            )}

            <View style={styles.documentSection}>
              <Text style={styles.documentLabel}>Tour Guide Registration Proof *</Text>
              <TouchableOpacity
                style={[
                  styles.documentPicker,
                  errors.proofDocument && styles.documentPickerError
                ]}
                onPress={handleDocumentPicker}
              >
                <Ionicons 
                  name="document-attach" 
                  size={24} 
                  color={formData.proofDocument ? Colors.primary600 : Colors.secondary400} 
                />
                <Text style={[
                  styles.documentText,
                  formData.proofDocument && styles.documentTextSelected
                ]}>
                  {formData.proofDocument 
                    ? formData.proofDocument.name 
                    : 'Upload registration certificate or license'
                  }
                </Text>
                <Ionicons name="cloud-upload" size={20} color={Colors.secondary400} />
              </TouchableOpacity>
              {errors.proofDocument && (
                <Text style={styles.errorText}>{errors.proofDocument}</Text>
              )}
              <Text style={styles.helperText}>
                Upload your official tour guide registration certificate, license, or proof from tourism board
              </Text>
            </View>

            <CustomButton
              title="Submit Application"
              onPress={handleSubmit}
              loading={isLoading}
              style={styles.submitButton}
            />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={Colors.primary600} />
              <Text style={styles.infoText}>
                Your application will be reviewed by our admin team. This usually takes 1-3 business days.
              </Text>
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
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 15,
    padding: 8,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary700,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  documentSection: {
    marginBottom: 16,
  },
  documentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  documentPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.secondary200,
    borderRadius: 12,
    backgroundColor: Colors.white,
    padding: 16,
    minHeight: 56,
  },
  documentPickerError: {
    borderColor: Colors.error,
  },
  documentText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.secondary400,
    fontFamily: 'Inter',
  },
  documentTextSelected: {
    color: Colors.secondary700,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    fontFamily: 'Inter',
  },
  helperText: {
    fontSize: 12,
    color: Colors.secondary400,
    marginTop: 4,
    fontFamily: 'Inter',
    lineHeight: 16,
  },
  datePickerSection: {
    marginBottom: 16,
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.secondary200,
    borderRadius: 12,
    backgroundColor: Colors.white,
    padding: 16,
    minHeight: 56,
  },
  datePickerButtonError: {
    borderColor: Colors.error,
  },
  datePickerIcon: {
    marginRight: 12,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: Colors.secondary400,
    fontFamily: 'Inter',
  },
  datePickerTextSelected: {
    color: Colors.secondary700,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area for iOS
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.secondary200,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalButtonText: {
    fontSize: 16,
    color: Colors.primary600,
    fontFamily: 'Inter',
  },
  modalButtonTextDone: {
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    fontFamily: 'Inter',
  },
  iosDatePicker: {
    backgroundColor: Colors.white,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: Colors.primary700,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
});
