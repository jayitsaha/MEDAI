import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import EmergencyReportScreen from './EmergencyReportScreen';
import VoiceTextNoteScreen from './VoiceTextNoteScreen';
import EmergencyStatusScreen from './EmergencyStatusScreen';
import ConnectedPatientsScreen from './ConnectedPatientsScreen';
import PatientDashboardScreen from './PatientDashboardScreen';
import SafeZoneSettingsScreen from './SafeZoneSettingsScreen';
import MedicationReminderScreen from './MedicationReminderScreen';
import ProfileScreen from './ProfileScreen';

const Stack = createStackNavigator();

const MainApp = () => {
  return (
    <Stack.Navigator 
      initialRouteName="EmergencyReport"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="EmergencyReport" component={EmergencyReportScreen} />
      <Stack.Screen name="VoiceTextNote" component={VoiceTextNoteScreen} />
      <Stack.Screen name="EmergencyStatus" component={EmergencyStatusScreen} />
      <Stack.Screen name="ConnectedPatients" component={ConnectedPatientsScreen} />
      <Stack.Screen name="PatientDashboard" component={PatientDashboardScreen} />
      <Stack.Screen name="SafeZoneSettings" component={SafeZoneSettingsScreen} />
      <Stack.Screen name="MedicationReminder" component={MedicationReminderScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />

    </Stack.Navigator>
  );
};

export default MainApp;