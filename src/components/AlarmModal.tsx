import React from 'react';
import { Modal, Portal, Text, Button, PaperProvider } from 'react-native-paper';
import { useAlarm } from '../context/AlarmContext';
import { StyleSheet } from 'react-native';

const AlarmModal = () => {
    const { isRinging, alarmMessage, dismissAlarm } = useAlarm();

    return (
        <Portal>
            <Modal visible={isRinging} onDismiss={dismissAlarm} contentContainerStyle={styles.container}>
                <Text style={styles.title}>{alarmMessage || 'Budík'}</Text>
                <Text style={styles.subtitle}>Alarm zvoní!</Text>
                <Button mode="contained" onPress={dismissAlarm} style={styles.button}>
                    Vypnúť
                </Button>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
    },
    button: {
        marginTop: 10,
    }
});

export default AlarmModal;
