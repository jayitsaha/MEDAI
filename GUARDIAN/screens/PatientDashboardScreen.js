import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

// Mock data for patient dashboard
const PATIENT_DATA = {
  id: '1',
  name: 'Mohan Patel',
  age: 72,
  condition: 'Early-stage Alzheimer\'s',
  lastActive: '2 mins ago',
  avatar: null,
  location: {
    latitude: 12.9352,
    longitude: 77.6245,
    address: '45 Koramangala 5th Block, Bangalore, 560095',
    lastUpdated: '2 minutes ago'
  },
  safeZones: [
    {
      id: '1',
      name: 'Home',
      radius: 200, // meters
      coordinates: {
        latitude: 12.9352,
        longitude: 77.6245
      }
    },
    {
      id: '2',
      name: 'Cubbon Park',
      radius: 150, // meters
      coordinates: {
        latitude: 12.9763,
        longitude: 77.5929
      }
    }
  ],
  metrics: {
    wanderingIncidents: {
      total: 3,
      today: 0,
      weekly: 1,
      monthly: 3
    },
    safeZoneTime: {
      today: 92, // percentage
      weekly: 87,
      monthly: 90
    },
    dailyActiveUsage: {
      today: 5.2, // hours
      weekly: 4.8,
      monthly: 5.1
    }
  },
  medications: [
    {
      id: '1',
      name: 'Donepezil (Aricept)',
      dosage: '5mg',
      schedule: ['8:00 AM'],
      remaining: 12,
      total: 30,
      nextDose: '8:00 AM',
      compliance: 85
    },
    {
      id: '2',
      name: 'Memantine (Admenta)',
      dosage: '10mg',
      schedule: ['7:00 PM'],
      remaining: 5,
      total: 30,
      nextDose: '7:00 PM',
      compliance: 90
    },
    {
      id: '3',
      name: 'Methylcobalamin',
      dosage: '1000mcg',
      schedule: ['12:00 PM'],
      remaining: 20,
      total: 60,
      nextDose: '12:00 PM',
      compliance: 95
    }
  ],
  activityHistory: [
    { date: '2023-05-01', safeZonePercentage: 95, activeHours: 5.5 },
    { date: '2023-05-02', safeZonePercentage: 90, activeHours: 4.8 },
    { date: '2023-05-03', safeZonePercentage: 100, activeHours: 5.2 },
    { date: '2023-05-04', safeZonePercentage: 85, activeHours: 4.5 },
    { date: '2023-05-05', safeZonePercentage: 92, activeHours: 5.0 },
    { date: '2023-05-06', safeZonePercentage: 80, activeHours: 4.0 },
    { date: '2023-05-07', safeZonePercentage: 95, activeHours: 5.3 },
  ]
};

const PatientDashboardScreen = ({ route, navigation }) => {
  const { patientId, patientName } = route.params;
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, medication, activity
  
  const mapRef = useRef(null);
  
  // Fetch patient data
  const fetchPatientData = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an actual API call
      // const response = await axios.get(`${API_URL}/api/patients/${patientId}`);
      // setPatient(response.data);
      
      // Using dummy data for development
      setTimeout(() => {
        setPatient(PATIENT_DATA);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load patient data. Please try again.');
    }
  };
  
  // Load patient data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchPatientData();
      return () => {
        // Cleanup if needed
      };
    }, [patientId])
  );
  
  // Navigate to Safe Zone Settings
  const navigateToSafeZoneSettings = () => {
    navigation.navigate('SafeZoneSettings', {
      patientId: patientId
    });
  };
  
  // Navigate to Medication Reminder screen
  const navigateToMedicationReminder = () => {
    navigation.navigate('MedicationReminder', {
      patientId: patientId
    });
  };
  
  // Handle emergency call
  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Assistance',
      'Do you want to report an emergency for this patient?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Proceed', 
          style: 'destructive',
          onPress: () => navigation.navigate('EmergencyReport')
        }
      ]
    );
  };
  
  // Medication status color
  const getMedicationStatusColor = (remaining, total) => {
    const percentage = (remaining / total) * 100;
    if (percentage <= 20) return '#E57373'; // Red
    if (percentage <= 40) return '#F9C74F'; // Yellow
    return '#81B29A'; // Green
  };
  
  // Progress bar component
  const ProgressBar = ({ progress, color, height = 4, bgColor = '#F1F5F9' }) => (
    <View style={[styles.progressBar, { height, backgroundColor: bgColor }]}>
      <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
  );
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#4A6FA5" />
        <Text style={styles.loadingText}>Loading patient data...</Text>
      </View>
    );
  }
  
  if (!patient) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={32} color="#E57373" />
        <Text style={styles.errorText}>Failed to load patient data</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchPatientData}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Dashboard</Text>
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={handleEmergencyCall}
        >
          <Ionicons name="call-outline" size={20} color="#E57373" />
        </TouchableOpacity>
      </View>
      
      {/* Patient Info Card */}
      <View style={styles.patientInfoCard}>
        <View style={styles.patientHeader}>
          <View style={styles.avatarContainer}>
            {patient.avatar ? (
              <Image source={{ uri: patient.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{patient.name.charAt(0)}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientDetails}>{patient.age} years • {patient.condition}</Text>
            <Text style={styles.patientLastActive}>Last active: {patient.lastActive}</Text>
          </View>
        </View>
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'overview' && styles.activeTabButton]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'medication' && styles.activeTabButton]}
          onPress={() => setActiveTab('medication')}
        >
          <Text style={[styles.tabText, activeTab === 'medication' && styles.activeTabText]}>Medication</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'activity' && styles.activeTabButton]}
          onPress={() => setActiveTab('activity')}
        >
          <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>Activity</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.contentContainer}
        contentContainerStyle={styles.contentContainerStyle}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Quick Metrics Section */}
            <View style={styles.metricCardsContainer}>
              <View style={styles.metricCard}>
                <View style={styles.metricIconContainer}>
                  <Ionicons name="warning-outline" size={20} color="#E57373" />
                </View>
                <Text style={styles.metricValue}>{patient.metrics.wanderingIncidents.total}</Text>
                <Text style={styles.metricLabel}>Wandering</Text>
              </View>
              
              <View style={styles.metricCard}>
                <View style={[styles.metricIconContainer, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#4A6FA5" />
                </View>
                <Text style={styles.metricValue}>{patient.metrics.safeZoneTime.today}%</Text>
                <Text style={styles.metricLabel}>Safe Zone</Text>
              </View>
              
              <View style={styles.metricCard}>
                <View style={[styles.metricIconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="time-outline" size={20} color="#81B29A" />
                </View>
                <Text style={styles.metricValue}>{patient.metrics.dailyActiveUsage.today}h</Text>
                <Text style={styles.metricLabel}>Activity</Text>
              </View>
            </View>
            
            {/* Location Map Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Current Location</Text>
                <TouchableOpacity 
                  style={styles.sectionAction}
                  onPress={navigateToSafeZoneSettings}
                >
                  <Text style={styles.sectionActionText}>Manage</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={{
                    latitude: patient.location.latitude,
                    longitude: patient.location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01
                  }}
                >
                  {/* Patient location marker */}
                  <Marker
                    coordinate={{
                      latitude: patient.location.latitude,
                      longitude: patient.location.longitude
                    }}
                  >
                    <View style={styles.patientMarker}>
                      <View style={styles.patientMarkerDot} />
                    </View>
                  </Marker>
                  
                  {/* Safe zones */}
                  {patient.safeZones.map(zone => (
                    <Circle
                      key={zone.id}
                      center={zone.coordinates}
                      radius={zone.radius}
                      fillColor="rgba(74, 111, 165, 0.1)"
                      strokeColor="#4A6FA5"
                      strokeWidth={1}
                    />
                  ))}
                </MapView>
              </View>
              
              <View style={styles.addressContainer}>
                <Ionicons name="location-outline" size={16} color="#64748B" />
                <Text style={styles.addressText}>{patient.location.address}</Text>
              </View>
              
              <Text style={styles.locationUpdated}>Updated {patient.location.lastUpdated}</Text>
            </View>
            
            {/* Medication Compliance Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Medication</Text>
                <TouchableOpacity 
                  style={styles.sectionAction}
                  onPress={navigateToMedicationReminder}
                >
                  <Text style={styles.sectionActionText}>View All</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.medicationComplianceContainer}>
                {patient.medications.map(medication => {
                  const statusColor = getMedicationStatusColor(medication.remaining, medication.total);
                  return (
                    <View key={medication.id} style={styles.medicationComplianceItem}>
                      <View style={styles.medicationComplianceInfo}>
                        <Text style={styles.medicationName}>{medication.name}</Text>
                        <Text style={styles.medicationDetails}>{medication.dosage} • {medication.nextDose}</Text>
                      </View>
                      
                      <View style={styles.medicationComplianceMetrics}>
                        <ProgressBar 
                          progress={(medication.remaining / medication.total) * 100} 
                          color={statusColor} 
                        />
                        <View style={styles.medicationStockInfo}>
                          <Text style={styles.medicationStockText}>
                            {medication.remaining}/{medication.total}
                          </Text>
                          {medication.remaining <= medication.total * 0.2 && (
                            <View style={styles.lowStockBadge}>
                              <Text style={styles.lowStockText}>Low</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
            
            {/* Activity Summary */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Activity</Text>
                <TouchableOpacity 
                  style={styles.sectionAction}
                  onPress={() => setActiveTab('activity')}
                >
                  <Text style={styles.sectionActionText}>Details</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.activitySummary}>
                <View style={styles.activityMetric}>
                  <Text style={styles.activityMetricLabel}>Safe Zone Time</Text>
                  <Text style={styles.activityMetricValue}>{patient.metrics.safeZoneTime.today}%</Text>
                  <ProgressBar 
                    progress={patient.metrics.safeZoneTime.today} 
                    color="#4A6FA5" 
                  />
                </View>
                
                <View style={styles.activityMetric}>
                  <Text style={styles.activityMetricLabel}>Daily Activity</Text>
                  <Text style={styles.activityMetricValue}>{patient.metrics.dailyActiveUsage.today} hours</Text>
                  <ProgressBar 
                    progress={(patient.metrics.dailyActiveUsage.today / 8) * 100} 
                    color="#81B29A" 
                  />
                </View>
                
                <View style={styles.activityMetric}>
                  <Text style={styles.activityMetricLabel}>Medication Compliance</Text>
                  <Text style={styles.activityMetricValue}>85%</Text>
                  <ProgressBar 
                    progress={85} 
                    color="#F9C74F" 
                  />
                </View>
              </View>
            </View>
          </>
        )}
        
        {/* Medication Tab Content */}
        {activeTab === 'medication' && (
          <View style={styles.sectionContainerFull}>
            <View style={styles.medicationHeader}>
              <Text style={styles.medicationHeaderTitle}>Medication Schedule</Text>
              <TouchableOpacity 
                style={styles.addMedicationButton}
                onPress={() => Alert.alert('Add Medication', 'This would allow adding a new medication')}
              >
                <Ionicons name="add" size={20} color="#4A6FA5" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.medicationListContainer}>
              {patient.medications.map(medication => {
                const remainingPercentage = (medication.remaining / medication.total) * 100;
                const statusColor = getMedicationStatusColor(medication.remaining, medication.total);
                
                return (
                  <View key={medication.id} style={styles.medicationListItem}>
                    <View style={styles.medicationHeader}>
                      <Text style={styles.medicationListName}>{medication.name}</Text>
                      <Text style={styles.medicationListDosage}>{medication.dosage}</Text>
                    </View>
                    
                    <View style={styles.medicationScheduleContainer}>
                      {medication.schedule.map((time, index) => (
                        <View key={index} style={styles.medicationScheduleItem}>
                          <Ionicons name="time-outline" size={14} color="#64748B" />
                          <Text style={styles.medicationScheduleTime}>{time}</Text>
                        </View>
                      ))}
                    </View>
                    
                    <View style={styles.medicationStockContainer}>
                      <Text style={styles.medicationStockText}>
                        {medication.remaining}/{medication.total} remaining
                      </Text>
                      <ProgressBar 
                        progress={remainingPercentage} 
                        color={statusColor} 
                      />
                    </View>
                    
                    <View style={styles.medicationActions}>
                      {medication.remaining <= medication.total * 0.2 && (
                        <TouchableOpacity 
                          style={styles.refillButton}
                          onPress={() => Alert.alert('Refill', `Schedule refill for ${medication.name}?`)}
                        >
                          <Text style={styles.refillButtonText}>Refill</Text>
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity 
                        style={styles.markTakenButton}
                        onPress={() => Alert.alert('Mark Taken', `Mark ${medication.name} as taken?`)}
                      >
                        <Text style={styles.markTakenButtonText}>Mark Taken</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
            
            <View style={styles.complianceSection}>
              <Text style={styles.complianceSectionTitle}>Compliance History</Text>
              
              <View style={styles.complianceRow}>
                <Text style={styles.complianceLabel}>Today</Text>
                <View style={styles.complianceBarContainer}>
                  <ProgressBar 
                    progress={85} 
                    color="#81B29A" 
                    height={8}
                    bgColor="#E8F5E9"
                  />
                </View>
                <Text style={styles.complianceValue}>85%</Text>
              </View>
              
              <View style={styles.complianceRow}>
                <Text style={styles.complianceLabel}>This Week</Text>
                <View style={styles.complianceBarContainer}>
                  <ProgressBar 
                    progress={78} 
                    color="#4A6FA5" 
                    height={8}
                    bgColor="#E3F2FD"
                  />
                </View>
                <Text style={styles.complianceValue}>78%</Text>
              </View>
              
              <View style={styles.complianceRow}>
                <Text style={styles.complianceLabel}>This Month</Text>
                <View style={styles.complianceBarContainer}>
                  <ProgressBar 
                    progress={82} 
                    color="#F9C74F" 
                    height={8}
                    bgColor="#FFFDE7"
                  />
                </View>
                <Text style={styles.complianceValue}>82%</Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Activity Tab Content */}
        {activeTab === 'activity' && (
          <>
            <View style={styles.sectionContainerFull}>
              <Text style={styles.activitySectionTitle}>Activity Summary</Text>
              
              <View style={styles.activityCards}>
                <View style={styles.activityCard}>
                  <View style={[styles.activityCardIcon, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="shield-checkmark-outline" size={20} color="#4A6FA5" />
                  </View>
                  <Text style={styles.activityCardValue}>{patient.metrics.safeZoneTime.today}%</Text>
                  <Text style={styles.activityCardLabel}>Time in Safe Zone</Text>
                  <ProgressBar 
                    progress={patient.metrics.safeZoneTime.today} 
                    color="#4A6FA5"
                    bgColor="#E3F2FD" 
                  />
                </View>
                
                <View style={styles.activityCard}>
                  <View style={[styles.activityCardIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="walk-outline" size={20} color="#81B29A" />
                  </View>
                  <Text style={styles.activityCardValue}>{patient.metrics.dailyActiveUsage.today}h</Text>
                  <Text style={styles.activityCardLabel}>Active Time</Text>
                  <ProgressBar 
                    progress={(patient.metrics.dailyActiveUsage.today / 8) * 100} 
                    color="#81B29A"
                    bgColor="#E8F5E9" 
                  />
                </View>
              </View>
              
              <Text style={styles.activitySubSectionTitle}>Wandering Incidents</Text>
              <View style={styles.wanderingContainer}>
                <View style={styles.wanderingHeader}>
                  <Text style={styles.wanderingCount}>4</Text>
                  <Text style={styles.wanderingLabel}>Total Incidents</Text>
                </View>
                
                <View style={styles.wanderingPeriods}>
                  <View style={styles.wanderingPeriod0}>
                    <Text style={styles.wanderingPeriodValue}>
                      {patient.metrics.wanderingIncidents.today}
                    </Text>
                    <Text style={styles.wanderingPeriodLabel}>Today</Text>
                  </View>
                  
                  <View style={styles.wanderingPeriod1}>
                    <Text style={styles.wanderingPeriodValue}>
                      {patient.metrics.wanderingIncidents.weekly}
                    </Text>
                    <Text style={styles.wanderingPeriodLabel}>This Week</Text>
                  </View>
                  
                  <View style={styles.wanderingPeriod}>
                    <Text style={styles.wanderingPeriodValue}>
                      {patient.metrics.wanderingIncidents.monthly}
                    </Text>
                    <Text style={styles.wanderingPeriodLabel}>This Month</Text>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={styles.sectionContainerFull}>
              <Text style={styles.activityHistoryTitle}>Activity History</Text>
              
              <View style={styles.activityHistoryContainer}>
                {patient.activityHistory.map((day, index) => (
                  <View key={index} style={styles.activityHistoryItem}>
                    <Text style={styles.activityHistoryDate}>
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                    
                    <View style={styles.activityHistoryMetrics}>
                      <View style={styles.activityHistoryMetric}>
                        <View style={styles.activityHistoryIconContainer}>
                          <Ionicons name="shield-checkmark-outline" size={14} color="#4A6FA5" />
                        </View>
                        <View style={styles.activityHistoryBarContainer}>
                          <ProgressBar 
                            progress={day.safeZonePercentage} 
                            color="#4A6FA5" 
                            height={6}
                            bgColor="#E3F2FD"
                          />
                        </View>
                        <Text style={styles.activityHistoryValue}>{day.safeZonePercentage}%</Text>
                      </View>
                      
                      <View style={styles.activityHistoryMetric}>
                        <View style={styles.activityHistoryIconContainer}>
                          <Ionicons name="time-outline" size={14} color="#81B29A" />
                        </View>
                        <View style={styles.activityHistoryBarContainer}>
                          <ProgressBar 
                            progress={(day.activeHours / 8) * 100} 
                            color="#81B29A" 
                            height={6}
                            bgColor="#E8F5E9"
                          />
                        </View>
                        <Text style={styles.activityHistoryValue}>{day.activeHours}h</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
        
        {/* Emergency Assistance Button */}
        <TouchableOpacity
          style={styles.emergencyAssistanceButton}
          onPress={handleEmergencyCall}
        >
          <Ionicons name="alert-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.emergencyAssistanceText}>Emergency Assistance</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9F9',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9F9',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  emergencyButton: {
    padding: 4,
  },
  patientInfoCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A6FA5',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  patientDetails: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 2,
  },
  patientLastActive: {
    fontSize: 12,
    color: '#64748B',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabButton: {
    paddingVertical: 12,
    marginRight: 24,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#4A6FA5',
  },
  tabText: {
    fontSize: 14,
    color: '#64748B',
  },
  activeTabText: {
    color: '#4A6FA5',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F8F9F9',
  },
  contentContainerStyle: {
    paddingBottom: 24,
  },
  metricCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 20,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionContainerFull: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  sectionAction: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  sectionActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4A6FA5',
  },
  mapContainer: {
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  patientMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(74, 111, 165, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientMarkerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A6FA5',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 14,
    color: '#334155',
    marginLeft: 6,
  },
  locationUpdated: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginLeft: 22,
  },
  progressBar: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  medicationComplianceContainer: {
    margin: 16,
  },
  medicationComplianceItem: {
    backgroundColor: '#F8F9F9',
    borderRadius: 8,
    padding: 12,
  },
  medicationComplianceInfo: {
    marginBottom: 12,
  },
  medicationName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  medicationDetails: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  medicationComplianceMetrics: {
    margin: 8,
  },
  medicationStockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  medicationStockText: {
    fontSize: 12,
    color: '#64748B',
  },
  lowStockBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lowStockText: {
    fontSize: 10,
    color: '#E57373',
    fontWeight: '500',
  },
  activitySummary: {
    margin: 16,
  },
  activityMetric: {
    backgroundColor: '#F8F9F9',
    borderRadius: 8,
    padding: 12,
  },
  activityMetricLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  activityMetricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  medicationHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  addMedicationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicationListContainer: {
    margin: 16,
  },
  medicationListItem: {
    backgroundColor: '#F8F9F9',
    borderRadius: 8,
    padding: 16,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationListName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
  },
  medicationListDosage: {
    fontSize: 14,
    color: '#64748B',
  },
  medicationScheduleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  medicationScheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  medicationScheduleTime: {
    fontSize: 12,
    color: '#334155',
    marginLeft: 4,
  },
  medicationStockContainer: {
    marginBottom: 12,
  },
  medicationStockText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  medicationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    margin: 8,
  },
  refillButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#FFEBEE',
  },
  refillButtonText: {
    fontSize: 12,
    color: '#E57373',
    fontWeight: '500',
  },
  markTakenButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#E3F2FD',
  },
  markTakenButtonText: {
    fontSize: 12,
    color: '#4A6FA5',
    fontWeight: '500',
  },
  complianceSection: {
    marginTop: 24,
  },
  complianceSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 16,
  },
  complianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  complianceLabel: {
    width: 80,
    fontSize: 14,
    color: '#64748B',
  },
  complianceBarContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  complianceValue: {
    width: 40,
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    textAlign: 'right',
  },
  activitySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  activityCards: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 24,
  },
  activityCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityCardValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  activityCardLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  activitySubSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 12,
  },
  wanderingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  wanderingHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  wanderingCount: {
    fontSize: 24,
    fontWeight: '600',
    color: '#E57373',
  },
  wanderingLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  wanderingPeriods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wanderingPeriod: {
    alignItems: 'center',
    marginLeft: 30
  },

  wanderingPeriod0: {
    alignItems: 'center',
    marginLeft: 0
  },

  wanderingPeriod1: {
    alignItems: 'center',
    marginLeft: 60
  },

  wanderingPeriodValue: {
    fontSize: 18,
    fontWeight: '500',
    color: '#334155',
  },
  wanderingPeriodLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  activityHistoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  activityHistoryContainer: {
    margin: 12,
  },
  activityHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityHistoryDate: {
    width: 50,
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  activityHistoryMetrics: {
    flex: 1,
    margin: 8,
  },
  activityHistoryMetric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityHistoryIconContainer: {
    width: 24,
    alignItems: 'center',
  },
  activityHistoryBarContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  activityHistoryValue: {
    width: 36,
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
    textAlign: 'right',
  },
  emergencyAssistanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E57373',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#E57373',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  emergencyAssistanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default PatientDashboardScreen;