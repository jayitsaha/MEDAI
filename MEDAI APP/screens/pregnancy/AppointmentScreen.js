// src/screens/pregnancy/AppointmentScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';

// Sample recommended checkups by week
const RECOMMENDED_CHECKUPS = [
  {
    id: 'rec-1',
    title: 'First Prenatal Visit',
    description: 'Complete medical history, blood work, physical exam',
    weekRange: '8-12',
    type: 'standard'
  },
  {
    id: 'rec-2',
    title: 'NT Scan',
    description: 'Nuchal translucency ultrasound',
    weekRange: '11-14',
    type: 'screening'
  },
  {
    id: 'rec-3',
    title: 'Monthly Checkup',
    description: 'Weight, blood pressure, fundal height measurement',
    weekRange: '16-28',
    type: 'standard'
  },
  {
    id: 'rec-4',
    title: 'Glucose Screening',
    description: 'Test for gestational diabetes',
    weekRange: '24-28',
    type: 'screening'
  },
  {
    id: 'rec-5',
    title: 'Biweekly Checkup',
    description: 'More frequent monitoring of baby and mother',
    weekRange: '28-36',
    type: 'standard'
  },
  {
    id: 'rec-6',
    title: 'Group B Strep Test',
    description: 'Vaginal and rectal swab',
    weekRange: '35-37',
    type: 'screening'
  },
  {
    id: 'rec-7',
    title: 'Weekly Checkup',
    description: 'Close monitoring as due date approaches',
    weekRange: '36-40',
    type: 'standard'
  }
];

const AppointmentScreen = () => {
  const [appointments, setAppointments] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState({});
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [showRecommended, setShowRecommended] = useState(false);
  
  // Form state for new appointment
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    doctorName: '',
    location: '',
    notes: '',
    time: new Date(),
    showTimePicker: false
  });
  
  useEffect(() => {
    loadAppointments();
  }, []);
  
  // Load appointments from storage
  const loadAppointments = async () => {
    try {
      const savedAppointments = await AsyncStorage.getItem('appointments');
      if (savedAppointments) {
        const appointmentsData = JSON.parse(savedAppointments);
        setAppointments(appointmentsData);
        updateMarkedDates(appointmentsData);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };
  
  // Save appointments to storage
  const saveAppointments = async (appointmentsData) => {
    try {
      await AsyncStorage.setItem('appointments', JSON.stringify(appointmentsData));
    } catch (error) {
      console.error('Error saving appointments:', error);
    }
  };
  
  // Update marked dates for calendar
  const updateMarkedDates = (appointmentsData) => {
    const dates = {};
    
    appointmentsData.forEach(appointment => {
      dates[appointment.date] = {
        marked: true,
        dotColor: '#FF69B4'
      };
    });
    
    setMarkedDates(dates);
  };
  
  // Open appointment form
  const openAppointmentForm = (date) => {
    setSelectedDate(date);
    setNewAppointment({
      title: '',
      doctorName: '',
      location: '',
      notes: '',
      time: new Date(),
      showTimePicker: false
    });
    setModalVisible(true);
  };
  
  // Add new appointment
  const addAppointment = () => {
    if (!newAppointment.title.trim()) {
      Alert.alert('Error', 'Please enter an appointment title');
      return;
    }
    
    const hours = newAppointment.time.getHours().toString().padStart(2, '0');
    const minutes = newAppointment.time.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    const appointment = {
      id: Date.now().toString(),
      title: newAppointment.title,
      doctorName: newAppointment.doctorName,
      location: newAppointment.location,
      notes: newAppointment.notes,
      date: selectedDate,
      time: timeString,
      timestamp: new Date().toISOString()
    };
    
    const updatedAppointments = [...appointments, appointment];
    setAppointments(updatedAppointments);
    saveAppointments(updatedAppointments);
    updateMarkedDates(updatedAppointments);
    
    // Schedule reminder notification
    scheduleAppointmentReminder(appointment);
    
    setModalVisible(false);
  };
  
  // Delete appointment
  const deleteAppointment = (id) => {
    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to delete this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            const updatedAppointments = appointments.filter(
              appointment => appointment.id !== id
            );
            setAppointments(updatedAppointments);
            saveAppointments(updatedAppointments);
            updateMarkedDates(updatedAppointments);
          }
        }
      ]
    );
  };
  
  // Schedule appointment reminder notification
  const scheduleAppointmentReminder = (appointment) => {
    // In a real app, this would use a notification library to schedule reminders
    // For this demo, we'll just log the scheduled reminder
    console.log(
      `Reminder scheduled for appointment "${appointment.title}" on ${appointment.date} at ${appointment.time}`
    );
  };
  
  // Format date for display
  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Add recommended checkup as appointment
  const addRecommendedCheckup = (checkup) => {
    // Calculate a suitable date for the appointment
    // For demo purposes, we'll set it to 2 weeks from now
    const date = new Date();
    date.setDate(date.getDate() + 14);
    const dateString = date.toISOString().split('T')[0];
    
    // Create appointment from checkup
    const appointment = {
      id: Date.now().toString(),
      title: checkup.title,
      doctorName: '',
      location: '',
      notes: checkup.description,
      date: dateString,
      time: '09:00',
      timestamp: new Date().toISOString()
    };
    
    const updatedAppointments = [...appointments, appointment];
    setAppointments(updatedAppointments);
    saveAppointments(updatedAppointments);
    updateMarkedDates(updatedAppointments);
    
    // Schedule reminder notification
    scheduleAppointmentReminder(appointment);
    
    Alert.alert(
      'Checkup Added',
      `${checkup.title} has been added to your calendar on ${formatDisplayDate(dateString)}.`
    );
  };
  
  // Get appointments for selected date
  const getAppointmentsForDate = (date) => {
    return appointments.filter(appointment => appointment.date === date);
  };
  
  // Render appointment item
  const renderAppointmentItem = ({ item }) => {
    return (
      <View style={styles.appointmentItem}>
        <View style={styles.appointmentTime}>
          <Text style={styles.timeText}>{item.time}</Text>
          <View style={[
            styles.appointmentType,
            {backgroundColor: getTypeColor(item.title, 'light')}
          ]}>
            <Text style={[
              styles.typeText, 
              {color: getTypeColor(item.title, 'dark')}
            ]}>
              {getAppointmentType(item.title)}
            </Text>
          </View>
        </View>
        
        <View style={styles.appointmentContent}>
          <Text style={styles.appointmentTitle}>{item.title}</Text>
          
          {item.doctorName ? (
            <View style={styles.appointmentDetail}>
              <Ionicons name="person" size={16} color="#666" />
              <Text style={styles.detailText}>{item.doctorName}</Text>
            </View>
          ) : null}
          
          {item.location ? (
            <View style={styles.appointmentDetail}>
              <Ionicons name="location" size={16} color="#666" />
              <Text style={styles.detailText}>{item.location}</Text>
            </View>
          ) : null}
          
          {item.notes ? (
            <View style={styles.appointmentDetail}>
              <Ionicons name="document-text" size={16} color="#666" />
              <Text style={styles.detailText}>{item.notes}</Text>
            </View>
          ) : null}
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => deleteAppointment(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Render recommended checkup item
  const renderRecommendedItem = ({ item }) => {
    return (
      <View style={styles.recommendedItem}>
        <View style={styles.recommendedHeader}>
          <Text style={styles.recommendedTitle}>{item.title}</Text>
          <View style={[
            styles.recommendedWeek,
            {backgroundColor: getTypeColor(item.type, 'light')}
          ]}>
            <Text style={[
              styles.weekText,
              {color: getTypeColor(item.type, 'dark')}
            ]}>
              Week {item.weekRange}
            </Text>
          </View>
        </View>
        
        <Text style={styles.recommendedDescription}>
          {item.description}
        </Text>
        
        <TouchableOpacity 
          style={styles.addRecommendedButton}
          onPress={() => addRecommendedCheckup(item)}
        >
          <Text style={styles.addRecommendedText}>Add to Calendar</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Get background color for appointment type
  const getTypeColor = (text, shade) => {
    // Check if the text contains keywords to categorize the appointment
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('screening') || lowerText.includes('scan') || lowerText.includes('test')) {
      return shade === 'light' ? '#E3F2FD' : '#1E88E5';
    } else if (lowerText.includes('checkup') || lowerText.includes('standard') || lowerText.includes('visit')) {
      return shade === 'light' ? '#E8F5E9' : '#43A047';
    } else if (lowerText.includes('specialist') || lowerText.includes('consult')) {
      return shade === 'light' ? '#FFF3E0' : '#FB8C00';
    } else {
      return shade === 'light' ? '#F3E5F5' : '#AB47BC';
    }
  };
  
  // Get appointment type based on title
  const getAppointmentType = (title) => {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('screening') || lowerTitle.includes('scan') || lowerTitle.includes('test')) {
      return 'Screening';
    } else if (lowerTitle.includes('checkup') || lowerTitle.includes('visit')) {
      return 'Checkup';
    } else if (lowerTitle.includes('specialist') || lowerTitle.includes('consult')) {
      return 'Specialist';
    } else {
      return 'Other';
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments</Text>
        
        <View style={styles.viewSelector}>
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === 'calendar' && styles.activeViewButton
            ]}
            onPress={() => setViewMode('calendar')}
          >
            <Ionicons 
              name="calendar" 
              size={20} 
              color={viewMode === 'calendar' ? '#FF69B4' : '#999'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === 'list' && styles.activeViewButton
            ]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons 
              name="list" 
              size={20} 
              color={viewMode === 'list' ? '#FF69B4' : '#999'} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {viewMode === 'calendar' ? (
        <ScrollView>
          <View style={styles.calendarContainer}>
            <Calendar
              markedDates={markedDates}
              onDayPress={(day) => openAppointmentForm(day.dateString)}
              theme={{
                todayTextColor: '#FF69B4',
                selectedDayBackgroundColor: '#FF69B4',
                dotColor: '#FF69B4',
                arrowColor: '#FF69B4',
              }}
            />
          </View>
          
          <View style={styles.upcomingContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
              <TouchableOpacity onPress={() => openAppointmentForm(new Date().toISOString().split('T')[0])}>
                <Ionicons name="add-circle" size={24} color="#FF69B4" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={appointments.sort((a, b) => new Date(a.date) - new Date(b.date))}
              renderItem={renderAppointmentItem}
              keyExtractor={item => item.id}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No upcoming appointments. Tap a date to add one.
                </Text>
              }
              scrollEnabled={false}
            />
          </View>
          
          <View style={styles.recommendedContainer}>
            <TouchableOpacity 
              style={styles.recommendedHeader}
              onPress={() => setShowRecommended(!showRecommended)}
            >
              <Text style={styles.sectionTitle}>Recommended Checkups</Text>
              <Ionicons 
                name={showRecommended ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#666" 
              />
            </TouchableOpacity>
            
            {showRecommended && (
              <FlatList
                data={RECOMMENDED_CHECKUPS}
                renderItem={renderRecommendedItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={appointments.sort((a, b) => new Date(a.date) - new Date(b.date))}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <View style={styles.listDate}>
                <Text style={styles.listDateDay}>
                  {new Date(item.date).getDate()}
                </Text>
                <Text style={styles.listDateMonth}>
                  {new Date(item.date).toLocaleString('default', { month: 'short' })}
                </Text>
              </View>
              
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{item.title}</Text>
                <Text style={styles.listTime}>{item.time}</Text>
                
                {item.location ? (
                  <Text style={styles.listDetail}>{item.location}</Text>
                ) : null}
                
                {item.doctorName ? (
                  <Text style={styles.listDetail}>Dr. {item.doctorName}</Text>
                ) : null}
              </View>
              
              <TouchableOpacity 
                style={styles.listDelete}
                onPress={() => deleteAppointment(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Ionicons name="calendar-outline" size={50} color="#DDD" />
              <Text style={styles.emptyText}>
                No appointments scheduled
              </Text>
              <TouchableOpacity
                style={styles.addFirstButton}
                onPress={() => {
                  openAppointmentForm(new Date().toISOString().split('T')[0]);
                }}
              >
                <Text style={styles.addFirstText}>Add Your First Appointment</Text>
              </TouchableOpacity>
            </View>
          }
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => openAppointmentForm(new Date().toISOString().split('T')[0])}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
              <Text style={styles.addButtonText}>New Appointment</Text>
            </TouchableOpacity>
          }
        />
      )}
      
      {/* Floating action button for calendar view */}
      {viewMode === 'calendar' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => openAppointmentForm(new Date().toISOString().split('T')[0])}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      
      {/* New appointment modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Appointment</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalDate}>
                {selectedDate ? formatDisplayDate(selectedDate) : 'Select a date'}
              </Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newAppointment.title}
                  onChangeText={(text) => setNewAppointment({...newAppointment, title: text})}
                  placeholder="e.g., Regular Checkup, Ultrasound"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Time</Text>
                <TouchableOpacity
                  style={styles.formInput}
                  onPress={() => setNewAppointment({
                    ...newAppointment,
                    showTimePicker: true
                  })}
                >
                  <Text>
                    {newAppointment.time.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </TouchableOpacity>
                
                {newAppointment.showTimePicker && (
                  <DateTimePicker
                    value={newAppointment.time}
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                      setNewAppointment({
                        ...newAppointment,
                        showTimePicker: false,
                        time: selectedTime || newAppointment.time
                      });
                    }}
                  />
                )}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Doctor's Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={newAppointment.doctorName}
                  onChangeText={(text) => setNewAppointment({...newAppointment, doctorName: text})}
                  placeholder="e.g., Dr. Smith"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Location</Text>
                <TextInput
                  style={styles.formInput}
                  value={newAppointment.location}
                  onChangeText={(text) => setNewAppointment({...newAppointment, location: text})}
                  placeholder="e.g., City Hospital"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea]}
                  value={newAppointment.notes}
                  onChangeText={(text) => setNewAppointment({...newAppointment, notes: text})}
                  placeholder="Any special instructions or things to remember"
                  multiline
                  numberOfLines={4}
                />
              </View>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={addAppointment}
              >
                <Text style={styles.saveButtonText}>Save Appointment</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    padding: 3,
  },
  viewButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 17,
  },
  activeViewButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    padding: 10,
  },
  upcomingContainer: {
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  appointmentItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  appointmentTime: {
    width: 80,
    padding: 15,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  appointmentType: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  appointmentContent: {
    flex: 1,
    padding: 15,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  appointmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  deleteButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
  },
  recommendedContainer: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    marginBottom: 30,
  },
  recommendedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  recommendedItem: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  recommendedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  recommendedWeek: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  weekText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recommendedDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  addRecommendedButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF69B4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addRecommendedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  listDate: {
    width: 60,
    backgroundColor: '#FFE4E1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  listDateDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF69B4',
  },
  listDateMonth: {
    fontSize: 14,
    color: '#FF69B4',
  },
  listContent: {
    flex: 1,
    padding: 15,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  listTime: {
    fontSize: 14,
    color: '#FF69B4',
    marginBottom: 10,
  },
  listDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  listDelete: {
    padding: 15,
    justifyContent: 'center',
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  addFirstButton: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 20,
  },
  addFirstText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF69B4',
    margin: 15,
    padding: 12,
    borderRadius: 25,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    padding: 15,
  },
  modalDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF69B4',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  formInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  formTextarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#FF69B4',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppointmentScreen;