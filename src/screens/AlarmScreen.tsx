
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, NativeModules, Platform, PermissionsAndroid, StatusBar, TouchableOpacity, ScrollView, Dimensions, FlatList } from 'react-native';
import { Button, Text, IconButton, TextInput, TouchableRipple, Divider, Modal, Portal, FAB } from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import SuccessModal from '../components/SuccessModal';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../navigation/AppNavigator';
import { useFocusEffect } from '@react-navigation/native';

// Povoľte prehrávanie zvuku aj v tichom režime
Sound.setCategory('Playback');

const { AlarmModule } = NativeModules;

const SOUNDS = [
    { label: 'Zvonenie', value: 'alarm_sound_1' },
    { label: 'Somár', value: 'alarm_sound_2' },
    { label: 'Alarm', value: 'alarm_sound_3' },
    { label: 'Nirvana', value: 'alarm_sound_4' },
    { label: 'HATATA', value: 'alarm_sound_5' },
    { label: 'Detský plač', value: 'alarm_sound_6' },
    { label: 'Kohút', value: 'alarm_sound_7' },
    { label: 'Metal', value: 'alarm_sound_8' },
    { label: 'Gitara', value: 'alarm_sound_9' },
];

const SAVED_ALARMS_KEY = 'saved_alarms';

export interface Alarm {
    id: string;
    timestamp: number;
    message: string;
    soundName: string;
}

type Props = BottomTabScreenProps<RootTabParamList, 'Alarm'>;

const AlarmScreen = ({ navigation, route }: Props) => {
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [selectedSound, setSelectedSound] = useState(SOUNDS[0].value);
  const [message, setMessage] = useState('');
  const [playingSoundInstance, setPlayingSoundInstance] = useState<Sound | null>(null);
  const [currentlyPlayingSoundName, setCurrentlyPlayingSoundName] = useState<string | null>(null);
  const [isSoundModalVisible, setIsSoundModalVisible] = useState(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isAddEditModalVisible, setIsAddEditModalVisible] = useState(false);
  const [savedAlarms, setSavedAlarms] = useState<Alarm[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const loadAlarms = async () => {
        const alarmsJson = await AsyncStorage.getItem(SAVED_ALARMS_KEY);
        if (alarmsJson) {
          const alarms: Alarm[] = JSON.parse(alarmsJson);
          alarms.sort((a, b) => a.timestamp - b.timestamp);
          setSavedAlarms(alarms);
        } else {
          setSavedAlarms([]);
        }
      };
      loadAlarms();
    }, [])
  );

  const handleSoundPreview = (soundName: string) => {
    if (playingSoundInstance) {
        playingSoundInstance.stop();
        playingSoundInstance.release();
    }
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
            if (!success) console.log('playback failed');
            setPlayingSoundInstance(null);
            setCurrentlyPlayingSoundName(null);
            sound.release();
        });
    });
  };
  
  useEffect(() => {
    return () => {
      if (playingSoundInstance) {
        playingSoundInstance.stop();
        playingSoundInstance.release();
      }
    };
  }, [playingSoundInstance]);

  const requestPermissions = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
          const notificationStatus = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
          if (notificationStatus !== PermissionsAndroid.RESULTS.GRANTED) {
              Alert.alert('Chyba', 'Povolenie pre notifikácie je potrebné na zobrazenie alarmu.');
              return false;
          }
      }
      if (Platform.OS === 'android' && Platform.Version >= 31) {
          const hasPermission = await AlarmModule.checkAndRequestExactAlarmPermission();
          if (!hasPermission) {
              Alert.alert('Povolenie je potrebné', 'Aplikácia bola presmerovaná do nastavení. Prosím, povoľte alarmy a skúste to znova.', [{ text: 'OK' }]);
              return false;
          }
      }
      return true;
  };

  const openNewAlarmModal = () => {
    setEditingAlarmId(null);
    setDate(new Date());
    setMessage('');
    setSelectedSound(SOUNDS[0].value);
    setIsAddEditModalVisible(true);
  };

  const hideAddEditModal = () => {
    setIsAddEditModalVisible(false);
    setEditingAlarmId(null);
  };
  
  const showSoundModal = () => setIsSoundModalVisible(true);
  const hideSoundModal = () => {
    if (playingSoundInstance) {
      playingSoundInstance.stop();
      playingSoundInstance.release();
      setPlayingSoundInstance(null);
      setCurrentlyPlayingSoundName(null);
    }
    setIsSoundModalVisible(false);
  };

  const handleSelectSound = (soundValue: string) => {
    setSelectedSound(soundValue);
    hideSoundModal();
  };

  const handleEditAlarm = (alarm: Alarm) => {
    setDate(new Date(alarm.timestamp));
    setMessage(alarm.message);
    setSelectedSound(alarm.soundName);
    setEditingAlarmId(alarm.id);
    setIsAddEditModalVisible(true);
  };

  const handleDeleteAlarm = (alarmId: string) => {
    Alert.alert(
      'Zmazať pripomienku',
      'Naozaj chcete natrvalo zmazať túto pripomienku?',
      [
        { text: 'Zrušiť', style: 'cancel' },
        {
          text: 'Zmazať',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS === 'android') {
                await AlarmModule.cancelAlarm(alarmId);
            }
            const newAlarms = savedAlarms.filter(alarm => alarm.id !== alarmId);
            await AsyncStorage.setItem(SAVED_ALARMS_KEY, JSON.stringify(newAlarms));
            setSavedAlarms(newAlarms);
          }
        }
      ]
    );
  };

  const handleSetAlarm = async () => {
    try {
      if (date.getTime() <= Date.now()) {
        Alert.alert('Chyba', 'Vybraný čas musí byť v budúcnosti.');
        return;
      }

      const allPermissionsGranted = await requestPermissions();
      if (!allPermissionsGranted) return;

      const currentAlarmsJson = await AsyncStorage.getItem(SAVED_ALARMS_KEY);
      const currentAlarms: Alarm[] = currentAlarmsJson ? JSON.parse(currentAlarmsJson) : [];

      const alarmData: Alarm = {
        id: editingAlarmId || Date.now().toString(),
        timestamp: date.getTime(),
        soundName: selectedSound,
        message: message || 'Budík',
      };

      let newAlarms: Alarm[];
      if (editingAlarmId) {
        newAlarms = currentAlarms.map(alarm => alarm.id === editingAlarmId ? alarmData : alarm);
      } else {
        newAlarms = [...currentAlarms, alarmData];
      }
      
      const newAlarmsSorted = newAlarms.sort((a, b) => a.timestamp - b.timestamp);
      await AsyncStorage.setItem(SAVED_ALARMS_KEY, JSON.stringify(newAlarmsSorted));
      setSavedAlarms(newAlarmsSorted);
      
      await AlarmModule.setAlarm(alarmData.id, alarmData.timestamp, alarmData.soundName, alarmData.message);
      
      setSuccessMessage(`Pripomienka bola nastavená na ${date.toLocaleString('sk-SK')}`);
      setIsSuccessModalVisible(true);
      hideAddEditModal();
      
    } catch (error: any) {
      console.error('Chyba pri nastavovaní alarmu:', error);
      Alert.alert('Chyba', `Nepodarilo sa nastaviť alarm. (${error.message})`);
    }
  };

  const renderAlarmItem = ({ item }: { item: Alarm }) => (
    <View style={styles.itemContainer}>
        <View style={styles.itemTextContainer}>
            <Text style={styles.itemDate}>
                {new Date(item.timestamp).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={styles.itemFullDate}>
                {new Date(item.timestamp).toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <Text style={styles.itemMessage}>{item.message}</Text>
        </View>
        <View style={styles.itemActions}>
            <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => handleEditAlarm(item)}>
                <Icon name="pencil-outline" size={20} color="#FFFFFF"/>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDeleteAlarm(item.id)}>
                <Icon name="delete-outline" size={20} color="#FFFFFF"/>
            </TouchableOpacity>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Portal>
        {/* Main Add/Edit Modal */}
        <Modal visible={isAddEditModalVisible} onDismiss={hideAddEditModal} contentContainerStyle={styles.addEditModalContainer}>
          <ScrollView>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingAlarmId ? 'Upraviť pripomienku' : 'Nová pripomienka'}</Text>
              <IconButton icon="close" size={24} onPress={hideAddEditModal} iconColor="#B0B0B0" />
            </View>
            <View style={styles.modalContentPadding}>
              <TouchableOpacity onPress={() => setOpen(true)} style={styles.timePickerButton}>
                  <Text style={styles.timeText}>
                      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.dateText}>
                      {date.toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </Text>
              </TouchableOpacity>
              <TextInput
                  label="Text pripomienky"
                  value={message}
                  onChangeText={setMessage}
                  style={styles.messageInput}
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
              <TouchableRipple onPress={showSoundModal} style={styles.modalOptionButton}>
                  <View style={styles.soundPickerButtonContent}>
                      <View>
                          <Text style={styles.soundPickerLabel}>Zvuk pripomienky</Text>
                          <Text style={styles.soundPickerValue}>{SOUNDS.find(s => s.value === selectedSound)?.label || 'Vybrať zvuk'}</Text>
                      </View>
                      <Icon name="chevron-right" size={24} color="#E0E0E0" />
                  </View>
              </TouchableRipple>
              <Button mode="contained" onPress={handleSetAlarm} style={styles.finalSaveButton} labelStyle={styles.saveButtonLabel}>
                  Uložiť pripomienku
              </Button>
            </View>
          </ScrollView>
        </Modal>

        {/* Sound Selection Modal */}
        <Modal visible={isSoundModalVisible} onDismiss={hideSoundModal} contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Zvuk pripomienky</Text>
            <IconButton icon="close" size={24} onPress={hideSoundModal} iconColor="#B0B0B0" />
          </View>
          <ScrollView>
            {SOUNDS.map((sound, index) => (
                <React.Fragment key={sound.value}>
                    <TouchableRipple onPress={() => handleSelectSound(sound.value)} style={styles.soundItemRipple}>
                        <View style={styles.soundItem}>
                            <Icon name={selectedSound === sound.value ? 'radiobox-marked' : 'radiobox-blank'} size={24} color={selectedSound === sound.value ? '#ff4500' : '#B0B0B0'} />
                            <Text style={styles.soundLabel}>{sound.label}</Text>
                            <IconButton icon={currentlyPlayingSoundName === sound.value ? 'stop' : 'play'} iconColor={currentlyPlayingSoundName === sound.value ? '#ff4500' : '#E0E0E0'} size={24} onPress={() => handleSoundPreview(sound.value)} />
                        </View>
                    </TouchableRipple>
                    {index < SOUNDS.length - 1 && <Divider style={styles.divider} />}
                </React.Fragment>
            ))}
          </ScrollView>
        </Modal>

        {/* Message Input Modal - REMOVED */}

        <SuccessModal visible={isSuccessModalVisible} onDismiss={() => setIsSuccessModalVisible(false)} message={successMessage} />
      </Portal>

      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.greeting}>Nazdar Marek</Text>
      </View>

      {savedAlarms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconButton
            icon="plus-circle-outline"
            iconColor="#ff4500"
            size={100}
            onPress={openNewAlarmModal}
            style={styles.addButton}
          />
          <Text style={styles.addButtonLabel}>Nová pripomienka</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
            <FlatList
                data={savedAlarms}
                renderItem={renderAlarmItem}
                keyExtractor={item => item.id}
                ItemSeparatorComponent={() => <Divider style={styles.listDivider}/>}
                contentContainerStyle={styles.listContentContainer}
            />
            <FAB
                style={styles.fab}
                icon="plus"
                onPress={openNewAlarmModal}
                color="#FFFFFF"
            />
        </View>
      )}

      <DatePicker modal open={open} date={date} onConfirm={(selectedDate) => { setOpen(false); setDate(selectedDate); }} onCancel={() => setOpen(false)} title="Vyberte čas a dátum" confirmText="Potvrdiť" cancelText="Zrušiť" theme="dark" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'sans-serif-condensed',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  addButton: {
    margin: 20,
  },
  addButtonLabel: {
    color: '#E0E0E0',
    fontSize: 18,
    fontWeight: '600',
    marginTop: -20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#ff4500',
  },
  addEditModalContainer: {
    backgroundColor: '#121212',
    flex: 1,
  },
  modalContentPadding: {
    padding: 20,
  },
  timePickerButton: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
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
  modalOptionButton: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  finalSaveButton: {
    backgroundColor: '#ff4500',
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 20,
  },
  messageButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageLabel: { color: '#B0B0B0', fontSize: 12 },
  messageValue: { color: '#FFFFFF', fontSize: 16 },
  soundPickerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  soundPickerLabel: { color: '#B0B0B0', fontSize: 12 },
  soundPickerValue: { color: '#FFFFFF', fontSize: 16 },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 15,
    paddingVertical: 5,
    backgroundColor: '#252525',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: { color: '#E0E0E0', fontSize: 18, fontWeight: '600' },
  messageModalContent: { padding: 15 },
  input: { backgroundColor: '#1E1E1E' },
  saveButtonLabel: { color: '#FFFFFF' },
  soundItemRipple: { paddingHorizontal: 15 },
  soundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  divider: { backgroundColor: '#333', marginLeft: 54 },
  soundLabel: { flex: 1, color: '#FFFFFF', fontSize: 16, marginLeft: 15 },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  itemTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  itemMessage: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 4,
  },
  itemDate: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  itemFullDate: {
    color: '#B0B0B0',
    fontSize: 14,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 25,
  },
  editButton: {
    backgroundColor: '#2C2C2E',
  },
  deleteButton: {
    backgroundColor: '#ff4500',
  },
  listDivider: {
    backgroundColor: '#333',
  },
  messageInput: {
    marginBottom: 15,
    backgroundColor: '#1E1E1E',
  },
});

export default AlarmScreen;
