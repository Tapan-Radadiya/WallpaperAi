import axios from 'axios';

const isServer = typeof window === 'undefined';
const baseURL = isServer ? process.env.NEXT_PUBLIC_API_URL : '/api/v1';

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
