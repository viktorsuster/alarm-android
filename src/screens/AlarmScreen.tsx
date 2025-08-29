import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, NativeModules, Platform, PermissionsAndroid } from 'react-native';
import { Button, Title, RadioButton, Text, IconButton, TextInput } from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';

// Povoľte prehrávanie zvuku aj v tichom režime
Sound.setCategory('Playback');

const { AlarmModule } = NativeModules;

const SOUNDS = [
    { label: 'Zvuk 1', value: 'alarm_sound_1' },
    { label: 'Zvuk 2', value: 'alarm_sound_2' },
    { label: 'Zvuk 3', value: 'alarm_sound_3' },
];

const ALARM_KEY = 'single_alarm';

const AlarmScreen = () => {
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [selectedSound, setSelectedSound] = useState(SOUNDS[0].value);
  const [message, setMessage] = useState('');
  const [playingSoundInstance, setPlayingSoundInstance] = useState<Sound | null>(null);
  const [currentlyPlayingSoundName, setCurrentlyPlayingSoundName] = useState<string | null>(null);

  // Načítanie uloženého alarmu pri štarte
  useEffect(() => {
    const loadAlarm = async () => {
      const storedAlarm = await AsyncStorage.getItem(ALARM_KEY);
      if (storedAlarm) {
        const { message, soundName } = JSON.parse(storedAlarm);
        setMessage(message);
        setSelectedSound(soundName);
      }
    };
    loadAlarm();
  }, []);
  
  const handleSoundPreview = (soundName: string) => {
    // Zastavíme akýkoľvek aktuálne prehrávaný zvuk
    if (playingSoundInstance) {
        playingSoundInstance.stop();
        playingSoundInstance.release();
    }

    // Ak používateľ klikol na ten istý zvuk, ktorý hral, funguje to ako "stop"
    if (currentlyPlayingSoundName === soundName) {
        setPlayingSoundInstance(null);
        setCurrentlyPlayingSoundName(null);
        return;
    }
    
    const sound = new Sound(`${soundName}.wav`, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
            console.log('failed to load the sound', error);
            Alert.alert('Chyba', 'Nepodarilo sa načítať zvuk.');
            return;
        }
        setPlayingSoundInstance(sound);
        setCurrentlyPlayingSoundName(soundName);
        sound.play((success) => {
            if (!success) {
                console.log('playback failed due to audio decoding errors');
            }
            // Resetujeme stav po dohraní
            setPlayingSoundInstance(null);
            setCurrentlyPlayingSoundName(null);
            sound.release();
        });
    });
  };
  
  // Upratovanie pri odchode z obrazovky
  useEffect(() => {
    return () => {
      if (playingSoundInstance) {
        playingSoundInstance.stop();
        playingSoundInstance.release();
      }
    };
  }, [playingSoundInstance]);

  const requestPermissions = async () => {
      // Povolenie pre notifikácie (Android 13+)
      if (Platform.OS === 'android' && Platform.Version >= 33) {
          const notificationStatus = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
          if (notificationStatus !== PermissionsAndroid.RESULTS.GRANTED) {
              Alert.alert('Chyba', 'Povolenie pre notifikácie je potrebné na zobrazenie alarmu.');
              return false;
          }
      }

      // Povolenie pre presné alarmy (Android 12+)
      if (Platform.OS === 'android' && Platform.Version >= 31) {
          const hasPermission = await AlarmModule.checkAndRequestExactAlarmPermission();
          if (!hasPermission) {
              Alert.alert(
                  'Povolenie je potrebné',
                  'Aplikácia bola presmerovaná do nastavení. Prosím, povoľte alarmy a skúste to znova.',
                  [{ text: 'OK' }]
              );
              return false;
          }
      }

      return true;
  };

  const handleSetAlarm = async (alarmDate: Date) => {
    try {
      if (alarmDate.getTime() <= Date.now()) {
        Alert.alert('Chyba', 'Vybraný čas musí byť v budúcnosti.');
        return;
      }

      console.log('Kontrolujem a žiadam o povolenia...');
      const allPermissionsGranted = await requestPermissions();
      console.log('Všetky povolenia udelené?:', allPermissionsGranted);
      
      if (!allPermissionsGranted) {
          return;
      }

      const alarmData = {
        timestamp: alarmDate.getTime(),
        soundName: selectedSound,
        message: message || 'Budík', // Default message
      };
      
      await AsyncStorage.setItem(ALARM_KEY, JSON.stringify(alarmData));
      await AlarmModule.setAlarm(alarmData.timestamp, alarmData.soundName, alarmData.message);
      
      Alert.alert('Alarm nastavený', `Alarm bol nastavený na ${alarmDate.toLocaleString()}`);
    } catch (error: any) {
      console.error('Chyba pri nastavovaní alarmu:', error);
      Alert.alert('Chyba', `Nepodarilo sa nastaviť alarm. (${error.message})`);
    }
  };

  const handleStopAlarm = async () => {
      try {
          await AlarmModule.stopAlarm();
          Alert.alert('Alarm vypnutý');
      } catch (error) {
          console.error('Chyba pri vypínaní alarmu:', error);
      }
  };

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/reminder.json')}
        autoPlay
        loop
        style={styles.lottie}
      />
      
      <Title>Nastaviť pripomienku</Title>
      
      <TextInput
        label="Správa pripomienky"
        value={message}
        onChangeText={setMessage}
        style={styles.input}
      />
      
      <View style={styles.soundPickerContainer}>
          <Text variant="titleMedium">Vyberte zvuk:</Text>
          <RadioButton.Group onValueChange={newValue => setSelectedSound(newValue)} value={selectedSound}>
              {SOUNDS.map(sound => {
                  const isPlaying = currentlyPlayingSoundName === sound.value;
                  return (
                      <View key={sound.value} style={styles.radioButtonContainer}>
                          <RadioButton value={sound.value} />
                          <Text style={styles.soundLabel}>{sound.label}</Text>
                          <IconButton
                              icon={isPlaying ? 'stop-circle-outline' : 'play-circle-outline'}
                              size={24}
                              onPress={() => handleSoundPreview(sound.value)}
                          />
                      </View>
                  );
              })}
          </RadioButton.Group>
      </View>

      <Button mode="contained" onPress={() => setOpen(true)} style={styles.button}>
        Vybrať čas a nastaviť alarm
      </Button>
      <DatePicker
        modal
        open={open}
        date={date}
        onConfirm={(selectedDate) => {
          setOpen(false);
          setDate(selectedDate);
          handleSetAlarm(selectedDate);
        }}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  lottie: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  soundPickerContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '60%',
    justifyContent: 'space-between',
  },
  soundLabel: {
    flex: 1,
  },
  button: {
    marginTop: 16,
  },
  input: {
    width: '80%',
    marginBottom: 10,
  },
});

export default AlarmScreen;
