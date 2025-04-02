// src/screens/alzheimers/SafeZoneScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  Switch,
  Modal,
  Dimensions
} from 'react-native';
import Slider from '@react-native-community/slider';
import MapView, { Marker, Circle, Polyline } from 'react-native-maps';
import LocationService from '../../services/LocationService';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { useIsFocused } from '@react-navigation/native';

const SafeZoneScreen = () => {
  const [homeLocation, setHomeLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [radius, setRadius] = useState(500); // Default 500 meters
  const [tracking, setTracking] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [backtrackingActive, setBacktrackingActive] = useState(false);
  const [showBacktrackModal, setShowBacktrackModal] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState('');
  const [distanceToHome, setDistanceToHome] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [navigationSteps, setNavigationSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const locationSubscriptionRef = useRef(null);
  const mapRef = useRef(null);
  const isFocused = useIsFocused();

  // Load saved home location and radius
  useEffect(() => {
    const loadLocationData = async () => {
      try {
        const savedHomeLocation = await LocationService.getHomeLocation();
        const savedRadius = await LocationService.getSafeZoneRadius();
        
        if (savedHomeLocation) {
          setHomeLocation(savedHomeLocation);
          setMapRegion({
            latitude: savedHomeLocation.latitude,
            longitude: savedHomeLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
        
        if (savedRadius) {
          setRadius(savedRadius);
        }
        
        // Check if location tracking is active
        const isTracking = await LocationService.isLocationTrackingActive();
        setTracking(isTracking);

        // Get location history
        const history = await LocationService.getLocationHistory();
        setLocationHistory(history || []);

        // Get current location
        await getCurrentLocation();
      } catch (error) {
        console.error('Error in loadLocationData:', error);
      }
    };
    
    if (isFocused) {
      loadLocationData();
    }

    return () => {
      // Cleanup when screen loses focus
      if (locationSubscriptionRef.current) {
        try {
          LocationService.stopBacktracking(locationSubscriptionRef.current);
          locationSubscriptionRef.current = null;
          setBacktrackingActive(false);
          setShowBacktrackModal(false);
        } catch (error) {
          console.error('Error in cleanup:', error);
        }
      }
    };
  }, [isFocused]);

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return null;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest
      });
      
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setCurrentLocation(newLocation);
      
      return newLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Unable to get current location. Please try again.');
      return null;
    }
  };

  // Set home location
  const handleSetHomeLocation = async () => {
    try {
      const success = await LocationService.setHomeLocation();
      
      if (success) {
        const newHomeLocation = await LocationService.getHomeLocation();
        setHomeLocation(newHomeLocation);
        setMapRegion({
          latitude: newHomeLocation.latitude,
          longitude: newHomeLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        
        Alert.alert('Success', 'Home location set successfully!');
      } else {
        Alert.alert('Error', 'Failed to set home location. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleSetHomeLocation:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  // Save radius changes
  const handleRadiusChange = async (value) => {
    try {
      setRadius(value);
      await LocationService.setSafeZoneRadius(value);
    } catch (error) {
      console.error('Error in handleRadiusChange:', error);
    }
  };

  // Toggle location tracking
  const toggleLocationTracking = async () => {
    try {
      if (tracking) {
        const stopped = await LocationService.stopLocationTracking();
        if (stopped) {
          setTracking(false);
          Alert.alert('Tracking Stopped', 'Location tracking has been disabled.');
        }
      } else {
        const started = await LocationService.startLocationTracking();
        if (started) {
          setTracking(true);
          Alert.alert('Tracking Started', 'Location tracking is now enabled.');
        }
      }
    } catch (error) {
      console.error('Error in toggleLocationTracking:', error);
      Alert.alert('Error', 'Failed to toggle location tracking.');
    }
  };

  // Start backtracking
  const startBacktracking = async () => {
    try {
      const currentLoc = await getCurrentLocation();
      
      if (!currentLoc) {
        Alert.alert('Error', 'Unable to get current location. Please try again.');
        return;
      }
      
      if (!homeLocation) {
        Alert.alert('Error', 'Home location not set. Please set your home location first.');
        return;
      }
      
      // Start the road-based backtracking service
      const subscription = await LocationService.startRoadBacktracking(
        // Location update callback
        (location, target, instruction, step) => {
          try {
            // Update state with new location and instruction
            setCurrentLocation(location);
            setCurrentInstruction(instruction);
            
            if (step) {
              setCurrentStep(step);
            }
            
            // Calculate distance to home
            const distance = LocationService.calculateDistance(
              location.latitude,
              location.longitude,
              target.latitude,
              target.longitude
            );
            setDistanceToHome(Math.round(distance));
            
            // Update location history
            setLocationHistory(prevHistory => [
              ...(prevHistory || []), 
              {
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: new Date().toISOString()
              }
            ]);
            
            // Fit map to show both current location and route
            if (mapRef.current && routePath && routePath.length > 0) {
              try {
                mapRef.current.fitToCoordinates(
                  [...routePath],
                  {
                    edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                    animated: true,
                  }
                );
              } catch (mapError) {
                console.error('Error fitting map to coordinates:', mapError);
              }
            }
          } catch (error) {
            console.error('Error in location update callback:', error);
          }
        },
        // Route update callback
        (route) => {
          try {
            if (route) {
              setRoutePath(route.path || []);
              setNavigationSteps(route.steps || []);
              
              // If this is the first set of instructions, announce it
              if (route.steps && route.steps.length > 0 && !currentStep) {
                const firstStep = route.steps[0];
                setCurrentStep(firstStep);
                setCurrentInstruction(firstStep.instruction);
              }
            }
          } catch (error) {
            console.error('Error in route update callback:', error);
          }
        }
      );
      
      if (subscription) {
        locationSubscriptionRef.current = subscription;
        setBacktrackingActive(true);
        setShowBacktrackModal(true);
      }
    } catch (error) {
      console.error('Error in startBacktracking:', error);
      Alert.alert('Error', 'Failed to start navigation. Please try again.');
    }
  };

  // Stop backtracking
  const stopBacktracking = () => {
    try {
      if (locationSubscriptionRef.current) {
        LocationService.stopBacktracking(locationSubscriptionRef.current);
        locationSubscriptionRef.current = null;
        setBacktrackingActive(false);
        setShowBacktrackModal(false);
        setCurrentInstruction('');
        setCurrentStep(null);
        
        // Stop any ongoing speech
        Speech.stop();
        
        Alert.alert('Backtracking Stopped', 'Voice navigation has been disabled.');
      }
    } catch (error) {
      console.error('Error in stopBacktracking:', error);
    }
  };

  // Clear location history
  const handleClearHistory = async () => {
    try {
      Alert.alert(
        'Clear History',
        'Are you sure you want to clear your location history?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Clear',
            onPress: async () => {
              try {
                const success = await LocationService.clearLocationHistory();
                if (success) {
                  setLocationHistory([]);
                  Alert.alert('Success', 'Location history cleared successfully.');
                } else {
                  Alert.alert('Error', 'Failed to clear location history.');
                }
              } catch (error) {
                console.error('Error clearing history:', error);
                Alert.alert('Error', 'An error occurred while clearing history.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in handleClearHistory:', error);
    }
  };

  // Repeat current instruction
  const repeatInstruction = () => {
    try {
      if (currentInstruction) {
        LocationService.speakInstruction(currentInstruction);
      }
    } catch (error) {
      console.error('Error in repeatInstruction:', error);
    }
  };
  
  // Get direction text based on current location and home location
  const getDirectionText = () => {
    try {
      if (!currentLocation || !homeLocation) return 'straight';
      
      const bearing = LocationService.calculateBearing(
        currentLocation.latitude,
        currentLocation.longitude,
        homeLocation.latitude,
        homeLocation.longitude
      );
      
      return LocationService.getDirectionFromBearing(bearing);
    } catch (error) {
      console.error('Error in getDirectionText:', error);
      return 'straight';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.mapContainer}>
        {mapRegion && (
          <MapView
            ref={mapRef}
            style={styles.map}
            region={mapRegion}
            showsUserLocation={true}
            followsUserLocation={backtrackingActive}
          >
            {homeLocation && (
              <>
                <Marker
                  coordinate={{
                    latitude: homeLocation.latitude,
                    longitude: homeLocation.longitude,
                  }}
                  title="Home"
                  description="Your safe zone center"
                  pinColor="#6A5ACD"
                />
                <Circle
                  center={{
                    latitude: homeLocation.latitude,
                    longitude: homeLocation.longitude,
                  }}
                  radius={radius}
                  fillColor="rgba(106, 90, 205, 0.2)"
                  strokeColor="rgba(106, 90, 205, 0.5)"
                  strokeWidth={2}
                />
              </>
            )}
            {locationHistory && locationHistory.length > 0 && (
              <Polyline
                coordinates={locationHistory}
                strokeColor="rgba(255, 0, 0, 0.6)"
                strokeWidth={3}
              />
            )}
          </MapView>
        )}
      </View>
      
      <View style={styles.settingsContainer}>
        <Text style={styles.title}>Safe Zone Settings</Text>
        
        <View style={styles.setting}>
          <View style={styles.settingHeader}>
            <Ionicons name="home" size={24} color="#6A5ACD" />
            <Text style={styles.settingTitle}>Home Location</Text>
          </View>
          
          {homeLocation ? (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                Latitude: {homeLocation.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Longitude: {homeLocation.longitude.toFixed(6)}
              </Text>
            </View>
          ) : (
            <Text style={styles.noLocationText}>No home location set</Text>
          )}
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleSetHomeLocation}
          >
            <Text style={styles.buttonText}>
              {homeLocation ? 'Update Home Location' : 'Set Home Location'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.setting}>
          <View style={styles.settingHeader}>
            <Ionicons name="resize" size={24} color="#6A5ACD" />
            <Text style={styles.settingTitle}>Safe Zone Radius</Text>
          </View>
          
          <Text style={styles.radiusText}>{Math.round(radius)} meters</Text>
          
          <Slider
            style={styles.slider}
            minimumValue={100}
            maximumValue={2000}
            step={50}
            value={radius}
            onValueChange={setRadius}
            onSlidingComplete={handleRadiusChange}
            minimumTrackTintColor="#6A5ACD"
            maximumTrackTintColor="#D1D1D1"
            thumbTintColor="#6A5ACD"
          />
          
          <View style={styles.rangeLabels}>
            <Text style={styles.rangeLabel}>100m</Text>
            <Text style={styles.rangeLabel}>2000m</Text>
          </View>
        </View>
        
        <View style={styles.setting}>
          <View style={styles.settingHeader}>
            <Ionicons 
              name={tracking ? "location" : "location-outline"} 
              size={24} 
              color={tracking ? "#6A5ACD" : "#888"} 
            />
            <Text style={styles.settingTitle}>Location Tracking</Text>
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>
              {tracking ? 'Enabled' : 'Disabled'}
            </Text>
            <Switch
              trackColor={{ false: "#D1D1D1", true: "#BEB7E2" }}
              thumbColor={tracking ? "#6A5ACD" : "#f4f3f4"}
              onValueChange={toggleLocationTracking}
              value={tracking}
            />
          </View>
          
          <Text style={styles.infoText}>
            When enabled, the app will monitor your location and alert you if you leave your safe zone.
          </Text>
        </View>
        
        {/* New Backtracking Section */}
        <View style={styles.setting}>
          <View style={styles.settingHeader}>
            <Ionicons 
              name="navigate" 
              size={24} 
              color="#6A5ACD" 
            />
            <Text style={styles.settingTitle}>Voice Navigation</Text>
          </View>
          
          <Text style={styles.infoText}>
            Get voice-guided directions to help you return to your safe zone if you've wandered too far.
          </Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.button,
                { flex: 1, backgroundColor: backtrackingActive ? '#888' : '#6A5ACD' }
              ]}
              onPress={startBacktracking}
              disabled={backtrackingActive}
            >
              <Text style={styles.buttonText}>Start Navigation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                { 
                  flex: 1, 
                  backgroundColor: backtrackingActive ? '#6A5ACD' : '#888',
                  marginLeft: 10
                }
              ]}
              onPress={stopBacktracking}
              disabled={!backtrackingActive}
            >
              <Text style={styles.buttonText}>Stop Navigation</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Location History Section */}
        <View style={styles.setting}>
          <View style={styles.settingHeader}>
            <Ionicons name="footsteps" size={24} color="#6A5ACD" />
            <Text style={styles.settingTitle}>Location History</Text>
          </View>
          
          <Text style={styles.infoText}>
            The app stores your recent location history to help you retrace your steps if needed.
          </Text>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#FF6B6B' }]}
            onPress={handleClearHistory}
          >
            <Text style={styles.buttonText}>Clear History</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Backtracking Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showBacktrackModal}
        onRequestClose={() => {
          Alert.alert('Navigation Active', 'Stop navigation first to close this screen.');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Voice Navigation Active</Text>
              <TouchableOpacity onPress={stopBacktracking}>
                <Ionicons name="close-circle" size={30} color="#6A5ACD" />
              </TouchableOpacity>
            </View>
            
            {/* Navigation Map */}
            <View style={styles.navigationMapContainer}>
              {homeLocation && currentLocation && (
                <MapView
                  style={styles.navigationMap}
                  initialRegion={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  showsUserLocation={true}
                >
                  {/* Home marker */}
                  <Marker
                    coordinate={{
                      latitude: homeLocation.latitude,
                      longitude: homeLocation.longitude,
                    }}
                    title="Home"
                    description="Your safe zone"
                    pinColor="#6A5ACD"
                  />
                  
                  {/* Safe zone circle */}
                  <Circle
                    center={{
                      latitude: homeLocation.latitude,
                      longitude: homeLocation.longitude,
                    }}
                    radius={radius}
                    fillColor="rgba(106, 90, 205, 0.2)"
                    strokeColor="rgba(106, 90, 205, 0.5)"
                    strokeWidth={2}
                  />
                  
                  {/* Direction polyline for road route */}
                  {routePath && routePath.length > 0 && (
                    <Polyline
                      coordinates={routePath}
                      strokeColor="#FF6B6B"
                      strokeWidth={4}
                    />
                  )}
                  
                  {/* Direct path as fallback */}
                  {(!routePath || routePath.length === 0) && currentLocation && homeLocation && (
                    <Polyline
                      coordinates={[
                        currentLocation,
                        homeLocation
                      ]}
                      strokeColor="#FF6B6B"
                      strokeWidth={4}
                      lineDashPattern={[5, 5]}
                    />
                  )}
                  
                  {/* Path history */}
                  {locationHistory && locationHistory.length > 0 && (
                    <Polyline
                      coordinates={locationHistory}
                      strokeColor="rgba(0, 0, 255, 0.6)"
                      strokeWidth={3}
                    />
                  )}
                </MapView>
              )}
            </View>
            
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionTitle}>Current Direction:</Text>
              <Text style={styles.instructionText}>{currentInstruction || 'Loading directions...'}</Text>
              
              {distanceToHome !== null && (
                <Text style={styles.distanceText}>
                  Distance to home: {distanceToHome} meters
                </Text>
              )}
            </View>
            
            {/* Step-by-Step Instructions */}
            <View style={styles.stepInstructionsContainer}>
              <Text style={styles.stepInstructionsTitle}>Step-by-Step Guide:</Text>
              <ScrollView style={styles.stepsScroll}>
                <View style={styles.stepsList}>
                  {navigationSteps && navigationSteps.length > 0 ? (
                    navigationSteps.map((step, index) => (
                      <View key={index} style={[
                        styles.stepItem,
                        currentStep && step.instruction === currentStep.instruction ? styles.activeStep : {}
                      ]}>
                        <View style={[
                          styles.stepNumber,
                          currentStep && step.instruction === currentStep.instruction ? { backgroundColor: '#FF6B6B' } : {}
                        ]}>
                          <Text style={styles.stepNumberText}>{index + 1}</Text>
                        </View>
                        <View style={styles.stepContent}>
                          <Text style={styles.stepText}>
                            {step.instruction}
                          </Text>
                          <Text style={styles.stepDistance}>
                            {step.distance} meters
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <>
                      <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <View style={styles.stepContent}>
                          <Text style={styles.stepText}>
                            Continue {getDirectionText()} 
                          </Text>
                          <Text style={styles.stepDistance}>
                            {Math.round((distanceToHome || 300) / 3)} meters
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <View style={styles.stepContent}>
                          <Text style={styles.stepText}>
                            Look for familiar landmarks around you
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <View style={styles.stepContent}>
                          <Text style={styles.stepText}>
                            Continue {getDirectionText()} again
                          </Text>
                          <Text style={styles.stepDistance}>
                            {Math.round((distanceToHome || 300) / 3)} meters
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>4</Text>
                        </View>
                        <View style={styles.stepContent}>
                          <Text style={styles.stepText}>
                            Continue until you reach your safe zone
                          </Text>
                          <Text style={styles.stepDistance}>
                            {Math.round((distanceToHome || 300) / 3)} meters
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </ScrollView>
            </View>
            
            <TouchableOpacity
              style={styles.repeatButton}
              onPress={repeatInstruction}
            >
              <Ionicons name="volume-high" size={24} color="white" />
              <Text style={styles.repeatButtonText}>Repeat Instructions</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalNote}>
              Follow the spoken directions to return to your safe zone. This screen will automatically update as you move.
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  mapContainer: {
    height: 250,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    margin: 15,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  settingsContainer: {
    padding: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  setting: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    color: '#444',
  },
  locationInfo: {
    marginBottom: 15,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  noLocationText: {
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#6A5ACD',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  radiusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6A5ACD',
    textAlign: 'center',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#888',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 16,
    color: '#444',
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: Dimensions.get('window').height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6A5ACD',
  },
  instructionContainer: {
    backgroundColor: '#F0F0F7',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#444',
  },
  instructionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6A5ACD',
    marginBottom: 10,
  },
  distanceText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  repeatButton: {
    backgroundColor: '#6A5ACD',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  repeatButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
  },
  modalNote: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Navigation map styles
  navigationMapContainer: {
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E7',
  },
  navigationMap: {
    width: '100%',
    height: '100%',
  },
  // Step-by-step instructions styles
  stepInstructionsContainer: {
    backgroundColor: '#F0F0F7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    maxHeight: 200,
  },
  stepInstructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#444',
  },
  stepsScroll: {
    maxHeight: 150,
  },
  stepsList: {
    marginLeft: 5,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 8,
  },
  activeStep: {
    backgroundColor: 'rgba(106, 90, 205, 0.1)',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6A5ACD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 20,
    fontWeight: '500',
  },
  stepDistance: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
    fontStyle: 'italic',
  },
});

export default SafeZoneScreen;