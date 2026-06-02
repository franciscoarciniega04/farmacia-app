import apiClient from '../services/apiClient';

export const authRepository = {
  login({ username, password }) {
    return apiClient.post('/login/', { username, password });
  },
};

export default authRepository;
