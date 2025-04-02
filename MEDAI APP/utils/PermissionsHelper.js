import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import { Platform, Alert, Linking } from 'react-native';

export const requestCameraPermissions = async () => {
  try {
    // For Android, try direct permissions API first
    if (Platform.OS === 'android') {
      // First check if permission is already granted
      const { status: existingStatus } = await Permissions.getAsync(Permissions.CAMERA);
      
      if (existingStatus === 'granted') {
        return true;
      }
      
      // Prompt for permission
      const { status } = await Permissions.askAsync(Permissions.CAMERA);
      
      if (status === 'granted') {
        return true;
      } else {
        // Permission denied, show alert with option to open settings
        Alert.alert(
          'Camera Permission Required',
          'MEDAI needs camera access to scan prescriptions and medications.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => Linking.openSettings() 
            }
          ]
        );
        return false;
      }
    } 
    // For iOS, use the Image Picker API
    else {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status === 'granted') {
        return true;
      } else {
        Alert.alert(
          'Camera Permission Required',
          'MEDAI needs camera access to scan prescriptions and medications.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => Linking.openSettings() 
            }
          ]
        );
        return false;
      }
    }
  } catch (error) {
    console.error('Error requesting camera permissions:', error);
    return false;
  }
};

export const requestMediaLibraryPermissions = async () => {
  try {
    if (Platform.OS === 'android') {
      const { status: existingStatus } = await Permissions.getAsync(Permissions.MEDIA_LIBRARY);
      
      if (existingStatus === 'granted') {
        return true;
      }
      
      const { status } = await Permissions.askAsync(Permissions.MEDIA_LIBRARY);
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library access is needed to upload prescription images.');
        return false;
      }
      
      return true;
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library access is needed to upload prescription images.');
        return false;
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error requesting media library permissions:', error);
    return false;
  }
};