// src/services/LocationService.js
// Simplified version without background tasks or foreground services
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendNotification } from './NotificationService';
import * as Speech from 'expo-speech';

// Storage keys
const SAFE_ZONE_RADIUS_KEY = 'safe-zone-radius';
const HOME_LOCATION_KEY = 'home-location';
const LOCATION_HISTORY_KEY = 'location-history';
const MAX_HISTORY_POINTS = 50;

// Global tracking variable
let locationWatcher = null;

// Store location point in history
const storeLocationPoint = async (point) => {
  try {
    const historyJSON = await AsyncStorage.getItem(LOCATION_HISTORY_KEY);
    let history = historyJSON ? JSON.parse(historyJSON) : [];
    
    // Add new point to history
    history.push(point);
    
    // Keep only the most recent points
    if (history.length > MAX_HISTORY_POINTS) {
      history = history.slice(history.length - MAX_HISTORY_POINTS);
    }
    
    // Save updated history
    await AsyncStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(history));
    
    return true;
  } catch (error) {
    console.error('Error storing location point:', error);
    return false;
  }
};

// Get location history
const getLocationHistory = async () => {
  try {
    const historyJSON = await AsyncStorage.getItem(LOCATION_HISTORY_KEY);
    return historyJSON ? JSON.parse(historyJSON) : [];
  } catch (error) {
    console.error('Error getting location history:', error);
    return [];
  }
};

// Clear location history
const clearLocationHistory = async () => {
  try {
    await AsyncStorage.removeItem(LOCATION_HISTORY_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing location history:', error);
    return false;
  }
};

// Calculate distance between two points using Haversine formula
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

// Calculate bearing between two points
const calculateBearing = (startLat, startLng, destLat, destLng) => {
  startLat = startLat * Math.PI / 180;
  startLng = startLng * Math.PI / 180;
  destLat = destLat * Math.PI / 180;
  destLng = destLng * Math.PI / 180;

  const y = Math.sin(destLng - startLng) * Math.cos(destLat);
  const x = Math.cos(startLat) * Math.sin(destLat) -
            Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360; // Normalize to 0-360
  
  return bearing;
};

// Get direction from bearing
const getDirectionFromBearing = (bearing) => {
  const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
  return directions[Math.round(bearing / 45) % 8];
};

// Speak voice instruction
const speakInstruction = (instruction) => {
  try {
    // First stop any ongoing speech
    Speech.stop();
    
    // Add a slight delay to ensure previous speech is stopped
    setTimeout(() => {
      Speech.speak(instruction, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onStart: () => {
          console.log('Started speaking:', instruction);
        },
        onDone: () => {
          console.log('Finished speaking');
        },
        onStopped: () => {
          console.log('Speech stopped');
        },
        onError: (error) => {
          console.error('Speech error:', error);
        }
      });
    }, 200);
  } catch (error) {
    console.error('Error in speakInstruction:', error);
  }
};

// Generate voice instructions for backtracking
const generateVoiceInstructions = (currentLocation, targetLocation) => {
  try {
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      targetLocation.latitude,
      targetLocation.longitude
    );
    
    const bearing = calculateBearing(
      currentLocation.latitude,
      currentLocation.longitude,
      targetLocation.latitude,
      targetLocation.longitude
    );
    
    const direction = getDirectionFromBearing(bearing);
    const roundedDistance = Math.round(distance);
    
    let instruction = '';
    
    if (distance < 20) {
      instruction = "You have reached your destination. You are very close to home.";
    } else {
      instruction = `Head ${direction} for approximately ${roundedDistance} meters to reach home.`;
    }
    
    return instruction;
  } catch (error) {
    console.error('Error in generateVoiceInstructions:', error);
    return "Continue following the path to home.";
  }
};

// Generate a simulated road path between two points
const generateSimulatedPath = (origin, destination) => {
  try {
    if (!origin || !destination) {
      console.error('Invalid origin or destination in generateSimulatedPath');
      return [origin, destination].filter(point => point != null);
    }
    
    // Create a path with multiple points to simulate a road-like path
    const points = [];
    points.push({...origin}); // Start with origin
    
    // Calculate the general direction
    const latDiff = destination.latitude - origin.latitude;
    const lngDiff = destination.longitude - origin.longitude;
    
    // Add intermediate waypoints to simulate road patterns
    // First go in the longitude direction (east-west)
    if (Math.abs(lngDiff) > 0.0001) { // If there's a significant longitude difference
      points.push({
        latitude: origin.latitude,
        longitude: origin.longitude + (lngDiff * 0.7) // Go 70% of the way in longitude
      });
    }
    
    // Then go in latitude direction (north-south)
    if (Math.abs(latDiff) > 0.0001) { // If there's a significant latitude difference
      points.push({
        latitude: origin.latitude + (latDiff * 0.9), // Go 90% of the way in latitude
        longitude: destination.longitude - (lngDiff * 0.3) // Adjust longitude slightly
      });
    }
    
    // Add some small deviations to make it look more natural
    if (points.length >= 3) {
      // Add a small deviation to the middle points
      for (let i = 1; i < points.length - 1; i++) {
        // Small random deviation (0.0001 is roughly 10 meters)
        const randomLat = (Math.random() - 0.5) * 0.0002;
        const randomLng = (Math.random() - 0.5) * 0.0002;
        
        points[i].latitude += randomLat;
        points[i].longitude += randomLng;
      }
    }
    
    // Add the destination
    points.push({...destination});
    
    // Add more intermediate points to make the path smoother
    const smoothedPoints = [];
    
    for (let i = 0; i < points.length - 1; i++) {
      smoothedPoints.push(points[i]);
      
      // Add interpolated points between each pair of main points
      const startPoint = points[i];
      const endPoint = points[i + 1];
      
      for (let j = 1; j <= 2; j++) {
        const ratio = j / 3;
        smoothedPoints.push({
          latitude: startPoint.latitude + (endPoint.latitude - startPoint.latitude) * ratio,
          longitude: startPoint.longitude + (endPoint.longitude - startPoint.longitude) * ratio
        });
      }
    }
    
    smoothedPoints.push(points[points.length - 1]);
    
    return smoothedPoints;
  } catch (error) {
    console.error('Error in generateSimulatedPath:', error);
    return [origin, destination].filter(point => point != null);
  }
};

// Generate navigation steps for the path
const generateNavigationSteps = (path, destination) => {
  try {
    if (!path || path.length < 2) {
      console.error('Invalid path in generateNavigationSteps');
      return { steps: [], path: path || [], totalDistance: 0 };
    }
    
    const steps = [];
    
    // Create steps for each significant direction change
    for (let i = 1; i < path.length - 1; i++) {
      // Calculate bearings between segments
      const prevBearing = calculateBearing(
        path[i-1].latitude, path[i-1].longitude,
        path[i].latitude, path[i].longitude
      );
      
      const nextBearing = calculateBearing(
        path[i].latitude, path[i].longitude,
        path[i+1].latitude, path[i+1].longitude
      );
      
      // Calculate the angle difference
      let angleDiff = nextBearing - prevBearing;
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;
      
      // If there's a significant turn (more than 30 degrees)
      if (Math.abs(angleDiff) > 30) {
        const turnDirection = angleDiff > 0 ? 'right' : 'left';
        const directionAfterTurn = getDirectionFromBearing(nextBearing);
        
        // Calculate distance from previous step or start
        const prevPointIndex = steps.length > 0 ? steps[steps.length-1].endPointIndex : 0;
        let distance = 0;
        
        for (let j = prevPointIndex; j < i; j++) {
          distance += calculateDistance(
            path[j].latitude, path[j].longitude,
            path[j+1].latitude, path[j+1].longitude
          );
        }
        
        steps.push({
          startLocation: { lat: path[i].latitude, lng: path[i].longitude },
          endLocation: { lat: path[i+1].latitude, lng: path[i+1].longitude },
          distance: Math.round(distance),
          instruction: `Turn ${turnDirection} and head ${directionAfterTurn} for ${Math.round(distance)} meters`,
          maneuver: `turn-${turnDirection}`,
          startPointIndex: i,
          endPointIndex: i+1
        });
      }
    }
    
    // Add first step (from start to first turn or destination)
    const firstStepEndIndex = steps.length > 0 ? steps[0].startPointIndex : path.length - 1;
    let firstStepDistance = 0;
    
    for (let j = 0; j < firstStepEndIndex; j++) {
      firstStepDistance += calculateDistance(
        path[j].latitude, path[j].longitude,
        path[j+1].latitude, path[j+1].longitude
      );
    }
    
    const initialBearing = calculateBearing(
      path[0].latitude, path[0].longitude,
      path[1].latitude, path[1].longitude
    );
    
    const initialDirection = getDirectionFromBearing(initialBearing);
    
    steps.unshift({
      startLocation: { lat: path[0].latitude, lng: path[0].longitude },
      endLocation: { lat: path[firstStepEndIndex].latitude, lng: path[firstStepEndIndex].longitude },
      distance: Math.round(firstStepDistance),
      instruction: `Head ${initialDirection} for ${Math.round(firstStepDistance)} meters`,
      maneuver: 'straight',
      startPointIndex: 0,
      endPointIndex: firstStepEndIndex
    });
    
    // Add final step (to destination)
    if (steps.length > 0) {
      const lastStep = steps[steps.length - 1];
      const lastPointIndex = lastStep.endPointIndex;
      
      if (lastPointIndex < path.length - 1) {
        let finalDistance = 0;
        
        for (let j = lastPointIndex; j < path.length - 1; j++) {
          finalDistance += calculateDistance(
            path[j].latitude, path[j].longitude,
            path[j+1].latitude, path[j+1].longitude
          );
        }
        
        steps.push({
          startLocation: { lat: path[lastPointIndex].latitude, lng: path[lastPointIndex].longitude },
          endLocation: { lat: path[path.length-1].latitude, lng: path[path.length-1].longitude },
          distance: Math.round(finalDistance),
          instruction: `Continue straight to destination for ${Math.round(finalDistance)} meters`,
          maneuver: 'straight',
          startPointIndex: lastPointIndex,
          endPointIndex: path.length - 1
        });
      }
    }
    
    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      totalDistance += calculateDistance(
        path[i].latitude, path[i].longitude,
        path[i+1].latitude, path[i+1].longitude
      );
    }
    
    return { 
      steps: steps,
      path: path,
      totalDistance: Math.round(totalDistance)
    };
  } catch (error) {
    console.error('Error in generateNavigationSteps:', error);
    return { steps: [], path: path || [], totalDistance: 0 };
  }
};

// Get simulated road route
const getSimulatedRoute = (origin, destination) => {
  try {
    if (!origin || !destination) {
      console.error('Invalid origin or destination in getSimulatedRoute');
      return { steps: [], path: [], totalDistance: 0 };
    }
    
    // Generate a path with waypoints
    const path = generateSimulatedPath(origin, destination);
    
    // Generate navigation steps
    return generateNavigationSteps(path, destination);
  } catch (error) {
    console.error('Error in getSimulatedRoute:', error);
    return { steps: [], path: [], totalDistance: 0 };
  }
};

// Find the closest point on a route to the current location
const findClosestPointOnRoute = (location, routePath) => {
  try {
    if (!routePath || routePath.length === 0 || !location) {
      return { point: null, distance: Infinity, index: -1 };
    }
    
    let closestPoint = routePath[0];
    let minDistance = calculateDistance(
      location.latitude,
      location.longitude,
      routePath[0].latitude,
      routePath[0].longitude
    );
    let closestIndex = 0;
    
    for (let i = 1; i < routePath.length; i++) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        routePath[i].latitude,
        routePath[i].longitude
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = routePath[i];
        closestIndex = i;
      }
    }
    
    return { point: closestPoint, distance: minDistance, index: closestIndex };
  } catch (error) {
    console.error('Error in findClosestPointOnRoute:', error);
    return { point: null, distance: Infinity, index: -1 };
  }
};

// Find the active navigation step based on current location
const findActiveNavigationStep = (location, path, steps, closestPointIndex) => {
  try {
    if (!steps || !Array.isArray(steps) || steps.length === 0 || !path || path.length === 0) {
      return null;
    }
    
    // Find the step that contains the closest point
    for (const step of steps) {
      if (closestPointIndex >= step.startPointIndex && closestPointIndex <= step.endPointIndex) {
        return step;
      }
    }
    
    // If no step found but we're close to the route, return the step that comes next
    for (let i = 0; i < steps.length; i++) {
      if (closestPointIndex < steps[i].startPointIndex) {
        return steps[i];
      }
    }
    
    // If we're past all steps, return the last one
    return steps[steps.length - 1];
  } catch (error) {
    console.error('Error in findActiveNavigationStep:', error);
    return null;
  }
};

// Start location tracking (simplified version without background tasks)
const startLocationTracking = async () => {
  try {
    // Request foreground permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Allow MEDAI to access your location for spatial awareness features.'
      );
      return false;
    }
    
    // Stop any existing watcher
    if (locationWatcher) {
      locationWatcher.remove();
      locationWatcher = null;
    }
    
    // Get home location for safe zone checking
    const homeLocation = await getHomeLocation();
    const safeZoneRadius = await getSafeZoneRadius();
    
    if (!homeLocation) {
      Alert.alert('No Home Location', 'Please set your home location first.');
      return false;
    }
    
    // Start a simple location watcher
    locationWatcher = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 10,
        timeInterval: 10000,
      },
      async (location) => {
        try {
          const currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          
          // Store location in history
          await storeLocationPoint({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            timestamp: new Date().toISOString()
          });
          
          // Check safe zone
          if (homeLocation && safeZoneRadius) {
            const distance = calculateDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              homeLocation.latitude,
              homeLocation.longitude
            );
            
            // If outside safe zone, notify
            if (distance > safeZoneRadius) {
              sendNotification(
                'Outside Safe Zone',
                'You are now outside your safe zone. Tap to open navigation back home.'
              );
              
              // Store current location for navigation
              await AsyncStorage.setItem(
                'current-location',
                JSON.stringify(currentLocation)
              );
            }
          }
        } catch (error) {
          console.error('Error in location tracking:', error);
        }
      }
    );
    
    Alert.alert('Tracking Active', 'Location tracking is now active while the app is open.');
    return true;
  } catch (error) {
    console.error('Error in startLocationTracking:', error);
    Alert.alert('Error', 'Failed to start location tracking.');
    return false;
  }
};

// Stop location tracking
const stopLocationTracking = async () => {
  try {
    if (locationWatcher) {
      locationWatcher.remove();
      locationWatcher = null;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error in stopLocationTracking:', error);
    return false;
  }
};

// Check if location tracking is active
const isLocationTrackingActive = () => {
  return !!locationWatcher;
};

// Start backtracking with simulated road navigation
const startRoadBacktracking = async (onLocationUpdate, onRouteUpdate) => {
  try {
    // Get home location
    const homeLocationJSON = await AsyncStorage.getItem(HOME_LOCATION_KEY);
    if (!homeLocationJSON) {
      Alert.alert('Error', 'Home location not set. Please set your home location first.');
      return false;
    }
    
    const homeLocation = JSON.parse(homeLocationJSON);
    
    // Get location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required for backtracking.');
      return false;
    }
    
    // Get current location
    const initialLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest
    });
    
    const currentLocation = {
      latitude: initialLocation.coords.latitude,
      longitude: initialLocation.coords.longitude
    };
    
    // Generate route
    const route = getSimulatedRoute(currentLocation, homeLocation);
    
    // Update route
    if (route && onRouteUpdate) {
      onRouteUpdate(route);
    }
    
    // Speak initial instruction
    if (route && route.steps && route.steps.length > 0) {
      const firstStep = route.steps[0];
      setTimeout(() => {
        speakInstruction(firstStep.instruction);
      }, 1000);
    }
    
    // Track last spoken instruction
    let lastSpokenInstruction = '';
    let lastSpeakTime = 0;
    let lastStepIndex = -1;
    
    // Start watching position
    const locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        distanceInterval: 5,
        timeInterval: 3000,
      },
      async (location) => {
        try {
          const updatedLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          
          // Store location
          await storeLocationPoint({
            latitude: updatedLocation.latitude,
            longitude: updatedLocation.longitude,
            timestamp: new Date().toISOString()
          });
          
          // Check if off-route
          const closestPointInfo = findClosestPointOnRoute(updatedLocation, route ? route.path : []);
          
          if (closestPointInfo.distance > 50) {
            // Recalculate route
            const newRoute = getSimulatedRoute(updatedLocation, homeLocation);
            if (newRoute && onRouteUpdate) {
              onRouteUpdate(newRoute);
              
              if (newRoute.steps && newRoute.steps.length > 0) {
                speakInstruction(newRoute.steps[0].instruction);
                lastSpokenInstruction = newRoute.steps[0].instruction;
                lastSpeakTime = Date.now();
                lastStepIndex = 0;
              }
            }
          }
          
          // Generate guidance
          let instruction = "";
          let activeStep = null;
          
          if (route && route.steps && route.steps.length > 0) {
            activeStep = findActiveNavigationStep(updatedLocation, route.path, route.steps, closestPointInfo.index);
            
            if (activeStep) {
              instruction = activeStep.instruction;
              
              const currentStepIndex = route.steps.findIndex(step => 
                step.instruction === activeStep.instruction
              );
              
              const isNewStep = currentStepIndex !== lastStepIndex;
              
              if (activeStep.endPointIndex < route.path.length) {
                const distanceToNextTurn = calculateDistance(
                  updatedLocation.latitude,
                  updatedLocation.longitude,
                  route.path[activeStep.endPointIndex].latitude,
                  route.path[activeStep.endPointIndex].longitude
                );
                
                const currentTime = Date.now();
                const timeSinceLastSpeak = currentTime - lastSpeakTime;
                
                if ((isNewStep && instruction !== lastSpokenInstruction) || 
                    (distanceToNextTurn < 30 && timeSinceLastSpeak > 10000) || 
                    (timeSinceLastSpeak > 20000 && instruction === lastSpokenInstruction)) {
                  
                  speakInstruction(instruction);
                  lastSpokenInstruction = instruction;
                  lastSpeakTime = currentTime;
                  lastStepIndex = currentStepIndex;
                }
              }
            } else {
              instruction = generateVoiceInstructions(updatedLocation, homeLocation);
              
              const currentTime = Date.now();
              if (currentTime - lastSpeakTime > 20000) {
                speakInstruction(instruction);
                lastSpokenInstruction = instruction;
                lastSpeakTime = currentTime;
                lastStepIndex = -1;
              }
            }
          } else {
            instruction = generateVoiceInstructions(updatedLocation, homeLocation);
            
            const currentTime = Date.now();
            if (currentTime - lastSpeakTime > 20000) {
              speakInstruction(instruction);
              lastSpokenInstruction = instruction;
              lastSpeakTime = currentTime;
            }
          }
          
          // Update UI
          if (onLocationUpdate) {
            onLocationUpdate(updatedLocation, homeLocation, instruction, activeStep);
          }
        } catch (error) {
          console.error('Error in location update handler:', error);
        }
      }
    );
    
    return locationSubscription;
  } catch (error) {
    console.error('Error in startRoadBacktracking:', error);
    Alert.alert('Error', 'An error occurred while starting navigation. Please try again.');
    return false;
  }
};

// Stop backtracking
const stopBacktracking = (locationSubscription) => {
  try {
    if (locationSubscription) {
      locationSubscription.remove();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error in stopBacktracking:', error);
    return false;
  }
};

// Set home location
const setHomeLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Allow MEDAI to access your location to set your home location.'
      );
      return false;
    }
    
    const location = await Location.getCurrentPositionAsync({});
    const homeLocation = {
      latitude: location.coords.latitude + 0.005,
      longitude: location.coords.longitude + 0.005,
    };
    
    await AsyncStorage.setItem(HOME_LOCATION_KEY, JSON.stringify(homeLocation));
    
    // Set default safe zone radius if not already set
    const existingRadius = await AsyncStorage.getItem(SAFE_ZONE_RADIUS_KEY);
    if (!existingRadius) {
      await AsyncStorage.setItem(SAFE_ZONE_RADIUS_KEY, '500'); // Default 500 meters
    }
    
    return true;
  } catch (error) {
    console.error('Error setting home location:', error);
    return false;
  }
};

// Get home location
const getHomeLocation = async () => {
  try {
    const homeLocation = await AsyncStorage.getItem(HOME_LOCATION_KEY);
    return homeLocation ? JSON.parse(homeLocation) : null;
  } catch (error) {
    console.error('Error getting home location:', error);
    return null;
  }
};

// Set safe zone radius
const setSafeZoneRadius = async (radius) => {
  try {
    await AsyncStorage.setItem(SAFE_ZONE_RADIUS_KEY, radius.toString());
    return true;
  } catch (error) {
    console.error('Error setting safe zone radius:', error);
    return false;
  }
};

// Get safe zone radius
const getSafeZoneRadius = async () => {
  try {
    const radius = await AsyncStorage.getItem(SAFE_ZONE_RADIUS_KEY);
    return radius ? parseFloat(radius) : 500; // Default 500 meters
  } catch (error) {
    console.error('Error getting safe zone radius:', error);
    return 500; // Default 500 meters
  }
};

// Navigate to home
const navigateToHome = async () => {
  try {
    const homeLocation = await getHomeLocation();
    const currentLocation = await AsyncStorage.getItem('current-location');
    
    if (homeLocation && currentLocation) {
      const current = JSON.parse(currentLocation);
      
      // Create a deep link for navigation app
      const url = `https://www.google.com/maps/dir/?api=1&origin=${current.latitude},${current.longitude}&destination=${homeLocation.latitude},${homeLocation.longitude}&travelmode=walking`;
      
      return url;
    }
    
    return null;
  } catch (error) {
    console.error('Error in navigateToHome:', error);
    return null;
  }
};

// Export all functions
export default {
  startLocationTracking,
  stopLocationTracking,
  isLocationTrackingActive,
  setHomeLocation,
  getHomeLocation,
  setSafeZoneRadius,
  getSafeZoneRadius,
  navigateToHome,
  storeLocationPoint,
  getLocationHistory,
  clearLocationHistory,
  startBacktracking: startRoadBacktracking, // Use road backtracking as the default
  stopBacktracking,
  generateVoiceInstructions,
  speakInstruction,
  calculateDistance,
  calculateBearing,
  getDirectionFromBearing,
  getSimulatedRoute,
  startRoadBacktracking,
  findClosestPointOnRoute,
  findActiveNavigationStep,
  generateSimulatedPath,
  generateNavigationSteps
};