import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { authAPI } from '../services/api';

// Toast komponenti
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

export default function RegisterScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });

    const showToast = (message, type = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: '' }), 3000);
    };

    const handleRegister = async () => {
        if (!username || !email || !password || !confirmPassword) {
            showToast('Lütfen tüm alanları doldurun!', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Şifreler eşleşmiyor!', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Şifre en az 6 karakter olmalı!', 'error');
            return;
        }

        setLoading(true);
        try {
            await authAPI.register(username, email, password);
            showToast('Hesabın oluşturuldu! Yönlendiriliyorsun...', 'success');
            setTimeout(() => navigation.navigate('Login'), 2000);
        } catch (error) {
            try {
                const errorObj = JSON.parse(error.message);
                showToast(errorObj.message || 'Kayıt olurken hata oluştu!', 'error');
            } catch {
                showToast(error.message || 'Kayıt olurken hata oluştu!', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Toast message={toast.message} type={toast.type} />

            <Text style={styles.logo}>🎬</Text>
            <Text style={styles.title}>MovieLists</Text>
            <Text style={styles.subtitle}>Hesap Oluştur</Text>

            <Toast message={toast.message} type={toast.type} />

            <TextInput
                style={styles.input}
                placeholder="Kullanıcı Adı"
                placeholderTextColor="#888"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoComplete="off"
            />

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="off"
            />

            <TextInput
                style={styles.input}
                placeholder="Şifre"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="off"
            />

            <TextInput
                style={styles.input}
                placeholder="Şifre Tekrar"
                placeholderTextColor="#888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="off"
            />

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Zaten hesabın var mı? Giriş Yap</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingVertical: 40,
        maxWidth: 500,
        width: '100%',
        alignSelf: 'center',
    },
    logo: {
        fontSize: 80,
        textAlign: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#667eea',
        textAlign: 'center',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 18,
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 40,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        color: '#ffffff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        outlineStyle: 'none',
    },
    button: {
        backgroundColor: '#667eea',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    link: {
        color: '#667eea',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
    toast: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
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