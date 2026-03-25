import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { userAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [favoriteTmdbId, setFavoriteTmdbId] = useState(null);

    // Uygulama açıldığında token kontrolü
    useEffect(() => {
        loadToken();
    }, []);

    const loadToken = async () => {
        try {
            const savedToken = await AsyncStorage.getItem('token');
            const savedUser = await AsyncStorage.getItem('user');

            if (savedToken && savedUser) {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));

                // ✅ favori filmi de yükle
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
        } catch (error) {
            console.error('Logout hatası:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, favoriteTmdbId, setFavoriteTmdbId }}>
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