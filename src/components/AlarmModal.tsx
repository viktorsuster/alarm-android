import React from 'react';
import { Modal, Portal, Text, Button } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { NativeModules } from 'react-native';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { AlarmModule } = NativeModules;

interface AlarmModalProps {
    visible: boolean;
    message: string;
    onDismiss: () => void;
}

const AlarmModal: React.FC<AlarmModalProps> = ({ visible, message, onDismiss }) => {

    const handleStopAlarm = async () => {
        try {
            await AlarmModule.stopAlarm();
            onDismiss();
        } catch (error) {
            console.error('Failed to stop alarm:', error);
        }
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={handleStopAlarm} contentContainerStyle={styles.container}>
                <Icon name="alarm-light-outline" size={60} color="#ff4500" />
                <Text style={styles.title}>Pripomienka</Text>
                <Text style={styles.subtitle}>{message || 'Budík'}</Text>
                <Button 
                    mode="contained" 
                    onPress={handleStopAlarm} 
                    style={styles.button}
                    labelStyle={styles.buttonLabel}
                    icon="alarm-off"
                >
                    Zastaviť
                </Button>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1E1E1E',
        padding: 30,
        margin: 20,
        borderRadius: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    title: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 15,
        marginBottom: 10,
    },
    subtitle: {
        color: '#B0B0B0',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 25,
    },
    button: {
        marginTop: 10,
        backgroundColor: '#ff4500',
        borderRadius: 10,
        paddingVertical: 8,
        width: '100%',
    },
    buttonLabel: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default AlarmModal;
