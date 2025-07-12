import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function TravelerTabsLayout() {
  type IoniconName =
    | 'home-outline'
    | 'briefcase-outline'
    | 'list-outline'
    | 'newspaper-outline'
    | 'person-circle-outline';

  const tabs: { name: string; title: string; icon: IoniconName }[] = [
    { name: 'home', title: 'Home', icon: 'home-outline' },
    { name: 'bookNow', title: 'Book Now', icon: 'briefcase-outline' },
    { name: 'myActivity', title: 'Activities', icon: 'list-outline' },
    { name: 'community', title: 'Community', icon: 'newspaper-outline' },
    { name: 'profile', title: 'Profile', icon: 'person-circle-outline' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary800,
          tabBarInactiveTintColor: Colors.secondary400,
          animation: 'fade',
        }}
      >
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <View>
                  <Ionicons name={tab.icon} size={size} color={color} />
                </View>
              ),
            }}
          />
        ))}
      </Tabs>
    </View>
  );
}