import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GamesStackParamList, Level } from '../navigation/AppNavigator';
import levelsData from '../assets/word-search-levels.json';

type LevelSelectionNavigationProp = StackNavigationProp<GamesStackParamList, 'WordSearchLevelSelection'>;

type Props = {
  navigation: LevelSelectionNavigationProp;
};

const WordSearchLevelSelectionScreen = ({ navigation }: Props) => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium'>('easy');
  const [loading, setLoading] = useState(true);

  const loadCompletedLevels = async () => {
    try {
      const completed = await AsyncStorage.getItem('completed_word_search_levels');
      if (completed !== null) {
        setCompletedLevels(new Set(JSON.parse(completed)));
      }
    } catch (error) {
      console.error('Failed to load completed levels.', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLevels(levelsData as Level[]);
      loadCompletedLevels();
    }, [])
  );

  const handleResetLevel = (level: Level) => {
    Alert.alert(
      "Resetovať postup",
      `Naozaj si želáš vymazať všetok postup pre level "${level.name}"?`,
      [
        {
          text: "Zrušiť",
          style: "cancel"
        },
        { 
          text: "Áno, resetovať", 
          onPress: async () => {
            try {
              // Remove in-progress save
              await AsyncStorage.removeItem(`word_search_progress_${level.id}`);
              
              // Remove from completed list
              const completedJSON = await AsyncStorage.getItem('completed_word_search_levels');
              if (completedJSON) {
                const completedArray: number[] = JSON.parse(completedJSON);
                const newCompletedArray = completedArray.filter(id => id !== level.id);
                await AsyncStorage.setItem('completed_word_search_levels', JSON.stringify(newCompletedArray));
                setCompletedLevels(new Set(newCompletedArray));
              }
            } catch (error) {
              console.error("Failed to reset level progress.", error);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const renderLevelItem = ({ item }: { item: Level }) => (
    <TouchableOpacity
      style={styles.levelItem}
      onPress={() => navigation.navigate('WordSearch', { level: item })}
      onLongPress={() => handleResetLevel(item)}
    >
      <Text style={styles.levelText}>{item.name}</Text>
      {completedLevels.has(item.id) && (
        <Icon name="check-circle" size={24} color="#4CAF50" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#ff4500" />
      </View>
    );
  }

  const filteredLevels = levels.filter(level => level.difficulty === selectedDifficulty);

  return (
    <View style={styles.container}>
      <View style={styles.difficultySelector}>
        <TouchableOpacity
          style={[styles.difficultyButton, selectedDifficulty === 'easy' && styles.selectedButton]}
          onPress={() => setSelectedDifficulty('easy')}
        >
          <Text style={styles.difficultyButtonText}>Ľahké</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.difficultyButton, selectedDifficulty === 'medium' && styles.selectedButton]}
          onPress={() => setSelectedDifficulty('medium')}
        >
          <Text style={styles.difficultyButtonText}>Stredné</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredLevels}
        keyExtractor={item => item.id.toString()}
        renderItem={renderLevelItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultySelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#1E1E1E',
  },
  difficultyButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  selectedButton: {
    backgroundColor: '#ff4500',
  },
  difficultyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    paddingHorizontal: 10,
  },
  levelItem: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    marginVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
});

export default WordSearchLevelSelectionScreen;
