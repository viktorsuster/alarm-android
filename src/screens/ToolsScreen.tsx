import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ToolsStackParamList } from '../navigation/AppNavigator';

type Tool = {
  id: string;
  name: string;
  screen: keyof ToolsStackParamList;
};

const tools: Tool[] = [
  { id: '1', name: 'Stavebné Projekty', screen: 'ProjectsList' },
  { id: '2', name: 'Vodováha', screen: 'SpiritLevel' },
  { id: '3', name: 'Kompas', screen: 'Compass' },
  { id: '4', name: 'Kalkulačka (m², m³)', screen: 'Calculator' },
];

type ToolsScreenNavigationProp = NativeStackNavigationProp<
  ToolsStackParamList,
  'ToolsList'
>;

const ToolsScreen = () => {
  const navigation = useNavigation<ToolsScreenNavigationProp>();

  const renderItem = ({ item }: { item: Tool }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate(item.screen, {} as any)}
    >
      <Text style={styles.itemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tools}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  itemContainer: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  itemText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
});

export default ToolsScreen;
