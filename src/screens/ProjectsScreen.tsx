import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ToolsStackParamList, Project } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type ProjectsScreenNavigationProp = NativeStackNavigationProp<ToolsStackParamList, 'ProjectsList'>;

const ProjectsScreen = () => {
    const navigation = useNavigation<ProjectsScreenNavigationProp>();
    const [projects, setProjects] = useState<Project[]>([]);

    const loadProjects = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem('@projects');
            setProjects(jsonValue != null ? JSON.parse(jsonValue) : []);
        } catch (e) {
            console.error("Failed to load projects.", e);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            loadProjects();
        }, [])
    );

    const deleteProject = (projectId: string) => {
        Alert.alert(
            "Odstrániť projekt",
            "Naozaj chcete natrvalo odstrániť tento projekt a všetky jeho záznamy?",
            [
                { text: "Zrušiť", style: "cancel" },
                { text: "Odstrániť", style: "destructive", onPress: async () => {
                    try {
                        const updatedProjects = projects.filter(p => p.id !== projectId);
                        await AsyncStorage.setItem('@projects', JSON.stringify(updatedProjects));
                        setProjects(updatedProjects);
                    } catch (e) {
                        console.error("Failed to delete project.", e);
                    }
                }},
            ]
        );
    };

    const renderItem = ({ item }: { item: Project }) => (
        <TouchableOpacity 
            style={styles.itemContainer}
            onPress={() => navigation.navigate('ProjectTimeline', { projectId: item.id })}
        >
            <Icon name="folder-outline" size={30} color="#ff4500" style={styles.icon} />
            <Text style={styles.itemText}>{item.name}</Text>
            <TouchableOpacity onPress={() => deleteProject(item.id)} style={styles.deleteButton}>
                <Icon name="trash-can-outline" size={24} color="#888" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={projects}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text style={styles.emptyText}>Zatiaľ žiadne projekty. Začnite pridaním nového projektu.</Text>}
                contentContainerStyle={{ flexGrow: 1 }}
            />
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddProject')}
            >
                <Icon name="plus" size={30} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    itemContainer: {
        flexDirection: 'row',
        backgroundColor: '#1E1E1E',
        padding: 20,
        marginVertical: 5,
        marginHorizontal: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    icon: {
        marginRight: 15,
    },
    itemText: {
        color: '#FFFFFF',
        fontSize: 18,
        flex: 1, // Aby text zabral maximum miesta a odtlačil tlačidlo
    },
    deleteButton: {
        padding: 5,
    },
    emptyText: {
        color: '#888',
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    },
    addButton: {
        position: 'absolute',
        right: 30,
        bottom: 30,
        backgroundColor: '#ff4500',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
    },
});

export default ProjectsScreen;
