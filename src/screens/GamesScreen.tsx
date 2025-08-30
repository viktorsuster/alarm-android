import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GamesStackParamList } from '../navigation/AppNavigator'; // This will be created later

type GamesScreenNavigationProp = StackNavigationProp<GamesStackParamList, 'GamesList'>;

type Props = {
  navigation: GamesScreenNavigationProp;
};

// Dummy data for games
const GAMES = [
  { id: '2', name: 'Pivné 2048', screen: 'Game2048' as const, icon: 'glass-mug-variant' },
  { id: '4', name: 'Osemsmerovka', screen: 'WordSearchLevelSelection' as const, icon: 'format-letter-matches' },
  { id: '5', name: 'Pexeso', screen: 'MemoryTrainer' as const, icon: 'brain' },
  { id: '1', name: 'Triedenie Smajlíkov', screen: 'SortPuzzle' as const, icon: 'water-pump' },
];

const GamesScreen = ({ navigation }: Props) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={GAMES}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.gameItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Icon name={item.icon} size={28} color="#ff4500" style={styles.icon} />
            <Text style={styles.gameText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 10,
  },
  gameItem: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  icon: {
    marginRight: 15,
  },
});

export default GamesScreen;
