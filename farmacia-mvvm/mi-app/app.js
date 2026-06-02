// App.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './src/navigation/StackNavigator';
import LoginScreen from './src/screens/auth/LoginScreen';
import MenuPrincipalScreen from './src/screens/MenuPrincipalScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false, // Ocultar header por defecto
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
        />
        <Stack.Screen 
          name="MenuPrincipal" 
          component={MenuPrincipalScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
