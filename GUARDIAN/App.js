import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import 'react-native-gesture-handler';

// Import screens
// import IntroductionAnimationScreen from './screens/IntroductionAnimationScreen.tsx';
import SignInScreen from './screens/SignInScreen';
// import SignUpScreen from './screens/SignUpScreen';
import MainApp from './screens/MainApp';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SignInScreen"
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* <Stack.Screen name="IntroductionAnimation" component={IntroductionAnimationScreen} /> */}
        <Stack.Screen name="SignInScreen" component={SignInScreen} />
        {/* <Stack.Screen name="SignUpScreen" component={SignUpScreen} /> */}
        <Stack.Screen name="MainApp" component={MainApp} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});