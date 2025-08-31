import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Image, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ToolsStackParamList, Project, Entry } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type AddEntryScreenRouteProp = RouteProp<ToolsStackParamList, 'AddEntry'>;
type ChecklistItem = { text: string; checked: boolean };

const AddEntryScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<AddEntryScreenRouteProp>();
    const { projectId, entry } = route.params; // Pridali sme sme 'entry'

    const [step, setStep] = useState<'selection' | 'form'>(entry ? 'form' : 'selection');
    const [type, setType] = useState<Entry['type']>(entry?.type || 'note');

    const [textContent, setTextContent] = useState(
        (entry && typeof entry.content === 'string') ? entry.content : ''
    );
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
        (entry && Array.isArray(entry.content)) ? entry.content : []
    );
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [photos, setPhotos] = useState<string[]>(entry?.photos || []);

    const handleSelectType = (selectedType: Entry['type']) => {
        setType(selectedType);
        setStep('form');
    };

    const handleAddChecklistItem = () => {
        if (newChecklistItem.trim()) {
            setChecklistItems([...checklistItems, { text: newChecklistItem.trim(), checked: false }]);
            setNewChecklistItem('');
        }
    };

    const handleRemoveChecklistItem = (index: number) => {
        const newItems = [...checklistItems];
        newItems.splice(index, 1);
        setChecklistItems(newItems);
    };

    const handleChoosePhoto = () => {
        launchImageLibrary({ mediaType: 'photo', selectionLimit: 0 }, async (response) => {
            if (response.didCancel || response.errorCode || !response.assets) return;
            
            const newImagePaths: string[] = [];
            const imageDir = `${RNFS.DocumentDirectoryPath}/project_images`;
            await RNFS.mkdir(imageDir);

            for (const asset of response.assets) {
                if (asset.uri) {
                    const fileName = `${Date.now()}_${asset.fileName || 'image.jpg'}`;
                    const newPath = `${imageDir}/${fileName}`;
                    try {
                        await RNFS.copyFile(asset.uri, newPath);
                        newImagePaths.push('file://' + newPath);
                    } catch (error) {
                        console.error('Error copying file:', error);
                    }
                }
            }
            setPhotos([...photos, ...newImagePaths]);
        });
    };
    
    const handleRemovePhoto = async (uri: string) => {
        setPhotos(photos.filter(p => p !== uri));
        try {
            const path = uri.replace('file://', '');
            if (await RNFS.exists(path)) {
                await RNFS.unlink(path);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    const saveEntry = async () => {
        const entryToSave: Entry = {
            id: entry?.id || Date.now().toString(),
            type: type,
            content: type === 'checklist' ? checklistItems : textContent,
            photos: photos,
            date: entry?.date || new Date().toISOString(),
        };

        try {
            const projectsJson = await AsyncStorage.getItem('@projects');
            let projects: Project[] = projectsJson ? JSON.parse(projectsJson) : [];
            const projectIndex = projects.findIndex(p => p.id === projectId);

            if (projectIndex > -1) {
                if (entry) { // Úprava
                    const entryIndex = projects[projectIndex].entries.findIndex(e => e.id === entry.id);
                    if (entryIndex > -1) {
                        projects[projectIndex].entries[entryIndex] = entryToSave;
                    }
                } else { // Vytvorenie
                    projects[projectIndex].entries.push(entryToSave);
                }
                await AsyncStorage.setItem('@projects', JSON.stringify(projects));
                navigation.goBack();
            } else {
                Alert.alert("Chyba", "Projekt sa nenašiel.");
            }
        } catch (e) {
            console.error('Failed to save entry.', e);
        }
    };

    // Tento efekt posiela funkciu saveEntry do hlavičky
    useLayoutEffect(() => {
        if (step === 'form') {
            navigation.setOptions({
                headerRight: () => (
                    <TouchableOpacity onPress={saveEntry} style={styles.headerButton}>
                        <Text style={styles.headerButtonText}>Uložiť</Text>
                    </TouchableOpacity>
                ),
            });
        } else {
            navigation.setOptions({ headerRight: null });
        }
    }, [navigation, step, textContent, checklistItems, photos]); // Pridávame závislosti, aby sa funkcia v hlavičke aktualizovala

    if (step === 'selection') {
        return (
            <View style={styles.container}>
                <Text style={styles.selectionTitle}>Čo chcete pridať?</Text>
                <TouchableOpacity style={styles.selectionButton} onPress={() => handleSelectType('note')}>
                    <Icon name="note-text-outline" size={40} color="#FFF" />
                    <Text style={styles.selectionButtonText}>Poznámku</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.selectionButton} onPress={() => handleSelectType('checklist')}>
                    <Icon name="format-list-checks" size={40} color="#FFF" />
                    <Text style={styles.selectionButtonText}>Nákupný zoznam</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    return (
        <FlatList
            style={styles.formContainer}
            data={type === 'checklist' ? checklistItems : []}
            keyExtractor={(_, index) => index.toString()}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
                <>
                    {type === 'note' ? (
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Napíšte poznámku..."
                            placeholderTextColor="#888"
                            value={textContent}
                            onChangeText={setTextContent}
                            multiline
                        />
                    ) : (
                        <View style={styles.checklistItemContainer}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                placeholder="Napíš položku"
                                placeholderTextColor="#888"
                                value={newChecklistItem}
                                onChangeText={setNewChecklistItem}
                                onSubmitEditing={handleAddChecklistItem}
                            />
                            <TouchableOpacity style={styles.addItemButton} onPress={handleAddChecklistItem}>
                                <Icon name="plus" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            }
            renderItem={({ item, index }) => (
                <View style={styles.checklistItem}>
                  <Text style={styles.checklistItemText}>{item.text}</Text>
                  <TouchableOpacity onPress={() => handleRemoveChecklistItem(index)}>
                    <Icon name="close-circle-outline" size={24} color="#888" />
                  </TouchableOpacity>
                </View>
            )}
            ListFooterComponent={
                <>
                    {type === 'note' && (
                        <>
                            <Text style={styles.label}>Fotky</Text>
                            <View style={styles.photosContainer}>
                                {photos.map(uri => (
                                <View key={uri} style={styles.photoWrapper}>
                                    <Image source={{ uri }} style={styles.photo} />
                                    <TouchableOpacity style={styles.removePhotoButton} onPress={() => handleRemovePhoto(uri)}>
                                    <Icon name="close-circle" size={24} color="#000" />
                                    </TouchableOpacity>
                                </View>
                                ))}
                                <TouchableOpacity style={styles.addPhotoButton} onPress={handleChoosePhoto}>
                                <Icon name="camera-plus-outline" size={30} color="#888" />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </>
            }
        />
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    selectionTitle: {
        fontSize: 24,
        color: '#FFF',
        fontWeight: 'bold',
        marginBottom: 40,
    },
    selectionButton: {
        backgroundColor: '#1E1E1E',
        borderRadius: 15,
        padding: 30,
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
        flexDirection: 'row',
    },
    selectionButtonText: {
        color: '#FFF',
        fontSize: 20,
        marginLeft: 20,
    },
    formContainer: {
        flex: 1,
        backgroundColor: '#121212',
        padding: 20,
    },
    label: {
        color: '#AAA',
        fontSize: 16,
        marginBottom: 10,
        marginTop: 20,
    },
    input: {
      backgroundColor: '#1E1E1E',
      color: '#FFFFFF',
      padding: 15,
      borderRadius: 10,
      fontSize: 18,
      marginBottom: 20,
    },
    textArea: {
      height: 200,
      textAlignVertical: 'top',
    },
    checklistItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    addItemButton: {
        backgroundColor: '#ff4500',
        padding: 15,
        borderRadius: 10,
        marginLeft: 10,
    },
    checklistItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#1E1E1E',
        borderRadius: 10,
        marginBottom: 5,
    },
    checklistItemText: {
        color: '#FFF',
        fontSize: 16,
    },
    photosContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    addPhotoButton: {
        width: 80,
        height: 80,
        borderRadius: 10,
        backgroundColor: '#1E1E1E',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 5,
    },
    photoWrapper: {
        position: 'relative',
        margin: 5,
    },
    photo: {
        width: 80,
        height: 80,
        borderRadius: 10,
    },
    removePhotoButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FFF',
        borderRadius: 12,
    },
    headerButton: {
        marginRight: 15,
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    headerButtonText: {
        color: '#ff4500',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AddEntryScreen;
