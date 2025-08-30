import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import AlarmScreen from '../screens/AlarmScreen';
import GalleryScreen from '../screens/GalleryScreen';
import GamesScreen from '../screens/GamesScreen';
import GameDetailScreen from '../screens/GameDetailScreen';
// import SortPuzzleScreen from '../screens/SortPuzzleScreen';
import WordSearchScreen from '../screens/WordSearchScreen';

export type GamesStackParamList = {
  GamesList: undefined;
  GameDetail: { gameId: string, gameName: string };
  SortPuzzle: undefined;
  WordSearch: undefined;
};

export type RootTabParamList = {
  Alarm: undefined;
  Gallery: undefined;
  Games: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const GamesStack = createNativeStackNavigator<GamesStackParamList>();

const GamesStackNavigator = () => {
  return (
    <GamesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1E1E1E' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <GamesStack.Screen name="GamesList" component={GamesScreen} options={{ title: 'Hry' }} />
      <GamesStack.Screen name="GameDetail" component={GameDetailScreen} options={({ route }) => ({ title: route.params.gameName })} />
      <GamesStack.Screen name="WordSearch" component={WordSearchScreen} options={{ title: 'Osemsmerovka' }} />
    </GamesStack.Navigator>
  );
}

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Alarm"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = 'alarm';

            if (route.name === 'Alarm') {
              iconName = focused ? 'alarm-check' : 'alarm';
            } else if (route.name === 'Gallery') {
              iconName = focused ? 'image-multiple' : 'image-multiple-outline';
            } else if (route.name === 'Games') {
              iconName = focused ? 'gamepad-variant' : 'gamepad-variant-outline';
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#ff4500',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#1E1E1E',
            borderTopColor: '#333'
          },
          headerStyle: {
            backgroundColor: '#121212',
          },
          headerTintColor: '#fff',
        })}
      >
        <Tab.Screen
          name="Alarm"
          component={AlarmScreen}
          options={{
            headerShown: false,
            tabBarLabel: 'Budík',
          }}
        />
        <Tab.Screen
          name="Gallery"
          component={GalleryScreen}
          options={{
            title: 'Galéria',
            tabBarLabel: 'Galéria',
          }}
        />
        <Tab.Screen
          name="Games"
          component={GamesStackNavigator}
          options={{
            headerShown: false,
            tabBarLabel: 'Hry',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
