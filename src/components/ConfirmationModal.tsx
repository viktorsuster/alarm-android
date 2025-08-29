import React from 'react';
import { Modal, Portal, Text, Button } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ConfirmationModalProps {
    visible: boolean;
    onDismiss: () => void;
    onConfirm: () => void;
    details: {
        date: Date;
        message: string;
        soundLabel: string;
    };
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ visible, onDismiss, onConfirm, details }) => {
    const { date, message, soundLabel } = details;

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
                <Icon name="check-circle-outline" size={60} color="#ff4500" />
                <Text style={styles.title}>Potvrdiť pripomienku</Text>
                
                <View style={styles.detailRow}>
                    <Icon name="calendar-clock" size={24} color="#B0B0B0" style={styles.icon} />
                    <Text style={styles.detailText}>{date.toLocaleString('sk-SK')}</Text>
                </View>
                
                <View style={styles.detailRow}>
                    <Icon name="message-text-outline" size={24} color="#B0B0B0" style={styles.icon} />
                    <Text style={styles.detailText}>{message || 'Žiadna správa'}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Icon name="music-note" size={24} color="#B0B0B0" style={styles.icon} />
                    <Text style={styles.detailText}>{soundLabel}</Text>
                </View>
                
                <View style={styles.buttonContainer}>
                    <Button 
                        mode="outlined" 
                        onPress={onDismiss} 
                        style={[styles.button, styles.cancelButton]}
                        labelStyle={styles.cancelButtonLabel}
                    >
                        Zrušiť
                    </Button>
                    <Button 
                        mode="contained" 
                        onPress={onConfirm} 
                        style={[styles.button, styles.confirmButton]}
                        labelStyle={styles.confirmButtonLabel}
                    >
                        Uložiť
                    </Button>
                </View>
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
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 15,
        marginBottom: 25,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        width: '100%',
    },
    icon: {
        marginRight: 15,
    },
    detailText: {
        color: '#E0E0E0',
        fontSize: 16,
        flex: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        width: '100%',
    },
    button: {
        flex: 1,
        marginHorizontal: 5,
        borderRadius: 10,
    },
    cancelButton: {
        borderColor: '#888',
    },
    cancelButtonLabel: {
        color: '#B0B0B0',
    },
    confirmButton: {
        backgroundColor: '#ff4500',
    },
    confirmButtonLabel: {
        color: '#FFFFFF',
    }
});

export default ConfirmationModal;
