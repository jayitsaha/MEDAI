// src/services/FallDetectionService.js
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// API base URL - update this to your Flask server address
const API_URL = 'http://192.168.107.82:5001/api';

let subscription = null;
let accelerometerData = [];
const WINDOW_SIZE = 50; // Number of data points to collect before analysis

// Initialize fall detection
const initialize = async () => {
  try {

    // console.log("Initializing fall detection...");
    // Check if fall detection is enabled in AsyncStorage
    const enabled = await AsyncStorage.getItem('fall_detection_enabled');

    await startMonitoring();
    
    // if (enabled === 'true') {
    //   await startMonitoring();
    // }
    
    return true;
  } catch (error) {
    console.error('Error initializing fall detection:', error);
    return false;
  }
};

// Start monitoring for falls
const startMonitoring = async () => {
  try {
    // console.log("Starting fall detection...");
    // Set accelerometer update interval
    Accelerometer.setUpdateInterval(100); // 100ms = 10 readings per second
    
    // Start collecting data
    accelerometerData = [];
    
    subscription = Accelerometer.addListener(data => {
      // Add data to buffer
      accelerometerData.push(data);

      // console.log("Accelerometer data:", data);
      
      // Keep buffer at WINDOW_SIZE
      if (accelerometerData.length > WINDOW_SIZE) {
        accelerometerData.shift();
      }
      
      // When we have enough data, analyze for falls
      if (accelerometerData.length === WINDOW_SIZE) {
        analyzeForFall();
      }
    });
    
    // Save setting to AsyncStorage
    await AsyncStorage.setItem('fall_detection_enabled', 'true');
    
    return true;
  } catch (error) {
    console.error('Error starting fall detection:', error);
    return false;
  }
};

// Stop monitoring for falls
const stopMonitoring = async () => {
  try {
    if (subscription) {
      subscription.remove();
      subscription = null;
    }
    
    accelerometerData = [];
    
    // Save setting to AsyncStorage
    await AsyncStorage.setItem('fall_detection_enabled', 'false');
    
    return true;
  } catch (error) {
    console.error('Error stopping fall detection:', error);
    return false;
  }
};

// Check if monitoring is active
const isMonitoringActive = () => {
  return subscription !== null;
};

// Analyze accelerometer data for falls
const analyzeForFall = async () => {
  try {
    // Call the fall detection API
    const response = await fetch(`${API_URL}/fall-detection/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accelerometerData
      })
    });
    
    const result = await response.json();

    // console.log("Fall detection result:", result);
    
    if (!result.success) {
      console.error('Fall detection analysis error:', result.error);
      return;
    }
    
    // If a fall is detected with high confidence, trigger alert
    if (result.fallDetected && result.confidence > 10) {
      handleFallDetected(result.fallType, result.confidence);
    }
  } catch (error) {
    console.error('Error analyzing for fall:', error);
  }
};

// Handle a detected fall
const handleFallDetected = async (fallType, confidence) => {
  try {
    // Get emergency contacts
    const contactsJson = await AsyncStorage.getItem('emergency_contacts');
    const contacts = contactsJson ? JSON.parse(contactsJson) : [];
    
    // Create a fall record
    const fallRecord = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: fallType,
      confidence,
      notified: contacts.length > 0
    };
    
    // Save to fall history
    const historyJson = await AsyncStorage.getItem('fall_history');
    const history = historyJson ? JSON.parse(historyJson) : [];
    history.push(fallRecord);
    await AsyncStorage.setItem('fall_history', JSON.stringify(history));
    
    // Show notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Fall Detected',
        body: 'MEDAI has detected that you may have fallen. Are you okay?',
        data: { fallId: fallRecord.id },
      },
      trigger: null, // Immediate notification
    });
    
    // In a real app, you would also:
    // 1. Show an on-screen alert with a timer
    // 2. If no response, contact emergency contacts
    // 3. Potentially use device's emergency SOS feature
  } catch (error) {
    console.error('Error handling fall detection:', error);
  }
};

// Get fall history
const getFallHistory = async () => {
  try {
    const historyJson = await AsyncStorage.getItem('fall_history');
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Error getting fall history:', error);
    return [];
  }
};

export default {
  initialize,
  startMonitoring,
  stopMonitoring,
  isMonitoringActive,
  getFallHistory
};