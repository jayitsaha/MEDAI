import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Dimensions,
  Platform
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

// API URL
const API_URL = 'https://medai-guardian-api.herokuapp.com';

// Screen dimensions
const { width, height } = Dimensions.get('window');

// Dummy safe zone data
const DUMMY_SAFE_ZONES = [
  {
    id: '1',
    name: 'Home',
    address: '45 Koramangala 5th Block, Bangalore, 560095',
    radius: 200, // meters
    isActive: true,
    alertSettings: {
      notifyOnExit: true,
      notifyOnEntry: false,
      notifyCaregiver: true,
      autoCallOnExit: false
    },
    coordinates: {
      latitude: 12.9352,
      longitude: 77.6245
    }
  },
  {
    id: '2',
    name: 'Cubbon Park',
    address: 'Kasturba Road, Bangalore, 560001',
    radius: 150, // meters
    isActive: true,
    alertSettings: {
      notifyOnExit: true,
      notifyOnEntry: true,
      notifyCaregiver: true,
      autoCallOnExit: false
    },
    coordinates: {
      latitude: 12.9763,
      longitude: 77.5929
    }
  },
  {
    id: '3',
    name: 'Lalbagh Garden',
    address: 'Mavalli, Bangalore, 560004',
    radius: 100, // meters
    isActive: false,
    alertSettings: {
      notifyOnExit: true,
      notifyOnEntry: false,
      notifyCaregiver: false,
      autoCallOnExit: false
    },
    coordinates: {
      latitude: 12.9507,
      longitude: 77.5848
    }
  }
];
// Patient location history (for heatmap)
const DUMMY_LOCATION_HISTORY = [
  { latitude: 12.9352, longitude: 77.6245 }, // Home in Koramangala
  { latitude: 12.9358, longitude: 77.6250 },
  { latitude: 12.9372, longitude: 77.6260 },
  { latitude: 12.9400, longitude: 77.6280 },
  { latitude: 12.9450, longitude: 77.6300 },
  { latitude: 12.9500, longitude: 77.6320 },
  { latitude: 12.9600, longitude: 77.6340 },
  { latitude: 12.9763, longitude: 77.5929 }, // Cubbon Park
  { latitude: 12.9700, longitude: 77.6000 },
  { latitude: 12.9650, longitude: 77.6100 },
  { latitude: 12.9600, longitude: 77.6150 },
  { latitude: 12.9550, longitude: 77.6200 },
  { latitude: 12.9500, longitude: 77.6220 },
  { latitude: 12.9450, longitude: 77.6230 },
  { latitude: 12.9400, longitude: 77.6240 },
  { latitude: 12.9375, longitude: 77.6245 },
  { latitude: 12.9370, longitude: 77.6245 },
  { latitude: 12.9360, longitude: 77.6245 },
  { latitude: 12.9507, longitude: 77.5848 }, // Lalbagh Garden
];

const SafeZoneSettingsScreen = ({ route, navigation }) => {
  const { patientId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [safeZones, setSafeZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [showLocationHistory, setShowLocationHistory] = useState(false);
  const [locationHistory, setLocationHistory] = useState([]);
  
  const mapRef = useRef(null);
  
  // New safe zone form state
  const [newZone, setNewZone] = useState({
    name: '',
    address: '',
    radius: 200,
    isActive: true,
    alertSettings: {
      notifyOnExit: true,
      notifyOnEntry: false,
      notifyCaregiver: true,
      autoCallOnExit: false
    },
    coordinates: null
  });
  
  // Fetch patient safe zones
  const fetchSafeZones = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an actual API call
      // const response = await axios.get(`${API_URL}/api/patients/${patientId}/safe-zones`);
      // setSafeZones(response.data);
      
      // Using dummy data for development
      setTimeout(() => {
        setSafeZones(DUMMY_SAFE_ZONES);
        setLocationHistory(DUMMY_LOCATION_HISTORY);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching safe zones:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load safe zones. Please try again.');
    }
  };
  
  // Load safe zones when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchSafeZones();
      return () => {
        // Clean up if needed
      };
    }, [patientId])
  );
  
  // Select a safe zone
  const handleSelectZone = (zone) => {
    setSelectedZone(zone);
    setEditMode(false);
    
    // Animate to zone location
    if (mapRef.current && zone.coordinates) {
      mapRef.current.animateToRegion({
        latitude: zone.coordinates.latitude,
        longitude: zone.coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      });
    }
  };
  
  // Toggle safe zone active status
  const toggleZoneActive = (zoneId) => {
    setSafeZones(prev => {
      const updated = prev.map(zone => {
        if (zone.id === zoneId) {
          return {
            ...zone,
            isActive: !zone.isActive
          };
        }
        return zone;
      });
      
      // If the selected zone is toggled, update it
      if (selectedZone && selectedZone.id === zoneId) {
        setSelectedZone(updated.find(z => z.id === zoneId));
      }
      
      return updated;
    });
  };
  
  // Enter edit mode for a zone
  const handleEditZone = () => {
    setEditMode(true);
  };
  
  // Save edited zone
  const handleSaveZone = () => {
    if (!selectedZone) return;
    
    // In a real app, this would be an API call
    setSafeZones(prev => {
      return prev.map(zone => {
        if (zone.id === selectedZone.id) {
          return selectedZone;
        }
        return zone;
      });
    });
    
    setEditMode(false);
    Alert.alert('Success', 'Safe zone updated successfully');
  };
  
  // Delete a safe zone
  const handleDeleteZone = () => {
    if (!selectedZone) return;
    
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete the "${selectedZone.name}" safe zone?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // In a real app, this would be an API call
            setSafeZones(prev => prev.filter(zone => zone.id !== selectedZone.id));
            setSelectedZone(null);
            Alert.alert('Success', 'Safe zone deleted successfully');
          }
        }
      ]
    );
  };
  
  // Add a new safe zone
  const handleAddZone = () => {
    // Reset new zone form
    setNewZone({
      name: '',
      address: '',
      radius: 200,
      isActive: true,
      alertSettings: {
        notifyOnExit: true,
        notifyOnEntry: false,
        notifyCaregiver: true,
        autoCallOnExit: false
      },
      coordinates: null
    });
    
    // Show add zone modal
    setShowAddZoneModal(true);
    
    // Get current location
    getCurrentLocation();
  };
  
  // Get current location for new safe zone
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      setNewZone(prev => ({
        ...prev,
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        }
      }));
      
      // Animate map to current location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Could not get current location');
    }
  };
  
  // Save new safe zone
  const handleSaveNewZone = () => {
    // Validate form
    if (!newZone.name) {
      Alert.alert('Error', 'Please enter a name for the safe zone');
      return;
    }
    
    if (!newZone.address) {
      Alert.alert('Error', 'Please enter an address for the safe zone');
      return;
    }
    
    if (!newZone.coordinates) {
      Alert.alert('Error', 'Please select a location for the safe zone');
      return;
    }
    
    // Create new zone object
    const zone = {
      ...newZone,
      id: `new_${Date.now()}` // In a real app, the backend would generate this ID
    };
    
    // In a real app, this would be an API call
    setSafeZones(prev => [...prev, zone]);
    setShowAddZoneModal(false);
    
    // Select the new zone
    setSelectedZone(zone);
    
    Alert.alert('Success', 'New safe zone added successfully');
  };
  
  // Handle map long press to set location
  const handleMapLongPress = (event) => {
    if (showAddZoneModal) {
      // Set coordinates for new zone
      setNewZone(prev => ({
        ...prev,
        coordinates: event.nativeEvent.coordinate
      }));
    }
  };
  
  // Update zone radius
  const handleRadiusChange = (radius) => {
    if (editMode && selectedZone) {
      setSelectedZone(prev => ({
        ...prev,
        radius
      }));
    } else if (showAddZoneModal) {
      setNewZone(prev => ({
        ...prev,
        radius
      }));
    }
  };
  
  // Toggle alert setting for selected zone
  const toggleAlertSetting = (setting) => {
    if (!editMode || !selectedZone) return;
    
    setSelectedZone(prev => ({
      ...prev,
      alertSettings: {
        ...prev.alertSettings,
        [setting]: !prev.alertSettings[setting]
      }
    }));
  };
  
  // Toggle alert setting for new zone
  const toggleNewZoneAlertSetting = (setting) => {
    setNewZone(prev => ({
      ...prev,
      alertSettings: {
        ...prev.alertSettings,
        [setting]: !prev.alertSettings[setting]
      }
    }));
  };
  
  // Toggle location history visibility
  const toggleLocationHistory = () => {
    setShowLocationHistory(prev => !prev);
  };
  
  // Test alerts for a safe zone
  const testZoneAlerts = (zone) => {
    Alert.alert(
      'Test Alerts',
      `This will send a test alert for the "${zone.name}" safe zone. Do you want to continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Test', 
          onPress: () => {
            // In a real app, this would send an API request
            Alert.alert('Test Alert Sent', 'A test alert has been sent to configured devices.');
          }
        }
      ]
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FA5" />
        <Text style={styles.loadingText}>Loading safe zones...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safe Zone Settings</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Map section */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: safeZones[0]?.coordinates.latitude || 37.7865,
              longitude: safeZones[0]?.coordinates.longitude || -122.4324,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02
            }}
            onLongPress={handleMapLongPress}
          >
            {/* Safe zones */}
            {safeZones.map(zone => (
              <React.Fragment key={zone.id}>
                <Circle
                  center={zone.coordinates}
                  radius={zone.radius}
                  fillColor={zone.isActive ? (selectedZone?.id === zone.id ? 'rgba(74, 111, 165, 0.2)' : 'rgba(42, 157, 143, 0.2)') : 'rgba(169, 169, 169, 0.2)'}
                  strokeColor={zone.isActive ? (selectedZone?.id === zone.id ? '#4A6FA5' : '#2A9D8F') : '#A9A9A9'}
                  strokeWidth={2}
                />
                <Marker
                  coordinate={zone.coordinates}
                  title={zone.name}
                  description={zone.isActive ? 'Active' : 'Inactive'}
                  pinColor={zone.isActive ? (selectedZone?.id === zone.id ? '#4A6FA5' : '#2A9D8F') : '#A9A9A9'}
                  onPress={() => handleSelectZone(zone)}
                />
              </React.Fragment>
            ))}
            
            {/* New safe zone preview */}
            {showAddZoneModal && newZone.coordinates && (
              <Circle
                center={newZone.coordinates}
                radius={newZone.radius}
                fillColor="rgba(74, 111, 165, 0.2)"
                strokeColor="#4A6FA5"
                strokeWidth={2}
              />
            )}
            
            {/* Location history */}
            {showLocationHistory && locationHistory.map((location, index) => (
              <Marker
                key={`history_${index}`}
                coordinate={location}
                title={`Location ${index + 1}`}
                opacity={0.7}
              >
                <View style={styles.historyMarker} />
              </Marker>
            ))}
          </MapView>
          
          <View style={styles.mapControls}>
            <TouchableOpacity
              style={styles.mapControlButton}
              onPress={toggleLocationHistory}
            >
              <Ionicons 
                name={showLocationHistory ? "footsteps" : "footsteps"} 
                size={20} 
                color="#4A6FA5" 
              />
              <Text style={styles.mapControlText}>
                {showLocationHistory ? "Hide History" : "Show History"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.mapControlButton}
              onPress={() => {
                mapRef.current?.fitToElements({
                  edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                  animated: true
                });
              }}
            >
              <Ionicons name="expand" size={20} color="#4A6FA5" />
              <Text style={styles.mapControlText}>Show All</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Safe zones list */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Safe Zones</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddZone}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Zone</Text>
            </TouchableOpacity>
          </View>
          
          {safeZones.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="location" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No safe zones configured</Text>
              <Text style={styles.emptySubText}>Add a safe zone to monitor patient location</Text>
            </View>
          ) : (
            safeZones.map(zone => (
              <TouchableOpacity
                key={zone.id}
                style={[
                  styles.zoneItem,
                  selectedZone?.id === zone.id && styles.zoneItemSelected
                ]}
                onPress={() => handleSelectZone(zone)}
              >
                <View style={styles.zoneItemContent}>
                  <View style={[
                    styles.zoneIconContainer,
                    zone.isActive ? styles.zoneIconActive : styles.zoneIconInactive
                  ]}>
                    <Ionicons
                      name="location"
                      size={24}
                      color={zone.isActive ? "#FFFFFF" : "#94A3B8"}
                    />
                  </View>
                  
                  <View style={styles.zoneInfo}>
                    <Text style={[
                      styles.zoneName,
                      !zone.isActive && styles.zoneInactiveName
                    ]}>
                      {zone.name}
                    </Text>
                    <Text style={styles.zoneAddress}>{zone.address}</Text>
                    <Text style={styles.zoneRadius}>Radius: {zone.radius} meters</Text>
                  </View>
                  
                  <View style={styles.zoneActions}>
                    <Switch
                      value={zone.isActive}
                      onValueChange={() => toggleZoneActive(zone.id)}
                      trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                      thumbColor={zone.isActive ? "#4A6FA5" : "#CBD5E1"}
                    />
                    
                    <TouchableOpacity
                      style={styles.testButton}
                      onPress={() => testZoneAlerts(zone)}
                      disabled={!zone.isActive}
                    >
                      <Ionicons
                        name="alert-circle"
                        size={18}
                        color={zone.isActive ? "#E63946" : "#CBD5E1"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
        
        {/* Selected zone details */}
        {selectedZone && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {editMode ? "Edit Safe Zone" : "Safe Zone Details"}
              </Text>
              {!editMode ? (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditZone}
                >
                  <Ionicons name="create" size={20} color="#FFFFFF" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveZone}
                >
                  <Ionicons name="save" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                {editMode ? (
                  <TextInput
                    style={styles.detailInput}
                    value={selectedZone.name}
                    onChangeText={(text) => setSelectedZone(prev => ({ ...prev, name: text }))}
                    placeholder="Enter zone name"
                  />
                ) : (
                  <Text style={styles.detailValue}>{selectedZone.name}</Text>
                )}
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                {editMode ? (
                  <TextInput
                    style={styles.detailInput}
                    value={selectedZone.address}
                    onChangeText={(text) => setSelectedZone(prev => ({ ...prev, address: text }))}
                    placeholder="Enter address"
                  />
                ) : (
                  <Text style={styles.detailValue}>{selectedZone.address}</Text>
                )}
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Radius:</Text>
                {editMode ? (
                  <View style={styles.radiusInputContainer}>
                    <Slider
                      style={styles.radiusSlider}
                      minimumValue={50}
                      maximumValue={500}
                      step={10}
                      value={selectedZone.radius}
                      onValueChange={handleRadiusChange}
                      minimumTrackTintColor="#4A6FA5"
                      maximumTrackTintColor="#E2E8F0"
                      thumbTintColor="#4A6FA5"
                    />
                    <Text style={styles.radiusValue}>{selectedZone.radius} meters</Text>
                  </View>
                ) : (
                  <Text style={styles.detailValue}>{selectedZone.radius} meters</Text>
                )}
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={styles.statusContainer}>
                  <Text style={[
                    styles.statusText,
                    { color: selectedZone.isActive ? "#2A9D8F" : "#94A3B8" }
                  ]}>
                    {selectedZone.isActive ? "Active" : "Inactive"}
                  </Text>
                  {editMode && (
                    <Switch
                      value={selectedZone.isActive}
                      onValueChange={() => setSelectedZone(prev => ({ ...prev, isActive: !prev.isActive }))}
                      trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                      thumbColor={selectedZone.isActive ? "#4A6FA5" : "#CBD5E1"}
                    />
                  )}
                </View>
              </View>
            </View>
            
            {editMode && (
              <View style={styles.alertSettingsContainer}>
                <Text style={styles.alertSettingsTitle}>Alert Settings</Text>
                
                <View style={styles.alertSettingRow}>
                  <View style={styles.alertSettingContent}>
                    <Ionicons name="exit" size={20} color="#4A6FA5" />
                    <Text style={styles.alertSettingText}>Notify on Exit</Text>
                  </View>
                  <Switch
                    value={selectedZone.alertSettings.notifyOnExit}
                    onValueChange={() => toggleAlertSetting('notifyOnExit')}
                    trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                    thumbColor={selectedZone.alertSettings.notifyOnExit ? "#4A6FA5" : "#CBD5E1"}
                  />
                </View>
                
                <View style={styles.alertSettingRow}>
                  <View style={styles.alertSettingContent}>
                    <Ionicons name="enter" size={20} color="#4A6FA5" />
                    <Text style={styles.alertSettingText}>Notify on Entry</Text>
                  </View>
                  <Switch
                    value={selectedZone.alertSettings.notifyOnEntry}
                    onValueChange={() => toggleAlertSetting('notifyOnEntry')}
                    trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                    thumbColor={selectedZone.alertSettings.notifyOnEntry ? "#4A6FA5" : "#CBD5E1"}
                  />
                </View>
                
                <View style={styles.alertSettingRow}>
                  <View style={styles.alertSettingContent}>
                    <Ionicons name="people" size={20} color="#4A6FA5" />
                    <Text style={styles.alertSettingText}>Notify Caregiver</Text>
                  </View>
                  <Switch
                    value={selectedZone.alertSettings.notifyCaregiver}
                    onValueChange={() => toggleAlertSetting('notifyCaregiver')}
                    trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                    thumbColor={selectedZone.alertSettings.notifyCaregiver ? "#4A6FA5" : "#CBD5E1"}
                  />
                </View>
                
                <View style={styles.alertSettingRow}>
                  <View style={styles.alertSettingContent}>
                    <Ionicons name="call" size={20} color="#4A6FA5" />
                    <Text style={styles.alertSettingText}>Auto-Call on Exit</Text>
                  </View>
                  <Switch
                    value={selectedZone.alertSettings.autoCallOnExit}
                    onValueChange={() => toggleAlertSetting('autoCallOnExit')}
                    trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                    thumbColor={selectedZone.alertSettings.autoCallOnExit ? "#4A6FA5" : "#CBD5E1"}
                  />
                </View>
              </View>
            )}
            
            {editMode && (
              <View style={styles.deleteContainer}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteZone}
                >
                  <Ionicons name="trash" size={20} color="#FFFFFF" />
                  <Text style={styles.deleteButtonText}>Delete Safe Zone</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Add Zone Modal */}
      <Modal
        visible={showAddZoneModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddZoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Safe Zone</Text>
              <TouchableOpacity
                onPress={() => setShowAddZoneModal(false)}
              >
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalInstructions}>
                Long press on the map to set the zone center or use your current location
              </Text>
              
              {/* Map for selecting location */}
              <View style={styles.modalMapContainer}>
                <MapView
                  style={styles.modalMap}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={{
                    latitude: newZone.coordinates?.latitude || 37.7865,
                    longitude: newZone.coordinates?.longitude || -122.4324,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01
                  }}
                  onLongPress={handleMapLongPress}
                >
                  {newZone.coordinates && (
                    <>
                      <Marker
                        coordinate={newZone.coordinates}
                        draggable
                        onDragEnd={(e) => {
                          setNewZone(prev => ({
                            ...prev,
                            coordinates: e.nativeEvent.coordinate
                          }));
                        }}
                      />
                      <Circle
                        center={newZone.coordinates}
                        radius={newZone.radius}
                        fillColor="rgba(74, 111, 165, 0.2)"
                        strokeColor="#4A6FA5"
                        strokeWidth={2}
                      />
                    </>
                  )}
                </MapView>
                
                <TouchableOpacity
                  style={styles.useLocationButton}
                  onPress={getCurrentLocation}
                >
                  <Ionicons name="locate" size={20} color="#FFFFFF" />
                  <Text style={styles.useLocationButtonText}>Use Current Location</Text>
                </TouchableOpacity>
              </View>
              
              {/* Zone details form */}
              <View style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newZone.name}
                    onChangeText={(text) => setNewZone(prev => ({ ...prev, name: text }))}
                    placeholder="Enter zone name (e.g. Home, Work)"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Address</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newZone.address}
                    onChangeText={(text) => setNewZone(prev => ({ ...prev, address: text }))}
                    placeholder="Enter address"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Radius (meters)</Text>
                  <View style={styles.radiusInputContainer}>
                    <Slider
                      style={styles.radiusSlider}
                      minimumValue={50}
                      maximumValue={500}
                      step={10}
                      value={newZone.radius}
                      onValueChange={(value) => setNewZone(prev => ({ ...prev, radius: value }))}
                      minimumTrackTintColor="#4A6FA5"
                      maximumTrackTintColor="#E2E8F0"
                      thumbTintColor="#4A6FA5"
                    />
                    <Text style={styles.radiusValue}>{newZone.radius} meters</Text>
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Status</Text>
                  <View style={styles.statusContainer}>
                    <Text style={styles.statusText}>
                      {newZone.isActive ? "Active" : "Inactive"}
                    </Text>
                    <Switch
                      value={newZone.isActive}
                      onValueChange={(value) => setNewZone(prev => ({ ...prev, isActive: value }))}
                      trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                      thumbColor={newZone.isActive ? "#4A6FA5" : "#CBD5E1"}
                    />
                  </View>
                </View>
              </View>
              
              {/* Alert settings */}
              <View style={styles.alertSettingsContainer}>
                <Text style={styles.alertSettingsTitle}>Alert Settings</Text>
                
                <View style={styles.alertSettingRow}>
                  <View style={styles.alertSettingContent}>
                    <Ionicons name="exit" size={20} color="#4A6FA5" />
                    <Text style={styles.alertSettingText}>Notify on Exit</Text>
                  </View>
                  <Switch
                    value={newZone.alertSettings.notifyOnExit}
                    onValueChange={() => toggleNewZoneAlertSetting('notifyOnExit')}
                    trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                    thumbColor={newZone.alertSettings.notifyOnExit ? "#4A6FA5" : "#CBD5E1"}
                  />
                </View>
                
                <View style={styles.alertSettingRow}>
                  <View style={styles.alertSettingContent}>
                    <Ionicons name="enter" size={20} color="#4A6FA5" />
                    <Text style={styles.alertSettingText}>Notify on Entry</Text>
                  </View>
                  <Switch
                    value={newZone.alertSettings.notifyOnEntry}
                    onValueChange={() => toggleNewZoneAlertSetting('notifyOnEntry')}
                    trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                    thumbColor={newZone.alertSettings.notifyOnEntry ? "#4A6FA5" : "#CBD5E1"}
                  />
                </View>
                
                <View style={styles.alertSettingRow}>
                  <View style={styles.alertSettingContent}>
                    <Ionicons name="people" size={20} color="#4A6FA5" />
                    <Text style={styles.alertSettingText}>Notify Caregiver</Text>
                  </View>
                  <Switch
                    value={newZone.alertSettings.notifyCaregiver}
                    onValueChange={() => toggleNewZoneAlertSetting('notifyCaregiver')}
                    trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                    thumbColor={newZone.alertSettings.notifyCaregiver ? "#4A6FA5" : "#CBD5E1"}
                  />
                </View>
                
                <View style={styles.alertSettingRow}>
                  <View style={styles.alertSettingContent}>
                    <Ionicons name="call" size={20} color="#4A6FA5" />
                    <Text style={styles.alertSettingText}>Auto-Call on Exit</Text>
                  </View>
                  <Switch
                    value={newZone.alertSettings.autoCallOnExit}
                    onValueChange={() => toggleNewZoneAlertSetting('autoCallOnExit')}
                    trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                    thumbColor={newZone.alertSettings.autoCallOnExit ? "#4A6FA5" : "#CBD5E1"}
                  />
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddZoneModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.saveNewButton,
                  (!newZone.name || !newZone.address || !newZone.coordinates) && styles.saveNewButtonDisabled
                ]}
                onPress={handleSaveNewZone}
                disabled={!newZone.name || !newZone.address || !newZone.coordinates}
              >
                <Text style={styles.saveNewButtonText}>Save Zone</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  mapContainer: {
    height: 300,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  mapControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mapControlText: {
    fontSize: 14,
    color: '#0F172A',
    marginLeft: 6,
  },
  historyMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A6FA5',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  zoneItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderLeftWidth: 0,
  },
  zoneItemSelected: {
    borderLeftWidth: 3,
    borderLeftColor: '#4A6FA5',
  },
  zoneItemContent: {
    flexDirection: 'row',
    padding: 12,
  },
  zoneIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  zoneIconActive: {
    backgroundColor: '#4A6FA5',
  },
  zoneIconInactive: {
    backgroundColor: '#F1F5F9',
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 2,
  },
  zoneInactiveName: {
    color: '#64748B',
  },
  zoneAddress: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  zoneRadius: {
    fontSize: 12,
    color: '#94A3B8',
  },
  zoneActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A9D8F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  saveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
    color: '#64748B',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  detailInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 8,
  },
  radiusInputContainer: {
    flex: 1,
  },
  radiusSlider: {
    width: '100%',
    height: 40,
  },
  radiusValue: {
    fontSize: 14,
    color: '#0F172A',
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#0F172A',
    marginRight: 8,
  },
  alertSettingsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    marginBottom: 16,
  },
  alertSettingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  alertSettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertSettingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertSettingText: {
    fontSize: 14,
    color: '#0F172A',
    marginLeft: 8,
  },
  deleteContainer: {
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E63946',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalContent: {
    padding: 16,
    maxHeight: Platform.OS === 'ios' ? height * 0.5 : height * 0.6,
  },
  modalInstructions: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalMapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  modalMap: {
    ...StyleSheet.absoluteFillObject,
  },
  useLocationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  useLocationButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  formContainer: {
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  formInput: {
    fontSize: 14,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButton: {
    padding: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#64748B',
  },
  saveNewButton: {
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveNewButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  saveNewButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default SafeZoneSettingsScreen;