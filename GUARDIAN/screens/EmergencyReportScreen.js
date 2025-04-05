import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Animated,
  SafeAreaView,
  StatusBar
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { Audio } from 'expo-av';

// Screen dimensions
const { width, height } = Dimensions.get('window');

// API URL
const API_URL = 'https://medai-guardian-api.herokuapp.com';

// Dummy nearby facilities data
const DUMMY_FACILITIES = [
    {
      id: '1',
      name: 'Manipal Hospital, Whitefield',
      type: 'hospital',
      distance: 1.2,
      time: 5,
      address: 'Whitefield Main Road, ITPL, Bangalore, 560066',
      phone: '+91 80 2345 6789',
      coordinates: {
        latitude: 37.7865,
        longitude: -122.4304
      },
      availability: {
        beds: 12,
        ambulances: 3,
        emergencyRoom: 'Available'
      }
    },
    {
      id: '2',
      name: 'Apollo Hospital, Jayanagar',
      type: 'clinic',
      distance: 0.8,
      time: 3,
      address: '154 Jayanagar 4th Block, Bangalore, 560041',
      phone: '+91 80 4567 8901',
      coordinates: {
        latitude: 37.7905,
        longitude: -122.4344
      },
      availability: {
        beds: 5,
        ambulances: 1,
        emergencyRoom: 'Limited'
      }
    },
    {
      id: '3',
      name: 'Fortis Ambulance Service',
      type: 'ambulance',
      distance: 0.5,
      time: 2,
      address: 'Bannerghatta Road, Bangalore, 560076',
      phone: '+91 99001 23456',
      coordinates: {
        latitude: 37.7835,
        longitude: -122.4284
      },
      availability: {
        ambulances: 2
      }
    }
  ];

const EmergencyReportScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [emergencyStatus, setEmergencyStatus] = useState('ready'); // ready, sending, sent
  const mapRef = useRef(null);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Start pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  // Button press animation
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  };

  // Get current location
  const getLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant location permissions to use emergency services.'
        );
        setLocationLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      setLocation(currentLocation.coords);
      setLocationLoading(false);
      
      // Fetch nearby facilities based on location
      fetchNearbyFacilities(currentLocation.coords);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationLoading(false);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try again.'
      );
    }
  };

  // Fetch nearby medical facilities
  const fetchNearbyFacilities = async (coords) => {
    setLoading(true);
    try {
      // In a real app, this would be an actual API call
      // const response = await axios.get(
      //   `${API_URL}/api/facilities/nearby?lat=${coords.latitude}&lng=${coords.longitude}`
      // );
      // setFacilities(response.data);
      
      // Using dummy data for development
      setTimeout(() => {
        // Add slight variation to coordinates for display
        const facilitiesWithCoords = DUMMY_FACILITIES.map(facility => ({
          ...facility,
          coordinates: {
            latitude: coords.latitude + (Math.random() - 0.5) * 0.01,
            longitude: coords.longitude + (Math.random() - 0.5) * 0.01
          }
        }));
        
        setFacilities(facilitiesWithCoords);
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error fetching nearby facilities:', error);
      setLoading(false);
      Alert.alert(
        'Network Error',
        'Unable to fetch nearby medical facilities. Please try again.'
      );
    }
  };

  // Load location and facilities on component mount
  useEffect(() => {
    getLocation();
  }, []);

  // Send emergency distress signal
  const sendEmergencySignal = async () => {
    if (!selectedFacility && facilities.length > 0) {
      // If no facility selected, use the nearest one
      setSelectedFacility(facilities[0]);
    }
    
    const targetFacility = selectedFacility || (facilities.length > 0 ? facilities[0] : null);
    
    if (!targetFacility) {
      Alert.alert(
        'No Facilities Available',
        'Unable to find nearby medical facilities. Please try again or call emergency services directly.'
      );
      return;
    }
    
    // Animate button press
    animateButton();
    
    // Show confirmation dialog
    Alert.alert(
      'Confirm Emergency Report',
      `Send emergency alert to ${targetFacility.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Send',
          onPress: async () => {
            setEmergencyStatus('sending');
            
            try {
              // In a real app, this would be an actual API call
              // await axios.post(`${API_URL}/api/emergency/report`, {
              //   facilityId: targetFacility.id,
              //   location: location,
              //   timestamp: new Date().toISOString()
              // });
              
              // Simulate API call
              setTimeout(() => {
                setEmergencyStatus('sent');
                
                // Navigate to voice/text note screen after short delay
                setTimeout(() => {
                  navigation.navigate('VoiceTextNote', {
                    facilityId: targetFacility.id,
                    facilityName: targetFacility.name
                  });
                }, 1500);
              }, 2000);
              
              // Play confirmation sound
              const { sound } = await Audio.Sound.createAsync(
                require('../assets/sounds/alert_sent.mp3')
              );
              await sound.playAsync();
            } catch (error) {
              console.error('Error sending emergency report:', error);
              setEmergencyStatus('ready');
              Alert.alert(
                'Error',
                'Failed to send emergency report. Please try again or call emergency services directly.'
              );
            }
          }
        }
      ]
    );
  };

  // Navigate to Connected Patients screen
  const navigateToConnectedPatients = () => {
    navigation.navigate('ConnectedPatients');
  };

  // Refresh location and facilities
  const handleRefresh = () => {
    getLocation();
  };

  // Select a facility
  const handleSelectFacility = (facility) => {
    setSelectedFacility(facility);
    
    // Animate to facility location on map
    if (mapRef.current && facility.coordinates) {
      mapRef.current.animateToRegion({
        latitude: facility.coordinates.latitude,
        longitude: facility.coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 1000);
    }
  };

  // Render facility item with minimalist design
  const renderFacilityItem = (facility) => {
    const isSelected = selectedFacility?.id === facility.id;
    
    return (
      <TouchableOpacity
        key={facility.id}
        style={[
          styles.facilityItem,
          isSelected && styles.facilityItemSelected
        ]}
        onPress={() => handleSelectFacility(facility)}
      >
        <View style={styles.facilityContent}>
          <View>
            <Text style={styles.facilityName}>{facility.name}</Text>
            <View style={styles.facilityDetails}>
              <Text style={styles.facilityDistance}>{facility.distance} mi • {facility.time} min</Text>
            </View>
          </View>
          
          <View style={[
            styles.facilityStatusContainer,
            facility.availability?.emergencyRoom === 'Available' ? styles.statusAvailable :
            facility.availability?.emergencyRoom === 'Limited' ? styles.statusLimited :
            styles.statusBusy
          ]}>
            <Text style={styles.facilityStatus}>
              {facility.availability?.emergencyRoom || 'Available'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#F8F9F9" />
      
      {/* Header with profile photo */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Emergency</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Image 
                source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* Map section */}
        <View style={styles.mapContainer}>
          {locationLoading ? (
            <View style={styles.mapLoading}>
              <ActivityIndicator size="small" color="#4A6FA5" />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          ) : !location ? (
            <View style={styles.mapError}>
              <Ionicons name="warning-outline" size={24} color="#E57373" />
              <Text style={styles.errorText}>Unable to get your location</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={getLocation}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02
              }}
              showsUserLocation
              followsUserLocation
            >
              {/* Facility markers */}
              {facilities.map((facility) => (
                <Marker
                  key={facility.id}
                  coordinate={facility.coordinates}
                  title={facility.name}
                  description={`${facility.distance} mi away`}
                  onPress={() => handleSelectFacility(facility)}
                >
                  <View style={[
                    styles.facilityMarker,
                    selectedFacility?.id === facility.id && styles.selectedFacilityMarker
                  ]}>
                    <Ionicons
                      name={
                        facility.type === 'hospital'
                          ? 'medical-outline'
                          : facility.type === 'clinic'
                          ? 'fitness-outline'
                          : 'car-outline'
                      }
                      size={14}
                      color={selectedFacility?.id === facility.id ? '#FFFFFF' : '#4A6FA5'}
                    />
                  </View>
                </Marker>
              ))}
            </MapView>
          )}
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh-outline" size={16} color="#4A6FA5" />
          </TouchableOpacity>
        </View>
        
        {/* Connected Patients Button */}
        <TouchableOpacity 
          style={styles.connectedPatientsButton}
          onPress={navigateToConnectedPatients}
        >
          <Ionicons name="people-outline" size={18} color="#4A6FA5" />
          <Text style={styles.connectedPatientsText}>Connected Patients</Text>
          <Ionicons name="chevron-forward" size={18} color="#4A6FA5" />
        </TouchableOpacity>
        
        {/* Nearby facilities section */}
        <View style={styles.facilitiesContainer}>
          <Text style={styles.sectionTitle}>Nearby Medical Facilities</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4A6FA5" />
              <Text style={styles.loadingText}>Finding nearby facilities...</Text>
            </View>
          ) : facilities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="medical-outline" size={32} color="#CBD5E1" />
              <Text style={styles.emptyText}>No facilities found nearby</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRefresh}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.facilitiesList}>
              {facilities.map(renderFacilityItem)}
            </View>
          )}
        </View>
        
        {/* Selected facility details */}
        {selectedFacility && (
          <View style={styles.selectedFacilityContainer}>
            <Text style={styles.facilityDetailsName}>{selectedFacility.name}</Text>
            
            <View style={styles.facilityDetailsRow}>
              <Ionicons name="location-outline" size={16} color="#94A3B8" />
              <Text style={styles.facilityDetailsText}>{selectedFacility.address}</Text>
            </View>
            
            <View style={styles.facilityDetailsRow}>
              <Ionicons name="call-outline" size={16} color="#94A3B8" />
              <Text style={styles.facilityDetailsText}>{selectedFacility.phone}</Text>
            </View>
            
            <View style={styles.facilityStatsContainer}>
              {selectedFacility.availability?.beds !== undefined && (
                <View style={styles.facilityStat}>
                  <Text style={styles.facilityStatValue}>{selectedFacility.availability.beds}</Text>
                  <Text style={styles.facilityStatLabel}>Available Beds</Text>
                </View>
              )}
              
              {selectedFacility.availability?.ambulances !== undefined && (
                <View style={styles.facilityStat}>
                  <Text style={styles.facilityStatValue}>{selectedFacility.availability.ambulances}</Text>
                  <Text style={styles.facilityStatLabel}>Ambulances</Text>
                </View>
              )}
              
              {selectedFacility.type === 'hospital' && (
                <View style={styles.facilityStat}>
                  <Text style={styles.facilityStatValue}>{selectedFacility.time} min</Text>
                  <Text style={styles.facilityStatLabel}>ETA</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Emergency button */}
      <View style={styles.emergencyButtonContainer}>
        {emergencyStatus === 'ready' ? (
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={sendEmergencySignal}
            activeOpacity={0.9}
          >
            <Text style={styles.emergencyButtonText}>Report Emergency</Text>
          </TouchableOpacity>
        ) : emergencyStatus === 'sending' ? (
          <View style={styles.emergencyStatusContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.emergencyStatusText}>
              Sending emergency alert...
            </Text>
          </View>
        ) : (
          <View style={styles.emergencyStatusContainer}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" />
            <Text style={styles.emergencyStatusText}>
              Emergency alert sent!
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9F9',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileImage: {
    width: 32,
    height: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  mapContainer: {
    height: 200,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  mapError: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  refreshButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  facilityMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#4A6FA5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedFacilityMarker: {
    backgroundColor: '#4A6FA5',
    borderColor: '#FFFFFF',
  },
  connectedPatientsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  connectedPatientsText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginLeft: 12,
  },
  facilitiesContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 16,
  },
  facilitiesList: {
    margin: 12,
  },
  facilityItem: {
    backgroundColor: '#F8F9F9',
    borderRadius: 8,
    overflow: 'hidden',
    borderLeftWidth: 0,
    borderLeftColor: 'transparent',
  },
  facilityItemSelected: {
    borderLeftWidth: 3,
    borderLeftColor: '#4A6FA5',
  },
  facilityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  facilityName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 4,
  },
  facilityDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  facilityDistance: {
    fontSize: 12,
    color: '#64748B',
  },
  facilityStatusContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusAvailable: {
    backgroundColor: '#D1FAE5',
  },
  statusLimited: {
    backgroundColor: '#FEF3C7',
  },
  statusBusy: {
    backgroundColor: '#FEE2E2',
  },
  facilityStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
  },
  selectedFacilityContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  facilityDetailsName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  facilityDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  facilityDetailsText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  facilityStatsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  facilityStat: {
    flex: 1,
    alignItems: 'center',
  },
  facilityStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A6FA5',
  },
  facilityStatLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  emergencyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  emergencyButton: {
    backgroundColor: '#E57373',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E57373',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  emergencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emergencyStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A6FA5',
    paddingVertical: 16,
    borderRadius: 12,
  },
  emergencyStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default EmergencyReportScreen;