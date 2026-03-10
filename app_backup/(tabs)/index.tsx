import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎬 MovieLists</Text>
      <Text style={styles.subtitle}>Film Kütüphanem</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667eea',
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 10,
  },
});