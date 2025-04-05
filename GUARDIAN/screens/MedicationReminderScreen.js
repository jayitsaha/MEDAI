import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';
import axios from 'axios';

// API URL
const API_URL = 'https://medai-guardian-api.herokuapp.com';

// Dummy patient medication data
const DUMMY_MEDICATION_DATA = {
    patientId: '1',
    patientName: 'Mohan Patel',
    medications: [
      { 
        id: '1', 
        name: 'Donepezil (Aricept)', 
        dosage: '5mg', 
        time: '8:00 AM', 
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        notes: 'Take with food after breakfast',
        remaining: 12, 
        total: 30,
        refillAlert: true,
        refillThreshold: 5
      },
      { 
        id: '2', 
        name: 'Memantine (Admenta)', 
        dosage: '10mg', 
        time: '7:00 PM', 
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        notes: 'Take after dinner',
        remaining: 5, 
        total: 30,
        refillAlert: true,
        refillThreshold: 5
      },
      { 
        id: '3', 
        name: 'Methylcobalamin', 
        dosage: '1000mcg', 
        time: '12:00 PM', 
        days: ['Monday', 'Wednesday', 'Friday'],
        notes: 'Take with lunch',
        remaining: 20, 
        total: 60,
        refillAlert: true,
        refillThreshold: 10
      }
    ],
    history: {
      '2023-05-01': [
        { id: '1', name: 'Donepezil (Aricept)', taken: true, time: '8:05 AM' },
        { id: '2', name: 'Memantine (Admenta)', taken: true, time: '7:12 PM' }
      ],
      '2023-05-02': [
        { id: '1', name: 'Donepezil (Aricept)', taken: true, time: '8:10 AM' },
        { id: '2', name: 'Memantine (Admenta)', taken: false, time: null },
        { id: '3', name: 'Methylcobalamin', taken: true, time: '12:30 PM' }
      ],
      '2023-05-03': [
        { id: '1', name: 'Donepezil (Aricept)', taken: true, time: '7:55 AM' },
        { id: '2', name: 'Memantine (Admenta)', taken: true, time: '7:00 PM' }
      ],
      '2023-05-04': [
        { id: '1', name: 'Donepezil (Aricept)', taken: true, time: '8:15 AM' },
        { id: '2', name: 'Memantine (Admenta)', taken: true, time: '7:20 PM' },
        { id: '3', name: 'Methylcobalamin', taken: true, time: '12:05 PM' }
      ],
      '2023-05-05': [
        { id: '1', name: 'Donepezil (Aricept)', taken: true, time: '8:00 AM' },
        { id: '2', name: 'Memantine (Admenta)', taken: true, time: '7:10 PM' }
      ],
      '2023-05-06': [
        { id: '1', name: 'Donepezil (Aricept)', taken: false, time: null },
        { id: '2', name: 'Memantine (Admenta)', taken: true, time: '7:05 PM' },
        { id: '3', name: 'Methylcobalamin', taken: false, time: null }
      ],
      '2023-05-07': [
        { id: '1', name: 'Donepezil (Aricept)', taken: true, time: '8:30 AM' },
        { id: '2', name: 'Memantine (Admenta)', taken: true, time: '7:15 PM' }
      ]
    }
  };
// Get today's date in YYYY-MM-DD format
const getToday = () => {
  const date = new Date();
  return date.toISOString().split('T')[0];
};

const MedicationReminderScreen = ({ route, navigation }) => {
  const { patientId } = route.params;
  const [loading, setLoading] = useState(true);
  const [medicationData, setMedicationData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);

  // Calendar marked dates
  const [markedDates, setMarkedDates] = useState({});

  // For add/edit medication form
  const [medicationForm, setMedicationForm] = useState({
    name: '',
    dosage: '',
    time: '',
    days: [],
    notes: '',
    remaining: 0,
    total: 0,
    refillAlert: true,
    refillThreshold: 5
  });

  // Fetch medication data
  const fetchMedicationData = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an actual API call
      // const response = await axios.get(`${API_URL}/api/patients/${patientId}/medications`);
      // setMedicationData(response.data);
      
      // Using dummy data for development
      setTimeout(() => {
        setMedicationData(DUMMY_MEDICATION_DATA);
        setLoading(false);
        generateMarkedDates(DUMMY_MEDICATION_DATA.history);
      }, 1000);
    } catch (error) {
      console.error('Error fetching medication data:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load medication data. Please try again.');
    }
  };

  // Generate marked dates for calendar
  const generateMarkedDates = (history) => {
    const marked = {};
    
    Object.keys(history).forEach(date => {
      const allTaken = history[date].every(med => med.taken);
      const someTaken = history[date].some(med => med.taken);
      
      let dotColor = '';
      if (allTaken) {
        dotColor = '#2A9D8F'; // All medications taken
      } else if (someTaken) {
        dotColor = '#F9A826'; // Some medications taken
      } else {
        dotColor = '#E63946'; // No medications taken
      }
      
      marked[date] = {
        marked: true,
        dotColor: dotColor
      };
    });
    
    // Mark today's date
    const today = getToday();
    marked[today] = {
      ...marked[today],
      selected: true,
      selectedColor: '#4A6FA520'
    };
    
    setMarkedDates(marked);
  };

  // Load medication data on component mount
  useEffect(() => {
    fetchMedicationData();
  }, [patientId]);

  // Open medication form modal for editing
  const handleEditMedication = (medication) => {
    setSelectedMedication(medication);
    setMedicationForm({
      name: medication.name,
      dosage: medication.dosage,
      time: medication.time,
      days: [...medication.days],
      notes: medication.notes || '',
      remaining: medication.remaining,
      total: medication.total,
      refillAlert: medication.refillAlert,
      refillThreshold: medication.refillThreshold
    });
    setEditModalVisible(true);
  };

  // Open medication form modal for adding new
  const handleAddMedication = () => {
    setSelectedMedication(null);
    setMedicationForm({
      name: '',
      dosage: '',
      time: '',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      notes: '',
      remaining: 0,
      total: 0,
      refillAlert: true,
      refillThreshold: 5
    });
    setEditModalVisible(true);
  };

  // Handle day selection in medication form
  const toggleDay = (day) => {
    if (medicationForm.days.includes(day)) {
      setMedicationForm({
        ...medicationForm,
        days: medicationForm.days.filter(d => d !== day)
      });
    } else {
      setMedicationForm({
        ...medicationForm,
        days: [...medicationForm.days, day]
      });
    }
  };

  // Save medication (add or edit)
  const handleSaveMedication = () => {
    // Basic validation
    if (!medicationForm.name || !medicationForm.dosage || !medicationForm.time) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    
    if (medicationForm.days.length === 0) {
      Alert.alert('Error', 'Please select at least one day of the week.');
      return;
    }
    
    // In a real app, this would make an API call to save the data
    // For this demo, we'll just update our local state
    
    const updatedMedications = [...medicationData.medications];
    
    if (selectedMedication) {
      // Edit existing medication
      const index = updatedMedications.findIndex(med => med.id === selectedMedication.id);
      if (index !== -1) {
        updatedMedications[index] = {
          ...selectedMedication,
          ...medicationForm
        };
      }
    } else {
      // Add new medication
      const newId = Math.max(...updatedMedications.map(med => parseInt(med.id)), 0) + 1;
      updatedMedications.push({
        id: newId.toString(),
        ...medicationForm
      });
    }
    
    setMedicationData({
      ...medicationData,
      medications: updatedMedications
    });
    
    setEditModalVisible(false);
    Alert.alert('Success', selectedMedication ? 'Medication updated successfully' : 'Medication added successfully');
  };

  // Delete medication
  const handleDeleteMedication = () => {
    if (!selectedMedication) return;
    
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${selectedMedication.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // In a real app, this would make an API call to delete the medication
            const updatedMedications = medicationData.medications.filter(
              med => med.id !== selectedMedication.id
            );
            
            setMedicationData({
              ...medicationData,
              medications: updatedMedications
            });
            
            setEditModalVisible(false);
            Alert.alert('Success', 'Medication deleted successfully');
          }
        }
      ]
    );
  };

  // View medication details
  const handleViewMedication = (medication) => {
    setSelectedMedication(medication);
    setModalVisible(true);
  };

  // Send reminder notification to patient
  const handleSendReminder = (medication) => {
    Alert.alert(
      'Send Reminder',
      `Send a reminder to take ${medication.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          onPress: () => {
            // In a real app, this would make an API call to send a notification
            Alert.alert('Success', `Reminder sent for ${medication.name}`);
          }
        }
      ]
    );
  };

  // Refill medication
  const handleRefillMedication = (medication) => {
    Alert.alert(
      'Refill Medication',
      `Mark ${medication.name} as refilled?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Refill', 
          onPress: () => {
            // In a real app, this would make an API call to update medication count
            const updatedMedications = [...medicationData.medications];
            const index = updatedMedications.findIndex(med => med.id === medication.id);
            
            if (index !== -1) {
              updatedMedications[index] = {
                ...medication,
                remaining: medication.total
              };
              
              setMedicationData({
                ...medicationData,
                medications: updatedMedications
              });
              
              Alert.alert('Success', `${medication.name} marked as refilled`);
            }
          }
        }
      ]
    );
  };

  // Format selected date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Render medication history item
  const renderHistoryItem = ({ item }) => {
    return (
      <View style={styles.historyItem}>
        <View style={styles.historyItemContent}>
          <Text style={styles.historyItemName}>{item.name}</Text>
          {item.taken ? (
            <View style={styles.historyItemStatus}>
              <Text style={styles.historyItemTime}>{item.time}</Text>
              <Ionicons name="checkmark-circle" size={16} color="#2A9D8F" />
            </View>
          ) : (
            <View style={styles.historyItemStatus}>
              <Text style={styles.historyItemSkipped}>Skipped</Text>
              <Ionicons name="close-circle" size={16} color="#E63946" />
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render medication list item
  const renderMedicationItem = ({ item }) => {
    const remainingPercent = (item.remaining / item.total) * 100;
    let statusColor = '#2A9D8F';
    
    if (remainingPercent <= 20) {
      statusColor = '#E63946';
    } else if (remainingPercent <= 40) {
      statusColor = '#F9A826';
    }
    
    return (
      <TouchableOpacity 
        style={styles.medicationItem}
        onPress={() => handleViewMedication(item)}
      >
        <View style={styles.medicationItemContent}>
          <View style={styles.medicationItemHeader}>
            <Text style={styles.medicationItemName}>{item.name}</Text>
            <Text style={styles.medicationItemDosage}>{item.dosage}</Text>
          </View>
          
          <Text style={styles.medicationItemTime}>{item.time}</Text>
          
          <View style={styles.medicationItemFooter}>
            <View style={styles.medicationProgressContainer}>
              <View style={styles.medicationProgress}>
                <View 
                  style={[
                    styles.medicationProgressFill, 
                    { 
                      width: `${remainingPercent}%`,
                      backgroundColor: statusColor
                    }
                  ]} 
                />
              </View>
              <Text style={styles.medicationRemaining}>
                {item.remaining}/{item.total}
              </Text>
            </View>
            
            {item.remaining <= item.refillThreshold && (
              <TouchableOpacity 
                style={styles.refillButton}
                onPress={() => handleRefillMedication(item)}
              >
                <Text style={styles.refillButtonText}>Refill</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.reminderButton}
          onPress={() => handleSendReminder(item)}
        >
          <Ionicons name="notifications" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FA5" />
        <Text style={styles.loadingText}>Loading medication data...</Text>
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
        <Text style={styles.headerTitle}>Medication Reminder</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Calendar Section */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            markedDates={markedDates}
            onDayPress={(day) => {
              const updatedMarkedDates = { ...markedDates };
              
              // Remove previous selection
              Object.keys(updatedMarkedDates).forEach(date => {
                if (updatedMarkedDates[date].selected) {
                  updatedMarkedDates[date] = {
                    ...updatedMarkedDates[date],
                    selected: false
                  };
                }
              });
              
              // Add new selection
              updatedMarkedDates[day.dateString] = {
                ...updatedMarkedDates[day.dateString],
                selected: true,
                selectedColor: '#4A6FA520'
              };
              
              setMarkedDates(updatedMarkedDates);
              setSelectedDate(day.dateString);
            }}
            theme={{
              todayTextColor: '#4A6FA5',
              arrowColor: '#4A6FA5',
              dotColor: '#4A6FA5',
              selectedDayBackgroundColor: '#4A6FA5',
              monthTextColor: '#0F172A',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '500',
            }}
          />
        </View>

        {/* Medication History Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>History for {formatDate(selectedDate)}</Text>
          </View>
          
          {medicationData.history[selectedDate] ? (
            <FlatList
              data={medicationData.history[selectedDate]}
              renderItem={renderHistoryItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.historyList}
            />
          ) : (
            <View style={styles.emptyHistoryContainer}>
              <Text style={styles.emptyHistoryText}>No medication history for this date</Text>
            </View>
          )}
        </View>

        {/* Medications Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medication Schedule</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddMedication}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={medicationData.medications}
            renderItem={renderMedicationItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.medicationList}
          />
        </View>
      </ScrollView>

      {/* Medication Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Medication Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            
            {selectedMedication && (
              <ScrollView style={styles.modalScrollView}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedMedication.name}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dosage:</Text>
                  <Text style={styles.detailValue}>{selectedMedication.dosage}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>{selectedMedication.time}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Days:</Text>
                  <Text style={styles.detailValue}>{selectedMedication.days.join(', ')}</Text>
                </View>
                
                {selectedMedication.notes && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Notes:</Text>
                    <Text style={styles.detailValue}>{selectedMedication.notes}</Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Remaining:</Text>
                  <Text style={styles.detailValue}>{selectedMedication.remaining} of {selectedMedication.total}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Refill Alert:</Text>
                  <Text style={styles.detailValue}>
                    {selectedMedication.refillAlert ? `Yes, at ${selectedMedication.refillThreshold} remaining` : 'No'}
                  </Text>
                </View>
                
                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.editButton]}
                    onPress={() => {
                      setModalVisible(false);
                      handleEditMedication(selectedMedication);
                    }}
                  >
                    <Ionicons name="create" size={20} color="#FFFFFF" />
                    <Text style={styles.modalButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.sendReminderButton]}
                    onPress={() => {
                      setModalVisible(false);
                      handleSendReminder(selectedMedication);
                    }}
                  >
                    <Ionicons name="notifications" size={20} color="#FFFFFF" />
                    <Text style={styles.modalButtonText}>Send Reminder</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Add/Edit Medication Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedMedication ? 'Edit Medication' : 'Add Medication'}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={medicationForm.name}
                  onChangeText={(text) => setMedicationForm({...medicationForm, name: text})}
                  placeholder="Medication name"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Dosage *</Text>
                <TextInput
                  style={styles.formInput}
                  value={medicationForm.dosage}
                  onChangeText={(text) => setMedicationForm({...medicationForm, dosage: text})}
                  placeholder="e.g. 5mg"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Time *</Text>
                <TextInput
                  style={styles.formInput}
                  value={medicationForm.time}
                  onChangeText={(text) => setMedicationForm({...medicationForm, time: text})}
                  placeholder="e.g. 8:00 AM"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Days of the Week *</Text>
                <View style={styles.daysContainer}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayButton,
                        medicationForm.days.includes(day) && styles.dayButtonSelected
                      ]}
                      onPress={() => toggleDay(day)}
                    >
                      <Text
                        style={[
                          styles.dayButtonText,
                          medicationForm.days.includes(day) && styles.dayButtonTextSelected
                        ]}
                      >
                        {day.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea]}
                  value={medicationForm.notes}
                  onChangeText={(text) => setMedicationForm({...medicationForm, notes: text})}
                  placeholder="Additional instructions"
                  multiline={true}
                  numberOfLines={3}
                />
              </View>
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, {flex: 1, marginRight: 8}]}>
                  <Text style={styles.formLabel}>Remaining</Text>
                  <TextInput
                    style={styles.formInput}
                    value={medicationForm.remaining.toString()}
                    onChangeText={(text) => setMedicationForm({...medicationForm, remaining: parseInt(text) || 0})}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                
                <View style={[styles.formGroup, {flex: 1, marginLeft: 8}]}>
                  <Text style={styles.formLabel}>Total</Text>
                  <TextInput
                    style={styles.formInput}
                    value={medicationForm.total.toString()}
                    onChangeText={(text) => setMedicationForm({...medicationForm, total: parseInt(text) || 0})}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Refill Alert</Text>
                <View style={styles.switchContainer}>
                  <Switch
                    value={medicationForm.refillAlert}
                    onValueChange={(value) => setMedicationForm({...medicationForm, refillAlert: value})}
                    trackColor={{ false: "#E2E8F0", true: "#4A6FA540" }}
                    thumbColor={medicationForm.refillAlert ? "#4A6FA5" : "#CBD5E1"}
                  />
                  <Text style={styles.switchLabel}>
                    {medicationForm.refillAlert ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
              
              {medicationForm.refillAlert && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Refill Threshold</Text>
                  <TextInput
                    style={styles.formInput}
                    value={medicationForm.refillThreshold.toString()}
                    onChangeText={(text) => setMedicationForm({...medicationForm, refillThreshold: parseInt(text) || 0})}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={styles.helperText}>Alert when remaining pills reach this number</Text>
                </View>
              )}
              
              <View style={styles.modalButtonsContainer}>
                {selectedMedication && (
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={handleDeleteMedication}
                  >
                    <Ionicons name="trash" size={20} color="#FFFFFF" />
                    <Text style={styles.modalButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveMedication}
                >
                  <Ionicons name="save" size={20} color="#FFFFFF" />
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
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
  emptyHistoryContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  historyList: {
    paddingBottom: 8,
  },
  historyItem: {
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  historyItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
  },
  historyItemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemTime: {
    fontSize: 14,
    color: '#2A9D8F',
    marginRight: 4,
  },
  historyItemSkipped: {
    fontSize: 14,
    color: '#E63946',
    marginRight: 4,
  },
  medicationList: {
    paddingBottom: 8,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 12,
  },
  medicationItemContent: {
    flex: 1,
  },
  medicationItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  medicationItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  medicationItemDosage: {
    fontSize: 14,
    color: '#64748B',
  },
  medicationItemTime: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  medicationItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicationProgressContainer: {
    flex: 1,
  },
  medicationProgress: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
    width: '80%',
  },
  medicationProgressFill: {
    height: '100%',
  },
  medicationRemaining: {
    fontSize: 12,
    color: '#64748B',
  },
  refillButton: {
    backgroundColor: '#F9A82620',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  refillButtonText: {
    fontSize: 12,
    color: '#F9A826',
    fontWeight: '500',
  },
  reminderButton: {
    backgroundColor: '#4A6FA5',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
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
  modalScrollView: {
    padding: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#0F172A',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    flex: 1,
  },
  editButton: {
    backgroundColor: '#4A6FA5',
    marginRight: 8,
  },
  sendReminderButton: {
    backgroundColor: '#F9A826',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#2A9D8F',
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#E63946',
    marginRight: 8,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 16,
    color: '#0F172A',
  },
  formTextarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  dayButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    margin: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayButtonSelected: {
    backgroundColor: '#4A6FA520',
    borderColor: '#4A6FA5',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#64748B',
  },
  dayButtonTextSelected: {
    color: '#4A6FA5',
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#0F172A',
  },
  helperText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
});

export default MedicationReminderScreen;