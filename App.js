import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import BackdropBackground from './src/components/BackdropBackground';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { BackdropProvider } from './src/contexts/BackdropContext';
import HomeScreen from './src/screens/HomeScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import LoginScreen from './src/screens/LoginScreen';
import MovieDetailScreen from './src/screens/MovieDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import WatchLaterScreen from './src/screens/WatchLaterScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
    return (
        <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
            <BackdropBackground />
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: 'rgba(26,26,26,0.9)',
                        borderTopColor: 'rgba(255,255,255,0.1)',
                        paddingBottom: 5,
                        paddingTop: 5,
                        height: 60,
                    },
                    tabBarActiveTintColor: '#667eea',
                    tabBarInactiveTintColor: '#888',
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: '600',
                    },
                }}
            >
                <Tab.Screen
                    name="Ara"
                    component={HomeScreen}
                    options={{
                        tabBarIcon: ({ color }) => (
                            <Text style={{ fontSize: 22 }}>🔍</Text>
                        ),
                    }}
                />
                <Tab.Screen
                    name="Kütüphanem"
                    component={LibraryScreen}
                    options={{
                        tabBarIcon: ({ color }) => (
                            <Text style={{ fontSize: 22 }}>🎬</Text>
                        ),
                    }}
                />
                <Tab.Screen
                    name="Daha Sonra"
                    component={WatchLaterScreen}
                    options={{
                        tabBarIcon: ({ color }) => (
                            <Text style={{ fontSize: 22 }}>⏰</Text>
                        ),
                    }}
                />
                <Tab.Screen
                    name="Profil"
                    component={ProfileScreen}
                    options={{
                        tabBarIcon: ({ color }) => (
                            <Text style={{ fontSize: 22 }}>👤</Text>
                        ),
                    }}
                />
            </Tab.Navigator>
        </View>
    );
}

function Navigation() {
    const { user, loading } = useAuth();

    if (loading) return null;

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        <Stack.Screen name="Main" component={TabNavigator} />
                        <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BackdropProvider>
                <Navigation />
            </BackdropProvider>
        </AuthProvider>
    );
}