import NetInfo from '@react-native-community/netinfo';

async function getCurrentNetwork() {
  const state = await NetInfo.fetch();
  return {
    connected: state.isConnected === true,
    type: state.type,
    ssid: state.type === 'wifi' ? state.details?.ssid : undefined,
  };
}

export const NetworkMonitor = {
  getCurrentNetwork,
  forceNetworkCheck: getCurrentNetwork,
};
