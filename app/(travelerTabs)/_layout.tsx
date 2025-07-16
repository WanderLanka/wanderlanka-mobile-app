  import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  View
} from 'react-native';
import { Modalize } from 'react-native-modalize';
import { CustomTextInput, ThemedText } from '../../components';
import { Colors } from '../../constants/Colors';

  // If you get module not found errors, check that these files exist at app/ui/CustomTextInput.tsx and app/ui/ThemedText.tsx
  // If not, update the import paths to the correct location or create the missing files.

  export default function TravelerTabsLayout() {
    const modalRef = useRef<Modalize>(null);

    const openBottomSheet = () => {
      modalRef.current?.open();
    };

    type IoniconName =
      | 'home-outline'
      | 'briefcase-outline'
      | 'newspaper-outline'
      | 'person-circle-outline';

    const tabs: { name: string; title: string; icon: IoniconName }[] = [
      { name: 'home', title: 'Home', icon: 'home-outline' },
      { name: 'bookNow', title: 'Book Now', icon: 'briefcase-outline' },
      { name: 'community', title: 'Community', icon: 'newspaper-outline' },
      { name: 'profile', title: 'Profile', icon: 'person-circle-outline' },
    ];

    return (
      <>
        <View style={{ flex: 1 }}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: Colors.primary800,
              tabBarInactiveTintColor: Colors.secondary400,
            }}
          >
            <Tabs.Screen
              name="home"
              options={{
                title: 'Home',
                tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                  <Ionicons name="home-outline" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="bookNow"
              options={{
                title: 'Book Now',
                tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                  <Ionicons name="briefcase-outline" size={size} color={color} />
                ),
              }}
            />
            {/* Custom + Button in the middle */}
          <Tabs.Screen
              name="plan"
              options={{
                tabBarButton: () => (
                  <Pressable onPress={openBottomSheet} style={styles.fabButton}>
                    <Ionicons name="add" size={32} color={Colors.primary300} />
                  </Pressable>
                ),
                listeners: {
                  tabPress: (e: { preventDefault: () => void; }) => {
                    e.preventDefault();
                  },
                },
              }}
            />
            <Tabs.Screen
              name="community"
              options={{
                title: 'Community',
                tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                  <Ionicons name="newspaper-outline" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: 'Profile',
                tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                  <Ionicons name="person-circle-outline" size={size} color={color} />
                ),
              }}
            />
          </Tabs>
        </View>
        <Modalize ref={modalRef} adjustToContentHeight>
          <View style={styles.bottomSheetContent}>
            <View style={styles.sheetTitle}>
              <ThemedText variant="title" style={styles.bottomSheetTitle}>Your Dream Trip Starts Here</ThemedText>
            </View>
            <View style={styles.sheetBody}>
              <CustomTextInput
                label="Where are you going?"
                placeholder="Enter destination"
                leftIcon="location-outline"
                containerStyle={styles.inputWrapper}
              />
              <View style={styles.dateRow}>
                <CustomTextInput
                  label="Start Date"
                  placeholder="YYYY-MM-DD"
                  leftIcon="calendar-outline"
                  containerStyle={{ flex: 1, marginRight: 8, marginBottom: 0 }}
                />
                <CustomTextInput
                  label="End Date"
                  placeholder="YYYY-MM-DD"
                  leftIcon="calendar-outline"
                  containerStyle={{ flex: 1, marginLeft: 8, marginBottom: 0 }}
                />
              </View>
              
            </View>
          </View>
        </Modalize>
      </>
    );
  }

  const styles = StyleSheet.create({
    fabButton: {
      position: 'absolute',
      top: -20,
      alignSelf: 'center',
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: Colors.primary800,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: Colors.secondary700,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 8,
    },
    bottomSheetContent: {
      alignItems: 'stretch',
      minHeight: 800,
      alignSelf: 'center',
      marginBottom: 24,
      width: '100%',
      backgroundColor: Colors.secondary50,
      overflow: 'hidden',
      position: 'relative',
    },
    sheetTitle: {
      width: '100%',
      backgroundColor: Colors.primary800,
      paddingVertical: 28,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    sheetBody: {
      paddingHorizontal: 24,
      paddingVertical: 28,
      backgroundColor: Colors.secondary50,
      borderBottomLeftRadius: 18,
      borderBottomRightRadius: 18,
      alignItems: 'stretch',
      gap: 0,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginBottom: 16,
      gap: 12,
    },
    bottomSheetTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: Colors.white,
      marginBottom: 0,
      alignSelf: 'center',
    },
    inputWrapper: {
    marginBottom: 16,
    width: '100%',
  },
  
  });
