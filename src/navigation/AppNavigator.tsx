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
import ToolsScreen from '../screens/ToolsScreen';
import SpiritLevelScreen from '../screens/SpiritLevelScreen';
import CompassScreen from '../screens/CompassScreen';
import CalculatorScreen from '../screens/CalculatorScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import AddProjectScreen from '../screens/AddProjectScreen';
import ProjectTimelineScreen from '../screens/ProjectTimelineScreen';
import AddEntryScreen from '../screens/AddEntryScreen';
import EntryDetailScreen from '../screens/EntryDetailScreen';


export type Entry = {
  id: string;
  type: 'note' | 'checklist';
  content: string | { text: string; checked: boolean }[];
  photos: string[];
  date: string;
};

export type Project = {
  id: string;
  name: string;
  entries: Entry[];
};

export type GamesStackParamList = {
  GamesList: undefined;
  GameDetail: { gameId: string; gameName: string };
  WordSearchLevelSelection: undefined;
  WordSearch: { levelId: number };
  MemoryTrainer: undefined;
  SortPuzzle: undefined;
  Game2048: undefined;
};

export type RadioStackParamList = {
  RadioList: undefined;
  RadioDetail: { radioName: string, streamUrl: string };
};

export type ToolsStackParamList = {
  ToolsList: undefined;
  SpiritLevel: undefined;
  Compass: undefined;
  Calculator: undefined;
  Inclinometer: undefined;
  ProjectsList: undefined;
  AddProject: undefined;
  ProjectTimeline: { projectId: string };
  AddEntry: { projectId: string, entry?: Entry };
  EntryDetail: { projectId: string, entryId: string };
};

export type ProjectsStackParamList = {
  ProjectsList: undefined;
  AddProject: undefined;
  ProjectTimeline: { projectId: string };
  AddEntry: { projectId: string, entry?: Entry };
  EntryDetail: { projectId: string, entryId: string };
};

export type RootTabParamList = {
  Alarm: undefined;
  Gallery: undefined;
  Games: undefined;
  Radio: undefined;
  Tools: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const GamesStack = createNativeStackNavigator<GamesStackParamList>();
const RadioStack = createNativeStackNavigator<RadioStackParamList>();
const ToolsStack = createNativeStackNavigator<ToolsStackParamList>();
const ProjectsStack = createNativeStackNavigator<ProjectsStackParamList>();

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

const ToolsStackNavigator = () => {
  return (
    <ToolsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1E1E1E' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <ToolsStack.Screen name="ToolsList" component={ToolsScreen} options={{ title: 'Nástroje' }} />
      <ToolsStack.Screen name="SpiritLevel" component={SpiritLevelScreen} options={{ title: 'Vodováha' }} />
      <ToolsStack.Screen name="Compass" component={CompassScreen} options={{ title: 'Kompas' }} />
      <ToolsStack.Screen name="Calculator" component={CalculatorScreen} options={{ title: 'Kalkulačka' }} />
      <ToolsStack.Screen name="ProjectsList" component={ProjectsScreen} options={{ title: 'Projekty' }} />
      <ToolsStack.Screen name="AddProject" component={AddProjectScreen} options={{ title: 'Nový Projekt' }} />
      <ToolsStack.Screen name="ProjectTimeline" component={ProjectTimelineScreen} options={{ title: 'Časová Os' }} />
      <ToolsStack.Screen name="AddEntry" component={AddEntryScreen} options={{ title: 'Nový Záznam' }} />
      <ToolsStack.Screen name="EntryDetail" component={EntryDetailScreen} options={{ title: 'Detail Záznamu' }} />
    </ToolsStack.Navigator>
  );
}

const ProjectsStackNavigator = () => {
  return (
    <ProjectsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1E1E1E' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <ProjectsStack.Screen name="ProjectsList" component={ProjectsScreen} options={{ title: 'Projekty' }} />
      <ProjectsStack.Screen name="AddProject" component={AddProjectScreen} options={{ title: 'Nový Projekt' }} />
      <ProjectsStack.Screen name="ProjectTimeline" component={ProjectTimelineScreen} options={{ title: 'Časová Os' }} />
      <ProjectsStack.Screen name="AddEntry" component={AddEntryScreen} options={{ title: 'Nový Záznam' }} />
      <ProjectsStack.Screen name="EntryDetail" component={EntryDetailScreen} options={{ title: 'Detail Záznamu' }} />
    </ProjectsStack.Navigator>
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
            } else if (route.name === 'Tools') {
              iconName = focused ? 'toolbox' : 'toolbox-outline';
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
          name="Tools"
          component={ToolsStackNavigator}
          options={{
            headerShown: false,
            tabBarLabel: 'Nástroje',
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
