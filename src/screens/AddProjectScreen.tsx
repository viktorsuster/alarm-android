import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Project, ProjectsStackParamList } from '../navigation/AppNavigator';

type AddProjectNavigationProp = NativeStackNavigationProp<ProjectsStackParamList, 'AddProject'>;

const AddProjectScreen = () => {
    const [name, setName] = useState('');
    const navigation = useNavigation<AddProjectNavigationProp>();

    const saveProject = async () => {
        if (!name.trim()) {
            Alert.alert('Chyba', 'Názov projektu nemôže byť prázdny.');
            return;
        }

        const newProject: Project = {
            id: Date.now().toString(),
            name: name.trim(),
            entries: [],
        };

        try {
            const existingProjects = await AsyncStorage.getItem('@projects');
            const projects = existingProjects ? JSON.parse(existingProjects) : [];
            projects.push(newProject);
            await AsyncStorage.setItem('@projects', JSON.stringify(projects));
            
            // Nahradíme aktuálnu obrazovku v histórii a presmerujeme
            navigation.replace('ProjectTimeline', { projectId: newProject.id });
        } catch (e) {
            console.error('Failed to save project.', e);
            Alert.alert('Chyba', 'Nepodarilo sa uložiť projekt.');
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Názov projektu (napr. Stavba Kuzmányho)"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveProject}>
                <Text style={styles.saveButtonText}>Uložiť Projekt</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: 20,
    },
    input: {
        backgroundColor: '#1E1E1E',
        color: '#FFFFFF',
        padding: 15,
        borderRadius: 10,
        fontSize: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    saveButton: {
        backgroundColor: '#ff4500',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AddProjectScreen;
