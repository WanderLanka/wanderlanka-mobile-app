/**
 * Network Status Component
 * Shows current network information and allows manual refresh
 * Only shown in development mode
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { NetworkMonitor } from '../utils/networkMonitor';
import { API_CONFIG } from '../services/config';

interface NetworkStatusProps {
  style?: any;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ style }) => {
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [serverUrl, setServerUrl] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (__DEV__) {
      loadNetworkInfo();
    }
  }, []);

  const loadNetworkInfo = async () => {
    try {
      const info = await NetworkMonitor.getCurrentNetwork();
      setNetworkInfo(info);
      setServerUrl(API_CONFIG.BASE_URL);
    } catch (error) {
      console.error('Failed to load network info:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await NetworkMonitor.forceNetworkCheck();
      await loadNetworkInfo();
      
      Alert.alert(
        'Network Refreshed',
        `Server URL updated to: ${API_CONFIG.BASE_URL}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Network refresh failed:', error);
      Alert.alert('Error', 'Failed to refresh network connection');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShowDetails = () => {
    const details = `
Network: ${networkInfo?.ssid || 'Unknown'}
Type: ${networkInfo?.type || 'Unknown'}
Connected: ${networkInfo?.connected ? 'Yes' : 'No'}
Server: ${serverUrl}
    `.trim();

    Alert.alert('Network Details', details, [{ text: 'OK' }]);
  };

  // Only show in development mode
  if (!__DEV__ || !networkInfo) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.info}>
        <Ionicons 
          name={networkInfo.connected ? "wifi" : "wifi-outline"} 
          size={16} 
          color={networkInfo.connected ? Colors.success : Colors.error} 
        />
        <Text style={styles.networkText}>
          {networkInfo.ssid || 'Unknown Network'}
        </Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleShowDetails}
        >
          <Ionicons name="information-circle-outline" size={16} color={Colors.secondary500} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          <Ionicons 
            name="refresh-outline" 
            size={16} 
            color={isRefreshing ? Colors.secondary400 : Colors.primary600} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.secondary100,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 8,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  networkText: {
    marginLeft: 8,
    fontSize: 12,
    color: Colors.secondary600,
    fontFamily: 'Inter',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 8,
    padding: 4,
  },
});