import React from 'react';
import { Modal, Portal, Text, Button } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

interface SuccessModalProps {
    visible: boolean;
    onDismiss: () => void;
    message: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ visible, onDismiss, message }) => {
    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
                <LottieView
                    source={require('../assets/reminder.json')}
                    autoPlay
                    loop
                    style={styles.lottie}
                />
                <Text style={styles.title}>Hotovo!</Text>
                <Text style={styles.message}>{message}</Text>
                <Button 
                    mode="contained" 
                    onPress={onDismiss} 
                    style={styles.button}
                    labelStyle={styles.buttonLabel}
                >
                    OK
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
    lottie: {
        width: 150,
        height: 150,
        marginBottom: -20,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 15,
        marginBottom: 10,
    },
    message: {
        color: '#B0B0B0',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 25,
    },
    button: {
        marginTop: 10,
        backgroundColor: '#ff4500',
        borderRadius: 10,
        paddingHorizontal: 20,
    },
    buttonLabel: {
        color: '#FFFFFF',
    }
});

export default SuccessModal;
