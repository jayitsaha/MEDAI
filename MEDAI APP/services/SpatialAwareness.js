// src/services/SpatialAwareness.js
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

// Keys for storing landmarks
const LANDMARKS_KEY = 'landmarks';

// Landmark detection threshold (in meters)
const LANDMARK_DETECTION_DISTANCE = 20;

// Structure to store landmarks
// {
//   id: string,
//   name: string,
//   description: string,
//   latitude: number,
//   longitude: number,
//   lastVisited: string (ISO date),
//   visitCount: number
// }

// Add a new landmark
const addLandmark = async (landmark) => {
  try {
    const landmarksJSON = await AsyncStorage.getItem(LANDMARKS_KEY);
    let landmarks = landmarksJSON ? JSON.parse(landmarksJSON) : [];
    
    // Add unique ID if not provided
    if (!landmark.id) {
      landmark.id = Date.now().toString();
    }
    
    // Set initial visit count
    if (!landmark.visitCount) {
      landmark.visitCount = 1;
    }
    
    // Set last visited timestamp
    landmark.lastVisited = new Date().toISOString();
    
    landmarks.push(landmark);
    await AsyncStorage.setItem(LANDMARKS_KEY, JSON.stringify(landmarks));
    
    return landmark;
  } catch (error) {
    console.error('Error adding landmark:', error);
    return null;
  }
};

// Get all landmarks
const getLandmarks = async () => {
  try {
    const landmarksJSON = await AsyncStorage.getItem(LANDMARKS_KEY);
    return landmarksJSON ? JSON.parse(landmarksJSON) : [];
  } catch (error) {
    console.error('Error getting landmarks:', error);
    return [];
  }
};

// Remove a landmark
const removeLandmark = async (landmarkId) => {
  try {
    const landmarksJSON = await AsyncStorage.getItem(LANDMARKS_KEY);
    let landmarks = landmarksJSON ? JSON.parse(landmarksJSON) : [];
    
    landmarks = landmarks.filter(landmark => landmark.id !== landmarkId);
    await AsyncStorage.setItem(LANDMARKS_KEY, JSON.stringify(landmarks));
    
    return true;
  } catch (error) {
    console.error('Error removing landmark:', error);
    return false;
  }
};

// Update a landmark
const updateLandmark = async (landmarkId, updates) => {
  try {
    const landmarksJSON = await AsyncStorage.getItem(LANDMARKS_KEY);
    let landmarks = landmarksJSON ? JSON.parse(landmarksJSON) : [];
    
    const index = landmarks.findIndex(landmark => landmark.id === landmarkId);
    if (index !== -1) {
      landmarks[index] = { ...landmarks[index], ...updates };
      
      // Always update last visited timestamp when updating
      landmarks[index].lastVisited = new Date().toISOString();
      
      await AsyncStorage.setItem(LANDMARKS_KEY, JSON.stringify(landmarks));
      return landmarks[index];
    }
    
    return null;
  } catch (error) {
    console.error('Error updating landmark:', error);
    return null;
  }
};

// Check for landmarks near current location
const checkNearbyLandmarks = async (currentLocation, onLandmarkDetected) => {
  try {
    const landmarks = await getLandmarks();
    
    for (const landmark of landmarks) {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        landmark.latitude,
        landmark.longitude
      );
      
      if (distance <= LANDMARK_DETECTION_DISTANCE) {
        // Update visit count
        landmark.visitCount += 1;
        landmark.lastVisited = new Date().toISOString();
        await updateLandmark(landmark.id, landmark);
        
        // Notify caller
        if (onLandmarkDetected) {
          onLandmarkDetected(landmark, distance);
        }
        
        return landmark;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error checking nearby landmarks:', error);
    return null;
  }
};

// Auto-detect potential landmarks
const detectPotentialLandmark = async (locationHistory) => {
  if (!locationHistory || locationHistory.length < 10) {
    return null;
  }
  
  try {
    // Look for clusters in location history
    const clusters = findLocationClusters(locationHistory);
    
    if (clusters.length > 0) {
      // Find the most significant cluster that isn't already a landmark
      for (const cluster of clusters) {
        const isNearExistingLandmark = await isClusterNearLandmark(cluster.center);
        
        if (!isNearExistingLandmark) {
          // This is a potential new landmark
          return {
            latitude: cluster.center.latitude,
            longitude: cluster.center.longitude,
            visitCount: cluster.points.length,
            suggested: true
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error detecting potential landmarks:', error);
    return null;
  }
};

// Check if a cluster is near an existing landmark
const isClusterNearLandmark = async (clusterCenter) => {
  const landmarks = await getLandmarks();
  
  for (const landmark of landmarks) {
    const distance = calculateDistance(
      clusterCenter.latitude,
      clusterCenter.longitude,
      landmark.latitude,
      landmark.longitude
    );
    
    if (distance <= LANDMARK_DETECTION_DISTANCE) {
      return true;
    }
  }
  
  return false;
};

// Find clusters in location history using a simple distance-based approach
const findLocationClusters = (locationHistory) => {
  const clusters = [];
  const processedPoints = new Set();
  
  for (let i = 0; i < locationHistory.length; i++) {
    if (processedPoints.has(i)) continue;
    
    const point = locationHistory[i];
    const clusterPoints = [point];
    processedPoints.add(i);
    
    for (let j = 0; j < locationHistory.length; j++) {
      if (i === j || processedPoints.has(j)) continue;
      
      const otherPoint = locationHistory[j];
      const distance = calculateDistance(
        point.latitude,
        point.longitude,
        otherPoint.latitude,
        otherPoint.longitude
      );
      
      if (distance <= LANDMARK_DETECTION_DISTANCE) {
        clusterPoints.push(otherPoint);
        processedPoints.add(j);
      }
    }
    
    if (clusterPoints.length >= 3) { // Only consider clusters with at least 3 points
      // Calculate cluster center
      const centerLat = clusterPoints.reduce((sum, p) => sum + p.latitude, 0) / clusterPoints.length;
      const centerLng = clusterPoints.reduce((sum, p) => sum + p.longitude, 0) / clusterPoints.length;
      
      clusters.push({
        center: {
          latitude: centerLat,
          longitude: centerLng
        },
        points: clusterPoints
      });
    }
  }
  
  // Sort clusters by size (largest first)
  return clusters.sort((a, b) => b.points.length - a.points.length);
};

// Generate voice directions considering landmarks
const generateVoiceDirectionsWithLandmarks = async (currentLocation, targetLocation) => {
  // Basic direction and distance
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
  
  // Check for nearby landmarks
  const landmarks = await getLandmarks();
  let nearestLandmark = null;
  let nearestDistance = Infinity;
  
  for (const landmark of landmarks) {
    const landmarkDistance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      landmark.latitude,
      landmark.longitude
    );
    
    if (landmarkDistance < nearestDistance) {
      nearestLandmark = landmark;
      nearestDistance = landmarkDistance;
    }
  }
  
  // Generate instruction
  let instruction = '';
  
  if (distance < 20) {
    instruction = "You are very close to your destination.";
  } else {
    // Basic direction
    instruction = `Head ${direction} for approximately ${Math.round(distance)} meters.`;
    
    // Add landmark reference if available and relevant
    if (nearestLandmark && nearestDistance < 50) {
      if (nearestDistance < 20) {
        instruction = `You are near ${nearestLandmark.name}. ` + instruction;
      } else {
        const landmarkBearing = calculateBearing(
          currentLocation.latitude,
          currentLocation.longitude,
          nearestLandmark.latitude,
          nearestLandmark.longitude
        );
        
        const landmarkDirection = getDirectionFromBearing(landmarkBearing);
        instruction += ` ${nearestLandmark.name} is to your ${landmarkDirection}.`;
      }
    }
  }
  
  return instruction;
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

export default {
  addLandmark,
  getLandmarks,
  removeLandmark,
  updateLandmark,
  checkNearbyLandmarks,
  detectPotentialLandmark,
  generateVoiceDirectionsWithLandmarks,
  calculateDistance,
  calculateBearing,
  getDirectionFromBearing,
};