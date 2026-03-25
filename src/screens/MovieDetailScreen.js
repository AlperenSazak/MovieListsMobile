import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useAuth } from '../contexts/AuthContext';
import { commentsAPI, movieLikesAPI, moviesAPI, tmdbAPI, watchLaterAPI } from '../services/api';

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

export default function MovieDetailScreen({ route, navigation }) {
    const { movie } = route.params;
    const { user } = useAuth();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [showTrailer, setShowTrailer] = useState(false);
    const [trailerKey, setTrailerKey] = useState(null);

    // Beğeni
    const [likeStats, setLikeStats] = useState({ totalLikes: 0, totalDislikes: 0, userLiked: null });
    const [myMovieId, setMyMovieId] = useState(null);

    // Yorumlar
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: '' }), 3000);
    };

    useEffect(() => {
        loadDetails();
        loadComments();
        loadMyMovieId();
    }, []);

    const loadMyMovieId = async () => {
        try {
            const myMovies = await moviesAPI.getMyMovies();
            const tmdbId = movie.id || movie.tmdbId;
            const found = myMovies.find(m => m.tmdbId === tmdbId);
            if (found) {
                setMyMovieId(found.id);
                loadLikeStats(found.id);
            }
        } catch (e) {
            console.warn('My movie id alınamadı:', e);
        }
    };

    const loadLikeStats = async (movieId) => {
        try {
            const stats = await movieLikesAPI.getStats(movieId);
            setLikeStats(stats);
        } catch (e) {
            console.warn('Like stats alınamadı:', e);
        }
    };

    const loadDetails = async () => {
        setLoading(true);
        try {
            const data = await tmdbAPI.getMovieDetails(movie.id || movie.tmdbId);
            setDetails(data);
        } catch (error) {
            console.error('Detay yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async () => {
        try {
            const tmdbId = movie.id || movie.tmdbId;
            const data = await commentsAPI.getMovieComments(tmdbId);
            setComments(data);
        } catch (e) {
            console.warn('Yorumlar alınamadı:', e);
        }
    };

    const handleToggleLike = async (isLiked) => {
        if (!myMovieId) {
            showToast('Beğenmek için önce kütüphaneye ekleyin!', 'error');
            return;
        }
        try {
            await movieLikesAPI.toggleLike(myMovieId, isLiked);
            await loadLikeStats(myMovieId);
        } catch (e) {
            showToast('Beğeni işlemi başarısız!', 'error');
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setCommentLoading(true);
        try {
            const tmdbId = movie.id || movie.tmdbId;
            await commentsAPI.createComment(tmdbId, newComment.trim());
            setNewComment('');
            await loadComments();
            showToast('Yorum eklendi!', 'success');
        } catch (e) {
            showToast('Yorum eklenemedi! Filmi önce kütüphaneye ekleyin.', 'error');
        } finally {
            setCommentLoading(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await commentsAPI.deleteComment(commentId);
            await loadComments();
            showToast('Yorum silindi!', 'success');
        } catch (e) {
            showToast('Yorum silinemedi!', 'error');
        }
    };

    const handleAddMovie = async () => {
        try {
            await moviesAPI.addMovie({
                tmdbId: movie.id || movie.tmdbId,
                title: movie.title,
                overview: movie.overview,
                posterPath: movie.poster_path || movie.posterPath,
                backdropPath: movie.backdrop_path || movie.backdropPath,
                releaseDate: movie.release_date || movie.releaseDate,
                voteAverage: movie.vote_average || movie.voteAverage,
                genres: movie.genre_ids?.join(','),
            });
            showToast('Film kütüphaneye eklendi!', 'success');
            await loadMyMovieId();
        } catch (error) {
            try {
                const errorObj = JSON.parse(error.message);
                showToast(errorObj.message || 'Hata!', 'error');
            } catch {
                showToast('Film eklenirken hata!', 'error');
            }
        }
    };

    const handleWatchLater = async () => {
        try {
            await watchLaterAPI.add({
                tmdbId: movie.id || movie.tmdbId,
                title: movie.title,
                overview: movie.overview,
                posterPath: movie.poster_path || movie.posterPath,
                backdropPath: movie.backdrop_path || movie.backdropPath,
                releaseDate: movie.release_date || movie.releaseDate,
                voteAverage: movie.vote_average || movie.voteAverage,
                genres: movie.genre_ids?.join(','),
            });
            showToast('Film listeye eklendi!', 'success');
        } catch (error) {
            showToast('Film eklenirken hata!', 'error');
        }
    };

    const handleWatchTrailer = () => {
        const videos = details?.videos?.results || details?.videos || [];
        if (videos.length > 0) {
            const trailer = videos.find(v => v.type === 'Trailer') || videos[0];
            if (trailer?.key) {
                setTrailerKey(trailer.key);
                setShowTrailer(true);
            }
        } else {
            showToast('Fragman bulunamadı!', 'error');
        }
    };

    const posterPath = movie.poster_path || movie.poster_Path || movie.posterPath;
    const backdropPath = movie.backdrop_path || movie.backdrop_Path || movie.backdropPath;
    const releaseYear = (movie.release_date || movie.releaseDate)?.split(/[-T]/)[0];
    const rating = movie.vote_average || movie.voteAverage;

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Backdrop */}
                <View style={styles.backdropContainer}>
                    <Image
                        source={{
                            uri: backdropPath
                                ? `https://image.tmdb.org/t/p/w780${backdropPath}`
                                : posterPath
                                    ? `https://image.tmdb.org/t/p/w500${posterPath}`
                                    : null
                        }}
                        style={styles.backdrop}
                    />
                    <View style={styles.backdropOverlay} />
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtnText}>← Geri</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Toast message={toast.message} type={toast.type} />

                    {/* Poster + Başlık */}
                    <View style={styles.mainInfo}>
                        <Image
                            source={{ uri: posterPath ? `https://image.tmdb.org/t/p/w300${posterPath}` : null }}
                            style={styles.poster}
                        />
                        <View style={styles.titleSection}>
                            <Text style={styles.title}>{movie.title}</Text>
                            <Text style={styles.year}>📅 {releaseYear || 'N/A'}</Text>
                            <Text style={styles.rating}>⭐ {rating?.toFixed(1) || 'N/A'}</Text>
                            {loading ? null : details?.runtime ? (
                                <Text style={styles.runtime}>⏱️ {details.runtime} dk</Text>
                            ) : null}
                            {details?.genres && (
                                <View style={styles.genres}>
                                    {details.genres.slice(0, 3).map((g) => (
                                        <View key={g.id} style={styles.genreTag}>
                                            <Text style={styles.genreText}>{g.name}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Beğeni */}
                    <View style={styles.likeSection}>
                        <TouchableOpacity
                            style={[styles.likeBtn, likeStats.userLiked === true && styles.likeBtnActive]}
                            onPress={() => handleToggleLike(true)}
                        >
                            <Text style={styles.likeBtnText}>👍 {likeStats.totalLikes}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.dislikeBtn, likeStats.userLiked === false && styles.dislikeBtnActive]}
                            onPress={() => handleToggleLike(false)}
                        >
                            <Text style={styles.dislikeBtnText}>👎 {likeStats.totalDislikes}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Butonlar */}
                    <View style={styles.buttons}>
                        <TouchableOpacity style={styles.trailerBtn} onPress={handleWatchTrailer}>
                            <Text style={styles.trailerBtnText}>▶ Fragman İzle</Text>
                        </TouchableOpacity>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.addBtn} onPress={handleAddMovie}>
                                <Text style={styles.addBtnText}>➕ Kütüphaneye</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.watchLaterBtn} onPress={handleWatchLater}>
                                <Text style={styles.watchLaterBtnText}>⏰ Sonra İzle</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Özet */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📖 Özet</Text>
                        <Text style={styles.overview}>{movie.overview || 'Açıklama bulunamadı.'}</Text>
                    </View>

                    {/* Detaylar */}
                    {loading ? (
                        <ActivityIndicator color="#667eea" style={{ marginTop: 20 }} />
                    ) : details ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>🎬 Detaylar</Text>
                            {details.tagline ? (
                                <Text style={styles.tagline}>"{details.tagline}"</Text>
                            ) : null}
                            {details.cast && details.cast.length > 0 && (
                                <View style={styles.castSection}>
                                    <Text style={styles.castTitle}>👥 Oyuncular</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {details.cast.slice(0, 10).map((actor) => (
                                            <View key={actor.id} style={styles.actorCard}>
                                                <Image
                                                    source={{
                                                        uri: actor.profilePath
                                                            ? `https://image.tmdb.org/t/p/w185${actor.profilePath}`
                                                            : null
                                                    }}
                                                    style={styles.actorImage}
                                                />
                                                <Text style={styles.actorName} numberOfLines={2}>{actor.name}</Text>
                                                <Text style={styles.actorCharacter} numberOfLines={1}>{actor.character}</Text>
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    ) : null}

                    {/* Yorumlar */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>💬 Yorumlar ({comments.length})</Text>

                        {/* Yorum Yaz */}
                        <View style={styles.commentInputRow}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Yorumunuzu yazın..."
                                placeholderTextColor="#888"
                                value={newComment}
                                onChangeText={setNewComment}
                                multiline
                            />
                            <TouchableOpacity
                                style={styles.commentSendBtn}
                                onPress={handleAddComment}
                                disabled={commentLoading}
                            >
                                {commentLoading
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <Text style={styles.commentSendBtnText}>Gönder</Text>
                                }
                            </TouchableOpacity>
                        </View>

                        {/* Yorum Listesi */}
                        {comments.length === 0 ? (
                            <Text style={styles.noComments}>Henüz yorum yok. İlk yorumu sen yap!</Text>
                        ) : (
                            comments.map((comment) => (
                                <View key={comment.id} style={styles.commentCard}>
                                    <View style={styles.commentHeader}>
                                        <Text style={styles.commentUsername}>👤 {comment.username}</Text>
                                        <Text style={styles.commentDate}>
                                            {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                                        </Text>
                                    </View>
                                    <Text style={styles.commentContent}>{comment.content}</Text>
                                    {comment.username === user?.username && (
                                        <TouchableOpacity
                                            style={styles.deleteCommentBtn}
                                            onPress={() => handleDeleteComment(comment.id)}
                                        >
                                            <Text style={styles.deleteCommentBtnText}>🗑️ Sil</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))
                        )}
                    </View>
                </View>
                <Modal
                    visible={showTrailer}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowTrailer(false)}
                >
                    <View style={styles.trailerModal}>
                        <TouchableOpacity
                            style={styles.trailerCloseBtn}
                            onPress={() => setShowTrailer(false)}
                        >
                            <Text style={styles.trailerCloseBtnText}>✕ Kapat</Text>
                        </TouchableOpacity>
                        {trailerKey && (
                            <YoutubePlayer
                                height={220}
                                play={true}
                                videoId={trailerKey}
                            />
                        )}
                    </View>
                </Modal>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    backdropContainer: { height: 250, position: 'relative' },
    backdrop: { width: '100%', height: 250, backgroundColor: '#333' },
    backdropOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
    backBtn: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 20, paddingHorizontal: 15 },
    backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    content: { padding: 20 },
    toast: { padding: 15, borderRadius: 10, marginBottom: 15 },
    toastError: { backgroundColor: 'rgba(220, 53, 69, 0.95)' },
    toastSuccess: { backgroundColor: 'rgba(17, 153, 142, 0.95)' },
    toastText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
    mainInfo: { flexDirection: 'row', gap: 15, marginBottom: 20 },
    poster: { width: 110, height: 165, borderRadius: 10, backgroundColor: '#333' },
    titleSection: { flex: 1 },
    title: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    year: { color: '#888', fontSize: 14, marginBottom: 4 },
    rating: { color: '#f093fb', fontSize: 14, marginBottom: 4 },
    runtime: { color: '#888', fontSize: 14, marginBottom: 8 },
    genres: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    genreTag: { backgroundColor: 'rgba(102, 126, 234, 0.2)', borderWidth: 1, borderColor: 'rgba(102, 126, 234, 0.4)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    genreText: { color: '#667eea', fontSize: 12 },
    likeSection: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    likeBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, alignItems: 'center' },
    likeBtnActive: { backgroundColor: 'rgba(39, 174, 96, 0.3)', borderColor: '#27ae60' },
    likeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    dislikeBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, alignItems: 'center' },
    dislikeBtnActive: { backgroundColor: 'rgba(220, 53, 69, 0.3)', borderColor: '#dc3545' },
    dislikeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    buttons: { gap: 10, marginBottom: 20 },
    trailerBtn: { backgroundColor: '#667eea', padding: 15, borderRadius: 12, alignItems: 'center' },
    trailerBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    actionButtons: { flexDirection: 'row', gap: 10 },
    addBtn: { flex: 1, backgroundColor: 'rgba(102, 126, 234, 0.2)', borderWidth: 1, borderColor: 'rgba(102, 126, 234, 0.4)', borderRadius: 12, padding: 12, alignItems: 'center' },
    addBtnText: { color: '#667eea', fontSize: 14, fontWeight: '600' },
    watchLaterBtn: { flex: 1, backgroundColor: 'rgba(240, 147, 251, 0.2)', borderWidth: 1, borderColor: 'rgba(240, 147, 251, 0.4)', borderRadius: 12, padding: 12, alignItems: 'center' },
    watchLaterBtnText: { color: '#f093fb', fontSize: 14, fontWeight: '600' },
    section: { marginBottom: 25 },
    sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    tagline: { color: '#888', fontSize: 14, fontStyle: 'italic', marginBottom: 10 },
    overview: { color: '#ccc', fontSize: 15, lineHeight: 24 },
    castSection: { marginTop: 10 },
    castTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 10 },
    actorCard: { width: 80, marginRight: 12, alignItems: 'center' },
    actorImage: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#333', marginBottom: 6 },
    actorName: { color: '#fff', fontSize: 11, textAlign: 'center', fontWeight: '600' },
    actorCharacter: { color: '#888', fontSize: 10, textAlign: 'center' },
    commentInputRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    commentInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', minHeight: 45 },
    commentSendBtn: { backgroundColor: '#667eea', borderRadius: 10, padding: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
    commentSendBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    noComments: { color: '#888', textAlign: 'center', fontSize: 14, marginTop: 10 },
    commentCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    commentUsername: { color: '#667eea', fontWeight: '600', fontSize: 13 },
    commentDate: { color: '#888', fontSize: 12 },
    commentContent: { color: '#ccc', fontSize: 14, lineHeight: 20 },
    deleteCommentBtn: { alignSelf: 'flex-end', marginTop: 8 },
    deleteCommentBtnText: { color: '#dc3545', fontSize: 12 },
    trailerModal: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        padding: 20,
    },
    trailerCloseBtn: {
        alignSelf: 'flex-end',
        marginBottom: 15,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 10,
        borderRadius: 10,
        paddingHorizontal: 15,
    },
    trailerCloseBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});