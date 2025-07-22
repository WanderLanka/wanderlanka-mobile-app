import { CustomButton, ThemedText, ThemedView } from '../../components';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/Colors';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function DashboardScreen() {
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('../auth/login');
      return;
    }

    // Role-based navigation redirect
    if (user && user.role) {
      console.log('Dashboard: Redirecting user with role:', user.role);
      
      if (user.role === 'guide') {
        // Redirect guides to their interface
        console.log('Dashboard: Redirecting to guide interface');
        router.replace('../tourGuide/home');
      } else if (user.role === 'traveller' || user.role === 'tourist') {
        // Redirect travellers/tourists to their interface  
        console.log('Dashboard: Redirecting to traveller interface');
        router.replace('../(travelerTabs)/home');
      } else {
        console.log('Dashboard: Unknown role, staying on dashboard:', user.role);
      }
    }
  }, [isAuthenticated, user]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('../auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText variant="title" style={styles.welcome}>
          Welcome, {user.username}!
        </ThemedText>
        <Text style={styles.role}>
          Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </Text>
      </View>

      <View style={styles.content}>
        {user.role === 'traveller' ? (
          <ThemedText variant="subtitle" style={styles.description}>
            Start planning your Sri Lankan adventure!
          </ThemedText>
        ) : (
          <ThemedText variant="subtitle" style={styles.description}>
            Share your local knowledge and help travelers explore Sri Lanka!
          </ThemedText>
        )}
      </View>

      <View style={styles.actions}>
        <CustomButton
          title="Logout"
          variant="outline"
          onPress={handleLogout}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: Colors.secondary50,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  welcome: {
    fontSize: 24,
    color: Colors.primary700,
    marginBottom: 8,
    textAlign: 'center',
  },
  role: {
    fontSize: 16,
    color: Colors.secondary500,
    fontFamily: 'Inter',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 18,
    color: Colors.secondary600,
    textAlign: 'center',
    lineHeight: 26,
  },
  actions: {
    marginBottom: 40,
  },
});
