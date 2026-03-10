import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { moviesAPI, tmdbAPI, userAPI, watchLaterAPI } from '../services/api';

function Toast({ message, type }) {
    if (!message) return null;
    return (
        <View style={[styles.toast, type === 'error' ? styles.toastError : styles.toastSuccess]}>
            <Text style={styles.toastText}>
                {type === 'error' ? '❌ ' : '✅ '}{message}
            </Text>
        </View>
    );
}

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({ movieCount: 0, watchLaterCount: 0 });
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '' });

    // Favori film
    const [favoriteTmdbId, setFavoriteTmdbId] = useState(null);
    const [backdrops, setBackdrops] = useState([]);
    const [currentBackdropIndex, setCurrentBackdropIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Film arama
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showSearch, setShowSearch] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: '' }), 3000);
    };

    const loadStats = async () => {
        setLoading(true);
        try {
            const [movies, watchLater, profile] = await Promise.all([
                moviesAPI.getMyMovies(),
                watchLaterAPI.getAll(),
                userAPI.getProfile(),
            ]);
            setStats({
                movieCount: movies.length,
                watchLaterCount: watchLater.length,
            });
            if (profile.favoriteTmdbId) {
                setFavoriteTmdbId(profile.favoriteTmdbId);
                loadBackdrops(profile.favoriteTmdbId);
            }
        } catch (error) {
            console.error('Stats yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBackdrops = async (tmdbId) => {
        try {
            const data = await tmdbAPI.getMovieBackdrops(tmdbId);
            console.log('Backdrops:', data);
            if (data && data.length > 0) {
                setBackdrops(data);
            }
        } catch (error) {
            console.error('Backdrop yüklenemedi:', error);
        }
    };

    // 10 sn'de bir backdrop değiştir
    useEffect(() => {
        if (backdrops.length === 0) return;

        const interval = setInterval(() => {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]).start();

            setTimeout(() => {
                setCurrentBackdropIndex((prev) =>
                    prev === backdrops.length - 1 ? 0 : prev + 1
                );
            }, 500);
        }, 10000);

        return () => clearInterval(interval);
    }, [backdrops]);

    useFocusEffect(
        useCallback(() => {
            loadStats();
        }, [])
    );

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const results = await moviesAPI.searchMovies(searchQuery);
            setSearchResults(results.results || []);
        } catch (error) {
            showToast('Arama hatası!', 'error');
        } finally {
            setSearching(false);
        }
    };

    const handleSelectFavorite = async (movie) => {
        try {
            await userAPI.setFavoriteMovie(movie.id);
            setFavoriteTmdbId(movie.id);
            setShowSearch(false);
            setSearchQuery('');
            setSearchResults([]);
            loadBackdrops(movie.id);
            showToast(`${movie.title} favori film seçildi!`, 'success');
        } catch (error) {
            showToast('Favori film seçilemedi!', 'error');
        }
    };

    return (
        <ScrollView style={styles.container}>
            {/* Backdrop */}
            {backdrops.length > 0 && (
                <Animated.View style={[styles.backdropContainer, { opacity: fadeAnim }]}>
                    <Image
                        source={{
                            uri: `https://image.tmdb.org/t/p/w780${backdrops[currentBackdropIndex]}`
                        }}
                        style={styles.backdrop}
                    />
                    <View style={styles.backdropOverlay} />
                </Animated.View>
            )}

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>👤 Profil</Text>
            </View>

            <Toast message={toast.message} type={toast.type} />

            {/* Avatar */}
            <View style={styles.avatarSection}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user?.username?.charAt(0).toUpperCase() || '?'}
                    </Text>
                </View>
                <Text style={styles.username}>{user?.username}</Text>
                <Text style={styles.email}>{user?.email}</Text>
            </View>

            {/* İstatistikler */}
            {loading ? (
                <ActivityIndicator size="large" color="#667eea" style={styles.loader} />
            ) : (
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>🎬</Text>
                        <Text style={styles.statNumber}>{stats.movieCount}</Text>
                        <Text style={styles.statLabel}>Kütüphanedeki Film</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>⏰</Text>
                        <Text style={styles.statNumber}>{stats.watchLaterCount}</Text>
                        <Text style={styles.statLabel}>Daha Sonra İzle</Text>
                    </View>
                </View>
            )}

            {/* Favori Film Bölümü */}
            <View style={styles.favoriteSection}>
                <View style={styles.favoriteTitleRow}>
                    <Text style={styles.sectionTitle}>🎥 Favori Film</Text>
                    <TouchableOpacity
                        style={styles.changeBtn}
                        onPress={() => setShowSearch(!showSearch)}
                    >
                        <Text style={styles.changeBtnText}>
                            {showSearch ? '✕ Kapat' : '✏️ Değiştir'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {!favoriteTmdbId && !showSearch && (
                    <TouchableOpacity
                        style={styles.selectBtn}
                        onPress={() => setShowSearch(true)}
                    >
                        <Text style={styles.selectBtnText}>🎬 Favori Film Seç</Text>
                    </TouchableOpacity>
                )}

                {showSearch && (
                    <View style={styles.searchBox}>
                        <View style={styles.searchRow}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Film ara..."
                                placeholderTextColor="#888"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={handleSearch}
                                autoComplete="off"
                            />
                            <TouchableOpacity
                                style={styles.searchBtn}
                                onPress={handleSearch}
                            >
                                <Text style={styles.searchBtnText}>🔍</Text>
                            </TouchableOpacity>
                        </View>

                        {searching && (
                            <ActivityIndicator color="#667eea" style={{ marginTop: 10 }} />
                        )}

                        {searchResults.map((movie) => (
                            <TouchableOpacity
                                key={movie.id}
                                style={styles.searchResult}
                                onPress={() => handleSelectFavorite(movie)}
                            >
                                <Image
                                    source={{
                                        uri: movie.poster_path
                                            ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
                                            : null
                                    }}
                                    style={styles.resultPoster}
                                />
                                <View style={styles.resultInfo}>
                                    <Text style={styles.resultTitle} numberOfLines={1}>
                                        {movie.title}
                                    </Text>
                                    <Text style={styles.resultYear}>
                                        {movie.release_date?.split('-')[0] || 'N/A'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Hesap Bilgileri */}
            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>📋 Hesap Bilgileri</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Kullanıcı Adı</Text>
                    <Text style={styles.infoValue}>{user?.username}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{user?.email}</Text>
                </View>
            </View>

            {/* Çıkış */}
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                <Text style={styles.logoutText}>🚪 Çıkış Yap</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(10,10,10,0.85)',
    },
    backdropContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
    },
    backdrop: {
        width: '100%',
        height: 300,
    },
    backdropOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    header: {
        padding: 20,
        paddingTop: 50,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#667eea',
    },
    toast: {
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 20,
        marginBottom: 10,
    },
    toastError: {
        backgroundColor: 'rgba(220, 53, 69, 0.95)',
    },
    toastSuccess: {
        backgroundColor: 'rgba(17, 153, 142, 0.95)',
    },
    toastText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    avatarSection: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 30,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 3,
        borderColor: 'rgba(102, 126, 234, 0.5)',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fff',
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    email: {
        fontSize: 16,
        color: '#888',
    },
    loader: {
        marginTop: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 20,
        gap: 15,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    statIcon: {
        fontSize: 30,
        marginBottom: 10,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#667eea',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
    },
    favoriteSection: {
        margin: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    favoriteTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    changeBtn: {
        backgroundColor: 'rgba(102, 126, 234, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.5)',
        borderRadius: 8,
        padding: 8,
        paddingHorizontal: 12,
    },
    changeBtnText: {
        color: '#667eea',
        fontSize: 13,
        fontWeight: '600',
    },
    selectBtn: {
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.4)',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
    },
    selectBtnText: {
        color: '#667eea',
        fontSize: 16,
        fontWeight: '600',
    },
    searchBox: {
        marginTop: 10,
    },
    searchRow: {
        flexDirection: 'row',
        gap: 10,
    },
    searchInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: 12,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        outlineStyle: 'none',
    },
    searchBtn: {
        backgroundColor: '#667eea',
        borderRadius: 10,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
        width: 50,
    },
    searchBtnText: {
        fontSize: 20,
    },
    searchResult: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        marginTop: 5,
    },
    resultPoster: {
        width: 40,
        height: 60,
        borderRadius: 5,
        backgroundColor: '#333',
        marginRight: 10,
    },
    resultInfo: {
        flex: 1,
    },
    resultTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    resultYear: {
        color: '#888',
        fontSize: 13,
        marginTop: 3,
    },
    infoCard: {
        margin: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    infoLabel: {
        color: '#888',
        fontSize: 15,
    },
    infoValue: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    logoutBtn: {
        margin: 20,
        backgroundColor: 'rgba(220, 53, 69, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(220, 53, 69, 0.5)',
        borderRadius: 15,
        padding: 18,
        alignItems: 'center',
        marginBottom: 40,
    },
    logoutText: {
        color: '#dc3545',
        fontSize: 18,
        fontWeight: 'bold',
    },
});