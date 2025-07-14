import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Modalize } from 'react-native-modalize';
import { Colors } from '../../constants/Colors';

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
      {/* Bottom Sheet */}
      <Modalize ref={modalRef} adjustToContentHeight>
        <View style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>Create a New Plan</Text>
          <Text>Insert your custom options or UI here.</Text>
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
    padding: 20,
    alignItems: 'center',
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
});
