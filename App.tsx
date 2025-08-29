import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, NativeEventEmitter, NativeModules } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import AlarmScreen from './src/screens/AlarmScreen';
import { AlarmProvider } from './src/context/AlarmContext';
import AlarmModal from './src/components/AlarmModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ALARM_KEY = 'single_alarm';

const AppContent = ({ initialProps }: { initialProps: any }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const showModal = (message: string) => {
    setModalMessage(message);
    setIsModalVisible(true);
  };

  const hideModal = () => setIsModalVisible(false);

  useEffect(() => {
    const handleAlarmEvent = (message: string) => {
      showModal(message);
    };

    // Listener pre warm start
    const eventEmitter = new NativeEventEmitter(NativeModules.AlarmModule);
    const subscription = eventEmitter.addListener('onAlarmTrigger', (event) => {
      if (event && event.message) {
        handleAlarmEvent(event.message);
      }
    });

    // Spracovanie pre cold start
    if (initialProps && initialProps.notificationAction === 'stop_alarm' && initialProps.alarmMessage) {
        handleAlarmEvent(initialProps.alarmMessage);
    }
    
    // Kontrola stavu v AsyncStorage pri štarte
    const checkRingingState = async () => {
        const storedAlarm = await AsyncStorage.getItem(ALARM_KEY);
        if (storedAlarm) {
            const alarmData = JSON.parse(storedAlarm);
            if (alarmData.isRinging) {
                showModal(alarmData.message);
            }
        }
    };
    checkRingingState();

    return () => {
      subscription.remove();
    };
  }, [initialProps]);

  return (
    <AlarmProvider showModal={showModal}>
      <AlarmScreen />
      <AlarmModal visible={isModalVisible} message={modalMessage} onDismiss={hideModal} />
    </AlarmProvider>
  );
};

function App(props: any): React.JSX.Element {
  return (
    <PaperProvider>
        <SafeAreaView style={styles.container}>
          <AppContent initialProps={props} />
        </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
