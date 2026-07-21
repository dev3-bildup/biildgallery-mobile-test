import * as Network from 'expo-network';

export interface NetworkMonitor {
  isOnline(): Promise<boolean>;
}

export class ExpoNetworkMonitor implements NetworkMonitor {
  async isOnline(): Promise<boolean> {
    try {
      const state = await Network.getNetworkStateAsync();
      return Boolean(state.isConnected && state.isInternetReachable !== false);
    } catch {
      // If the check itself fails, assume offline and let the cache fallback handle it.
      return false;
    }
  }
}
