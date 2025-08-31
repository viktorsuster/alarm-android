import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { ProjectsStackParamList, Project, Entry } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS from 'react-native-fs';
import ImageViewer from 'react-native-image-zoom-viewer';

type EntryDetailScreenRouteProp = RouteProp<ProjectsStackParamList, 'EntryDetail'>;
type ChecklistItem = { text: string; checked: boolean };

const EntryDetailScreen = () => {
    const route = useRoute<EntryDetailScreenRouteProp>();
    const navigation = useNavigation();
    const { projectId, entryId } = route.params;

    const [entry, setEntry] = useState<Entry | null>(null);
    const [isViewerVisible, setIsViewerVisible] = useState(false);
    const [viewerImages, setViewerImages] = useState<{ url: string }[]>([]);
    const [viewerIndex, setViewerIndex] = useState(0);

    const loadEntry = useCallback(async () => {
        const projectsJson = await AsyncStorage.getItem('@projects');
        const projects: Project[] = projectsJson ? JSON.parse(projectsJson) : [];
        const project = projects.find(p => p.id === projectId);
        const currentEntry = project?.entries.find(e => e.id === entryId);
        if (currentEntry) {
            setEntry(currentEntry);
        }
    }, [projectId, entryId]);

    useFocusEffect(
        useCallback(() => {
            loadEntry();
        }, [loadEntry])
    );

    // useEffect na nastavenie hlavičky
    useEffect(() => {
        if (entry) {
            navigation.setOptions({ 
                title: new Date(entry.date).toLocaleDateString('sk-SK'),
                headerRight: () => (
                    <View style={styles.headerButtons}>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('AddEntry', { projectId, entry: entry })}
                            style={styles.headerButton}
                        >
                            <Icon name="pencil-outline" size={25} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={deleteEntry}
                            style={styles.headerButton}
                        >
                            <Icon name="trash-can-outline" size={25} color="#ff6347" />
                        </TouchableOpacity>
                    </View>
                )
            });
        }
    }, [entry, navigation]);

    const updateChecklist = async (newContent: ChecklistItem[]) => {
        if (!entry) return;
        const updatedEntry = { ...entry, content: newContent };
        setEntry(updatedEntry);

        const projectsJson = await AsyncStorage.getItem('@projects');
        let projects: Project[] = projectsJson ? JSON.parse(projectsJson) : [];
        const projectIndex = projects.findIndex(p => p.id === projectId);
        if (projectIndex > -1) {
            const entryIndex = projects[projectIndex].entries.findIndex(e => e.id === entryId);
            if (entryIndex > -1) {
                projects[projectIndex].entries[entryIndex] = updatedEntry;
                await AsyncStorage.setItem('@projects', JSON.stringify(projects));
            }
        }
    };

    const toggleChecklistItem = (index: number) => {
        if (entry && Array.isArray(entry.content)) {
            const newContent = [...entry.content] as ChecklistItem[];
            newContent[index].checked = !newContent[index].checked;
            updateChecklist(newContent);
        }
    };
    
    const deleteEntry = async () => {
        Alert.alert("Odstrániť záznam", "Naozaj chcete odstrániť tento záznam?", [
            { text: "Zrušiť", style: "cancel" },
            { text: "Odstrániť", style: "destructive", onPress: async () => {
                if (entry && entry.photos.length > 0) {
                    for (const uri of entry.photos) {
                        try {
                            await RNFS.unlink(uri);
                        } catch (e) {
                            console.error("Error deleting photo:", e);
                        }
                    }
                }

                const projectsJson = await AsyncStorage.getItem('@projects');
                let projects: Project[] = projectsJson ? JSON.parse(projectsJson) : [];
                const projectIndex = projects.findIndex(p => p.id === projectId);
                if (projectIndex > -1) {
                    projects[projectIndex].entries = projects[projectIndex].entries.filter(e => e.id !== entryId);
                    await AsyncStorage.setItem('@projects', JSON.stringify(projects));
                    navigation.goBack();
                }
            }}
        ]);
    };

    const openImageViewer = (uri: string) => {
        const images = entry?.photos.map(p => ({ url: p })) || [];
        const selectedIndex = images.findIndex(img => img.url === uri);
        setViewerImages(images);
        setViewerIndex(selectedIndex);
        setIsViewerVisible(true);
    };
    
    if (!entry) return <View style={styles.container}><Text style={styles.loadingText}>Načítavam...</Text></View>;
    
    return (
        <>
            <ScrollView style={styles.container}>
                {entry.type === 'note' && (
                    <Text style={styles.noteContent}>{entry.content as string}</Text>
                )}

                {entry.type === 'checklist' && (
                    <FlatList
                        scrollEnabled={false}
                        data={entry.content as ChecklistItem[]}
                        keyExtractor={(_, index) => index.toString()}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity style={styles.checklistItem} onPress={() => toggleChecklistItem(index)}>
                                <Icon name={item.checked ? 'checkbox-marked-outline' : 'checkbox-blank-outline'} size={24} color="#ff4500" />
                                <Text style={[styles.checklistItemText, item.checked && styles.checkedItemText]}>{item.text}</Text>
                            </TouchableOpacity>
                        )}
                    />
                )}

                {entry && entry.photos.length > 0 && (
                    <View style={styles.photosContainer}>
                         <Text style={styles.photosTitle}>Fotky</Text>
                        {entry.photos.map(uri => (
                            <TouchableOpacity key={uri} onPress={() => openImageViewer(uri)}>
                                <Image source={{ uri }} style={styles.photo} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
            <Modal visible={isViewerVisible} transparent={true} onRequestClose={() => setIsViewerVisible(false)}>
                <ImageViewer
                    imageUrls={viewerImages}
                    index={viewerIndex}
                    onCancel={() => setIsViewerVisible(false)}
                    enableSwipeDown
                    onSwipeDown={() => setIsViewerVisible(false)}
                    renderHeader={() => (
                        <TouchableOpacity style={styles.closeButton} onPress={() => setIsViewerVisible(false)}>
                            <Icon name="close" size={30} color="#FFF" />
                        </TouchableOpacity>
                    )}
                />
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: 20,
    },
    loadingText: { color: '#FFF', textAlign: 'center' },
    noteContent: {
        color: '#FFF',
        fontSize: 16,
        lineHeight: 24,
        backgroundColor: '#1E1E1E',
        padding: 15,
        borderRadius: 10,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: '#1E1E1E',
        paddingHorizontal: 15,
        borderRadius: 10,
        marginBottom: 5,
    },
    checklistItemText: { color: '#FFF', fontSize: 18, marginLeft: 15 },
    checkedItemText: { textDecorationLine: 'line-through', color: '#888' },
    photosContainer: {
        marginTop: 20,
    },
    photosTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    photo: {
        width: '100%',
        height: 250,
        borderRadius: 10,
        marginBottom: 10,
        resizeMode: 'cover',
    },
    headerButtons: {
        flexDirection: 'row',
    },
    headerButton: {
        paddingHorizontal: 10,
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 2,
    }
});

export default EntryDetailScreen;
