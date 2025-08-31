import React from 'react';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import AlarmScreen from '../screens/AlarmScreen';
import GalleryScreen from '../screens/GalleryScreen';
import GamesScreen from '../screens/GamesScreen';
import GameDetailScreen from '../screens/GameDetailScreen';
// import SortPuzzleScreen from '../screens/SortPuzzleScreen';
import WordSearchScreen from '../screens/WordSearchScreen';
import WordSearchLevelSelectionScreen from '../screens/WordSearchLevelSelectionScreen';
import MemoryTrainerScreen from '../screens/MemoryTrainerScreen';
import SortPuzzleScreen from '../screens/SortPuzzleScreen';
import Game2048Screen from '../screens/Game2048Screen';
import RadioScreen from '../screens/RadioScreen';
import RadioDetailScreen from '../screens/RadioDetailScreen';

export type Level = {
  id: number;
  name: string;
  difficulty: string;
  gridSize: number;
  words: string[];
  tajnicka: string;
  solved_sentence: string;
};

export type GamesStackParamList = {
  GamesList: undefined;
  GameDetail: { gameId: string, gameName: string };
  SortPuzzle: undefined;
  WordSearch: { level: Level };
  WordSearchLevelSelection: undefined;
  MemoryTrainer: undefined;
  Game2048: undefined;
};

export type RadioStackParamList = {
  RadioList: undefined;
  RadioDetail: { radioName: string, streamUrl: string };
};

export type RootTabParamList = {
  Alarm: undefined;
  Gallery: undefined;
  Games: undefined;
  Radio: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const GamesStack = createNativeStackNavigator<GamesStackParamList>();
const RadioStack = createNativeStackNavigator<RadioStackParamList>();

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
      <GamesStack.Screen name="WordSearchLevelSelection" component={WordSearchLevelSelectionScreen} options={{ title: 'Osemsmerovka' }} />
      <GamesStack.Screen name="WordSearch" component={WordSearchScreen} options={{ title: 'Osemsmerovka' }} />
      <GamesStack.Screen name="MemoryTrainer" component={MemoryTrainerScreen} options={{ headerShown: false }} />
      <GamesStack.Screen name="SortPuzzle" component={SortPuzzleScreen} options={{ headerShown: false }} />
      <GamesStack.Screen name="Game2048" component={Game2048Screen} options={{ title: 'Beer 2048' }} />
    </GamesStack.Navigator>
  );
}

const RadioStackNavigator = () => {
  return (
    <RadioStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1E1E1E' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <RadioStack.Screen name="RadioList" component={RadioScreen} options={{ title: 'Rádio' }} />
      <RadioStack.Screen 
        name="RadioDetail" 
        component={RadioDetailScreen} 
        options={({ route }) => ({ title: route.params.radioName })} 
      />
    </RadioStack.Navigator>
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
            } else if (route.name === 'Radio') {
              iconName = 'radio';
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
          name="Radio"
          component={RadioStackNavigator}
          options={{
            headerShown: false,
            tabBarLabel: 'Rádio',
          }}
        />
        <Tab.Screen
          name="Games"
          component={GamesStackNavigator}
          options={({ route }) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? 'GamesList';
            const screensWithoutTabBar = ['WordSearch', 'MemoryTrainer', 'SortPuzzle', 'Game2048'];
            return {
              headerShown: false,
              tabBarLabel: 'Hry',
              tabBarStyle: {
                display: screensWithoutTabBar.includes(routeName) ? 'none' : 'flex',
                backgroundColor: '#1E1E1E',
                borderTopColor: '#333'
              },
            };
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
