import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { tmdbAPI, userAPI } from '../services/api';

const BackdropContext = createContext();

export const BackdropProvider = ({ children }) => {
    const [backdrops, setBackdrops] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const loadBackdrops = async () => {
        try {
            const profile = await userAPI.getProfile();
            if (profile.favoriteTmdbId) {
                const data = await tmdbAPI.getMovieBackdrops(profile.favoriteTmdbId);
                if (data && data.length > 0) {
                    setBackdrops(data);
                }
            }
        } catch (error) {
            console.error('Backdrop yüklenemedi:', error);
        }
    };

    const refreshBackdrops = (tmdbId) => {
        tmdbAPI.getMovieBackdrops(tmdbId).then((data) => {
            if (data && data.length > 0) {
                setBackdrops(data);
                setCurrentIndex(0);
            }
        });
    };

    useEffect(() => {
        loadBackdrops();
    }, []);

    useEffect(() => {
        if (backdrops.length === 0) return;

        const interval = setInterval(() => {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]).start();

            setTimeout(() => {
                setCurrentIndex((prev) =>
                    prev === backdrops.length - 1 ? 0 : prev + 1
                );
            }, 800);
        }, 10000);

        return () => clearInterval(interval);
    }, [backdrops]);

    return (
        <BackdropContext.Provider value={{ backdrops, currentIndex, fadeAnim, refreshBackdrops }}>
            {children}
        </BackdropContext.Provider>
    );
};

export const useBackdrop = () => useContext(BackdropContext);