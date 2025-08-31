import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RadioStackParamList } from '../navigation/AppNavigator';

type RadioScreenNavigationProp = StackNavigationProp<RadioStackParamList, 'RadioList'>;

type Props = {
  navigation: RadioScreenNavigationProp;
};

const RADIOS = [
  { 
    id: '1', 
    name: 'Funrádio', 
    screen: 'RadioDetail' as const, 
    icon: 'radio', 
    streamUrl: 'https://stream.funradio.sk:8000/fun128.mp3?_ic2=1756639024090' 
  },
  { 
    id: '2', 
    name: 'Express', 
    screen: 'RadioDetail' as const, 
    icon: 'radio', 
    streamUrl: 'https://stream.bauermedia.sk/expres-hi.mp3' 
  },
  { 
    id: '3', 
    name: 'Europa 2', 
    screen: 'RadioDetail' as const, 
    icon: 'radio', 
    streamUrl: 'https://stream.bauermedia.sk/europa2-hi.mp3' 
  },
  { 
    id: '4', 
    name: 'Antyradio', 
    screen: 'RadioDetail' as const, 
    icon: 'radio', 
    streamUrl: 'https://an.cdn.eurozet.pl/ant-waw.mp3' 
  },
  { 
    id: '5', 
    name: 'Radio Paradise (USA)', 
    screen: 'RadioDetail' as const, 
    icon: 'radio', 
    streamUrl: 'https://stream.radioparadise.com/flacm' 
  },
];

const RadioScreen = ({ navigation }: Props) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={RADIOS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.radioItem}
            onPress={() => navigation.navigate(item.screen, { radioName: item.name, streamUrl: item.streamUrl })}
          >
            <Icon name={item.icon} size={28} color="#ff4500" style={styles.icon} />
            <Text style={styles.radioText}>{item.name}</Text>
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
  radioItem: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  icon: {
    marginRight: 15,
  },
});

export default RadioScreen;
