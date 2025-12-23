import axios from 'axios';

// LOCALHOST PORTS
const USER_URL = 'http://localhost:8001';
const TEAM_URL = 'http://localhost:8002';
const TASK_URL = 'http://localhost:8003';

const createService = (baseURL) => {
    const instance = axios.create({
        baseURL,
        headers: { 'Content-Type': 'application/json' },
    });

    instance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            if (token) config.headers.Authorization = `Bearer ${token}`;
            return config;
        },
        (error) => Promise.reject(error)
    );

    return instance;
};

export const userClient = createService(USER_URL);
export const teamClient = createService(TEAM_URL);
export const taskClient = createService(TASK_URL);