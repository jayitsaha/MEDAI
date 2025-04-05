// src/services/OCRService.js
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestCameraPermissions, requestMediaLibraryPermissions } from '../utils/PermissionsHelper';

// API base URL - update this to your Flask server address
const API_URL = 'http://192.168.107.82:5001/api';

// Process prescription image with Grok Vision
const processPrescriptionImage = async (imageUri) => {
  try {
    // Show loading indicator or message
    console.log("Processing prescription with Grok Vision...");
    
    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);
    
    // Call the Grok-powered OCR API
    const response = await fetch(`${API_URL}/ocr/prescription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to process prescription');
    }
    
    // Get the prescription data
    const prescriptionData = result.data;
    
    // Save to AsyncStorage
    await savePrescription(prescriptionData);
    
    // Log success
    console.log(`Grok Vision identified ${prescriptionData.medicines.length} medications`);
    
    return prescriptionData;
  } catch (error) {
    console.error('Error processing prescription with Grok:', error);
    throw error;
  }
};

// Save prescription to AsyncStorage
const savePrescription = async (prescription) => {
  try {
    // Get existing prescriptions
    const prescriptionsJson = await AsyncStorage.getItem('prescriptions');
    let prescriptions = prescriptionsJson ? JSON.parse(prescriptionsJson) : [];
    
    // Add new prescription
    prescriptions.push(prescription);
    
    // Save back to AsyncStorage
    await AsyncStorage.setItem('prescriptions', JSON.stringify(prescriptions));
  } catch (error) {
    console.error('Error saving prescription:', error);
    throw error;
  }
};

// Get all prescriptions from AsyncStorage
const getPrescriptions = async () => {
  try {
    const prescriptionsJson = await AsyncStorage.getItem('prescriptions');
    return prescriptionsJson ? JSON.parse(prescriptionsJson) : [];
  } catch (error) {
    console.error('Error getting prescriptions:', error);
    return [];
  }
};

// Scan medicine image with Grok Vision
const scanMedicine = async (imageUri) => {
  try {
    console.log("Analyzing medication with Grok Vision...");
    
    // Get the current prescriptions for validation
    const prescriptions = await getPrescriptions();
    const latestPrescription = prescriptions.length > 0 ? prescriptions[prescriptions.length - 1] : null;
    
    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);
    
    // Call the medicine scanning API
    const response = await fetch(`${API_URL}/ocr/medicine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        prescriptionData: latestPrescription // Send latest prescription for validation
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to scan medicine');
    }
    
    // Get medicine info
    const medicineInfo = result.data;
    
    // Save to medications list in AsyncStorage
    await saveMedication(medicineInfo, imageUri);
    
    return medicineInfo;
  } catch (error) {
    console.error('Error scanning medicine with Grok:', error);
    throw error;
  }
};

// Save medication to AsyncStorage
const saveMedication = async (medication, imageUri) => {
  try {
    // Get existing medications
    const medicationsJson = await AsyncStorage.getItem('medications');
    let medications = medicationsJson ? JSON.parse(medicationsJson) : [];
    
    // Add image URI to medication
    medication.imageUri = imageUri;
    medication.id = Date.now().toString(); // Add unique ID
    medication.lastUpdated = new Date().toISOString();
    
    // Check if medication already exists
    const existingIndex = medications.findIndex(med => med.name === medication.name);
    
    if (existingIndex >= 0) {
      // Update existing medication
      medications[existingIndex] = {
        ...medications[existingIndex],
        ...medication
      };
    } else {
      // Add new medication
      medications.push(medication);
    }
    
    // Save back to AsyncStorage
    await AsyncStorage.setItem('medications', JSON.stringify(medications));
  } catch (error) {
    console.error('Error saving medication:', error);
    throw error;
  }
};

// Get all medications from AsyncStorage
const getMedications = async () => {
  try {
    const medicationsJson = await AsyncStorage.getItem('medications');
    return medicationsJson ? JSON.parse(medicationsJson) : [];
  } catch (error) {
    console.error('Error getting medications:', error);
    return [];
  }
};

// Pick image from camera or gallery
const pickImage = async (useCamera = false) => {
  try {
    // Request camera/media library permissions
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to scan medicines.');
        return null;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library permission is required to select images.');
        return null;
      }
    }
    
    // Launch camera or image picker
    const result = useCamera 
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image. Please try again.');
    return null;
  }
};

// Convert image URI to base64
const imageToBase64 = async (uri) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64data = reader.result.split(',')[1];
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

export default {
  processPrescriptionImage,
  scanMedicine,
  pickImage,
  getPrescriptions,
  getMedications
};