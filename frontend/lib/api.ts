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

// Image validation helper
export const validateImage = async (file: File): Promise<boolean> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
        await api.post('/image/process-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return true;
    } catch (error) {
        console.error('Image validation failed:', error);
        return false;
    }
};

export default api;
