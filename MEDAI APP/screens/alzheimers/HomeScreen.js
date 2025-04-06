// src/screens/alzheimers/HomeScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  FlatList,
  RefreshControl,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import LocationService from '../../services/LocationService';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

import theme from '../../constants/theme';


const HomeScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('User');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [homeLocation, setHomeLocation] = useState(null);
  const [safeZoneRadius, setSafeZoneRadius] = useState(500);
  const [isInSafeZone, setIsInSafeZone] = useState(true);
  const [medications, setMedications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [todaysMeds, setTodaysMeds] = useState([]);
  const [weatherData, setWeatherData] = useState({
    temp: '22°C',
    condition: 'Sunny',
    icon: 'sunny'
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  // Load user data
  useEffect(() => {
    loadUserData();
    loadHomeLocation();
    loadMedications();
    loadEmergencyContacts();
    startLocationTracking();
    
    // Animate components on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    
    // Get location permission and current position
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location.coords);
        checkIfInSafeZone(location.coords);
      }
    })();
    
    return () => {
      // Clean up
    };
  }, []);

  const loadUserData = async () => {
    try {
      const name = await AsyncStorage.getItem('user_name');
      if (name) {
        setUserName(name);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadHomeLocation = async () => {
    try {
      const home = await LocationService.getHomeLocation();
      if (home) {
        setHomeLocation(home);
      }
      
      const radius = await LocationService.getSafeZoneRadius();
      if (radius) {
        setSafeZoneRadius(radius);
      }
    } catch (error) {
      console.error('Error loading home location:', error);
    }
  };

  const loadMedications = async () => {
    try {
      const meds = await AsyncStorage.getItem('medicines');
      if (meds) {
        const parsedMeds = JSON.parse(meds);
        setMedications(parsedMeds);
        
        // Filter medications for today
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        
        // In a real app, you would filter based on medication schedule
        // For demo, just showing all medications
        setTodaysMeds(parsedMeds.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading medications:', error);
    }
  };

  const loadEmergencyContacts = async () => {
    try {
      const contacts = await AsyncStorage.getItem('emergency_contacts');
      if (contacts) {
        setEmergencyContacts(JSON.parse(contacts));
      } else {
        // Set sample emergency contacts if none exist
        const sampleContacts = [
          { id: '1', name: 'John Smith (Son)', phoneNumber: '123-456-7890' },
          { id: '2', name: 'Dr. Williams', phoneNumber: '987-654-3210' }
        ];
        setEmergencyContacts(sampleContacts);
      }
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
    }
  };

  const startLocationTracking = async () => {
    const isTracking = await LocationService.startLocationTracking();
    console.log('Location tracking started:', isTracking);
  };

  const checkIfInSafeZone = (location) => {
    if (homeLocation && location) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        homeLocation.latitude,
        homeLocation.longitude
      );
      
      setIsInSafeZone(distance <= safeZoneRadius);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * 
      Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    
    return distance * 1000; // Convert to meters
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    // Refresh data
    await Promise.all([
      loadUserData(),
      loadHomeLocation(),
      loadMedications(),
      loadEmergencyContacts()
    ]);
    
    // Get current location
    try {
      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);
      checkIfInSafeZone(location.coords);
    } catch (error) {
      console.error('Error getting current location:', error);
    }
    
    setRefreshing(false);
  };

  const renderFeatureCard = ({ item }) => (
    <TouchableOpacity
      style={styles.featureCard}
      onPress={() => navigation.navigate(item.screen)}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={item.colors}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.gradientCard}
      >
        <View style={styles.cardIconContainer}>
          <Ionicons name={item.icon} size={32} color="white" />
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const features = [
    {
      id: '1',
      title: 'My Medications',
      description: 'Track and manage your medication schedule',
      icon: 'medkit',
      screen: 'Medication',
      colors: ['#5E72E4', '#825EE4']
    },
    {
      id: '2',
      title: 'Safe Zone',
      description: 'Set and manage your safe zone location',
      icon: 'locate',
      screen: 'SafeZone',
      colors: ['#11CDEF', '#1171EF']
    },
    {
      id: '3',
      title: 'Emergency Contacts',
      description: 'View and contact your emergency contacts',
      icon: 'call',
      screen: 'Contacts',
      colors: ['#2DCE89', '#2DCEBC']
    },
    {
      id: '4',
      title: 'Memory Journal',
      description: 'Record and revisit important memories',
      icon: 'journal',
      screen: 'Journal',
      colors: ['#FB6340', '#FBB140']
    }
  ];

  const renderMedicationItem = ({ item, index }) => (
    <View style={[styles.medicationItem, index === 0 && { borderTopWidth: 0 }]}>
      <View style={styles.medicationTimeContainer}>
        <View style={styles.timeCircle}>
          <Text style={styles.timeText}>
            {index === 0 ? '9:00' : index === 1 ? '13:00' : '19:00'}
          </Text>
          <Text style={styles.amPmText}>
            {index === 0 ? 'AM' : 'PM'}
          </Text>
        </View>
      </View>
      
      <View style={styles.medicationDetails}>
        <Text style={styles.medicationName}>{item.name}</Text>
        <Text style={styles.medicationDosage}>{item.dosage}</Text>
        <View style={styles.medicationInfoRow}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.medicationInfo}>{item.frequency}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.takeMedicationButton}>
        <Text style={styles.takeMedicationText}>Take</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6A5ACD']}
          />
        }
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Hello, {userName}</Text>
              <Text style={styles.date}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
            
            <View style={styles.weatherContainer}>
              <Ionicons name={weatherData.icon} size={24} color="#6A5ACD" />
              <Text style={styles.temperature}>{weatherData.temp}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Safe Zone Status Card */}
        <Animated.View 
          style={[
            styles.safeZoneCard, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })}] 
            }
          ]}
        >
          <View style={styles.safeZoneHeader}>
            <Text style={styles.cardSectionTitle}>Location Status</Text>
            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={() => navigation.navigate('SafeZone')}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.safeZoneContent}>
            <View style={styles.statusInfoContainer}>
              <View style={[
                styles.statusIndicator, 
                { backgroundColor: isInSafeZone ? '#2DCE89' : '#FB6340' }
              ]} />
              <View>
                <Text style={styles.statusTitle}>
                  {isInSafeZone ? 'Within Safe Zone' : 'Outside Safe Zone'}
                </Text>
                <Text style={styles.statusDescription}>
                  {isInSafeZone 
                    ? 'You are currently within your safe zone area' 
                    : 'Warning: You have left your safe zone area'
                  }
                </Text>
              </View>
            </View>
            
            {currentLocation && homeLocation ? (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  region={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  scrollEnabled={false}
                  pitchEnabled={false}
                >
                  {/* Home marker */}
                  <Marker
                    coordinate={{
                      latitude: homeLocation.latitude,
                      longitude: homeLocation.longitude,
                    }}
                    title="Home"
                  >
                    <View style={styles.homeMarker}>
                      <Ionicons name="home" size={16} color="white" />
                    </View>
                  </Marker>
                  
                  {/* Current location marker */}
                  <Marker
                    coordinate={{
                      latitude: currentLocation.latitude,
                      longitude: currentLocation.longitude,
                    }}
                    title="You"
                  >
                    <View style={styles.currentLocationMarker}>
                      <View style={styles.currentLocationDot} />
                    </View>
                  </Marker>
                  
                  {/* Safe zone circle */}
                  <Circle
                    center={{
                      latitude: homeLocation.latitude,
                      longitude: homeLocation.longitude,
                    }}
                    radius={safeZoneRadius}
                    fillColor="rgba(106, 90, 205, 0.1)"
                    strokeColor="rgba(106, 90, 205, 0.5)"
                    strokeWidth={2}
                  />
                </MapView>
                
                {!isInSafeZone && (
                  <TouchableOpacity 
                    style={styles.navigateHomeButton}
                    onPress={() => {
                      // In a real app, this would launch navigation
                      navigation.navigate('SafeZone');
                    }}
                  >
                    <Ionicons name="navigate" size={16} color="white" />
                    <Text style={styles.navigateHomeText}>Navigate Home</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.loadingMap}>
                <Text style={styles.loadingText}>Loading map...</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Today's Medication */}
        <Animated.View 
          style={[
            styles.sectionContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [70, 0]
              })}] 
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Medication</Text>
            <TouchableOpacity 
              style={styles.sectionAction}
              onPress={() => navigation.navigate('Medication')}
            >
              <Text style={styles.sectionActionText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#6A5ACD" />
            </TouchableOpacity>
          </View>
          
          {todaysMeds.length > 0 ? (
            <View style={styles.medicationList}>
              <FlatList
                data={todaysMeds}
                renderItem={renderMedicationItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            </View>
          ) : (
            <View style={styles.emptyMedications}>
              <Ionicons name="calendar-outline" size={40} color="#DDD" />
              <Text style={styles.emptyText}>No medications scheduled for today</Text>
            </View>
          )}
        </Animated.View>

        {/* Quick Access */}
<Animated.View 
          style={[
            styles.quickAccessContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [40, 0]
              })}] 
            }
          ]}
        >
          <Text style={[styles.sectionTitle, {
            marginLeft: 23,
          }]}>Quick Access</Text>
          
          <View style={styles.featureGrid}>
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('Medication')}
            >
              <LinearGradient
                colors={[theme.colors.accent.alzheimers.light, theme.colors.accent.alzheimers.main]}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.gradientCard}
              >
                <View style={styles.cardIconContainer}>
                  <Ionicons name="medkit-outline" size={24} color="white" />
                </View>
                <Text style={styles.cardTitle}>My Medications</Text>
                <Text style={styles.cardDescription}>Track and manage your medication schedule</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('SafeZone')}
            >
              <LinearGradient
                colors={[theme.colors.accent.alzheimers.light, theme.colors.accent.alzheimers.main]}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.gradientCard}
              >
                <View style={styles.cardIconContainer}>
                  <Ionicons name="locate-outline" size={24} color="white" />
                </View>
                <Text style={styles.cardTitle}>Safe Zone</Text>
                <Text style={styles.cardDescription}>Set and manage your safe zone location</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('Contacts')}
            >
              <LinearGradient
                colors={[theme.colors.accent.alzheimers.light, theme.colors.accent.alzheimers.main]}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.gradientCard}
              >
                <View style={styles.cardIconContainer}>
                  <Ionicons name="call-outline" size={24} color="white" />
                </View>
                <Text style={styles.cardTitle}>Emergency Contacts</Text>
                <Text style={styles.cardDescription}>View and contact your emergency contacts</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('Journal')}
            >
              <LinearGradient
                colors={[theme.colors.accent.alzheimers.light, theme.colors.accent.alzheimers.main]}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.gradientCard}
              >
                <View style={styles.cardIconContainer}>
                  <Ionicons name="book-outline" size={24} color="white" />
                </View>
                <Text style={styles.cardTitle}>Memory Journal</Text>
                <Text style={styles.cardDescription}>Record and revisit important memories</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Emergency Contacts */}
        <Animated.View 
          style={[
            styles.sectionContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [110, 0]
              })}] 
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          
          <View style={styles.contactsContainer}>
            {emergencyContacts.map((contact, index) => (
              <TouchableOpacity 
                key={contact.id} 
                style={styles.contactCard}
                onPress={() => {
                  // In a real app, this would call the contact
                  alert(`Calling ${contact.name}...`);
                }}
              >
                <View style={styles.contactIconContainer}>
                  <Ionicons name="call" size={24} color="white" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Fall Detection Status */}
        <Animated.View 
          style={[
            styles.fallDetectionCard, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [130, 0]
              })}] 
            }
          ]}
        >
          <View style={styles.fallDetectionContent}>
            <View style={styles.fallDetectionIconContainer}>
              <Ionicons name="fitness" size={24} color="#6A5ACD" />
            </View>
            <View style={styles.fallDetectionInfo}>
              <Text style={styles.fallDetectionTitle}>Fall Detection</Text>
              <Text style={styles.fallDetectionStatus}>Active and monitoring</Text>
            </View>
            <View style={styles.fallDetectionSwitch}>
              <View style={styles.switchTrack}>
                <View style={styles.switchKnob} />
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  header: {
    paddingTop: StatusBar.currentHeight + 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  temperature: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
    color: '#666',
  },
  safeZoneCard: {
    margin: 20,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  safeZoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  viewDetailsButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#6A5ACD',
    fontWeight: '500',
  },
  safeZoneContent: {
    padding: 15,
  },
  statusInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
  },
  mapContainer: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  homeMarker: {
    backgroundColor: '#6A5ACD',
    padding: 6,
    borderRadius: 12,
  },
  currentLocationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: 'white',
  },
  navigateHomeButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#6A5ACD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigateHomeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  loadingMap: {
    height: 180,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionActionText: {
    fontSize: 14,
    color: '#6A5ACD',
    marginRight: 5,
  },
  medicationList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  medicationTimeContainer: {
    marginRight: 15,
  },
  timeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6A5ACD',
  },
  amPmText: {
    fontSize: 10,
    color: '#6A5ACD',
  },
  medicationDetails: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#6A5ACD',
    marginBottom: 5,
  },
  medicationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medicationInfo: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  takeMedicationButton: {
    backgroundColor: '#6A5ACD',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  takeMedicationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyMedications: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  featuresContainer: {
    height: 160,
  },
  featuresList: {
    paddingLeft: 0,
    paddingRight: 20,
  },
  featureCard: {
    width: CARD_WIDTH,
    height: 140,
    marginLeft: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  gradientCard: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  contactsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6A5ACD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  fallDetectionCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  fallDetectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  fallDetectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  fallDetectionInfo: {
    flex: 1,
  },
  fallDetectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  fallDetectionStatus: {
    fontSize: 14,
    color: '#2DCE89',
  },
  fallDetectionSwitch: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6A5ACD',
    padding: 2,
    justifyContent: 'center',
  },
  switchKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  quickAccessContainer: {
    marginBottom: theme.spacing.md,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 12
  },
  featureCard: {
    width: (width - theme.spacing.md * 2 - theme.spacing.sm) / 2,
    height: 180,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  gradientCard: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
    marginTop: theme.spacing.xs,
  },
  contactsContainer: {
    marginTop: 0,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accent.alzheimers.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.gray[900],
    marginBottom: 3,
  },
  contactPhone: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
  },
});

export default HomeScreen;