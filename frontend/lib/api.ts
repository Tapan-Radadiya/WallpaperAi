import axios from 'axios';

const api = axios.create({
    baseURL: 'http://192.168.1.31:3002',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
