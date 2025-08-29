import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AlarmScreen from '../screens/AlarmScreen';
import GalleryScreen from '../screens/GalleryScreen';

export type RootStackParamList = {
  Alarm: undefined;
  Gallery: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Alarm"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#121212',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
            name="Alarm" 
            component={AlarmScreen} 
            options={{ headerShown: false }} 
        />
        <Stack.Screen 
            name="Gallery" 
            component={GalleryScreen} 
            options={{ title: 'Galéria' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
