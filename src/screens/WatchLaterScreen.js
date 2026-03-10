import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { moviesAPI, watchLaterAPI } from '../services/api';

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

export default function WatchLaterScreen() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '' });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: '' }), 3000);
    };

    const loadMovies = async () => {
        setLoading(true);
        try {
            const data = await watchLaterAPI.getAll();
            setMovies(data);
        } catch (error) {
            showToast('Filmler yüklenemedi!', 'error');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadMovies();
        }, [])
    );

    const handleDelete = async (id) => {
        try {
            await watchLaterAPI.delete(id);
            showToast('Film listeden silindi!', 'success');
            loadMovies();
        } catch (error) {
            showToast('Film silinemedi!', 'error');
        }
    };

    const handleAddToLibrary = async (item) => {
        try {
            await moviesAPI.addMovie({
                tmdbId: item.tmdbId,
                title: item.title,
                overview: item.overview,
                posterPath: item.posterPath,
                backdropPath: item.backdropPath,
                releaseDate: item.releaseDate,
                voteAverage: item.voteAverage,
                genres: item.genres,
            });
            await watchLaterAPI.delete(item.id);
            showToast('Film kütüphaneye eklendi!', 'success');
            loadMovies();
        } catch (error) {
            showToast('İşlem başarısız!', 'error');
        }
    };

    const renderMovie = ({ item }) => (
        <View style={styles.movieCard}>
            <View style={styles.moviePosterContainer}>
                <Image
                    source={{
                        uri: item.posterPath
                            ? `https://image.tmdb.org/t/p/w200${item.posterPath}`
                            : null
                    }}
                    style={styles.moviePoster}
                />
                {!item.posterPath && (
                    <Text style={styles.noPoster}>🎬</Text>
                )}
            </View>
            <View style={styles.movieInfo}>
                <Text style={styles.movieTitle} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={styles.movieYear}>
                    📅 {item.releaseDate?.split('T')[0]?.split('-')[0] || 'N/A'}
                </Text>
                <Text style={styles.movieRating}>
                    ⭐ {item.voteAverage?.toFixed(1) || 'N/A'}
                </Text>
                {item.overview ? (
                    <Text style={styles.movieOverview} numberOfLines={2}>
                        {item.overview}
                    </Text>
                ) : null}
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => handleAddToLibrary(item)}
                    >
                        <Text style={styles.addButtonText}>➕ Kütüphaneye</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(item.id)}
                    >
                        <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>⏰ Daha Sonra İzle</Text>
                <Text style={styles.movieCount}>{movies.length} film</Text>
            </View>

            <Toast message={toast.message} type={toast.type} />

            {loading ? (
                <ActivityIndicator size="large" color="#667eea" style={styles.loader} />
            ) : movies.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateIcon}>⏰</Text>
                    <Text style={styles.emptyStateText}>Liste boş!</Text>
                    <Text style={styles.emptyStateSubText}>
                        Ara sekmesinden filmleri daha sonra izlemek için ekleyebilirsin.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={movies}
                    renderItem={renderMovie}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.movieList}
                />
            )}
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
    movieCount: {
        color: '#888',
        fontSize: 16,
    },
    loader: {
        marginTop: 50,
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
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    emptyStateSubText: {
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
    moviePosterContainer: {
        width: 100,
        height: 150,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    moviePoster: {
        width: 100,
        height: 150,
        position: 'absolute',
    },
    noPoster: {
        fontSize: 40,
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
    buttonRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 'auto',
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
        fontSize: 12,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: 'rgba(220, 53, 69, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(220, 53, 69, 0.5)',
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
        width: 40,
    },
    deleteButtonText: {
        fontSize: 16,
    },
    toast: {
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 20,
        marginTop: 10,
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
});