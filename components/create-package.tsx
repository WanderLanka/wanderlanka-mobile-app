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
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { API_CONFIG } from '../services/config';
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
  details?: string;
  duration: string;
  durationValue?: number;
  durationUnit?: 'days' | 'hours' | 'minutes';
  price: string;
  currency: string;
  perPerson: boolean;
  maxGroupSize: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging' | 'Expert';
  category: 'Cultural' | 'Adventure' | 'Nature' | 'Historical' | 'Beach' | 'City Tour' | 'Wildlife';
  coverImage?: string;
  images?: string[];
  highlights: string[];
  included: string[];
  excluded: string[];
  itinerary: ItineraryItem[];
  meetingPoint: string;
  freeCancellation?: boolean;
  freeCancellationWindow?: 'anytime' | '1_day_before' | '7_days_before' | '14_days_before';
  otherPolicies?: string;
  languages: string[];
  requirements: string[];
  isActive: boolean;
}

const defaultForm: PackageForm = {
  name: '',
  description: '',
  details: '',
  duration: '',
  durationValue: 1,
  durationUnit: 'days',
  price: '',
  currency: 'LKR',
  perPerson: false,
  maxGroupSize: '',
  difficulty: 'Easy',
  category: 'Cultural',
  coverImage: '',
  images: [],
  highlights: [],
  included: [],
  excluded: [],
  itinerary: [{ time: '', activity: '', location: '' }],
  meetingPoint: '',
  freeCancellation: false,
  freeCancellationWindow: 'anytime',
  otherPolicies: '',
  languages: ['English'],
  requirements: [],
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
  defaultValues?: Partial<PackageForm>;
  idOrSlug?: string;
  template?: string;
}

export default function CreatePackageComponent({ onClose, defaultValues, idOrSlug, template }: CreatePackageProps) {
  const params = useLocalSearchParams();
  const routeTemplate = params.template as string | undefined;
  const packageId = params.packageId as string | undefined;
  const [formData, setFormData] = useState<PackageForm>({ ...defaultForm, ...(defaultValues || {}) });
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Partial<PackageForm>>({});
  const [newHighlight, setNewHighlight] = useState('');
  const [newIncluded, setNewIncluded] = useState('');
  const [newExcluded, setNewExcluded] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const steps = [
    { id: 0, title: 'Basic Info', icon: 'information-circle' },
    { id: 1, title: 'Details', icon: 'list' },
    { id: 2, title: 'Itinerary', icon: 'map' },
    { id: 3, title: 'Policies', icon: 'document-text' },
  ];

  useEffect(() => {
    const effectiveTemplate = template || routeTemplate;
    if (effectiveTemplate && templateDefaults[effectiveTemplate as keyof typeof templateDefaults]) {
      const templateData = templateDefaults[effectiveTemplate as keyof typeof templateDefaults];
      setFormData(prev => ({
        ...prev,
        ...templateData
      }));
    }
  }, [template, routeTemplate]);

  useEffect(() => {
    if (defaultValues) {
      const sanitizeList = (arr?: string[]) => Array.isArray(arr) ? arr.filter((s) => typeof s === 'string' && s.trim()) : [];
      setFormData(prev => ({
        ...prev,
        ...defaultValues,
        highlights: sanitizeList(defaultValues.highlights as any) || prev.highlights,
        included: sanitizeList(defaultValues.included as any) || prev.included,
        excluded: sanitizeList(defaultValues.excluded as any) || prev.excluded,
        requirements: sanitizeList(defaultValues.requirements as any) || prev.requirements,
      }));
      setNewHighlight('');
      setNewIncluded('');
      setNewExcluded('');
      setNewRequirement('');
    }
  }, [defaultValues]);

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
        if (!formData.durationValue || Number(formData.durationValue) < 1) newErrors.duration = 'Duration must be at least 1';
        if (!formData.price.trim()) newErrors.price = 'Price is required';
        else if (isNaN(Number(formData.price))) newErrors.price = 'Price must be a number';
        if (!formData.maxGroupSize.trim()) newErrors.maxGroupSize = 'Group size is required';
        else if (isNaN(Number(formData.maxGroupSize))) newErrors.maxGroupSize = 'Group size must be a number';
        break;
      case 1: // Details
        // Details optional overall, but we still encourage at least one included item
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
        // Meeting point optional
        if (formData.freeCancellation && !formData.freeCancellationWindow) {
          (newErrors as any).freeCancellationWindow = 'Select a free cancellation window';
        }
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
        highlights: (formData.highlights || []).filter(h => typeof h === 'string' && h.trim()),
        included: (formData.included || []).filter(i => typeof i === 'string' && i.trim()),
        excluded: (formData.excluded || []).filter(e => typeof e === 'string' && e.trim()),
        requirements: (formData.requirements || []).filter(r => typeof r === 'string' && r.trim()),
        itinerary: formData.itinerary.filter(item => 
          item.time.trim() && item.activity.trim() && item.location.trim()
        ),
        price: Number(formData.price),
        maxGroupSize: Number(formData.maxGroupSize),
      };

      // Enforce at least one itinerary item before saving
      if (!cleanedData.itinerary || cleanedData.itinerary.length === 0) {
        Alert.alert('Itinerary required', 'Please add at least one itinerary item before saving.', [
          { text: 'Go to Itinerary', onPress: () => setCurrentStep(2) }
        ]);
        return;
      }

      // Map to API schema
      const payload: any = {
        title: cleanedData.name,
        description: cleanedData.description,
        details: cleanedData.details,
        // Send rich duration and computed durationDays (based on value + unit)
        duration: { value: formData.durationValue || 1, unit: formData.durationUnit || 'days' },
        durationDays: (function() {
          const val = formData.durationValue || 1;
          const unit = formData.durationUnit || 'days';
          if (unit === 'days') return val;
          if (unit === 'hours') return Math.max(1, Math.ceil(val / 24));
          if (unit === 'minutes') return Math.max(1, Math.ceil(val / (24 * 60)));
          return 1;
        })(),
        tags: [cleanedData.category],
        coverImage: cleanedData.coverImage || undefined,
  includes: cleanedData.included,
  excludes: cleanedData.excluded,
  highlights: cleanedData.highlights,
  requirements: cleanedData.requirements,
        images: cleanedData.images || [],
        itinerary: cleanedData.itinerary.map((it, idx) => ({ day: idx + 1, title: it.activity, description: `${it.time} @ ${it.location}` })),
        pricing: { amount: cleanedData.price, currency: cleanedData.currency || 'LKR', perPerson: !!cleanedData.perPerson },
        policies: {
          meetingPoint: cleanedData.meetingPoint || undefined,
          text: cleanedData.otherPolicies || undefined,
          freeCancellation: !!cleanedData.freeCancellation,
          freeCancellationWindow: cleanedData.freeCancellation ? (cleanedData.freeCancellationWindow || 'anytime') : undefined,
        },
        isActive: cleanedData.isActive,
        maxGroupSize: cleanedData.maxGroupSize || undefined,
      };

      const { GuideService } = await import('../services/guide');
      if (idOrSlug) {
        await GuideService.updatePackage(idOrSlug, payload);
      } else {
        await GuideService.insertPackage(payload);
      }

      Alert.alert('Success', 'Package saved successfully!', [{
        text: 'OK',
        onPress: () => {
          if (onClose) onClose(); else router.back();
        },
      }]);
    } catch (error) {
      console.error('Error saving package:', error);
      Alert.alert('Error', 'Failed to save package. Please try again.');
    }
  };

  const uploadAndSetCoverImage = async (file: { uri: string; name?: string; type?: string }) => {
    const guessFromUri = (uri: string) => {
      const lower = uri.split('?')[0].toLowerCase();
      const extMatch = lower.match(/\.([a-z0-9]+)$/);
      const ext = extMatch ? extMatch[1] : 'jpg';
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const name = `cover.${ext}`;
      return { name, type: mime };
    };
    const ensured = {
      uri: file.uri,
      ...(file.name && file.type ? { name: file.name, type: file.type } : guessFromUri(file.uri)),
    } as { uri: string; name: string; type: string };

    const form = new FormData();
    // @ts-ignore: React Native FormData file typing
    form.append('image', ensured);
    const { ApiService } = await import('../services/api');
    const res: any = await ApiService.upload('/api/guide/uploads/package-image', form);
    if (res?.success && res.url) {
      const absolute = res.url.startsWith('http')
        ? res.url
        : `${API_CONFIG.BASE_URL}/api/guide${res.url.startsWith('/') ? '' : '/'}${res.url}`;
      updateFormData('coverImage', absolute);
      return true;
    }
    throw new Error('Upload failed');
  };

  const uploadImageReturnUrl = async (file: { uri: string; name?: string; type?: string }) => {
    const guessFromUri = (uri: string) => {
      const lower = uri.split('?')[0].toLowerCase();
      const extMatch = lower.match(/\.([a-z0-9]+)$/);
      const ext = extMatch ? extMatch[1] : 'jpg';
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const name = `image.${ext}`;
      return { name, type: mime };
    };
    const ensured = {
      uri: file.uri,
      ...(file.name && file.type ? { name: file.name, type: file.type } : guessFromUri(file.uri)),
    } as { uri: string; name: string; type: string };

    const form = new FormData();
    // @ts-ignore
    form.append('image', ensured);
    const { ApiService } = await import('../services/api');
    const res: any = await ApiService.upload('/api/guide/uploads/package-image', form);
    if (res?.success && res.url) {
      const absolute = res.url.startsWith('http')
        ? res.url
        : `${API_CONFIG.BASE_URL}/api/guide${res.url.startsWith('/') ? '' : '/'}${res.url}`;
      return absolute;
    }
    throw new Error('Upload failed');
  };

  const handleAddGalleryImages = async () => {
    try {
      setGalleryUploading(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photo library to select images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.85 });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      // Optimistic preview with local URIs
      const existing = formData.images || [];
      const localUris = result.assets.map(a => a.uri).filter(Boolean) as string[];
      updateFormData('images', [...existing, ...localUris]);

      const urls: string[] = [];
      for (const asset of result.assets) {
        const url = await uploadImageReturnUrl({ uri: asset.uri, name: (asset as any).fileName, type: (asset as any).mimeType });
        urls.push(url);
      }
      // Replace optimistic locals with uploaded URLs
      updateFormData('images', [...existing, ...urls]);
    } catch (err: any) {
      console.error('Images upload failed', err);
      Alert.alert('Upload failed', err?.message || 'Unable to upload images.');
    } finally {
      setGalleryUploading(false);
    }
  };

  const handleAddFileImages = async () => {
    try {
      setGalleryUploading(true);
      const res = await DocumentPicker.getDocumentAsync({ type: 'image/*', multiple: true, copyToCacheDirectory: true });
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      // Optimistic preview with local URIs
      const existing = formData.images || [];
      const localUris = res.assets.map(a => a.uri).filter(Boolean) as string[];
      updateFormData('images', [...existing, ...localUris]);

      const urls: string[] = [];
      for (const file of res.assets) {
        const url = await uploadImageReturnUrl({ uri: file.uri, name: (file as any).name, type: (file as any).mimeType });
        urls.push(url);
      }
      // Replace optimistic locals with uploaded URLs
      updateFormData('images', [...existing, ...urls]);
    } catch (err: any) {
      console.error('Images upload failed', err);
      Alert.alert('Upload failed', err?.message || 'Unable to upload images.');
    } finally {
      setGalleryUploading(false);
    }
  };

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  const closeViewer = () => setViewerVisible(false);
  const nextImage = () => {
    const imgs = formData.images || [];
    if (!imgs.length) return;
    setViewerIndex((prev) => (prev + 1) % imgs.length);
  };
  const prevImage = () => {
    const imgs = formData.images || [];
    if (!imgs.length) return;
    setViewerIndex((prev) => (prev - 1 + imgs.length) % imgs.length);
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photo library to select an image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
  const asset = result.assets[0];
  await uploadAndSetCoverImage({ uri: asset.uri, name: (asset as any).fileName, type: (asset as any).mimeType });
    } catch (err: any) {
      console.error('Image upload failed', err);
      Alert.alert('Upload failed', err?.message || 'Unable to upload image.');
    }
  };

  const handlePickFromFiles = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'image/*', multiple: false, copyToCacheDirectory: true });
      if (res.canceled || !res.assets || res.assets.length === 0) return;
  const file = res.assets[0];
  await uploadAndSetCoverImage({ uri: file.uri, name: (file as any).name, type: (file as any).mimeType });
    } catch (err: any) {
      console.error('Image upload failed', err);
      Alert.alert('Upload failed', err?.message || 'Unable to upload image.');
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

      {/* Cover Image Section */}
      <View style={styles.coverSection}>
        <Text style={styles.label}>Cover Image</Text>
        {formData.coverImage ? (
          <Image source={{ uri: formData.coverImage }} style={styles.coverPreview} resizeMode="cover" />
        ) : (
          <View style={[styles.coverPreview, styles.coverPlaceholder]}>
            <Ionicons name="image" size={32} color={Colors.secondary400} />
          </View>
        )}
        <View style={styles.coverButtonsRow}>
          <TouchableOpacity style={styles.coverButton} onPress={handlePickFromGallery}>
            <Ionicons name="images" size={18} color={Colors.primary600} />
            <Text style={styles.coverButtonText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.coverButton} onPress={handlePickFromFiles}>
            <Ionicons name="folder" size={18} color={Colors.primary600} />
            <Text style={styles.coverButtonText}>Files</Text>
          </TouchableOpacity>
          {formData.coverImage ? (
            <TouchableOpacity style={[styles.coverButton, styles.coverRemoveButton]} onPress={() => updateFormData('coverImage', '')}>
              <Ionicons name="trash" size={18} color={Colors.error} />
              <Text style={[styles.coverButtonText, { color: Colors.error }]}>Remove</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Cover Image URL input removed as requested */}

      {/* Duration with value + unit picker */}
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.label}>Duration</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity style={styles.durationValueBox} onPress={() => setShowDurationPicker(true)}>
            <Text style={styles.durationValueText}>{formData.durationValue}</Text>
          </TouchableOpacity>
          <View style={styles.pickerContainer}>
            {(['days','hours','minutes'] as const).map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[styles.pickerOption, formData.durationUnit === unit && styles.pickerOptionSelected]}
                onPress={() => updateFormData('durationUnit', unit)}
              >
                <Text style={[styles.pickerOptionText, formData.durationUnit === unit && styles.pickerOptionTextSelected]}>
                  {unit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {showDurationPicker && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.durationWheel}>
            {Array.from({ length: 120 }, (_, i) => i + 1).map((n) => (
              <TouchableOpacity key={n} style={[styles.durationWheelItem, formData.durationValue === n && styles.durationWheelItemActive]} onPress={() => { updateFormData('durationValue', n); setShowDurationPicker(false); }}>
                <Text style={[styles.durationWheelText, formData.durationValue === n && styles.durationWheelTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        {!!errors.duration && (
          <Text style={{ color: Colors.error, marginTop: 4 }}>{String(errors.duration)}</Text>
        )}
      </View>

      {/* Price (full width with dropdown) */}
      <View style={{ marginTop: 8, marginBottom: 16 }}>
        <Text style={styles.label}>Price</Text>
        <View style={styles.priceCurrencyRow}>
          <View style={{ position: 'relative' }}>
            <TouchableOpacity style={styles.currencyButton} onPress={() => setCurrencyOpen((v) => !v)}>
              <Text style={styles.currencyButtonText}>{formData.currency}</Text>
              <Ionicons name={currencyOpen ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.secondary600} />
            </TouchableOpacity>
            {currencyOpen && (
              <View style={styles.currencyMenu}>
                {['LKR', 'USD', 'EUR', 'GBP', 'INR'].map((cur) => (
                  <TouchableOpacity
                    key={cur}
                    style={styles.currencyMenuItem}
                    onPress={() => { updateFormData('currency', cur); setCurrencyOpen(false); }}
                  >
                    <Text style={styles.currencyMenuText}>{cur}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <CustomTextInput
              label=""
              value={formData.price}
              onChangeText={(value) => updateFormData('price', value)}
              placeholder="15000"
              keyboardType="numeric"
              error={errors.price}
            />
          </View>
        </View>
      </View>

      {/* Charge type */}
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.label}>Charge type</Text>
        <View style={styles.pickerContainer}>
          {([
            { key: false, label: 'Per group' },
            { key: true, label: 'Per person' },
          ] as const).map((opt) => (
            <TouchableOpacity
              key={String(opt.key)}
              style={[styles.pickerOption, formData.perPerson === opt.key && styles.pickerOptionSelected]}
              onPress={() => updateFormData('perPerson', opt.key)}
            >
              <Text style={[styles.pickerOptionText, formData.perPerson === opt.key && styles.pickerOptionTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
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

      {/* Gallery Images */}
      <View style={{ marginTop: 8, marginBottom: 16 }}>
        <Text style={styles.label}>Gallery Images</Text>
        <View style={styles.coverButtonsRow}>
          <TouchableOpacity style={styles.coverButton} onPress={handleAddGalleryImages}>
            <Ionicons name="images" size={18} color={Colors.primary600} />
            <Text style={styles.coverButtonText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.coverButton} onPress={handleAddFileImages}>
            <Ionicons name="folder" size={18} color={Colors.primary600} />
            <Text style={styles.coverButtonText}>Files</Text>
          </TouchableOpacity>
        </View>
        {galleryUploading && (
          <View style={styles.uploadingRow}>
            <ActivityIndicator size="small" color={Colors.primary600} />
            <Text style={styles.uploadingText}>Uploading images…</Text>
          </View>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {(formData.images || []).length > 0 ? (
            (formData.images || []).map((img, idx) => (
              <TouchableOpacity key={`${img}-${idx}`} style={styles.galleryItem} onPress={() => openViewer(idx)} activeOpacity={0.8}>
                <Image source={{ uri: img }} style={styles.galleryImage} />
                <TouchableOpacity style={styles.removeGalleryButton} onPress={() => updateFormData('images', (formData.images || []).filter((_, i) => i !== idx))}>
                  <Ionicons name="close" size={14} color={Colors.white} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.galleryPlaceholder}>
              <Ionicons name="images-outline" size={24} color={Colors.secondary400} />
              <Text style={styles.galleryPlaceholderText}>No images yet</Text>
            </View>
          )}
        </ScrollView>

        {/* Full-screen Image Viewer */}
        <Modal visible={viewerVisible} animationType="fade" transparent onRequestClose={closeViewer}>
          <View style={styles.viewerContainer}>
            <TouchableOpacity style={styles.viewerCloseButton} onPress={closeViewer}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.viewerCenter}>
              {Boolean((formData.images || []).length) ? (
                <Image
                  source={{ uri: (formData.images || [])[viewerIndex] }}
                  style={styles.viewerImage}
                  resizeMode="contain"
                />
              ) : null}
            </View>
            {(formData.images || []).length > 1 && (
              <>
                <TouchableOpacity style={[styles.viewerNavButton, styles.viewerNavLeft]} onPress={prevImage}>
                  <Ionicons name="chevron-back" size={28} color={Colors.white} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.viewerNavButton, styles.viewerNavRight]} onPress={nextImage}>
                  <Ionicons name="chevron-forward" size={28} color={Colors.white} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </Modal>
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
      <CustomTextInput
        label="Additional Details (optional)"
        value={formData.details || ''}
        onChangeText={(value) => updateFormData('details', value)}
        placeholder="Any extra details you'd like travelers to know"
        multiline
        numberOfLines={4}
      />

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

      {/* Free Cancellation */}
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Free cancellation</Text>
        <Switch
          value={!!formData.freeCancellation}
          onValueChange={(value) => updateFormData('freeCancellation', value)}
          trackColor={{ false: Colors.secondary200, true: Colors.primary100 }}
          thumbColor={formData.freeCancellation ? Colors.primary600 : Colors.secondary400}
        />
      </View>
      {formData.freeCancellation && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.label}>Free cancellation window</Text>
          <View style={styles.pickerContainer}>
            {([
              { key: 'anytime', label: 'Anytime' },
              { key: '1_day_before', label: '1 day before' },
              { key: '7_days_before', label: '1 week before' },
              { key: '14_days_before', label: '2 weeks before' },
            ] as const).map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.pickerOption, formData.freeCancellationWindow === opt.key && styles.pickerOptionSelected]}
                onPress={() => updateFormData('freeCancellationWindow', opt.key)}
              >
                <Text style={[styles.pickerOptionText, formData.freeCancellationWindow === opt.key && styles.pickerOptionTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Other policies text */}
      <CustomTextInput
        label="Other policies (optional)"
        value={formData.otherPolicies || ''}
        onChangeText={(value) => updateFormData('otherPolicies', value)}
        placeholder="Any additional policies or terms"
        multiline
        numberOfLines={3}
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
          style={[
            styles.navButton,
            styles.secondaryButton,
            currentStep > 0 && styles.secondaryButtonActive,
          ]}
          onPress={handlePrevious}
          disabled={currentStep === 0}
          activeOpacity={1}
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
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel={currentStep === steps.length - 1 ? 'Save Package' : 'Next'}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  secondaryButton: {
    backgroundColor: Colors.secondary100,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },
  secondaryButtonActive: {
    // keep it visually highlighted when enabled
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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

  uploadButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.primary100,
    borderRadius: 8,
    borderWidth: 1,
  borderColor: Colors.primary100,
  },

  uploadButtonText: {
    marginLeft: 6,
    color: Colors.primary600,
    fontWeight: '600',
  },

  // Price + Currency inline
  priceCurrencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 15,
    minWidth: 80,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    backgroundColor: Colors.secondary100,
    borderRadius: 8,
    marginTop: -15,
  },
  currencyButtonText: {
    fontSize: 14,
    color: Colors.secondary700,
    fontWeight: '600',
    marginRight: 6,
  },
  currencyMenu: {
    position: 'absolute',
    top: 48,
    left: 0,
    zIndex: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  currencyMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  currencyMenuText: {
    fontSize: 14,
    color: Colors.secondary700,
  },

  // Duration styles
  durationValueBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    backgroundColor: Colors.secondary100,
    minWidth: 64,
    alignItems: 'center',
  },
  durationValueText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary700,
  },
  durationWheel: {
    marginTop: 8,
  },
  durationWheelItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    backgroundColor: Colors.secondary50,
  },
  durationWheelItemActive: {
    backgroundColor: Colors.primary100,
    borderColor: Colors.primary600,
  },
  durationWheelText: {
    fontSize: 16,
    color: Colors.secondary700,
  },
  durationWheelTextActive: {
    color: Colors.primary700,
    fontWeight: '700',
  },

  // Cover image section
  coverSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  coverPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: Colors.secondary100,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    marginBottom: 12,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  coverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.secondary50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },
  coverRemoveButton: {
    backgroundColor: Colors.secondary50,
    borderColor: Colors.secondary200,
  },
  coverButtonText: {
    marginLeft: 6,
    color: Colors.primary600,
    fontWeight: '600',
  },

  // Gallery images styles
  galleryItem: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.secondary200,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  removeGalleryButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Uploading indicator
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  uploadingText: {
    fontSize: 12,
    color: Colors.secondary600,
  },

  // Gallery placeholder
  galleryPlaceholder: {
    width: 160,
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.secondary200,
    backgroundColor: Colors.secondary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryPlaceholderText: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.secondary500,
  },

  // Full-screen viewer
  viewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerCloseButton: {
    position: 'absolute',
    top: 48,
    right: 20,
    padding: 8,
  },
  viewerCenter: {
    width: '100%',
    height: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: {
    width: '90%',
    height: '100%',
  },
  viewerNavButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    padding: 10,
  },
  viewerNavLeft: {
    left: 10,
  },
  viewerNavRight: {
    right: 10,
  },
});
