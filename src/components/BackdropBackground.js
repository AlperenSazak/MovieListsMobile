import { Animated, Image, StyleSheet, View } from 'react-native';
import { useBackdrop } from '../contexts/BackdropContext';

export default function BackdropBackground() {
    const { backdrops, currentIndex, fadeAnim } = useBackdrop();

    if (backdrops.length === 0) return null;

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Image
                source={{ uri: backdrops[currentIndex] }}
                style={styles.image}
            />
            <View style={styles.overlay} />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.82)',
    },
});