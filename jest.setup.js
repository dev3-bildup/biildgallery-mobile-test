/* eslint-disable no-undef */
jest.mock('expo-sqlite', () => require('./__tests__/mocks/expoSqliteMock'));
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
  NetworkStateType: {},
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
