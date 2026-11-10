import axios from 'axios';

// attach authentication token to all requests sent to backend

axios.interceptors.request.use(

  (config) => {

    const token = localStorage.getItem('token');

    if (token) {

      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      config.headers.token = token;
    }

    return config;

  },

  (error) => Promise.reject(error)

);

// handles 401 Unauthorized error (expired/invalid token)

axios.interceptors.response.use(

  (response) => response,

  (error) => {

    if (error.response && error.response.status === 401) {

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (window.location.pathname !== '/' && window.location.pathname !== '/forgot-password') {
        window.location.href = '/';
      }

    }

    return Promise.reject(error);
  }
);

export default axios;

