import { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

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

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });
    const { login } = useAuth();

    const showToast = (message, type = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: '' }), 3000);
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showToast('Lütfen tüm alanları doldurun!', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.login(email, password);
            await login(response.token, {
                username: response.username,
                email: response.email || email
            });
            showToast('Giriş başarılı!', 'success');
            console.log('Login response:', response);
        } catch (error) {
            try {
                const errorObj = JSON.parse(error.message);
                showToast(errorObj.message || 'Email veya şifre yanlış!', 'error');
            } catch {
                showToast('Email veya şifre yanlış!', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Toast message={toast.message} type={toast.type} />
            <View style={styles.content}>
                <Text style={styles.logo}>🎬</Text>
                <Text style={styles.title}>SineVizör</Text>
                <Text style={styles.subtitle}>Film Kütüphanem</Text>

                <Toast message={toast.message} type={toast.type} />

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

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.link}>Hesabın yok mu? Kayıt Ol</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
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
        fontSize: 16,
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
        marginBottom: 20,  // absolute yerine normal flow
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