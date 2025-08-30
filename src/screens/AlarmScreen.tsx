
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, NativeModules, Platform, PermissionsAndroid, StatusBar, TouchableOpacity, ScrollView, Dimensions, FlatList } from 'react-native';
import { Button, Text, IconButton, TextInput, TouchableRipple, Divider, Modal, Portal, FAB, Switch, Chip } from 'react-native-paper';
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
    enabled: boolean;
    repeat?: 'daily' | 'weekly';
    days?: number[];
}

type Props = BottomTabScreenProps<RootTabParamList, 'Alarm'>;

const WEEK_DAYS = ['P', 'U', 'S', 'Š', 'P', 'S', 'N'];

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
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly'>('none');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const loadAlarms = async () => {
        const alarmsJson = await AsyncStorage.getItem(SAVED_ALARMS_KEY);
        if (alarmsJson) {
          let alarms: Alarm[] = JSON.parse(alarmsJson);
          alarms = alarms.map(alarm => ({ ...alarm, enabled: alarm.enabled ?? true }));
          alarms.sort((a, b) => a.timestamp - b.timestamp);
          setSavedAlarms(alarms);
        } else {
          setSavedAlarms([]);
        }
      };
      loadAlarms();
    }, [])
  );

  const handleConfirmDate = (selectedDate: Date) => {
    setOpen(false);
    if (repeat === 'none') {
        setDate(selectedDate);
    } else {
        const newDate = new Date(date);
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
        setDate(newDate);
    }
  };

  const handleToggleAlarm = async (alarmId: string) => {
    const newAlarms = savedAlarms.map(alarm => {
        if (alarm.id === alarmId) {
            return { ...alarm, enabled: !alarm.enabled };
        }
        return alarm;
    });

    const toggledAlarm = newAlarms.find(alarm => alarm.id === alarmId);
    if (!toggledAlarm) return;

    if (Platform.OS === 'android') {
        if (toggledAlarm.enabled) {
            if (toggledAlarm.timestamp <= Date.now()) {
                Alert.alert('Chyba', 'Čas tejto pripomienky už uplynul. Upravte ju, prosím, ak ju chcete znovu aktivovať.');
                const originalAlarms = savedAlarms;
                setSavedAlarms(originalAlarms);
                return;
            }
            await AlarmModule.setAlarm(toggledAlarm.id, toggledAlarm.timestamp, toggledAlarm.soundName, toggledAlarm.message, toggledAlarm.repeat, toggledAlarm.days);
        } else {
            await AlarmModule.cancelAlarm(toggledAlarm.id);
        }
    }

    await AsyncStorage.setItem(SAVED_ALARMS_KEY, JSON.stringify(newAlarms));
    setSavedAlarms(newAlarms);
  };

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
    setRepeat('none');
    setSelectedDays([]);
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
    setRepeat(alarm.repeat || 'none');
    setSelectedDays(alarm.days || []);
    setEditingAlarmId(alarm.id);
    setIsAddEditModalVisible(true);
  };

  const handleDeleteAlarm = (alarmId: string) => {
    Alert.alert(
      'Chceš vymazac?',
      'Isto?',
      [
        { text: 'Zrušiť', style: 'cancel' },
        {
          text: 'Vymaž do piči',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS === 'android') {
                await AlarmModule.cancelAlarm(alarmId);
            }
            const newAlarms = savedAlarms.filter(alarm => alarm.id !== alarmId);
            await AsyncStorage.setItem(SAVED_ALARMS_KEY, JSON.stringify(newAlarms));
            setSavedAlarms(newAlarms);
            hideAddEditModal();
          }
        }
      ]
    );
  };

  const handleSetAlarm = async () => {
    try {
      let alarmTimestamp = date.getTime();
      let effectiveDate = new Date(date);

      if (repeat !== 'none') {
        const now = new Date();
        effectiveDate.setSeconds(0);
        effectiveDate.setMilliseconds(0);

        if (repeat === 'daily') {
          if (effectiveDate.getTime() <= now.getTime()) {
            effectiveDate.setDate(effectiveDate.getDate() + 1);
          }
        } else if (repeat === 'weekly') {
          if (selectedDays.length === 0) {
            Alert.alert('Chyba', 'Pre týždenné opakovanie musíte zvoliť aspoň jeden deň.');
            return;
          }
          
          const currentDay = (now.getDay() + 6) % 7; // Pondelok = 0
          const sortedDays = [...selectedDays].sort((a, b) => a - b);
          let dayOffset = -1;

          for (const day of sortedDays) {
            if (day > currentDay) {
              dayOffset = day - currentDay;
              break;
            }
            if (day === currentDay) {
              const potentialTimestamp = new Date(now);
              potentialTimestamp.setHours(effectiveDate.getHours());
              potentialTimestamp.setMinutes(effectiveDate.getMinutes());
              if (potentialTimestamp.getTime() > now.getTime()) {
                dayOffset = 0;
                break;
              }
            }
          }

          if (dayOffset === -1) {
            const firstDayNextWeek = sortedDays[0];
            dayOffset = (7 - currentDay) + firstDayNextWeek;
          }

          effectiveDate = new Date(now);
          effectiveDate.setDate(now.getDate() + dayOffset);
          effectiveDate.setHours(date.getHours());
          effectiveDate.setMinutes(date.getMinutes());
        }
        alarmTimestamp = effectiveDate.getTime();
      }

      if (alarmTimestamp <= Date.now() && repeat === 'none') {
        Alert.alert('Chyba', 'Vybraný čas musí byť v budúcnosti.');
        return;
      }

      const allPermissionsGranted = await requestPermissions();
      if (!allPermissionsGranted) return;

      const currentAlarmsJson = await AsyncStorage.getItem(SAVED_ALARMS_KEY);
      const currentAlarms: Alarm[] = currentAlarmsJson ? JSON.parse(currentAlarmsJson) : [];

      const alarmData: Alarm = {
        id: editingAlarmId || Date.now().toString(),
        timestamp: alarmTimestamp,
        soundName: selectedSound,
        message: message || 'Budík',
        enabled: true,
        repeat: repeat === 'none' ? undefined : repeat,
        days: repeat === 'weekly' ? selectedDays : undefined,
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
      
      await AlarmModule.setAlarm(alarmData.id, alarmData.timestamp, alarmData.soundName, alarmData.message, alarmData.repeat, alarmData.days);
      
      const timeString = effectiveDate.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
      let finalSuccessMessage = '';

      switch (repeat) {
        case 'daily':
          finalSuccessMessage = `Pripomienka je nastavená denne na ${timeString}.`;
          break;
        case 'weekly':
          const dayNames = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];
          const selectedDayNames = selectedDays.map(d => dayNames[d]).join(', ');
          finalSuccessMessage = `Pripomienka je nastavená na dni ${selectedDayNames} na ${timeString}.`;
          break;
        default: // 'none'
          finalSuccessMessage = `Pripomienka je nastavená na ${effectiveDate.toLocaleString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}.`;
          break;
      }
      
      setSuccessMessage(finalSuccessMessage);
      setIsSuccessModalVisible(true);
      hideAddEditModal();
      
    } catch (error: any) {
      console.error('Chyba pri nastavovaní alarmu:', error);
      Alert.alert('Chyba', `Nepodarilo sa nastaviť alarm. (${error.message})`);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex) 
        : [...prev, dayIndex].sort((a, b) => a - b)
    );
  };

  const renderAlarmItem = ({ item }: { item: Alarm }) => (
    <TouchableRipple onPress={() => handleEditAlarm(item)} style={styles.itemRipple}>
        <View style={styles.itemContainer}>
            <View style={styles.itemTextContainer}>
                <Text style={[styles.itemDate, !item.enabled && styles.disabledText]}>
                    {new Date(item.timestamp).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={[styles.itemFullDate, !item.enabled && styles.disabledText]}>
                    {item.repeat ? getRepeatText(item) : new Date(item.timestamp).toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
                <Text style={[styles.itemMessage, !item.enabled && styles.disabledText]}>{item.message}</Text>
            </View>
            <View style={styles.itemActions}>
                <Switch value={item.enabled} onValueChange={() => handleToggleAlarm(item.id)} color="#ff4500" />
            </View>
        </View>
    </TouchableRipple>
  );

  const getRepeatText = (item: Alarm) => {
    let repeatText = 'Jednorazová';
    if (item.repeat === 'daily') {
        repeatText = 'Denne';
    } else if (item.repeat === 'weekly' && item.days && item.days.length > 0) {
        const dayNames = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];
        repeatText = item.days.map(d => dayNames[d]).join(', ');
        if (item.days.length === 7) repeatText = 'Denne';
        else if (item.days.length === 2 && item.days.includes(5) && item.days.includes(6)) repeatText = 'Víkendy';
        else if (item.days.length === 5 && !item.days.includes(5) && !item.days.includes(6)) repeatText = 'Pracovné dni';
    }
    return repeatText;
  }

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Dobré ráno, Marek 🙂';
    if (hour < 18) return 'Pekný deň, Marek 👋';
    return 'Príjemný večer, Marek 🌙';
  };

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
                  {repeat === 'none' && (
                    <Text style={styles.dateText}>
                        {date.toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>
                  )}
              </TouchableOpacity>
              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Opakovanie</Text>
              <View style={styles.chipContainer}>
                  <Chip selected={repeat === 'none'} onPress={() => setRepeat('none')} style={styles.chip}>Neopakovať</Chip>
                  <Chip selected={repeat === 'daily'} onPress={() => setRepeat('daily')} style={styles.chip}>Denne</Chip>
                  <Chip selected={repeat === 'weekly'} onPress={() => setRepeat('weekly')} style={styles.chip}>Týždenne</Chip>
              </View>

              {repeat === 'weekly' && (
                <View style={styles.weekDaysContainer}>
                  {WEEK_DAYS.map((day, index) => (
                    <TouchableOpacity key={index} onPress={() => toggleDay(index)} style={[styles.dayButton, selectedDays.includes(index) && styles.dayButtonSelected]}>
                      <Text style={[styles.dayText, selectedDays.includes(index) && styles.dayTextSelected]}>{day}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.divider} />
              
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
              {editingAlarmId && (
                <Button 
                    mode="outlined" 
                    onPress={() => handleDeleteAlarm(editingAlarmId)} 
                    style={styles.deleteModalButton}
                    labelStyle={styles.deleteModalButtonLabel}
                    icon="delete-outline"
                >
                    Zmazať pripomienku
                </Button>
              )}
              <Button mode="contained" onPress={handleSetAlarm} style={styles.finalSaveButton} labelStyle={styles.saveButtonLabel}>
                  {editingAlarmId ? 'Uložiť zmeny' : 'Uložiť pripomienku'}
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
        <Text style={styles.greeting}>{getGreeting()}</Text>
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

      <DatePicker modal open={open} date={date} onConfirm={handleConfirmDate} onCancel={() => setOpen(false)} title="Vyberte čas a dátum" confirmText="Potvrdiť" cancelText="Zrušiť" theme="dark" mode={repeat === 'none' ? 'datetime' : 'time'} />
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
  deleteModalButton: {
    borderColor: '#ff4500',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
  },
  deleteModalButtonLabel: {
    color: '#ff4500',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 15,
  },
  sectionTitle: {
    color: '#E0E0E0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  chip: {
    backgroundColor: '#2C2C2E',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
  },
  dayButtonSelected: {
    backgroundColor: '#ff4500',
  },
  dayText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dayTextSelected: {
    color: '#FFFFFF',
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
  soundLabel: { flex: 1, color: '#FFFFFF', fontSize: 16, marginLeft: 15 },
  itemRipple: {
    borderRadius: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
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
    marginLeft: 10,
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
  disabledText: {
    color: '#888',
  },
});

export default AlarmScreen;
