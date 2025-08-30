import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { GamesStackParamList } from '../navigation/AppNavigator'; // This will be created later

type GameDetailScreenRouteProp = RouteProp<GamesStackParamList, 'GameDetail'>;

type Props = {
  route: GameDetailScreenRouteProp;
};

const GameDetailScreen = ({ route }: Props) => {
  const { gameName } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Vitaj v hre</Text>
      <Text style={styles.gameTitle}>{gameName}</Text>
      <Text style={styles.text}>Sem príde kód pre hru.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    margin: 10,
  },
  gameTitle: {
    fontSize: 28,
    color: '#ff4500',
    fontWeight: 'bold',
    marginBottom: 20,
  }
});

export default GameDetailScreen;
