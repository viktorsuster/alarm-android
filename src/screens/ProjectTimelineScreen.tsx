import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProjectsStackParamList, Project, Entry } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type TimelineScreenRouteProp = RouteProp<ProjectsStackParamList, 'ProjectTimeline'>;
type TimelineNavigationProp = NativeStackNavigationProp<ProjectsStackParamList, 'ProjectTimeline'>;

const ProjectTimelineScreen = () => {
    const route = useRoute<TimelineScreenRouteProp>();
    const navigation = useNavigation<TimelineNavigationProp>();
    const { projectId } = route.params;

    const [project, setProject] = useState<Project | null>(null);

    const loadProject = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem('@projects');
            const projects: Project[] = jsonValue != null ? JSON.parse(jsonValue) : [];
            const currentProject = projects.find(p => p.id === projectId);
            if (currentProject) {
                // Zoradíme záznamy od najnovšieho
                currentProject.entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setProject(currentProject);
                navigation.setOptions({ title: currentProject.name });
            }
        } catch (e) {
            console.error("Failed to load project details.", e);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            loadProject();
        }, [projectId])
    );

    const getIconForType = (type: Entry['type']) => {
        switch (type) {
          case 'note': return 'note-text-outline';
          case 'checklist': return 'format-list-checks';
          default: return 'help-circle-outline';
        }
    };

    const renderItem = ({ item }: { item: Entry }) => (
        <TouchableOpacity 
            style={styles.entryContainer}
            onPress={() => navigation.navigate('EntryDetail', { projectId: project.id, entryId: item.id })}
        >
            <View style={styles.timelineConnector} />
            <Icon name={getIconForType(item.type)} size={30} color="#ff4500" style={styles.icon} />
            <View style={styles.entryContent}>
                <Text style={styles.entryDate}>{new Date(item.date).toLocaleString('sk-SK')}</Text>
                <Text style={styles.entryText}>
                    {item.type === 'note' ? (item.content as string).substring(0, 100) + '...' : 'Nákupný zoznam'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (!project) {
        return <View style={styles.container}><Text style={styles.emptyText}>Načítavam projekt...</Text></View>;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={project.entries}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text style={styles.emptyText}>Žiadne záznamy. Začnite pridaním nového záznamu.</Text>}
                contentContainerStyle={{ padding: 20 }}
            />
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddEntry', { projectId })}
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
    entryContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        position: 'relative',
    },
    timelineConnector: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 14, // centrovanie na ikonu
        width: 2,
        backgroundColor: '#333',
    },
    icon: {
        backgroundColor: '#121212',
        zIndex: 1,
        paddingRight: 10,
    },
    entryContent: {
        flex: 1,
        backgroundColor: '#1E1E1E',
        padding: 15,
        borderRadius: 10,
        marginLeft: 10,
    },
    entryDate: {
        color: '#AAA',
        fontSize: 12,
        marginBottom: 5,
    },
    entryText: {
        color: '#FFF',
        fontSize: 16,
    }
});

export default ProjectTimelineScreen;
