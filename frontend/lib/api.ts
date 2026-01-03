import axios from 'axios';

const isServer = typeof window === 'undefined';
const baseURL = isServer ? 'http://192.168.1.31:3002/api/v1' : '/api/v1';

const api = axios.create({
    baseURL,
    timeout: 10000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Ensure withCredentials is always true for every request
api.interceptors.request.use(config => {
    config.withCredentials = true;
    return config;
});

export default api;
