import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { tmdbAPI, userAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [favoriteTmdbId, setFavoriteTmdbId] = useState(null);

    // Global backdrop state
    const [backdrops, setBackdrops] = useState([]);
    const [currentBackdropIndex, setCurrentBackdropIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        loadToken();
    }, []);

    useEffect(() => {
        if (favoriteTmdbId) {
            tmdbAPI.getMovieBackdrops(favoriteTmdbId).then(data => {
                if (data && data.length > 0) {
                    setBackdrops(data);
                    setCurrentBackdropIndex(0);
                }
            }).catch(console.error);
        }
    }, [favoriteTmdbId]);

    useEffect(() => {
        if (backdrops.length === 0) return;
        const interval = setInterval(() => {
            Animated.timing(fadeAnim, {
                toValue: 0, duration: 500, useNativeDriver: true,
            }).start(() => {
                setCurrentBackdropIndex(prev =>
                    prev === backdrops.length - 1 ? 0 : prev + 1
                );
                Animated.timing(fadeAnim, {
                    toValue: 1, duration: 500, useNativeDriver: true,
                }).start();
            });
        }, 15000);
        return () => clearInterval(interval);
    }, [backdrops]);

    const loadToken = async () => {
        try {
            const savedToken = await AsyncStorage.getItem('token');
            const savedUser = await AsyncStorage.getItem('user');
            if (savedToken && savedUser) {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
                try {
                    const profile = await userAPI.getProfile();
                    if (profile.favoriteTmdbId) {
                        setFavoriteTmdbId(profile.favoriteTmdbId);
                    }
                } catch (e) {
                    console.warn('Profil yüklenemedi:', e);
                }
            }
        } catch (error) {
            console.error('Token yükleme hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (token, userData) => {
        try {
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            setToken(token);
            setUser(userData);
        } catch (error) {
            console.error('Login kaydetme hatası:', error);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setToken(null);
            setUser(null);
            setFavoriteTmdbId(null);
            setBackdrops([]);
        } catch (error) {
            console.error('Logout hatası:', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user, token, loading, login, logout,
            favoriteTmdbId, setFavoriteTmdbId,
            backdrops, currentBackdropIndex, fadeAnim
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};