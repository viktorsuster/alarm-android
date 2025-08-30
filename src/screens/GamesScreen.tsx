import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { GamesStackParamList } from '../navigation/AppNavigator'; // This will be created later

type GamesScreenNavigationProp = StackNavigationProp<GamesStackParamList, 'GamesList'>;

type Props = {
  navigation: GamesScreenNavigationProp;
};

// Dummy data for games
const GAMES = [
  { id: '4', name: 'Osemsmerovka', screen: 'WordSearchLevelSelection' as const },
  { id: '5', name: 'Pexeso', screen: 'MemoryTrainer' as const },
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
            onPress={() => {
              if (item.screen === 'GameDetail') {
                navigation.navigate(item.screen, { gameId: item.id, gameName: item.name });
              } else {
                navigation.navigate(item.screen);
              }
            }}
          >
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
  },
  gameText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
});

export default GamesScreen;
