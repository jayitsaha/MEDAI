// import 'react-native-gesture-handler';
// import React, { useState, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   TouchableOpacity, 
//   ActivityIndicator,
//   StatusBar,
//   Alert 
// } from 'react-native';
// import { NavigationContainer } from '@react-navigation/native';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { createStackNavigator } from '@react-navigation/stack';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// // Persona Selection Screen
// import PersonaSelectionScreen from './screens/onboarding/PersonaSelectionScreen';

// // Alzheimer's Screens
// import AlzheimersHomeScreen from './screens/alzheimers/HomeScreen';
// import MedicationScreen from './screens/alzheimers/MedicationScreen';
// import SafeZoneScreen from './screens/alzheimers/SafeZoneScreen';

// // Pregnancy Screens
// import PregnancyHomeScreen from './screens/pregnancy/HomeScreen';
// import YogaScreen from './screens/pregnancy/YogaScreen';
// import ChatbotScreen from './screens/pregnancy/ChatbotScreen';
// import DietScreen from './screens/pregnancy/DietScreen';
// import AppointmentScreen from './screens/pregnancy/AppointmentScreen';

// // Common Services
// import FallDetectionService from './services/FallDetectionService';
// import { setupNotifications } from './services/NotificationService';

// const Tab = createBottomTabNavigator();
// const AlzheimersStack = createStackNavigator();
// const PregnancyStack = createStackNavigator();

// const AlzheimersNavigator = ({ navigation, logoutHandler }) => {
//   return (
//     <AlzheimersStack.Navigator 
//       screenOptions={{
//         headerStyle: { backgroundColor: '#6A5ACD' },
//         headerTintColor: '#fff',
//         headerTitleStyle: { fontWeight: 'bold' },
//         headerRight: () => (
//           <TouchableOpacity 
//             style={{ marginRight: 15 }}
//             onPress={() => {
//               Alert.alert(
//                 "Logout",
//                 "Are you sure you want to logout?",
//                 [
//                   {
//                     text: "Cancel",
//                     style: "cancel"
//                   },
//                   { 
//                     text: "Logout", 
//                     onPress: () => logoutHandler() 
//                   }
//                 ]
//               );
//             }}
//           >
//             <Ionicons name="log-out-outline" size={24} color="white" />
//           </TouchableOpacity>
//         )
//       }}
//     >
//       <AlzheimersStack.Screen 
//         name="Home" 
//         component={AlzheimersHomeScreen} 
//         options={{ 
//           title: 'MEDAI Home',
//           headerShown: false // Hide header for our beautiful home screen
//         }} 
//       />
//       <AlzheimersStack.Screen 
//         name="Medication" 
//         component={MedicationScreen} 
//         options={{ title: 'My Medications' }} 
//       />
//       <AlzheimersStack.Screen 
//         name="SafeZone" 
//         component={SafeZoneScreen} 
//         options={{ title: 'Safe Zone Settings' }} 
//       />
//     </AlzheimersStack.Navigator>
//   );
// };

// const PregnancyNavigator = ({ navigation, logoutHandler }) => {
//   return (
//     <PregnancyStack.Navigator
//       screenOptions={{
//         headerStyle: { backgroundColor: '#FF69B4' },
//         headerTintColor: '#fff',
//         headerTitleStyle: { fontWeight: 'bold' },
//         headerRight: () => (
//           <TouchableOpacity 
//             style={{ marginRight: 15 }}
//             onPress={() => {
//               Alert.alert(
//                 "Logout",
//                 "Are you sure you want to logout?",
//                 [
//                   {
//                     text: "Cancel",
//                     style: "cancel"
//                   },
//                   { 
//                     text: "Logout", 
//                     onPress: () => logoutHandler() 
//                   }
//                 ]
//               );
//             }}
//           >
//             <Ionicons name="log-out-outline" size={24} color="white" />
//           </TouchableOpacity>
//         )
//       }}
//     >
//       <PregnancyStack.Screen 
//         name="Home" 
//         component={PregnancyHomeScreen} 
//         options={{ 
//           title: 'MEDAI Home',
//           headerShown: false // Hide header for our beautiful home screen
//         }} 
//       />
//       <PregnancyStack.Screen 
//         name="Yoga" 
//         component={YogaScreen} 
//         options={{ title: 'Prenatal Yoga' }} 
//       />
//       <PregnancyStack.Screen 
//         name="Chatbot" 
//         component={ChatbotScreen} 
//         options={{ title: 'Pregnancy Assistant' }} 
//       />
//       <PregnancyStack.Screen 
//         name="Diet" 
//         component={DietScreen} 
//         options={{ title: 'Diet & Nutrition' }} 
//       />
//       <PregnancyStack.Screen 
//         name="Appointments" 
//         component={AppointmentScreen} 
//         options={{ title: 'Appointment Scheduler' }} 
//       />
//     </PregnancyStack.Navigator>
//   );
// };

// const App = () => {
//   const [userType, setUserType] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     // Initialize fall detection service
//     // FallDetectionService.initialize();
    
//     // Setup notifications
//     setupNotifications();
    
//     // Check user type from storage
//     const checkUserType = async () => {
//       try {
//         const storedUserType = await AsyncStorage.getItem('userType');
//         if (storedUserType) {
//           setUserType(storedUserType);
//         }
//         setIsLoading(false);
//       } catch (error) {
//         console.error('Error retrieving user type:', error);
//         setIsLoading(false);
//       }
//     };
    
//     checkUserType();
//   }, []);

//   const handlePersonaSelection = (type) => {
//     setUserType(type);
//   };

//   const handleLogout = async () => {
//     try {
//       // Clear all data from AsyncStorage
//       await AsyncStorage.clear();
      
//       // Reset state to show persona selection screen
//       setUserType(null);
      
//       console.log('Logged out successfully!');
//     } catch (error) {
//       console.error('Error logging out:', error);
//       Alert.alert('Error', 'Failed to logout. Please try again.');
//     }
//   };

//   if (isLoading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F8F8' }}>
//         <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
//         <ActivityIndicator size="large" color="#FF69B4" />
//       </View>
//     );
//   }

//   if (!userType) {
//     return <PersonaSelectionScreen onPersonaSelected={handlePersonaSelection} />;
//   }

//   return (
//     <SafeAreaProvider>
//       <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
//       <NavigationContainer>
//         {userType === 'alzheimers' ? (
//           <Tab.Navigator
//             screenOptions={({ route }) => ({
//               tabBarIcon: ({ focused, color, size }) => {
//                 let iconName;
                
//                 if (route.name === 'Home') {
//                   iconName = focused ? 'home' : 'home-outline';
//                 } else if (route.name === 'Medication') {
//                   iconName = focused ? 'medkit' : 'medkit-outline';
//                 } else if (route.name === 'SafeZone') {
//                   iconName = focused ? 'location' : 'location-outline';
//                 }
                
//                 return <Ionicons name={iconName} size={size} color={color} />;
//               },
//               tabBarActiveTintColor: '#6A5ACD',
//               tabBarInactiveTintColor: 'gray',
//               tabBarStyle: {
//                 elevation: 0,
//                 borderTopWidth: 1,
//                 borderTopColor: '#F0F0F0',
//                 height: 60,
//                 paddingBottom: 8,
//                 paddingTop: 8,
//               }
//             })}
//           >
//             <Tab.Screen 
//               name="Home" 
//               options={{ headerShown: false }}
//             >
//               {props => <AlzheimersNavigator {...props} logoutHandler={handleLogout} />}
//             </Tab.Screen>
//             <Tab.Screen 
//               name="Medication" 
//               component={MedicationScreen}
//               options={{
//                 title: 'Medications',
//                 headerRight: () => (
//                   <TouchableOpacity 
//                     style={{ marginRight: 15 }}
//                     onPress={() => {
//                       Alert.alert(
//                         "Logout",
//                         "Are you sure you want to logout?",
//                         [
//                           {
//                             text: "Cancel",
//                             style: "cancel"
//                           },
//                           { 
//                             text: "Logout", 
//                             onPress: () => handleLogout() 
//                           }
//                         ]
//                       );
//                     }}
//                   >
//                     <Ionicons name="log-out-outline" size={24} color="#6A5ACD" />
//                   </TouchableOpacity>
//                 )
//               }}
//             />
//             <Tab.Screen 
//               name="SafeZone" 
//               component={SafeZoneScreen}
//               options={{
//                 title: 'Safe Zone',
//                 headerRight: () => (
//                   <TouchableOpacity 
//                     style={{ marginRight: 15 }}
//                     onPress={() => {
//                       Alert.alert(
//                         "Logout",
//                         "Are you sure you want to logout?",
//                         [
//                           {
//                             text: "Cancel",
//                             style: "cancel"
//                           },
//                           { 
//                             text: "Logout", 
//                             onPress: () => handleLogout() 
//                           }
//                         ]
//                       );
//                     }}
//                   >
//                     <Ionicons name="log-out-outline" size={24} color="#6A5ACD" />
//                   </TouchableOpacity>
//                 )
//               }}
//             />
//           </Tab.Navigator>
//         ) : (
//           <Tab.Navigator
//             screenOptions={({ route }) => ({
//               tabBarIcon: ({ focused, color, size }) => {
//                 let iconName;
                
//                 if (route.name === 'Home') {
//                   iconName = focused ? 'home' : 'home-outline';
//                 } else if (route.name === 'Yoga') {
//                   iconName = focused ? 'fitness' : 'fitness-outline';
//                 } else if (route.name === 'Chatbot') {
//                   iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
//                 } else if (route.name === 'Diet') {
//                   iconName = focused ? 'nutrition' : 'nutrition-outline';
//                 } else if (route.name === 'Appointments') {
//                   iconName = focused ? 'calendar' : 'calendar-outline';
//                 }
                
//                 return <Ionicons name={iconName} size={size} color={color} />;
//               },
//               tabBarActiveTintColor: '#FF69B4',
//               tabBarInactiveTintColor: 'gray',
//               tabBarStyle: {
//                 elevation: 0,
//                 borderTopWidth: 1,
//                 borderTopColor: '#F0F0F0',
//                 height: 60,
//                 paddingBottom: 8,
//                 paddingTop: 8,
//               }
//             })}
//           >
//             <Tab.Screen 
//               name="Home" 
//               options={{ headerShown: false }}
//             >
//               {props => <PregnancyNavigator {...props} logoutHandler={handleLogout} />}
//             </Tab.Screen>
//             <Tab.Screen 
//               name="Yoga" 
//               component={YogaScreen}
//               options={{
//                 headerRight: () => (
//                   <TouchableOpacity 
//                     style={{ marginRight: 15 }}
//                     onPress={() => {
//                       Alert.alert(
//                         "Logout",
//                         "Are you sure you want to logout?",
//                         [
//                           {
//                             text: "Cancel",
//                             style: "cancel"
//                           },
//                           { 
//                             text: "Logout", 
//                             onPress: () => handleLogout() 
//                           }
//                         ]
//                       );
//                     }}
//                   >
//                     <Ionicons name="log-out-outline" size={24} color="#FF69B4" />
//                   </TouchableOpacity>
//                 )
//               }}
//             />
//             <Tab.Screen 
//               name="Chatbot" 
//               component={ChatbotScreen}
//               options={{
//                 headerRight: () => (
//                   <TouchableOpacity 
//                     style={{ marginRight: 15 }}
//                     onPress={() => {
//                       Alert.alert(
//                         "Logout",
//                         "Are you sure you want to logout?",
//                         [
//                           {
//                             text: "Cancel",
//                             style: "cancel"
//                           },
//                           { 
//                             text: "Logout", 
//                             onPress: () => handleLogout() 
//                           }
//                         ]
//                       );
//                     }}
//                   >
//                     <Ionicons name="log-out-outline" size={24} color="#FF69B4" />
//                   </TouchableOpacity>
//                 )
//               }}
//             />
//             <Tab.Screen 
//               name="Diet" 
//               component={DietScreen}
//               options={{
//                 headerRight: () => (
//                   <TouchableOpacity 
//                     style={{ marginRight: 15 }}
//                     onPress={() => {
//                       Alert.alert(
//                         "Logout",
//                         "Are you sure you want to logout?",
//                         [
//                           {
//                             text: "Cancel",
//                             style: "cancel"
//                           },
//                           { 
//                             text: "Logout", 
//                             onPress: () => handleLogout() 
//                           }
//                         ]
//                       );
//                     }}
//                   >
//                     <Ionicons name="log-out-outline" size={24} color="#FF69B4" />
//                   </TouchableOpacity>
//                 )
//               }}
//             />
//             <Tab.Screen 
//               name="Appointments" 
//               component={AppointmentScreen}
//               options={{
//                 headerRight: () => (
//                   <TouchableOpacity 
//                     style={{ marginRight: 15 }}
//                     onPress={() => {
//                       Alert.alert(
//                         "Logout",
//                         "Are you sure you want to logout?",
//                         [
//                           {
//                             text: "Cancel",
//                             style: "cancel"
//                           },
//                           { 
//                             text: "Logout", 
//                             onPress: () => handleLogout() 
//                           }
//                         ]
//                       );
//                     }}
//                   >
//                     <Ionicons name="log-out-outline" size={24} color="#FF69B4" />
//                   </TouchableOpacity>
//                 )
//               }}
//             />
//           </Tab.Navigator>
//         )}
//       </NavigationContainer>
//     </SafeAreaProvider>
//   );
// };

// export default App;

import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  StatusBar,
  Alert 
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Persona Selection Screen
import PersonaSelectionScreen from './screens/onboarding/PersonaSelectionScreen';

// Alzheimer's Screens
import AlzheimersHomeScreen from './screens/alzheimers/HomeScreen';
import MedicationScreen from './screens/alzheimers/MedicationScreen';
import SafeZoneScreen from './screens/alzheimers/SafeZoneScreen';

// Pregnancy Screens
import PregnancyHomeScreen from './screens/pregnancy/HomeScreen';
import YogaScreen from './screens/pregnancy/YogaScreen';
import ChatbotScreen from './screens/pregnancy/ChatbotScreen';
import DietScreen from './screens/pregnancy/DietScreen';
import AppointmentScreen from './screens/pregnancy/AppointmentScreen';

// Common Services
import FallDetectionService from './services/FallDetectionService';
import { setupNotifications } from './services/NotificationService';

const Tab = createBottomTabNavigator();
const AlzheimersStack = createStackNavigator();
const PregnancyStack = createStackNavigator();

const AlzheimersNavigator = ({ navigation, logoutHandler }) => {
  return (
    <AlzheimersStack.Navigator 
      screenOptions={{
        headerStyle: { backgroundColor: '#6A5ACD' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerRight: () => (
          <TouchableOpacity 
            style={{ marginRight: 15 }}
            onPress={() => {
              Alert.alert(
                "Logout",
                "Are you sure you want to logout?",
                [
                  {
                    text: "Cancel",
                    style: "cancel"
                  },
                  { 
                    text: "Logout", 
                    onPress: () => logoutHandler() 
                  }
                ]
              );
            }}
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        )
      }}
    >
      <AlzheimersStack.Screen 
        name="HomeScreen" // Changed from "Home" to "HomeScreen"
        component={AlzheimersHomeScreen} 
        options={{ 
          title: 'MEDAI Home',
          headerShown: false // Hide header for our beautiful home screen
        }} 
      />
      <AlzheimersStack.Screen 
        name="Medication" 
        component={MedicationScreen} 
        options={{ title: 'My Medications' }} 
      />
      <AlzheimersStack.Screen 
        name="SafeZone" 
        component={SafeZoneScreen} 
        options={{ title: 'Safe Zone Settings' }} 
      />
    </AlzheimersStack.Navigator>
  );
};

const PregnancyNavigator = ({ navigation, logoutHandler }) => {
  return (
    <PregnancyStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FF69B4' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerRight: () => (
          <TouchableOpacity 
            style={{ marginRight: 15 }}
            onPress={() => {
              Alert.alert(
                "Logout",
                "Are you sure you want to logout?",
                [
                  {
                    text: "Cancel",
                    style: "cancel"
                  },
                  { 
                    text: "Logout", 
                    onPress: () => logoutHandler() 
                  }
                ]
              );
            }}
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        )
      }}
    >
      <PregnancyStack.Screen 
        name="HomeScreen" // Changed from "Home" to "HomeScreen"
        component={PregnancyHomeScreen} 
        options={{ 
          title: 'MEDAI Home',
          headerShown: false // Hide header for our beautiful home screen
        }} 
      />
      <PregnancyStack.Screen 
        name="Yoga" 
        component={YogaScreen} 
        options={{ title: 'Prenatal Yoga' }} 
      />
      <PregnancyStack.Screen 
        name="Chatbot" 
        component={ChatbotScreen} 
        options={{ title: 'Pregnancy Assistant' }} 
      />
      <PregnancyStack.Screen 
        name="Diet" 
        component={DietScreen} 
        options={{ title: 'Diet & Nutrition' }} 
      />
      <PregnancyStack.Screen 
        name="Appointments" 
        component={AppointmentScreen} 
        options={{ title: 'Appointment Scheduler' }} 
      />
    </PregnancyStack.Navigator>
  );
};

const App = () => {
  const [userType, setUserType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize fall detection service
    // FallDetectionService.initialize();
    
    // Setup notifications
    setupNotifications();
    
    // Check user type from storage
    const checkUserType = async () => {
      try {
        const storedUserType = await AsyncStorage.getItem('userType');
        if (storedUserType) {
          setUserType(storedUserType);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error retrieving user type:', error);
        setIsLoading(false);
      }
    };
    
    checkUserType();
  }, []);

  const handlePersonaSelection = (type) => {
    setUserType(type);
  };

  const handleLogout = async () => {
    try {
      // Clear all data from AsyncStorage
      await AsyncStorage.clear();
      
      // Reset state to show persona selection screen
      setUserType(null);
      
      console.log('Logged out successfully!');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F8F8' }}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <ActivityIndicator size="large" color="#FF69B4" />
      </View>
    );
  }

  if (!userType) {
    return <PersonaSelectionScreen onPersonaSelected={handlePersonaSelection} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <NavigationContainer>
        {userType === 'alzheimers' ? (
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                
                if (route.name === 'Home') {
                  iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'Medication') {
                  iconName = focused ? 'medkit' : 'medkit-outline';
                } else if (route.name === 'SafeZone') {
                  iconName = focused ? 'location' : 'location-outline';
                }
                
                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#6A5ACD',
              tabBarInactiveTintColor: 'gray',
              tabBarStyle: {
                elevation: 0,
                borderTopWidth: 1,
                borderTopColor: '#F0F0F0',
                height: 60,
                paddingBottom: 8,
                paddingTop: 8,
              }
            })}
          >
            <Tab.Screen 
              name="Home" // Keep this as "Home" for the tab
              options={{ headerShown: false }}
            >
              {props => <AlzheimersNavigator {...props} logoutHandler={handleLogout} />}
            </Tab.Screen>
            <Tab.Screen 
              name="Medication" 
              component={MedicationScreen}
              options={{
                title: 'Medications',
                headerRight: () => (
                  <TouchableOpacity 
                    style={{ marginRight: 15 }}
                    onPress={() => {
                      Alert.alert(
                        "Logout",
                        "Are you sure you want to logout?",
                        [
                          {
                            text: "Cancel",
                            style: "cancel"
                          },
                          { 
                            text: "Logout", 
                            onPress: () => handleLogout() 
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="log-out-outline" size={24} color="#6A5ACD" />
                  </TouchableOpacity>
                )
              }}
            />
            <Tab.Screen 
              name="SafeZone" 
              component={SafeZoneScreen}
              options={{
                title: 'Safe Zone',
                headerRight: () => (
                  <TouchableOpacity 
                    style={{ marginRight: 15 }}
                    onPress={() => {
                      Alert.alert(
                        "Logout",
                        "Are you sure you want to logout?",
                        [
                          {
                            text: "Cancel",
                            style: "cancel"
                          },
                          { 
                            text: "Logout", 
                            onPress: () => handleLogout() 
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="log-out-outline" size={24} color="#6A5ACD" />
                  </TouchableOpacity>
                )
              }}
            />
          </Tab.Navigator>
        ) : (
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                
                if (route.name === 'Home') {
                  iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'Yoga') {
                  iconName = focused ? 'fitness' : 'fitness-outline';
                } else if (route.name === 'Chatbot') {
                  iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                } else if (route.name === 'Diet') {
                  iconName = focused ? 'nutrition' : 'nutrition-outline';
                } else if (route.name === 'Appointments') {
                  iconName = focused ? 'calendar' : 'calendar-outline';
                }
                
                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#FF69B4',
              tabBarInactiveTintColor: 'gray',
              tabBarStyle: {
                elevation: 0,
                borderTopWidth: 1,
                borderTopColor: '#F0F0F0',
                height: 60,
                paddingBottom: 8,
                paddingTop: 8,
              }
            })}
          >
            <Tab.Screen 
              name="Home" // Keep this as "Home" for the tab
              options={{ headerShown: false }}
            >
              {props => <PregnancyNavigator {...props} logoutHandler={handleLogout} />}
            </Tab.Screen>
            <Tab.Screen 
              name="Yoga" 
              component={YogaScreen}
              options={{
                headerRight: () => (
                  <TouchableOpacity 
                    style={{ marginRight: 15 }}
                    onPress={() => {
                      Alert.alert(
                        "Logout",
                        "Are you sure you want to logout?",
                        [
                          {
                            text: "Cancel",
                            style: "cancel"
                          },
                          { 
                            text: "Logout", 
                            onPress: () => handleLogout() 
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="log-out-outline" size={24} color="#FF69B4" />
                  </TouchableOpacity>
                )
              }}
            />
            <Tab.Screen 
              name="Chatbot" 
              component={ChatbotScreen}
              options={{
                headerRight: () => (
                  <TouchableOpacity 
                    style={{ marginRight: 15 }}
                    onPress={() => {
                      Alert.alert(
                        "Logout",
                        "Are you sure you want to logout?",
                        [
                          {
                            text: "Cancel",
                            style: "cancel"
                          },
                          { 
                            text: "Logout", 
                            onPress: () => handleLogout() 
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="log-out-outline" size={24} color="#FF69B4" />
                  </TouchableOpacity>
                )
              }}
            />
            <Tab.Screen 
              name="Diet" 
              component={DietScreen}
              options={{
                headerRight: () => (
                  <TouchableOpacity 
                    style={{ marginRight: 15 }}
                    onPress={() => {
                      Alert.alert(
                        "Logout",
                        "Are you sure you want to logout?",
                        [
                          {
                            text: "Cancel",
                            style: "cancel"
                          },
                          { 
                            text: "Logout", 
                            onPress: () => handleLogout() 
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="log-out-outline" size={24} color="#FF69B4" />
                  </TouchableOpacity>
                )
              }}
            />
            <Tab.Screen 
              name="Appointments" 
              component={AppointmentScreen}
              options={{
                headerRight: () => (
                  <TouchableOpacity 
                    style={{ marginRight: 15 }}
                    onPress={() => {
                      Alert.alert(
                        "Logout",
                        "Are you sure you want to logout?",
                        [
                          {
                            text: "Cancel",
                            style: "cancel"
                          },
                          { 
                            text: "Logout", 
                            onPress: () => handleLogout() 
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="log-out-outline" size={24} color="#FF69B4" />
                  </TouchableOpacity>
                )
              }}
            />
          </Tab.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;