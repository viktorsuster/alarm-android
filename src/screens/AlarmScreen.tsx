import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, NativeModules, Platform, PermissionsAndroid, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import { Button, Text, IconButton, TextInput, TouchableRipple, Divider, Modal, Portal } from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import SavedAlarmsModal, { Alarm } from '../components/SavedAlarmsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import SuccessModal from '../components/SuccessModal';

// Povoľte prehrávanie zvuku aj v tichom režime
Sound.setCategory('Playback');

const { AlarmModule } = NativeModules;

const SOUNDS = [
    { label: 'Zvuk 1', value: 'alarm_sound_1' },
    { label: 'Zvuk 2', value: 'alarm_sound_2' },
    { label: 'Zvuk 3', value: 'alarm_sound_3' },
    { label: 'Zvuk 4', value: 'alarm_sound_4' },
];

const ALARM_KEY = 'single_alarm';
const SAVED_ALARMS_KEY = 'saved_alarms';

const AlarmScreen = () => {
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [selectedSound, setSelectedSound] = useState(SOUNDS[0].value);
  const [message, setMessage] = useState('');
  const [playingSoundInstance, setPlayingSoundInstance] = useState<Sound | null>(null);
  const [currentlyPlayingSoundName, setCurrentlyPlayingSoundName] = useState<string | null>(null);
  const [isSoundModalVisible, setIsSoundModalVisible] = useState(false);
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const [tempMessage, setTempMessage] = useState('');
  const [isSavedAlarmsModalVisible, setIsSavedAlarmsModalVisible] = useState(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [alarmCandidate, setAlarmCandidate] = useState<Date | null>(null);


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

  const showSoundModal = () => setIsSoundModalVisible(true);
  const hideSoundModal = () => setIsSoundModalVisible(false);

  const handleSelectSound = (soundValue: string) => {
    setSelectedSound(soundValue);
    hideSoundModal();
  };

  const showMessageModal = () => {
    setTempMessage(message);
    setIsMessageModalVisible(true);
  };

  const hideMessageModal = () => {
    setIsMessageModalVisible(false);
  };

  const handleSaveMessage = () => {
    setMessage(tempMessage);
    hideMessageModal();
  };

  const handleEditAlarm = (alarm: Alarm) => {
    setDate(new Date(alarm.timestamp));
    setMessage(alarm.message);
    setSelectedSound(alarm.soundName);
    setEditingAlarmId(alarm.id);
  };

  const handleSetAlarm = async () => {
    if (!alarmCandidate) return;

    try {
      const alarmDate = alarmCandidate;
      if (alarmDate.getTime() <= Date.now()) {
        Alert.alert('Chyba', 'Vybraný čas musí byť v budúcnosti.');
        return;
      }

      const allPermissionsGranted = await requestPermissions();
      if (!allPermissionsGranted) {
          return;
      }

      const currentAlarmsJson = await AsyncStorage.getItem(SAVED_ALARMS_KEY);
      const currentAlarms: Alarm[] = currentAlarmsJson ? JSON.parse(currentAlarmsJson) : [];

      const alarmData: Alarm = {
        id: editingAlarmId || Date.now().toString(),
        timestamp: alarmDate.getTime(),
        soundName: selectedSound,
        message: message || 'Budík',
      };

      let newAlarms: Alarm[];

      if (editingAlarmId) {
        let wasUpdated = false;
        newAlarms = currentAlarms.map(alarm => {
            if (alarm.id === editingAlarmId) {
                wasUpdated = true;
                return alarmData;
            }
            return alarm;
        });

        if (!wasUpdated) {
            newAlarms.push(alarmData);
        }
      } else {
        newAlarms = [...currentAlarms, alarmData];
      }
      
      await AsyncStorage.setItem(SAVED_ALARMS_KEY, JSON.stringify(newAlarms));
      await AlarmModule.setAlarm(alarmData.id, alarmData.timestamp, alarmData.soundName, alarmData.message);
      
      setSuccessMessage(`Alarm bol nastavený na ${alarmDate.toLocaleString()}`);
      setIsSuccessModalVisible(true);

      // Reset form state
      setDate(new Date());
      setMessage('');
      setSelectedSound(SOUNDS[0].value);
      setEditingAlarmId(null);
      
    } catch (error: any) {
      console.error('Chyba pri nastavovaní alarmu:', error);
      Alert.alert('Chyba', `Nepodarilo sa nastaviť alarm. (${error.message})`);
    }
  };

  const confirmAndSetAlarm = () => {
    handleSetAlarm();
    setIsConfirmationModalVisible(false);
  }

  const handleDateTimeConfirm = (selectedDate: Date) => {
    setOpen(false);
    setDate(selectedDate);
    setAlarmCandidate(selectedDate);
    setIsConfirmationModalVisible(true);
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
    <SafeAreaView style={styles.container}>
      <Portal>
        <Modal visible={isSoundModalVisible} onDismiss={hideSoundModal} contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Poriadny Zvuk</Text>
            <IconButton icon="close" size={24} onPress={hideSoundModal} iconColor="#B0B0B0" />
          </View>
          {SOUNDS.map((sound, index) => {
              const isPlaying = currentlyPlayingSoundName === sound.value;
              const isSelected = selectedSound === sound.value;
              return (
                  <React.Fragment key={sound.value}>
                      <TouchableRipple onPress={() => handleSelectSound(sound.value)} style={styles.soundItemRipple}>
                          <View style={styles.soundItem}>
                              <Icon 
                                name={isSelected ? 'radiobox-marked' : 'radiobox-blank'} 
                                size={24} 
                                color={isSelected ? '#ff4500' : '#B0B0B0'} 
                              />
                              <Text style={styles.soundLabel}>{sound.label}</Text>
                              <IconButton
                                  icon={isPlaying ? 'stop' : 'play'}
                                  iconColor={isPlaying ? '#ff4500' : '#E0E0E0'}
                                  size={24}
                                  onPress={() => handleSoundPreview(sound.value)}
                              />
                          </View>
                      </TouchableRipple>
                      {index < SOUNDS.length - 1 && <Divider style={styles.divider} />}
                  </React.Fragment>
              );
          })}
        </Modal>
        <Modal visible={isMessageModalVisible} onDismiss={hideMessageModal} contentContainerStyle={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Správa pripomienky</Text>
              <IconButton icon="close" size={24} onPress={hideMessageModal} iconColor="#B0B0B0" />
            </View>
            <View style={styles.messageModalContent}>
              <TextInput
                  label="Čo ti mám pripomenúť?"
                  value={tempMessage}
                  onChangeText={setTempMessage}
                  style={styles.input}
                  mode="outlined"
                  outlineColor="#333"
                  activeOutlineColor="#ff4500"
                  theme={{ 
                      colors: { 
                          primary: '#ff4500',
                          text: '#FFFFFF', 
                          placeholder: '#B0B0B0',
                          background: '#1E1E1E',
                      },
                      dark: true,
                  }}
              />
              <Button mode="contained" onPress={handleSaveMessage} style={styles.saveButton} labelStyle={styles.saveButtonLabel}>
                  Uložiť
              </Button>
            </View>
        </Modal>
        <SavedAlarmsModal 
          visible={isSavedAlarmsModalVisible} 
          onDismiss={() => setIsSavedAlarmsModalVisible(false)}
          onEdit={handleEditAlarm}
        />
        {alarmCandidate && (
            <ConfirmationModal 
                visible={isConfirmationModalVisible}
                onDismiss={() => setIsConfirmationModalVisible(false)}
                onConfirm={confirmAndSetAlarm}
                details={{
                    date: alarmCandidate,
                    message: message || 'Budík',
                    soundLabel: SOUNDS.find(s => s.value === selectedSound)?.label || ''
                }}
            />
        )}
        <SuccessModal
            visible={isSuccessModalVisible}
            onDismiss={() => setIsSuccessModalVisible(false)}
            message={successMessage}
        />
      </Portal>

      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.greeting}>Nazdar Marek</Text>
        <Icon name="skull-crossbones" size={80} color="#E0E0E0" style={styles.skullIcon} />
        
        <View style={styles.section}>
            <TouchableOpacity onPress={() => setOpen(true)} style={styles.timePickerButton}>
                <Text style={styles.timeText}>
                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.dateText}>
                    {date.toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
                <Text style={styles.timePickerSubtitle}>
                    Nastav pripomienku, na ktorú nezabudneš
                </Text>
            </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableRipple onPress={showMessageModal} style={styles.messageButton}>
              <View style={styles.messageButtonContent}>
                  <View>
                      <Text style={styles.messageLabel}>Správa</Text>
                      <Text style={styles.messageValue} numberOfLines={1}>
                          {message || 'Žiadna správa'}
                      </Text>
                  </View>
                  <Icon name="chevron-right" size={24} color="#E0E0E0" />
              </View>
          </TouchableRipple>
        </View>

        <View style={styles.section}>
            <TouchableRipple onPress={showSoundModal} style={styles.soundPickerButton}>
                <View style={styles.soundPickerButtonContent}>
                    <View>
                        <Text style={styles.soundPickerLabel}>Zvuk</Text>
                        <Text style={styles.soundPickerValue}>
                            {SOUNDS.find(s => s.value === selectedSound)?.label || 'Vybrať zvuk'}
                        </Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="#E0E0E0" />
                </View>
            </TouchableRipple>
        </View>

        <View style={styles.section}>
            <TouchableRipple onPress={() => setIsSavedAlarmsModalVisible(true)} style={styles.savedAlarmsButton}>
                <View style={styles.savedAlarmsButtonContent}>
                    <Icon name="history" size={24} color="#E0E0E0" />
                    <Text style={styles.savedAlarmsButtonText}>Uložené pripomienky</Text>
                    <Icon name="chevron-right" size={24} color="#E0E0E0" />
                </View>
            </TouchableRipple>
        </View>

        <DatePicker
          modal
          open={open}
          date={date}
          onConfirm={handleDateTimeConfirm}
          onCancel={() => {
            setOpen(false);
          }}
          title="Vyberte čas budíka"
          confirmText="Nastaviť"
          cancelText="Zrušiť"
          theme="dark"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    width: '100%',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'sans-serif-condensed',
  },
  skullIcon: {
    alignSelf: 'center',
    marginVertical: 30,
  },
  section: {
    marginVertical: 10,
  },
  timePickerButton: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#B0B0B0',
    fontSize: 16,
    marginTop: 5,
  },
  timePickerSubtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 15,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#1E1E1E',
  },
  messageButton: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  messageButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageLabel: {
    color: '#B0B0B0',
    fontSize: 12,
  },
  messageValue: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  soundPickerButton: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  soundPickerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  soundPickerLabel: {
    color: '#B0B0B0',
    fontSize: 12,
  },
  soundPickerValue: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 15,
    backgroundColor: '#252525',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#E0E0E0',
    fontSize: 18,
    fontWeight: '600',
  },
  messageModalContent: {
    padding: 15,
  },
  saveButton: {
    marginTop: 15,
    backgroundColor: '#ff4500',
  },
  saveButtonLabel: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    color: '#E0E0E0',
    fontSize: 18,
    fontWeight: '600',
    padding: 15,
    textAlign: 'center',
    backgroundColor: '#252525',
  },
  soundItemRipple: {
    paddingHorizontal: 15,
  },
  soundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  divider: {
    backgroundColor: '#333',
    marginLeft: 54, // Align with text
  },
  soundLabel: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 15,
  },
  savedAlarmsButton: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  savedAlarmsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedAlarmsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
    marginLeft: 15,
  },
});

export default AlarmScreen;
