import AsyncStorage from '@react-native-async-storage/async-storage';

const timestampKey = (key) => `${key}_timestamp`;

export const cacheService = {
  async set(key, value, { timestamp = false } = {}) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    if (timestamp) {
      await AsyncStorage.setItem(timestampKey(key), Date.now().toString());
    }
  },

  async get(key, fallback = null) {
    const cached = await AsyncStorage.getItem(key);
    return cached ? JSON.parse(cached) : fallback;
  },

  async getTimestamp(key) {
    const value = await AsyncStorage.getItem(timestampKey(key));
    return value ? new Date(parseInt(value, 10)) : null;
  },

  async remove(keys = []) {
    await AsyncStorage.multiRemove(keys);
  },
};

export default cacheService;
