import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { moviesAPI, tmdbAPI, watchLaterAPI } from '../services/api';

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

export default function HomeScreen({ navigation }) {
    const { user, favoriteTmdbId } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [popularMovies, setPopularMovies] = useState([]);
    const [myMovieIds, setMyMovieIds] = useState([]);
    const [popularPage, setPopularPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const debounceRef = useRef(null);
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [showGenreModal, setShowGenreModal] = useState(false);
    const [backdrops, setBackdrops] = useState([]);
    const [currentBackdropIndex, setCurrentBackdropIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: '' }), 3000);
    };

    useEffect(() => {
        const randomPage = Math.floor(Math.random() * 10) + 1;
        setPopularPage(randomPage);
        setPopularMovies([]);
        loadPopularMovies(randomPage);
        loadGenres();
    }, []);

    useEffect(() => {
        if (backdrops.length === 0) return;
        const interval = setInterval(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                // fade out bitti, şimdi fotoğrafı değiştir
                setCurrentBackdropIndex(prev =>
                    prev === backdrops.length - 1 ? 0 : prev + 1
                );
                // sonra fade in
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }).start();
            });
        }, 15000);
        return () => clearInterval(interval);
    }, [backdrops]);

    const loadGenres = async () => {
        try {
            const data = await tmdbAPI.getGenres();
            setGenres(data.genres || []);
        } catch (error) {
            console.error('Türler yüklenemedi:', error);
        }
    };

    useEffect(() => {
        if (favoriteTmdbId) {
            tmdbAPI.getMovieBackdrops(favoriteTmdbId).then(data => {
                if (data && data.length > 0) setBackdrops(data);
            }).catch(console.error);
        }
    }, [favoriteTmdbId]);

    const handleGenreSelect = async (genre) => {
        if (selectedGenre?.id === genre.id) {
            setSelectedGenre(null);
            setSearched(false);
            setMovies([]);
            return;
        }

        setSelectedGenre(genre);
        setLoading(true);
        setSearched(true);
        try {
            const results = await moviesAPI.searchMovies(genre.name);
            setMovies(results.results || []);
        } catch (error) {
            console.error('Tür filtresi hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPopularMovies = async (page = 1) => {
        try {
            const popular = await tmdbAPI.getPopular(page);

            let myIds = [];
            try {
                const myMovies = await moviesAPI.getMyMovies();
                myIds = myMovies.map(m => m.tmdbId);
            } catch (e) {
                console.warn('My-movies alınamadı:', e);
            }

            setMyMovieIds(myIds);

            const filtered = (popular.results || []).filter(
                m => !myIds.includes(m.id)
            );

            setPopularMovies(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const newMovies = filtered.filter(m => !existingIds.has(m.id));
                return [...prev, ...newMovies];
            });
        } catch (error) {
            console.error('Popüler filmler yüklenemedi:', error);
        }
    };

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;
        await handleLiveSearch(searchQuery);
    }, [searchQuery]);

    const handleLiveSearch = (text) => {
        setSearchQuery(text);

        if (text.length < 2) {
            setSearched(false);
            setMovies([]);
            return;
        }

        // Önceki isteği iptal et
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            setSearched(true);
            try {
                const results = await moviesAPI.searchMovies(text);
                setMovies(results.results || []);
            } catch (error) {
                console.error('Arama hatası:', error);
            } finally {
                setLoading(false);
            }
        }, 500);
    };

    const handleAddMovie = async (item) => {
        try {
            await moviesAPI.addMovie({
                tmdbId: item.id,
                title: item.title,
                originalTitle: item.original_title || item.original_Title,
                overview: item.overview,
                posterPath: item.poster_path || item.poster_Path,
                backdropPath: item.backdrop_path || item.backdrop_Path,
                releaseDate: item.release_date || item.release_Date,
                voteAverage: item.vote_average || item.vote_Average,
                genres: item.genre_ids?.join(','),
            });
            showToast(`${item.title} kütüphaneye eklendi!`, 'success');
        } catch (error) {
            try {
                const errorObj = JSON.parse(error.message);
                showToast(errorObj.message || 'Film eklenirken hata oluştu!', 'error');
            } catch {
                showToast('Film eklenirken hata oluştu!', 'error');
            }
        }
    };

    const handleWatchLater = async (item) => {
        try {
            await watchLaterAPI.add({
                tmdbId: item.id,
                title: item.title,
                overview: item.overview,
                posterPath: item.poster_path || item.poster_Path,      // ✅
                backdropPath: item.backdrop_path || item.backdrop_Path, // ✅
                releaseDate: item.release_date || item.release_Date,    // ✅
                voteAverage: item.vote_average || item.vote_Average,    // ✅
                genres: item.genre_ids?.join(','),
            });
            showToast(`${item.title} listeye eklendi!`, 'success');
        } catch (error) {
            showToast('Film eklenirken hata oluştu!', 'error');
        }
    };

    const handleLoadMore = async () => {
        setLoadingMore(true);
        const nextPage = popularPage + 1;
        setPopularPage(nextPage);
        await loadPopularMovies(nextPage);
        setLoadingMore(false);
    };

    const renderMovie = ({ item }) => (
        <TouchableOpacity
            style={styles.movieCard}
            onPress={() => navigation.navigate('MovieDetail', { movie: item })}
        >
            <Image
                source={{
                    uri: (item.poster_path || item.poster_Path)
                        ? `https://image.tmdb.org/t/p/w200${item.poster_path || item.poster_Path}`
                        : 'https://via.placeholder.com/200x300'
                }}
                style={styles.moviePoster}
            />
            <View style={styles.movieInfo}>
                <Text style={styles.movieTitle} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={styles.movieYear}>
                    📅 {item.release_date?.split('-')[0] || 'N/A'}
                </Text>
                <Text style={styles.movieRating}>
                    ⭐ {item.vote_average?.toFixed(1) || 'N/A'}
                </Text>
                <Text style={styles.movieOverview} numberOfLines={3}>
                    {item.overview || 'Açıklama bulunamadı.'}
                </Text>
                {/* 🔥 İKİ BUTON */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => handleAddMovie(item)}
                    >
                        <Text style={styles.addButtonText}>➕ Kütüphaneye</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.watchLaterButton}
                        onPress={() => handleWatchLater(item)}
                    >
                        <Text style={styles.watchLaterButtonText}>⏰ Sonra</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {backdrops.length > 0 && (
                <Animated.View style={[styles.backdropContainer, { opacity: fadeAnim }]}>
                    <Image
                        source={{ uri: `https://image.tmdb.org/t/p/w780${backdrops[currentBackdropIndex]}` }}
                        style={styles.backdrop}
                    />
                    <View style={styles.backdropOverlay} />
                </Animated.View>
            )}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🎬 SineVizör</Text>
                {/* <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Çıkış</Text>
                </TouchableOpacity> */}
            </View>

            <Text style={styles.welcome}>
                Hoş geldin, {user?.username}! 👋
            </Text>

            <Toast message={toast.message} type={toast.type} />

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Film ara..."
                    placeholderTextColor="#888"
                    value={searchQuery}
                    onChangeText={handleLiveSearch}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    autoComplete="off"
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                    <Text style={styles.searchBtnText}>🔍</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.genreBtn, selectedGenre && styles.genreBtnActive]}
                    onPress={() => setShowGenreModal(true)}
                >
                    <Text style={styles.genreBtnText}>
                        {selectedGenre ? '✓' : '🎭'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* {genres.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.genreList}
                    contentContainerStyle={styles.genreListContent}
                >
                    {genres.map((genre) => (
                        <TouchableOpacity
                            key={genre.id}
                            style={[
                                styles.genreTag,
                                selectedGenre?.id === genre.id && styles.genreTagActive
                            ]}
                            onPress={() => handleGenreSelect(genre)}
                        >
                            <Text style={[
                                styles.genreText,
                                selectedGenre?.id === genre.id && styles.genreTextActive
                            ]}>
                                {genre.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )} */}

            {loading ? (
                <ActivityIndicator size="large" color="#667eea" style={styles.loader} />
            ) : searched && movies.length === 0 ? (
                <Text style={styles.emptyText}>Film bulunamadı 😕</Text>
            ) : !searched ? (
                popularMovies.length > 0 ? (
                    <FlatList
                        data={popularMovies}
                        renderItem={renderMovie}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            <Text style={styles.popularTitle}>🔥 Popüler Filmler</Text>
                        }
                        ListFooterComponent={
                            <TouchableOpacity
                                style={styles.loadMoreBtn}
                                onPress={handleLoadMore}
                                disabled={loadingMore}
                            >
                                {loadingMore ? (
                                    <ActivityIndicator color="#667eea" />
                                ) : (
                                    <Text style={styles.loadMoreText}>Daha Fazla ↓</Text>
                                )}
                            </TouchableOpacity>
                        }
                        contentContainerStyle={styles.movieList}
                    />
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateIcon}>🎬</Text>
                        <Text style={styles.emptyStateText}>Film aramak için yukarıdaki arama kutusunu kullan!</Text>
                    </View>
                )
            ) : (
                <FlatList
                    data={movies}
                    renderItem={renderMovie}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.movieList}
                />
            )}

            {/* Tür Modal */}
            <Modal
                visible={showGenreModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowGenreModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    onPress={() => setShowGenreModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>🎭 Tür Seç</Text>

                        {selectedGenre && (
                            <TouchableOpacity
                                style={styles.clearFilter}
                                onPress={() => {
                                    setSelectedGenre(null);
                                    setSearched(false);
                                    setMovies([]);
                                    setShowGenreModal(false);
                                }}
                            >
                                <Text style={styles.clearFilterText}>✕ Filtreyi Kaldır</Text>
                            </TouchableOpacity>
                        )}

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.genreGrid}>
                                {genres.map((genre) => (
                                    <TouchableOpacity
                                        key={genre.id}
                                        style={[
                                            styles.genreGridItem,
                                            selectedGenre?.id === genre.id && styles.genreGridItemActive
                                        ]}
                                        onPress={() => {
                                            handleGenreSelect(genre);
                                            setShowGenreModal(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.genreGridText,
                                            selectedGenre?.id === genre.id && styles.genreGridTextActive
                                        ]}>
                                            {genre.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(10,10,10,0.85)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#667eea',
    },
    logoutBtn: {
        backgroundColor: 'rgba(220, 53, 69, 0.8)',
        padding: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    logoutText: {
        color: '#fff',
        fontWeight: '600',
    },
    welcome: {
        color: '#fff',
        fontSize: 18,
        padding: 20,
        paddingBottom: 10,
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
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        padding: 20,
        paddingTop: 10,
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
    loader: {
        marginTop: 50,
    },
    emptyText: {
        color: '#888',
        textAlign: 'center',
        marginTop: 50,
        fontSize: 18,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyStateIcon: {
        fontSize: 80,
        marginBottom: 20,
    },
    emptyStateText: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
    },
    movieList: {
        padding: 20,
    },
    movieCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15,
        marginBottom: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    moviePoster: {
        width: 100,
        height: 150,
        backgroundColor: '#333',
    },
    movieInfo: {
        flex: 1,
        padding: 12,
    },
    movieTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    movieYear: {
        color: '#888',
        fontSize: 13,
        marginBottom: 3,
    },
    movieRating: {
        color: '#f093fb',
        fontSize: 13,
        marginBottom: 5,
    },
    movieOverview: {
        color: '#aaa',
        fontSize: 12,
        lineHeight: 18,
        marginBottom: 10,
    },
    addButton: {
        flex: 1,
        backgroundColor: 'rgba(102, 126, 234, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.5)',
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#667eea',
        fontSize: 11,
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    watchLaterButton: {
        flex: 1,
        backgroundColor: 'rgba(240, 147, 251, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(240, 147, 251, 0.5)',
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
    },
    watchLaterButtonText: {
        color: '#f093fb',
        fontSize: 11,
        fontWeight: '600',
    },
    popularTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    loadMoreBtn: {
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.4)',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    loadMoreText: {
        color: '#667eea',
        fontSize: 16,
        fontWeight: '600',
    },
    genreBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
        width: 50,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    genreBtnActive: {
        backgroundColor: 'rgba(102, 126, 234, 0.4)',
        borderColor: '#667eea',
    },
    genreBtnText: {
        fontSize: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
        maxHeight: '70%',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    clearFilter: {
        backgroundColor: 'rgba(220, 53, 69, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(220, 53, 69, 0.4)',
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
        marginBottom: 15,
    },
    clearFilterText: {
        color: '#dc3545',
        fontWeight: '600',
    },
    genreGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    genreGridItem: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    genreGridItemActive: {
        backgroundColor: 'rgba(102, 126, 234, 0.4)',
        borderColor: '#667eea',
    },
    genreGridText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
    },
    genreGridTextActive: {
        color: '#667eea',
    },
    backdropContainer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    },
    backdrop: {
        width: '100%',
        height: '100%',
    },
    backdropOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
});