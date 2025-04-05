import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';

// Patient data (simplified to just one Alzheimer's patient)
const ALZHEIMERS_PATIENT = {
    id: '1',
    name: 'Mohan Patel',
    age: 72,
    condition: 'Early-stage Alzheimer\'s',
    lastActive: '2 mins ago',
    location: 'Koramangala, Bangalore',
    status: 'stable',
    safeZone: true,
    medicationAlert: true,
    avatar: null,
    metrics: {
      wanderingIncidents: 3,
      dailyActiveUsage: "5.2 hours",
      medicationCompliance: "85%",
      safeZoneTime: "92%"
    }
  };

const ConnectedPatientsScreen = ({ navigation }) => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch patient data
  const fetchPatientData = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an actual API call
      // const response = await axios.get(`${API_URL}/api/patients/alzheimers`);
      // setPatient(response.data);
      
      // Using dummy data for development
      setTimeout(() => {
        setPatient(ALZHEIMERS_PATIENT);
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchPatientData();
  };

  // Load patient data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchPatientData();
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  // Get status icon and color
  const getStatusInfo = (patient) => {
    if (!patient.safeZone) {
      return {
        icon: 'warning-outline',
        color: '#E57373',
        text: 'Outside Safe Zone'
      };
    }
    
    if (patient.medicationAlert) {
      return {
        icon: 'medkit-outline',
        color: '#F9C74F',
        text: 'Medication Due'
      };
    }
    
    if (patient.status === 'stable' || patient.status === 'active') {
      return {
        icon: 'checkmark-circle-outline',
        color: '#81B29A',
        text: 'All Good'
      };
    }
    
    if (patient.status === 'sleeping') {
      return {
        icon: 'moon-outline',
        color: '#4A6FA5',
        text: 'Resting'
      };
    }
    
    return {
      icon: 'information-circle-outline',
      color: '#94A3B8',
      text: 'Status Unknown'
    };
  };

  // Navigate to patient dashboard
  const navigateToPatientDashboard = () => {
    navigation.navigate('PatientDashboard', { 
      patientId: patient.id,
      patientName: patient.name
    });
  };

  // Navigate to emergency report
  const navigateToEmergencyReport = () => {
    navigation.navigate('EmergencyReport');
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Connected Patient</Text>
          <TouchableOpacity style={styles.profileButton}>
            <Image 
              source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4A6FA5" />
          <Text style={styles.loadingText}>Loading patient data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Connected Patient</Text>
        <TouchableOpacity style={styles.profileButton}>
          <Image 
            source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4A6FA5']}
            tintColor="#4A6FA5"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {patient ? (
          <View style={styles.patientContainer}>
            <TouchableOpacity
              style={styles.patientCard}
              onPress={navigateToPatientDashboard}
            >
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
                  
                  <View style={styles.locationContainer}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.locationText}>{patient.location}</Text>
                    <Text style={styles.timeText}>• {patient.lastActive}</Text>
                  </View>
                </View>
              </View>
              
              {/* Patient status */}
              {(() => {
                const statusInfo = getStatusInfo(patient);
                return (
                  <View style={[styles.statusContainer, { backgroundColor: `${statusInfo.color}10` }]}>
                    <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>
                      {statusInfo.text}
                    </Text>
                  </View>
                );
              })()}
              
              <View style={styles.separator} />
              
              {/* Quick Metrics */}
              <View style={styles.metricsContainer}>
                <View style={styles.metricItem}>
                  <View style={[styles.metricIconContainer, { backgroundColor: '#FFEBEE' }]}>
                    <Ionicons name="warning-outline" size={16} color="#E57373" />
                  </View>
                  <View style={styles.metricContent}>
                    <Text style={styles.metricValue}>{patient.metrics.wanderingIncidents}</Text>
                    <Text style={styles.metricLabel}>Wandering Incidents</Text>
                  </View>
                </View>
                
                <View style={styles.metricItem}>
                  <View style={[styles.metricIconContainer, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="time-outline" size={16} color="#4A6FA5" />
                  </View>
                  <View style={styles.metricContent}>
                    <Text style={styles.metricValue}>{patient.metrics.dailyActiveUsage}</Text>
                    <Text style={styles.metricLabel}>Daily Activity</Text>
                  </View>
                </View>
                
                <View style={styles.metricItem}>
                  <View style={[styles.metricIconContainer, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="medkit-outline" size={16} color="#81B29A" />
                  </View>
                  <View style={styles.metricContent}>
                    <Text style={styles.metricValue}>{patient.metrics.medicationCompliance}</Text>
                    <Text style={styles.metricLabel}>Medication Compliance</Text>
                  </View>
                </View>
              </View>
              
              {/* View Dashboard Button */}
              <TouchableOpacity
                style={styles.dashboardButton}
                onPress={navigateToPatientDashboard}
              >
                <Text style={styles.dashboardButtonText}>View Complete Dashboard</Text>
                <Ionicons name="chevron-forward" size={16} color="#4A6FA5" />
              </TouchableOpacity>
            </TouchableOpacity>
            
            {/* Emergency Call Button */}
            <TouchableOpacity
              style={styles.emergencyCallButton}
              onPress={navigateToEmergencyReport}
            >
              <Ionicons name="alert-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.emergencyCallText}>Emergency Assistance</Text>
            </TouchableOpacity>
            
            {/* Add Patient Button */}
            <TouchableOpacity
              style={styles.addPatientButton}
              onPress={() => Alert.alert('Connect Patient', 'This would allow you to connect with another patient')}
            >
              <Ionicons name="add-outline" size={20} color="#4A6FA5" />
              <Text style={styles.addPatientButtonText}>Connect Another Patient</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="people-outline" size={36} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No patients connected</Text>
            <Text style={styles.emptyText}>Connect with a patient to start monitoring</Text>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={() => Alert.alert('Connect Patient', 'This would allow you to connect with a patient')}
            >
              <Text style={styles.connectButtonText}>Connect Patient</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileImage: {
    width: 32,
    height: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  patientContainer: {
    flex: 1,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
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
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  metricsContainer: {
    flexDirection: 'column',
    margin: 12,
    marginBottom: 20,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  metricIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 8,
  },
  dashboardButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A6FA5',
    marginRight: 8,
  },
  emergencyCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E57373',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#E57373',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  emergencyCallText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  addPatientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addPatientButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A6FA5',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  connectButton: {
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ConnectedPatientsScreen;