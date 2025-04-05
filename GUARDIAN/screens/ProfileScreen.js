import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API URL
const API_URL = 'https://medai-guardian-api.herokuapp.com';

// Dummy user data
const DUMMY_USER = {
    id: 'user_123',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@gmail.com',
    phone: '+91 98765 43210',
    avatar: null,
    role: 'caregiver',
    notificationPreferences: {
      emergencyAlerts: true,
      medicationReminders: true,
      safeZoneAlerts: true,
      dailyUpdates: false,
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true
    },
    connectedPatients: 1,
    emergencyContacts: [
      {
        id: 'contact_1',
        name: 'Anjali Sharma',
        relationship: 'Spouse',
        phone: '+91 99001 23456',
        isEmergencyContact: true
      },
      {
        id: 'contact_2',
        name: 'Vikram Sharma',
        relationship: 'Son',
        phone: '+91 98452 67890',
        isEmergencyContact: true
      }
    ]
  };

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [updatedUser, setUpdatedUser] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [newContact, setNewContact] = useState({
    name: '',
    relationship: '',
    phone: '',
    isEmergencyContact: true
  });
  
  // Fetch user data
  const fetchUserData = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an actual API call
      // const response = await axios.get(`${API_URL}/api/user/profile`);
      // setUser(response.data);
      
      // Using dummy data for development
      setTimeout(() => {
        setUser(DUMMY_USER);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load user profile. Please try again.');
    }
  };
  
  // Load user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);
  
  // Enter edit mode
  const handleEdit = () => {
    setUpdatedUser({...user});
    setEditMode(true);
  };
  
  // Save profile changes
  const handleSave = async () => {
    if (!updatedUser) return;
    
    setSaving(true);
    
    try {
      // Validate phone number
      const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
      if (!phoneRegex.test(updatedUser.phone)) {
        Alert.alert('Error', 'Please enter a valid phone number in the format (555) 123-4567');
        setSaving(false);
        return;
      }
      
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updatedUser.email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        setSaving(false);
        return;
      }
      
      // In a real app, this would be an API call
      // await axios.put(`${API_URL}/api/user/profile`, updatedUser);
      
      // Simulate API call
      setTimeout(() => {
        setUser(updatedUser);
        setEditMode(false);
        setSaving(false);
        Alert.alert('Success', 'Profile updated successfully');
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaving(false);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };
  
  // Cancel edit mode
  const handleCancel = () => {
    setEditMode(false);
  };
  
  // Toggle notification preference
  const toggleNotificationPreference = (preference) => {
    if (!editMode || !updatedUser) return;
    
    setUpdatedUser({
      ...updatedUser,
      notificationPreferences: {
        ...updatedUser.notificationPreferences,
        [preference]: !updatedUser.notificationPreferences[preference]
      }
    });
  };
  
  // Pick an image from library
  const pickImage = async () => {
    if (!editMode) return;
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permission to change your profile picture.');
      return;
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setUpdatedUser({
        ...updatedUser,
        avatar: uri
      });
    }
  };
  
  // Open contact modal for editing
  const handleEditContact = (contact) => {
    setSelectedContact(contact);
    setNewContact({...contact});
    setShowContactModal(true);
  };
  
  // Open contact modal for adding new
  const handleAddContact = () => {
    setSelectedContact(null);
    setNewContact({
      name: '',
      relationship: '',
      phone: '',
      isEmergencyContact: true
    });
    setShowContactModal(true);
  };
  
  // Save contact changes
  const handleSaveContact = () => {
    // Validate input
    if (!newContact.name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    
    if (!newContact.relationship.trim()) {
      Alert.alert('Error', 'Please enter a relationship');
      return;
    }
    
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    if (!phoneRegex.test(newContact.phone)) {
      Alert.alert('Error', 'Please enter a valid phone number in the format (555) 123-4567');
      return;
    }
    
    if (selectedContact) {
      // Update existing contact
      const updatedContacts = updatedUser.emergencyContacts.map(contact => 
        contact.id === selectedContact.id ? {...newContact, id: contact.id} : contact
      );
      
      setUpdatedUser({
        ...updatedUser,
        emergencyContacts: updatedContacts
      });
    } else {
      // Add new contact
      const newId = `contact_${Date.now()}`;
      setUpdatedUser({
        ...updatedUser,
        emergencyContacts: [
          ...updatedUser.emergencyContacts,
          {...newContact, id: newId}
        ]
      });
    }
    
    setShowContactModal(false);
  };
  
  // Delete a contact
  const handleDeleteContact = () => {
    if (!selectedContact) return;
    
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to remove ${selectedContact.name} from your emergency contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            const updatedContacts = updatedUser.emergencyContacts.filter(
              contact => contact.id !== selectedContact.id
            );
            
            setUpdatedUser({
              ...updatedUser,
              emergencyContacts: updatedContacts
            });
            
            setShowContactModal(false);
          }
        }
      ]
    );
  };
  
  // Sign out
  const handleSignOut = async () => {
    Alert.alert(
      'Confirm Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear auth token
              await AsyncStorage.removeItem('authToken');
              
              // In a real app, call logout endpoint
              // await axios.post(`${API_URL}/api/auth/logout`);
              
              // Navigate to sign in screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'SignIn' }],
              });
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FA5" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
  
  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#E63946" />
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchUserData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Use the active user data depending on mode
  const activeUser = editMode ? updatedUser : user;
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeaderContainer}>
          <View style={styles.profileHeader}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={editMode ? pickImage : undefined}
              disabled={!editMode}
            >
              {activeUser.avatar ? (
                <Image 
                  source={{ uri: activeUser.avatar }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {activeUser.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                  {editMode && (
                    <View style={styles.editAvatarIcon}>
                      <Ionicons name="camera" size={16} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              )}
              {editMode && activeUser.avatar && (
                <View style={styles.editAvatarIcon}>
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
            
            <Text style={styles.profileName}>{activeUser.name}</Text>
            <Text style={styles.profileRole}>{activeUser.role === 'caregiver' ? 'Caregiver' : 'Bystander'}</Text>
          </View>
          
          {!editMode ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEdit}
            >
              <Ionicons name="create" size={20} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editActionButton, styles.cancelButton]}
                onPress={handleCancel}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.editActionButton, styles.saveButton]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Personal Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="mail" size={20} color="#4A6FA5" />
                <Text style={styles.infoLabel}>Email</Text>
              </View>
              {editMode ? (
                <TextInput
                  style={styles.infoInput}
                  value={activeUser.email}
                  onChangeText={(text) => setUpdatedUser({...updatedUser, email: text})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.infoValue}>{activeUser.email}</Text>
              )}
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="call" size={20} color="#4A6FA5" />
                <Text style={styles.infoLabel}>Phone</Text>
              </View>
              {editMode ? (
                <TextInput
                  style={styles.infoInput}
                  value={activeUser.phone}
                  onChangeText={(text) => setUpdatedUser({...updatedUser, phone: text})}
                  keyboardType="phone-pad"
                  placeholder="(555) 123-4567"
                />
              ) : (
                <Text style={styles.infoValue}>{activeUser.phone}</Text>
              )}
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="people" size={20} color="#4A6FA5" />
                <Text style={styles.infoLabel}>Connected Patients</Text>
              </View>
              <Text style={styles.infoValue}>{activeUser.connectedPatients}</Text>
            </View>
          </View>
        </View>
        
        {/* Notification Preferences */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          
          <View style={styles.preferencesContainer}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <Ionicons name="warning" size={20} color="#E63946" />
                <Text style={styles.preferenceText}>Emergency Alerts</Text>
              </View>
              <Switch
                value={activeUser.notificationPreferences.emergencyAlerts}
                onValueChange={() => toggleNotificationPreference('emergencyAlerts')}
                disabled={!editMode}
                trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                thumbColor={activeUser.notificationPreferences.emergencyAlerts ? "#4A6FA5" : "#CBD5E1"}
              />
            </View>
            
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <Ionicons name="medkit" size={20} color="#2A9D8F" />
                <Text style={styles.preferenceText}>Medication Reminders</Text>
              </View>
              <Switch
                value={activeUser.notificationPreferences.medicationReminders}
                onValueChange={() => toggleNotificationPreference('medicationReminders')}
                disabled={!editMode}
                trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                thumbColor={activeUser.notificationPreferences.medicationReminders ? "#4A6FA5" : "#CBD5E1"}
              />
            </View>
            
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <Ionicons name="location" size={20} color="#4A6FA5" />
                <Text style={styles.preferenceText}>Safe Zone Alerts</Text>
              </View>
              <Switch
                value={activeUser.notificationPreferences.safeZoneAlerts}
                onValueChange={() => toggleNotificationPreference('safeZoneAlerts')}
                disabled={!editMode}
                trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                thumbColor={activeUser.notificationPreferences.safeZoneAlerts ? "#4A6FA5" : "#CBD5E1"}
              />
            </View>
            
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <Ionicons name="calendar" size={20} color="#F9A826" />
                <Text style={styles.preferenceText}>Daily Updates</Text>
              </View>
              <Switch
                value={activeUser.notificationPreferences.dailyUpdates}
                onValueChange={() => toggleNotificationPreference('dailyUpdates')}
                disabled={!editMode}
                trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                thumbColor={activeUser.notificationPreferences.dailyUpdates ? "#4A6FA5" : "#CBD5E1"}
              />
            </View>
            
            <View style={styles.divider} />
            
            <Text style={styles.subsectionTitle}>Notification Channels</Text>
            
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <Ionicons name="mail" size={20} color="#4A6FA5" />
                <Text style={styles.preferenceText}>Email Notifications</Text>
              </View>
              <Switch
                value={activeUser.notificationPreferences.emailNotifications}
                onValueChange={() => toggleNotificationPreference('emailNotifications')}
                disabled={!editMode}
                trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                thumbColor={activeUser.notificationPreferences.emailNotifications ? "#4A6FA5" : "#CBD5E1"}
              />
            </View>
            
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <Ionicons name="chatbubble" size={20} color="#4A6FA5" />
                <Text style={styles.preferenceText}>SMS Notifications</Text>
              </View>
              <Switch
                value={activeUser.notificationPreferences.smsNotifications}
                onValueChange={() => toggleNotificationPreference('smsNotifications')}
                disabled={!editMode}
                trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                thumbColor={activeUser.notificationPreferences.smsNotifications ? "#4A6FA5" : "#CBD5E1"}
              />
            </View>
            
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <Ionicons name="notifications" size={20} color="#4A6FA5" />
                <Text style={styles.preferenceText}>Push Notifications</Text>
              </View>
              <Switch
                value={activeUser.notificationPreferences.pushNotifications}
                onValueChange={() => toggleNotificationPreference('pushNotifications')}
                disabled={!editMode}
                trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                thumbColor={activeUser.notificationPreferences.pushNotifications ? "#4A6FA5" : "#CBD5E1"}
              />
            </View>
          </View>
        </View>
        
        {/* Emergency Contacts */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            {editMode && (
              <TouchableOpacity
                style={styles.addContactButton}
                onPress={handleAddContact}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addContactButtonText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.contactsContainer}>
            {activeUser.emergencyContacts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No emergency contacts</Text>
                {editMode && (
                  <Text style={styles.emptySubText}>Add emergency contacts who should be notified in case of emergencies</Text>
                )}
              </View>
            ) : (
              activeUser.emergencyContacts.map(contact => (
                <View key={contact.id} style={styles.contactCard}>
                  <View style={styles.contactInfo}>
                    <View style={styles.contactHeader}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      {contact.isEmergencyContact && (
                        <View style={styles.emergencyBadge}>
                          <Text style={styles.emergencyBadgeText}>Emergency</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                    
                    <View style={styles.contactPhone}>
                      <Ionicons name="call" size={16} color="#64748B" />
                      <Text style={styles.contactPhoneText}>{contact.phone}</Text>
                    </View>
                  </View>
                  
                  {editMode && (
                    <TouchableOpacity
                      style={styles.editContactButton}
                      onPress={() => handleEditContact(contact)}
                    >
                      <Ionicons name="create" size={20} color="#4A6FA5" />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
        
        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out" size={20} color="#E63946" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Contact Modal */}
      <Modal
        visible={showContactModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContactModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedContact ? 'Edit Contact' : 'Add Contact'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowContactModal(false)}
              >
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={newContact.name}
                  onChangeText={(text) => setNewContact({...newContact, name: text})}
                  placeholder="Enter contact name"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Relationship</Text>
                <TextInput
                  style={styles.formInput}
                  value={newContact.relationship}
                  onChangeText={(text) => setNewContact({...newContact, relationship: text})}
                  placeholder="E.g. Spouse, Child, Friend"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={newContact.phone}
                  onChangeText={(text) => setNewContact({...newContact, phone: text})}
                  placeholder="(555) 123-4567"
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.formGroup}>
                <View style={styles.emergencyContactRow}>
                  <Text style={styles.formLabel}>Emergency Contact</Text>
                  <Switch
                    value={newContact.isEmergencyContact}
                    onValueChange={(value) => setNewContact({...newContact, isEmergencyContact: value})}
                    trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                    thumbColor={newContact.isEmergencyContact ? "#4A6FA5" : "#CBD5E1"}
                  />
                </View>
                <Text style={styles.helperText}>
                  Emergency contacts will be notified in case of medical emergencies
                </Text>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              {selectedContact && (
                <TouchableOpacity
                  style={styles.deleteContactButton}
                  onPress={handleDeleteContact}
                >
                  <Ionicons name="trash" size={20} color="#E63946" />
                  <Text style={styles.deleteContactText}>Delete</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.saveContactButton}
                onPress={handleSaveContact}
              >
                <Text style={styles.saveContactText}>Save</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  profileHeaderContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4A6FA5',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4A6FA520',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4A6FA5',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4A6FA5',
  },
  editAvatarIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4A6FA5',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: '#64748B',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  editActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 8,
    minWidth: 100,
  },
  cancelButton: {
    backgroundColor: '#64748B',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#2A9D8F',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
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
    marginBottom: 16,
  },
  infoContainer: {
    marginBottom: 8,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#0F172A',
    paddingHorizontal: 8,
  },
  infoInput: {
    fontSize: 16,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#F8F9FA',
  },
  preferencesContainer: {
    marginBottom: 8,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceText: {
    fontSize: 16,
    color: '#0F172A',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  addContactButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  contactsContainer: {
    marginBottom: 8,
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
  contactCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginRight: 8,
  },
  emergencyBadge: {
    backgroundColor: '#E6394620',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  emergencyBadgeText: {
    fontSize: 12,
    color: '#E63946',
    fontWeight: '500',
  },
  contactRelationship: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  contactPhone: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactPhoneText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  editContactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutContainer: {
    alignItems: 'center',
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E63946',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E63946',
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
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 16,
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
    fontSize: 16,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F8F9FA',
  },
  emergencyContactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  deleteContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginRight: 'auto',
  },
  deleteContactText: {
    fontSize: 14,
    color: '#E63946',
    marginLeft: 8,
  },
  saveContactButton: {
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveContactText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ProfileScreen;