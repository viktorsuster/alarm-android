import React, { useEffect, useState } from 'react';
import { NativeEventEmitter, NativeModules, StyleSheet, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { AlarmProvider } from './src/context/AlarmContext';
import { RadioProvider } from './src/context/RadioContext';
import AlarmModal from './src/components/AlarmModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';

const ALARM_KEY = 'single_alarm';

const App = (props: any): React.JSX.Element => {
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

    const eventEmitter = new NativeEventEmitter(NativeModules.AlarmModule);
    const subscription = eventEmitter.addListener('onAlarmTrigger', (event) => {
      if (event && event.message) {
        handleAlarmEvent(event.message);
      }
    });

    if (props && props.notificationAction === 'stop_alarm' && props.alarmMessage) {
        handleAlarmEvent(props.alarmMessage);
    }
    
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
  }, [props]);

  return (
    <PaperProvider>
      <View style={styles.container}>
        <AlarmProvider showModal={showModal}>
          <RadioProvider>
            <AppNavigator />
          </RadioProvider>
          <AlarmModal visible={isModalVisible} message={modalMessage} onDismiss={hideModal} />
        </AlarmProvider>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
