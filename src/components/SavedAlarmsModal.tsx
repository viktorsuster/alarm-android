import React, { useState, useEffect } from 'react';
import { Modal, Portal, Text, Button, IconButton, Divider, TouchableRipple } from 'react-native-paper';
import { StyleSheet, View, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SAVED_ALARMS_KEY = 'saved_alarms';

export interface Alarm {
    id: string;
    timestamp: number;
    message: string;
    soundName: string;
}

interface SavedAlarmsModalProps {
    visible: boolean;
    onDismiss: () => void;
    onEdit: (alarm: Alarm) => void;
}

const SavedAlarmsModal: React.FC<SavedAlarmsModalProps> = ({ visible, onDismiss, onEdit }) => {
    const [savedAlarms, setSavedAlarms] = useState<Alarm[]>([]);

    const loadAlarms = async () => {
        const alarmsJson = await AsyncStorage.getItem(SAVED_ALARMS_KEY);
        if (alarmsJson) {
            setSavedAlarms(JSON.parse(alarmsJson));
        }
    };

    useEffect(() => {
        if (visible) {
            loadAlarms();
        }
    }, [visible]);

    const handleDelete = async (alarmId: string) => {
        const newAlarms = savedAlarms.filter(alarm => alarm.id !== alarmId);
        await AsyncStorage.setItem(SAVED_ALARMS_KEY, JSON.stringify(newAlarms));
        setSavedAlarms(newAlarms);
        Alert.alert('Pripomienka zmazaná');
    };
    
    const handleEdit = (alarm: Alarm) => {
        onEdit(alarm);
        onDismiss();
    };

    const renderItem = ({ item }: { item: Alarm }) => (
        <View style={styles.itemContainer}>
            <View style={styles.itemTextContainer}>
                <Text style={styles.itemMessage}>{item.message}</Text>
                <Text style={styles.itemDate}>
                    {new Date(item.timestamp).toLocaleString('sk-SK')}
                </Text>
            </View>
            <View style={styles.itemActions}>
                <IconButton icon="pencil-outline" size={24} onPress={() => handleEdit(item)} iconColor="#B0B0B0"/>
                <IconButton icon="delete-outline" size={24} onPress={() => handleDelete(item.id)} iconColor="#ff4500"/>
            </View>
        </View>
    );

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Uložené pripomienky</Text>
                    <IconButton icon="close" size={24} onPress={onDismiss} iconColor="#B0B0B0" />
                </View>
                <FlatList
                    data={savedAlarms}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    ItemSeparatorComponent={() => <Divider style={styles.divider}/>}
                    ListEmptyComponent={<Text style={styles.emptyText}>Zatiaľ žiadne uložené pripomienky.</Text>}
                />
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        backgroundColor: '#1E1E1E',
        marginHorizontal: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#333',
        overflow: 'hidden',
        height: '70%',
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
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    itemTextContainer: {
        flex: 1,
    },
    itemMessage: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    itemDate: {
        color: '#B0B0B0',
        fontSize: 12,
    },
    itemActions: {
        flexDirection: 'row',
    },
    divider: {
        backgroundColor: '#333',
    },
    emptyText: {
        color: '#B0B0B0',
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    }
});

export default SavedAlarmsModal;
