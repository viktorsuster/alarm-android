import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { accelerometer } from 'react-native-sensors';
import { Subscription } from 'rxjs';

const { width, height } = Dimensions.get('window');
const bubbleSize = 50;
const containerSize = width * 0.8;

const SpiritLevelScreen = () => {
  const [{ x, y }, setData] = useState({ x: 0, y: 0 });
  const lowPassFilter = useRef({ x: 0, y: 0 });
  let subscription: Subscription | null = null;

  useEffect(() => {
    const alpha = 0.95; // Faktor vyhladenia (bližšie k 1 = viac vyhladené)

    subscription = accelerometer.subscribe(({ x, y }) => {
      const smoothedX = lowPassFilter.current.x * alpha + x * (1 - alpha);
      const smoothedY = lowPassFilter.current.y * alpha + y * (1 - alpha);

      lowPassFilter.current = { x: smoothedX, y: smoothedY };
      setData({ x: smoothedX, y: smoothedY });
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }
    };
  }, []);

  // Normalizácia hodnôt zo senzora (cca -10 až 10) na pozíciu v kontajneri
  const bubbleX = (x / 10) * (containerSize / 2);
  const bubbleY = (y / 10) * (containerSize / 2);

  // Definujeme malú toleranciu, pretože senzory málokedy ukážu presnú 0
  const isCentered = Math.abs(x) < 0.1 && Math.abs(y) < 0.1;

  return (
    <View style={styles.container}>
      <View style={[styles.levelContainer, { borderColor: isCentered ? 'gold' : '#FFF' }]}>
        <View style={[styles.bubble, {
          transform: [
            { translateX: bubbleX },
            { translateY: bubbleY }
          ]
        }]} />
        <View style={styles.centerMarkings}>
          <View style={styles.centerLine} />
          <View style={[styles.centerLine, { transform: [{ rotate: '90deg' }] }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  levelContainer: {
    width: containerSize,
    height: containerSize,
    borderRadius: containerSize / 2,
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  bubble: {
    width: bubbleSize,
    height: bubbleSize,
    borderRadius: bubbleSize / 2,
    backgroundColor: 'rgba(0, 255, 0, 0.7)',
    position: 'absolute',
  },
  centerMarkings: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLine: {
    position: 'absolute',
    width: '110%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});

export default SpiritLevelScreen;
