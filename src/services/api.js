import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = Platform.OS === 'web'
    ? 'https://localhost:7293/api'
    : 'https://unstartling-apryl-nontarnishing.ngrok-free.dev/api';

export const apiCall = async (endpoint, options = {}) => {
    const token = await AsyncStorage.getItem('token');

    console.log('API_URL:', API_URL);
    console.log('Platform:', Platform.OS);
    console.log('Endpoint:', endpoint);

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.status === 204 || !responseText) {
        return null;
    }

    return JSON.parse(responseText);
};
export const authAPI = {
    login: (email, password) =>
        apiCall('/Auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    register: (username, email, password) =>
        apiCall('/Auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password }),
        }),
};

export const moviesAPI = {
    getMyMovies: () => apiCall('/Movies/my-movies'),

    searchMovies: (query) =>
        apiCall(`/Tmdb/search?query=${encodeURIComponent(query)}`),

    addMovie: (movieData) =>
        apiCall('/Movies', {
            method: 'POST',
            body: JSON.stringify(movieData),
        }),

    deleteMovie: (id) =>
        apiCall(`/Movies/${id}`, {
            method: 'DELETE',
        }),
};

export const watchLaterAPI = {
    getAll: () => apiCall('/WatchLater'),

    add: (movieData) =>
        apiCall('/WatchLater', {
            method: 'POST',
            body: JSON.stringify(movieData),
        }),

    delete: (id) =>
        apiCall(`/WatchLater/${id}`, {
            method: 'DELETE',
        }),
};

export const userAPI = {
    getProfile: () => apiCall('/Users/profile'),
    setFavoriteMovie: (tmdbId) =>
        apiCall(`/Users/favorite-movie/${tmdbId}`, {
            method: 'PUT',
        }),
};

export const tmdbAPI = {
    getPopular: (page = 1) => apiCall(`/Tmdb/popular?page=${page}`),
    getGenres: () => apiCall('/Tmdb/genres'),  // 🔥 EKLE
    getMovieDetails: (tmdbId) => apiCall(`/Tmdb/${tmdbId}`),
    getMovieBackdrops: (tmdbId) => apiCall(`/Tmdb/${tmdbId}/backdrops`),
    searchMovies: (query) => apiCall(`/Tmdb/search?query=${encodeURIComponent(query)}`),
    discover: (category = 'popular', page = 1) => apiCall(`/Tmdb/discover?category=${category}&page=${page}`),
};