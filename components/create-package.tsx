import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { ThemedText } from './ThemedText';
import { CustomTextInput } from './CustomTextInput';

interface ItineraryItem {
  time: string;
  activity: string;
  location: string;
}

interface PackageForm {
  name: string;
  description: string;
  duration: string;
  price: string;
  maxGroupSize: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging' | 'Expert';
  category: 'Cultural' | 'Adventure' | 'Nature' | 'Historical' | 'Beach' | 'City Tour' | 'Wildlife';
  highlights: string[];
  included: string[];
  excluded: string[];
  itinerary: ItineraryItem[];
  meetingPoint: string;
  cancellationPolicy: string;
  languages: string[];
  requirements: string[];
  isActive: boolean;
}

const defaultForm: PackageForm = {
  name: '',
  description: '',
  duration: '',
  price: '',
  maxGroupSize: '',
  difficulty: 'Easy',
  category: 'Cultural',
  highlights: [''],
  included: [''],
  excluded: [''],
  itinerary: [{ time: '', activity: '', location: '' }],
  meetingPoint: '',
  cancellationPolicy: '',
  languages: ['English'],
  requirements: [''],
  isActive: true,
};

const templateDefaults = {
  Cultural: {
    category: 'Cultural' as const,
    difficulty: 'Easy' as const,
    highlights: [
      'Cultural performances',
      'Local artisan workshops',
      'Traditional experiences',
      'Historical site visits'
    ],
    included: [
      'Professional guide',
      'Entrance fees',
      'Traditional lunch',
      'Transportation',
      'Cultural show tickets'
    ],
    excluded: [
      'Personal expenses',
      'Tips',
      'Additional snacks',
      'Souvenir purchases'
    ],
    requirements: [
      'Comfortable walking shoes',
      'Modest clothing for temple visits'
    ],
    cancellationPolicy: 'Free cancellation up to 24 hours before the tour'
  },
  Adventure: {
    category: 'Adventure' as const,
    difficulty: 'Challenging' as const,
    highlights: [
      'Spectacular views',
      'Hiking experience',
      'Nature exploration',
      'Adventure activities'
    ],
    included: [
      'Professional hiking guide',
      'Safety equipment',
      'Breakfast/refreshments',
      'Transportation',
      'First aid kit'
    ],
    excluded: [
      'Hiking boots (can be rented)',
      'Personal hiking gear',
      'Lunch',
      'Additional refreshments'
    ],
    requirements: [
      'Good physical fitness',
      'Hiking experience recommended',
      'Appropriate clothing'
    ],
    cancellationPolicy: 'Free cancellation up to 48 hours before the tour'
  },
  Nature: {
    category: 'Nature' as const,
    difficulty: 'Moderate' as const,
    highlights: [
      'Wildlife spotting',
      'Nature walks',
      'Scenic landscapes',
      'Photography opportunities'
    ],
    included: [
      'Professional guide',
      'Park entrance fees',
      'Transportation',
      'Binoculars',
      'Nature guide book'
    ],
    excluded: [
      'Meals',
      'Personal equipment',
      'Camera gear',
      'Additional activities'
    ],
    requirements: [
      'Comfortable walking shoes',
      'Sun protection',
      'Insect repellent'
    ],
    cancellationPolicy: 'Free cancellation up to 24 hours before the tour'
  }
};

interface CreatePackageProps {
  onClose?: () => void;
}

export default function CreatePackageComponent({ onClose }: CreatePackageProps) {
  const params = useLocalSearchParams();
  const template = params.template as string | undefined;
  const packageId = params.packageId as string | undefined;
  const [formData, setFormData] = useState<PackageForm>(defaultForm);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Partial<PackageForm>>({});
  const [newHighlight, setNewHighlight] = useState('');
  const [newIncluded, setNewIncluded] = useState('');
  const [newExcluded, setNewExcluded] = useState('');
  const [newRequirement, setNewRequirement] = useState('');

  const steps = [
    { id: 0, title: 'Basic Info', icon: 'information-circle' },
    { id: 1, title: 'Details', icon: 'list' },
    { id: 2, title: 'Itinerary', icon: 'map' },
    { id: 3, title: 'Policies', icon: 'document-text' },
  ];

  useEffect(() => {
    if (template && templateDefaults[template as keyof typeof templateDefaults]) {
      const templateData = templateDefaults[template as keyof typeof templateDefaults];
      setFormData(prev => ({
        ...prev,
        ...templateData
      }));
    }
  }, [template]);

  const updateFormData = (field: keyof PackageForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const addListItem = (listType: 'highlights' | 'included' | 'excluded' | 'requirements', value: string) => {
    if (value.trim()) {
      updateFormData(listType, [...formData[listType], value.trim()]);
      switch (listType) {
        case 'highlights': setNewHighlight(''); break;
        case 'included': setNewIncluded(''); break;
        case 'excluded': setNewExcluded(''); break;
        case 'requirements': setNewRequirement(''); break;
      }
    }
  };

  const removeListItem = (listType: 'highlights' | 'included' | 'excluded' | 'requirements', index: number) => {
    const newList = formData[listType].filter((_, i) => i !== index);
    updateFormData(listType, newList);
  };

  const addItineraryItem = () => {
    updateFormData('itinerary', [...formData.itinerary, { time: '', activity: '', location: '' }]);
  };

  const updateItineraryItem = (index: number, field: keyof ItineraryItem, value: string) => {
    const newItinerary = formData.itinerary.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    updateFormData('itinerary', newItinerary);
  };

  const removeItineraryItem = (index: number) => {
    if (formData.itinerary.length > 1) {
      const newItinerary = formData.itinerary.filter((_, i) => i !== index);
      updateFormData('itinerary', newItinerary);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<PackageForm> = {};

    switch (step) {
      case 0: // Basic Info
        if (!formData.name.trim()) newErrors.name = 'Package name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.duration.trim()) newErrors.duration = 'Duration is required';
        if (!formData.price.trim()) newErrors.price = 'Price is required';
        else if (isNaN(Number(formData.price))) newErrors.price = 'Price must be a number';
        if (!formData.maxGroupSize.trim()) newErrors.maxGroupSize = 'Group size is required';
        else if (isNaN(Number(formData.maxGroupSize))) newErrors.maxGroupSize = 'Group size must be a number';
        break;
      case 1: // Details
        if (formData.highlights.filter(h => h.trim()).length === 0) {
          newErrors.highlights = ['At least one highlight is required'];
        }
        if (formData.included.filter(i => i.trim()).length === 0) {
          newErrors.included = ['At least one included item is required'];
        }
        break;
      case 2: // Itinerary
        const validItinerary = formData.itinerary.filter(item => 
          item.time.trim() && item.activity.trim() && item.location.trim()
        );
        if (validItinerary.length === 0) {
          newErrors.itinerary = [{ time: 'At least one complete itinerary item is required', activity: '', location: '' }];
        }
        break;
      case 3: // Policies
        if (!formData.meetingPoint.trim()) newErrors.meetingPoint = 'Meeting point is required';
        if (!formData.cancellationPolicy.trim()) newErrors.cancellationPolicy = 'Cancellation policy is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSave();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepPress = (stepIndex: number) => {
    // Clear any existing errors when navigating
    setErrors({});
    
    // Allow navigation to any step - users can freely move between steps
    setCurrentStep(stepIndex);
  };

  const handleSave = async () => {
    try {
      // Filter out empty items
      const cleanedData = {
        ...formData,
        highlights: formData.highlights.filter(h => h.trim()),
        included: formData.included.filter(i => i.trim()),
        excluded: formData.excluded.filter(e => e.trim()),
        requirements: formData.requirements.filter(r => r.trim()),
        itinerary: formData.itinerary.filter(item => 
          item.time.trim() && item.activity.trim() && item.location.trim()
        ),
        price: Number(formData.price),
        maxGroupSize: Number(formData.maxGroupSize),
      };

      // Here you would typically save to your backend
      console.log('Saving package:', cleanedData);
      
      Alert.alert(
        'Success',
        'Package saved successfully!',
        [{
          text: 'OK', 
          onPress: () => {
            if (onClose) {
              onClose();
            } else {
              router.back();
            }
          }
        }]
      );
    } catch (error) {
      console.error('Error saving package:', error);
      Alert.alert('Error', 'Failed to save package. Please try again.');
    }
  };

  const renderBasicInfo = () => (
    <ScrollView 
      style={styles.stepContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <CustomTextInput
        label="Package Name"
        value={formData.name}
        onChangeText={(value) => updateFormData('name', value)}
        placeholder="Enter package name"
        error={errors.name}
      />

      <CustomTextInput
        label="Description"
        value={formData.description}
        onChangeText={(value) => updateFormData('description', value)}
        placeholder="Describe your tour package"
        multiline
        numberOfLines={4}
        error={errors.description}
      />

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <CustomTextInput
            label="Duration"
            value={formData.duration}
            onChangeText={(value) => updateFormData('duration', value)}
            placeholder="e.g., 6 hours"
            error={errors.duration}
          />
        </View>
        <View style={styles.halfWidth}>
          <CustomTextInput
            label="Price (LKR)"
            value={formData.price}
            onChangeText={(value) => updateFormData('price', value)}
            placeholder="15000"
            keyboardType="numeric"
            error={errors.price}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Difficulty Level</Text>
          <View style={styles.pickerContainer}>
            {['Easy', 'Moderate', 'Challenging', 'Expert'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.pickerOption,
                  formData.difficulty === level && styles.pickerOptionSelected
                ]}
                onPress={() => updateFormData('difficulty', level)}
              >
                <Text style={[
                  styles.pickerOptionText,
                  formData.difficulty === level && styles.pickerOptionTextSelected
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.halfWidth}>
          <CustomTextInput
            label="Max Group Size"
            value={formData.maxGroupSize}
            onChangeText={(value) => updateFormData('maxGroupSize', value)}
            placeholder="8"
            keyboardType="numeric"
            error={errors.maxGroupSize}
          />
        </View>
      </View>

      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {['Cultural', 'Adventure', 'Nature', 'Historical', 'Beach', 'City Tour', 'Wildlife'].map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              formData.category === category && styles.categoryChipSelected
            ]}
            onPress={() => updateFormData('category', category)}
          >
            <Text style={[
              styles.categoryChipText,
              formData.category === category && styles.categoryChipTextSelected
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScrollView>
  );

  const renderListSection = (
    title: string,
    items: string[],
    newValue: string,
    setNewValue: (value: string) => void,
    listType: 'highlights' | 'included' | 'excluded' | 'requirements',
    placeholder: string
  ) => (
    <View style={styles.listSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      
      <View style={styles.addItemContainer}>
        <TextInput
          style={styles.addItemInput}
          value={newValue}
          onChangeText={setNewValue}
          placeholder={placeholder}
          placeholderTextColor={Colors.secondary400}
        />
        <TouchableOpacity
          style={styles.addItemButton}
          onPress={() => addListItem(listType, newValue)}
          disabled={!newValue.trim()}
        >
          <Ionicons name="add" size={20} color={newValue.trim() ? Colors.primary600 : Colors.secondary400} />
        </TouchableOpacity>
      </View>

      <View style={styles.itemsList}>
        {items.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.listItemText}>{item}</Text>
            <TouchableOpacity
              style={styles.removeItemButton}
              onPress={() => removeListItem(listType, index)}
            >
              <Ionicons name="close" size={16} color={Colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderDetails = () => (
    <ScrollView 
      style={styles.stepContainer} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {renderListSection(
        'Highlights',
        formData.highlights,
        newHighlight,
        setNewHighlight,
        'highlights',
        'Add a highlight...'
      )}

      {renderListSection(
        'Included',
        formData.included,
        newIncluded,
        setNewIncluded,
        'included',
        'What\'s included in the tour...'
      )}

      {renderListSection(
        'Excluded',
        formData.excluded,
        newExcluded,
        setNewExcluded,
        'excluded',
        'What\'s not included...'
      )}

      {renderListSection(
        'Requirements',
        formData.requirements,
        newRequirement,
        setNewRequirement,
        'requirements',
        'Add a requirement...'
      )}
    </ScrollView>
  );

  const renderItinerary = () => (
    <ScrollView 
      style={styles.stepContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Itinerary</Text>
        <TouchableOpacity style={styles.addButton} onPress={addItineraryItem}>
          <Ionicons name="add" size={20} color={Colors.primary600} />
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {formData.itinerary.map((item, index) => (
          <View key={index} style={styles.itineraryItem}>
            <View style={styles.itineraryHeader}>
              <Text style={styles.itineraryNumber}>{index + 1}</Text>
              {formData.itinerary.length > 1 && (
                <TouchableOpacity
                  style={styles.removeItineraryButton}
                  onPress={() => removeItineraryItem(index)}
                >
                  <Ionicons name="trash" size={16} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>
            
            <CustomTextInput
              label="Time"
              value={item.time}
              onChangeText={(value) => updateItineraryItem(index, 'time', value)}
              placeholder="9:00 AM"
              containerStyle={styles.itineraryInput}
            />
            
            <CustomTextInput
              label="Activity"
              value={item.activity}
              onChangeText={(value) => updateItineraryItem(index, 'activity', value)}
              placeholder="Temple visit"
              containerStyle={styles.itineraryInput}
            />
            
            <CustomTextInput
              label="Location"
              value={item.location}
              onChangeText={(value) => updateItineraryItem(index, 'location', value)}
              placeholder="Temple of the Tooth"
              containerStyle={styles.itineraryInput}
            />
          </View>
        ))}
    </ScrollView>
  );

  const renderPolicies = () => (
    <ScrollView 
      style={styles.stepContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <CustomTextInput
        label="Meeting Point"
        value={formData.meetingPoint}
        onChangeText={(value) => updateFormData('meetingPoint', value)}
        placeholder="Where will you meet travelers?"
        error={errors.meetingPoint}
      />

      <CustomTextInput
        label="Cancellation Policy"
        value={formData.cancellationPolicy}
        onChangeText={(value) => updateFormData('cancellationPolicy', value)}
        placeholder="Free cancellation up to 24 hours before..."
        multiline
        numberOfLines={3}
        error={errors.cancellationPolicy}
      />

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Publish immediately</Text>
        <Switch
          value={formData.isActive}
          onValueChange={(value) => updateFormData('isActive', value)}
          trackColor={{ false: Colors.secondary200, true: Colors.primary100 }}
          thumbColor={formData.isActive ? Colors.primary600 : Colors.secondary400}
        />
      </View>
      
      <Text style={styles.switchDescription}>
        {formData.isActive 
          ? 'Package will be visible to travelers immediately'
          : 'Package will be saved as draft'
        }
      </Text>
    </ScrollView>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderBasicInfo();
      case 1: return renderDetails();
      case 2: return renderItinerary();
      case 3: return renderPolicies();
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose || (() => router.back())} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.secondary700} />
        </TouchableOpacity>
        <ThemedText variant="title" style={styles.headerTitle}>
          {packageId ? 'Edit Package' : 'Create Package'}
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <TouchableOpacity 
            key={step.id} 
            style={styles.progressStep}
            onPress={() => handleStepPress(index)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.progressCircle,
              index <= currentStep && styles.progressCircleActive,
              index < currentStep && styles.progressCircleCompleted,
              styles.progressCircleClickable // All steps are now clickable
            ]}>
              {index < currentStep ? (
                <Ionicons name="checkmark" size={16} color={Colors.white} />
              ) : (
                <Ionicons 
                  name={step.icon as any} 
                  size={16} 
                  color={index <= currentStep ? Colors.white : Colors.secondary400} 
                />
              )}
            </View>
            <Text style={[
              styles.progressLabel,
              index <= currentStep && styles.progressLabelActive
            ]}>
              {step.title}
            </Text>
            {index < steps.length - 1 && (
              <View style={[
                styles.progressLine,
                index < currentStep && styles.progressLineCompleted
              ]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderStepContent()}
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.secondaryButton]}
          onPress={handlePrevious}
          disabled={currentStep === 0}
        >
          <Text style={[
            styles.navButtonText,
            styles.secondaryButtonText,
            currentStep === 0 && styles.disabledButtonText
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.primaryButton]}
          onPress={handleNext}
        >
          <Text style={[styles.navButtonText, styles.primaryButtonText]}>
            {currentStep === steps.length - 1 ? 'Save Package' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary100,
  },

  closeButton: {
    padding: 4,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
  },

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: Colors.secondary50,
  },

  progressStep: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 4,
    paddingVertical: 8,
    justifyContent: 'flex-start',
  },

  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  progressCircleActive: {
    backgroundColor: Colors.primary600,
    borderColor: Colors.primary600,
  },

  progressCircleCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },

  progressCircleClickable: {
    transform: [{ scale: 1.02 }],
    borderColor: Colors.secondary400,
  },

  progressLabel: {
    fontSize: 12,
    color: Colors.secondary500,
    textAlign: 'center',
  },

  progressLabelActive: {
    color: Colors.primary600,
    fontWeight: '600',
  },

  progressLine: {
    position: 'absolute',
    top: 23, // Perfectly center with circle (8px margin + 16px circle center - 1px adjustment)
    left: '65%', // Start from center-right of current circle
    width: '70%', // Connect to center-left of next circle
    height: 2,
    backgroundColor: Colors.secondary200,
    zIndex: -1,
  },

  progressLineCompleted: {
    backgroundColor: Colors.success,
  },

  content: {
    flex: 1,
    minHeight: 0, // Ensure flex works properly
  },

  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },

  scrollContent: {
    paddingVertical: 20,
    paddingBottom: 40,
  },

  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },

  halfWidth: {
    flex: 1,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 8,
  },

  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },

  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.secondary100,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },

  pickerOptionSelected: {
    backgroundColor: Colors.primary600,
    borderColor: Colors.primary600,
  },

  pickerOptionText: {
    fontSize: 14,
    color: Colors.secondary600,
  },

  pickerOptionTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },

  categoryScroll: {
    marginBottom: 16,
    paddingVertical: 4,
  },

  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.secondary100,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },

  categoryChipSelected: {
    backgroundColor: Colors.primary600,
    borderColor: Colors.primary600,
  },

  categoryChipText: {
    fontSize: 14,
    color: Colors.secondary600,
  },

  categoryChipTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },

  listSection: {
    marginBottom: 32,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
    marginBottom: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary100,
    borderRadius: 8,
  },

  addButtonText: {
    fontSize: 14,
    color: Colors.primary600,
    fontWeight: '500',
    marginLeft: 4,
  },

  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },

  addItemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.secondary700,
    minHeight: 44, // Ensure consistent height
  },

  addItemButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.secondary100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemsList: {
    gap: 8,
  },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.secondary50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.secondary100,
  },

  listItemText: {
    flex: 1,
    fontSize: 14,
    color: Colors.secondary700,
  },

  removeItemButton: {
    padding: 4,
  },

  itineraryItem: {
    backgroundColor: Colors.secondary50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.secondary100,
  },

  itineraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  itineraryNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary600,
    backgroundColor: Colors.primary100,
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 28,
  },

  removeItineraryButton: {
    padding: 4,
  },

  itineraryInput: {
    marginBottom: 16,
  },

  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary100,
    marginTop: 20,
  },

  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary700,
  },

  switchDescription: {
    fontSize: 14,
    color: Colors.secondary500,
    marginTop: 8,
    lineHeight: 20,
  },

  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary100,
    gap: 12,
  },

  navButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButton: {
    backgroundColor: Colors.primary600,
  },

  secondaryButton: {
    backgroundColor: Colors.secondary100,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },

  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  primaryButtonText: {
    color: Colors.white,
  },

  secondaryButtonText: {
    color: Colors.secondary600,
  },

  disabledButtonText: {
    color: Colors.secondary400,
  },
});
