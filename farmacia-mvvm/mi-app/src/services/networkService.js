import NetInfo from '@react-native-community/netinfo';

export const networkService = {
  async isConnected() {
    const state = await NetInfo.fetch();
    return Boolean(state.isConnected);
  },

  subscribe(callback) {
    return NetInfo.addEventListener((state) => callback(Boolean(state.isConnected), state));
  },
};

export default networkService;
