import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Sound from 'react-native-sound';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { RadioStackParamList } from '../navigation/AppNavigator';
import { useRadio } from '../context/RadioContext';

type RadioDetailScreenRouteProp = RouteProp<RadioStackParamList, 'RadioDetail'>;

type Props = {
  route: RadioDetailScreenRouteProp;
};

const RadioDetailScreen = ({ route }: Props) => {
  const { radioName, streamUrl } = route.params;
  const navigation = useNavigation();
  const { playingRadio, setPlayingRadio } = useRadio();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCurrentlyPlaying = playingRadio?.url === streamUrl;

  useEffect(() => {
    Sound.setCategory('Playback');

    // Stop and release sound when the screen is left
    return () => {
      if (playingRadio && playingRadio.sound && navigation.isFocused() === false) {
        setPlayingRadio(null);
      }
    };
  }, [navigation, playingRadio, setPlayingRadio]);


  const handlePlayStop = () => {
    if (isCurrentlyPlaying) {
      // Stop the current radio
      setPlayingRadio(null);
    } else {
      // Play new radio
      if (playingRadio) {
        // Another radio is playing
        Alert.alert(
          'Prehráva sa iné rádio',
          `Práve hrá rádio "${playingRadio.name}". Chcete ho zastaviť a spustiť "${radioName}"?`,
          [
            { text: 'Zrušiť', style: 'cancel' },
            {
              text: 'OK',
              onPress: () => startNewRadio(),
            },
          ]
        );
      } else {
        // No radio is playing
        startNewRadio();
      }
    }
  };

  const startNewRadio = () => {
    setIsLoading(true);
    setError(null);

    const newSound = new Sound(streamUrl, '', (error) => {
      setIsLoading(false);
      if (error) {
        console.log('failed to load the sound', error);
        setError('Nepodarilo sa načítať stream.');
        return;
      }
      newSound.play((success) => {
        if (!success) {
          console.log('playback failed due to audio decoding errors');
          setError('Prehrávanie zlyhalo.');
        }
        // When playback finishes, clear the playing radio
        setPlayingRadio(null);
      });
      setPlayingRadio({ name: radioName, url: streamUrl, sound: newSound });
    });
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#ff4500" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <View style={styles.controls}>
          <TouchableOpacity onPress={handlePlayStop} style={styles.button}>
            <Icon name={isCurrentlyPlaying ? 'stop-circle-outline' : 'play-circle-outline'} size={100} color="#ff4500" />
          </TouchableOpacity>
        </View>
      )}
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
  controls: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    margin: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 18,
  },
  loader: {
    marginTop: 20,
  }
});

export default RadioDetailScreen;
