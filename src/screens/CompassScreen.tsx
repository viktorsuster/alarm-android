import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { magnetometer } from 'react-native-sensors';
import { Subscription } from 'rxjs';

// Jednoduchý obrázok šípky, ktorý bude ukazovať na sever.
// Pre lepší vzhľad by sa dal použiť obrázok kompasu.
const compassImage = require('../assets/compass_needle.png'); // Tento súbor musíme vytvoriť

const CompassScreen = () => {
  const [heading, setHeading] = useState(0);
  const smoothedHeadingRef = useRef(0);
  let subscription: Subscription | null = null;

  useEffect(() => {
    const alpha = 0.9; // Faktor vyhladenia

    subscription = magnetometer.subscribe(({ x, y }) => {
      const angle = Math.atan2(y, x);
      let degrees = angle * (180 / Math.PI);
      degrees = (degrees + 360) % 360;

      const smoothedHeading = smoothedHeadingRef.current * alpha + degrees * (1 - alpha);
      smoothedHeadingRef.current = smoothedHeading;
      
      setHeading(Math.round(smoothedHeading));
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.compassContainer}>
        <Image
          source={compassImage}
          style={[
            styles.compassNeedle,
            { transform: [{ rotate: `${360 - heading}deg` }] }
          ]}
        />
        <Text style={[styles.cardinalText, styles.north]}>S</Text>
        <Text style={[styles.cardinalText, styles.east]}>V</Text>
        <Text style={[styles.cardinalText, styles.south]}>J</Text>
        <Text style={[styles.cardinalText, styles.west]}>Z</Text>
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
  headingText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  compassContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    // V budúcnosti tu môže byť obrázok pozadia kompasu
  },
  compassNeedle: {
    width: 280,
    height: 280,
    resizeMode: 'contain',
  },
  cardinalText: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  north: {
    top: 10,
  },
  east: {
    right: 10,
  },
  south: {
    bottom: 10,
  },
  west: {
    left: 10,
  },
});

export default CompassScreen;
