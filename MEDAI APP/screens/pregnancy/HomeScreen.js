// src/screens/pregnancy/HomeScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  FlatList,
  RefreshControl,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CircularProgress from 'react-native-circular-progress-indicator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.4;

const HomeScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('Sarah');
  const [pregnancyWeek, setPregnancyWeek] = useState(24);
  const [trimester, setTrimester] = useState('Second');
  const [refreshing, setRefreshing] = useState(false);
  const [waterIntake, setWaterIntake] = useState(1200);
  const [waterGoal] = useState(2500);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [todaysTasks, setTodaysTasks] = useState([
    { id: '1', title: 'Take prenatal vitamins', completed: true },
    { id: '2', title: 'Drink 8 glasses of water', completed: false },
    { id: '3', title: 'Log your symptoms', completed: false },
    { id: '4', title: '15 minute yoga session', completed: false }
  ]);
  const [babySize, setBabySize] = useState({
    fruit: 'papaya',
    length: '30 cm',
    weight: '600 g'
  });

    const [weatherData, setWeatherData] = useState({
      temp: '22°C',
      condition: 'Sunny',
      icon: 'sunny'
    });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  // Load user data
  useEffect(() => {
    loadUserData();
    loadAppointments();
    
    // Animate components on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    
    return () => {
      // Clean up
    };
  }, []);

  const loadUserData = async () => {
    try {
      const name = await AsyncStorage.getItem('user_name');
      if (name) {
        setUserName(name);
      }
      
      const week = await AsyncStorage.getItem('pregnancy_week');
      if (week) {
        const weekNum = parseInt(week);
        setPregnancyWeek(weekNum);
        
        // Set trimester based on week
        if (weekNum <= 13) {
          setTrimester('First');
        } else if (weekNum <= 26) {
          setTrimester('Second');
        } else {
          setTrimester('Third');
        }
        
        // Set baby size based on week (simplified)
        updateBabySize(weekNum);
      }
      
      const water = await AsyncStorage.getItem('water_intake');
      if (water) {
        setWaterIntake(parseInt(water));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const appointments = await AsyncStorage.getItem('appointments');
      if (appointments) {
        const parsedAppointments = JSON.parse(appointments);
        
        // Get upcoming appointments (next 7 days)
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        const upcoming = parsedAppointments
          .filter(appointment => {
            const appointmentDate = new Date(appointment.date);
            return appointmentDate >= today && appointmentDate <= nextWeek;
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3);
        
        setUpcomingAppointments(upcoming);
      } else {
        // Set sample appointment if none exist
        const sampleAppointment = {
          id: '1',
          title: 'Regular Checkup',
          doctorName: 'Dr. Johnson',
          location: 'City Hospital',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '10:00'
        };
        setUpcomingAppointments([sampleAppointment]);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const updateBabySize = (week) => {
    // Simplified size chart - would be more detailed in a real app
    const sizeChart = {
      8: { fruit: 'raspberry', length: '1.6 cm', weight: '1 g' },
      12: { fruit: 'lime', length: '5.4 cm', weight: '14 g' },
      16: { fruit: 'avocado', length: '11.6 cm', weight: '100 g' },
      20: { fruit: 'banana', length: '25 cm', weight: '300 g' },
      24: { fruit: 'papaya', length: '30 cm', weight: '600 g' },
      28: { fruit: 'eggplant', length: '37 cm', weight: '1 kg' },
      32: { fruit: 'squash', length: '42 cm', weight: '1.7 kg' },
      36: { fruit: 'honeydew', length: '47 cm', weight: '2.6 kg' },
      40: { fruit: 'watermelon', length: '51 cm', weight: '3.4 kg' }
    };
    
    // Find the closest week in our chart
    const weeks = Object.keys(sizeChart).map(Number);
    const closestWeek = weeks.reduce((prev, curr) => {
      return (Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev);
    });
    
    setBabySize(sizeChart[closestWeek]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    // Refresh data
    await Promise.all([
      loadUserData(),
      loadAppointments()
    ]);
    
    setRefreshing(false);
  };

  const toggleTaskCompletion = (taskId) => {
    setTodaysTasks(
      todaysTasks.map(task => 
        task.id === taskId 
          ? { ...task, completed: !task.completed } 
          : task
      )
    );
  };

  const addWater = (amount) => {
    const newAmount = Math.min(waterIntake + amount, waterGoal);
    setWaterIntake(newAmount);
    
    // Save to storage
    AsyncStorage.setItem('water_intake', newAmount.toString());
  };

  const renderFeatureCard = ({ item }) => (
    <TouchableOpacity
      style={styles.featureCard}
      onPress={() => navigation.navigate(item.screen)}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={item.colors}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.gradientCard}
      >
        <View style={styles.cardIconContainer}>
          <Ionicons name={item.icon} size={24} color="white" />
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const features = [
    {
      id: '1',
      title: 'Yoga',
      icon: 'fitness',
      screen: 'Yoga',
      colors: ['#FF69B4', '#FF8FAB']
    },
    {
      id: '2',
      title: 'Diet',
      icon: 'nutrition',
      screen: 'Diet',
      colors: ['#FF8FAB', '#FFC0CB']
    },
    {
      id: '3',
      title: 'Appointments',
      icon: 'calendar',
      screen: 'Appointments',
      colors: ['#FFC0CB', '#FFD1DC']
    },
    {
      id: '4',
      title: 'Chat',
      icon: 'chatbubbles',
      screen: 'Chatbot',
      colors: ['#FFD1DC', '#FFE4E1']
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF69B4']}
          />
        }
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.greeting}>Hello, {userName}</Text>
              <Text style={styles.date}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
            
            <View style={styles.weatherContainer}>
              <Ionicons name={weatherData.icon} size={24} color="#FF69B4" />
              <Text style={styles.temperature}>{weatherData.temp}</Text>
            </View>
          </View>
          
          <View style={styles.pregnancyInfoContainer}>
            <View style={styles.weekInfo}>
              <Text style={styles.weekTitle}>Week</Text>
              <Text style={styles.weekNumber}>{pregnancyWeek}</Text>
              <Text style={styles.trimester}>{trimester} Trimester</Text>
            </View>
            
            <View style={styles.babyInfoContainer}>
              <View style={styles.babyInfo}>
                <View style={styles.babyMetric}>
                  <Ionicons name="resize-outline" size={16} color="#FF69B4" />
                  <Text style={styles.metricText}>{babySize.length}</Text>
                </View>
                <View style={styles.babyMetric}>
                  <Ionicons name="barbell-outline" size={16} color="#FF69B4" />
                  <Text style={styles.metricText}>{babySize.weight}</Text>
                </View>
              </View>
              <Text style={styles.fruitComparison}>
                Size of a {babySize.fruit}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Access Features */}
        <Animated.View 
          style={[
            styles.quickAccessContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })}] 
            }
          ]}
        >
          <FlatList
            data={features}
            renderItem={renderFeatureCard}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuresList}
          />
        </Animated.View>

        {/* Today's Tasks */}
        <Animated.View 
          style={[
            styles.sectionContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })}] 
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tasksContainer}>
            {todaysTasks.map(task => (
              <TouchableOpacity
                key={task.id}
                style={styles.taskItem}
                onPress={() => toggleTaskCompletion(task.id)}
              >
                <View style={[
                  styles.taskCheckbox,
                  task.completed && styles.taskCheckboxCompleted
                ]}>
                  {task.completed && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Text style={[
                  styles.taskText,
                  task.completed && styles.taskTextCompleted
                ]}>
                  {task.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Water Tracker */}
        <Animated.View 
          style={[
            styles.waterTrackerCard, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [70, 0]
              })}] 
            }
          ]}
        >
          <View style={styles.waterHeader}>
            <Text style={styles.waterTitle}>Water Intake</Text>
            <TouchableOpacity onPress={() => setWaterIntake(0)}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.waterContent}>
            <View style={styles.waterProgressContainer}>
              <CircularProgress
                value={waterIntake}
                maxValue={waterGoal}
                radius={50}
                duration={500}
                progressValueColor={'#FF69B4'}
                activeStrokeColor={'#FF69B4'}
                inActiveStrokeColor={'#FFE4E1'}
                inActiveStrokeOpacity={0.5}
                inActiveStrokeWidth={10}
                activeStrokeWidth={10}
                title={'ml'}
                titleColor={'#666'}
                titleStyle={{ fontSize: 12 }}
              />
            </View>
            
            <View style={styles.waterActions}>
              <View style={styles.waterTextContainer}>
                <Text style={styles.waterProgress}>
                  {waterIntake}/{waterGoal} ml
                </Text>
                <Text style={styles.waterRemaining}>
                  {Math.round((waterIntake / waterGoal) * 100)}% of daily goal
                </Text>
              </View>
              
              <View style={styles.waterButtons}>
                <TouchableOpacity 
                  style={styles.waterButton}
                  onPress={() => addWater(250)}
                >
                  <Text style={styles.waterButtonText}>+ 250ml</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.waterButton}
                  onPress={() => addWater(500)}
                >
                  <Text style={styles.waterButtonText}>+ 500ml</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Upcoming Appointments */}
        <Animated.View 
          style={[
            styles.sectionContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [90, 0]
              })}] 
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {upcomingAppointments.length > 0 ? (
            <View style={styles.appointmentsContainer}>
              {upcomingAppointments.map(appointment => (
                <TouchableOpacity 
                  key={appointment.id}
                  style={styles.appointmentCard}
                  onPress={() => navigation.navigate('Appointments')}
                >
                  <View style={styles.appointmentDate}>
                    <Text style={styles.appointmentDay}>
                      {new Date(appointment.date).getDate()}
                    </Text>
                    <Text style={styles.appointmentMonth}>
                      {new Date(appointment.date).toLocaleString('default', { month: 'short' })}
                    </Text>
                  </View>
                  
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                    <Text style={styles.appointmentTime}>{appointment.time}</Text>
                    
                    {appointment.location && (
                      <View style={styles.appointmentDetail}>
                        <Ionicons name="location-outline" size={14} color="#666" />
                        <Text style={styles.appointmentDetailText}>{appointment.location}</Text>
                      </View>
                    )}
                    
                    {appointment.doctorName && (
                      <View style={styles.appointmentDetail}>
                        <Ionicons name="person-outline" size={14} color="#666" />
                        <Text style={styles.appointmentDetailText}>{appointment.doctorName}</Text>
                      </View>
                    )}
                  </View>
                  
                  <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyAppointments}>
              <Ionicons name="calendar-outline" size={40} color="#FFE4E1" />
              <Text style={styles.emptyText}>No upcoming appointments</Text>
              <TouchableOpacity 
                style={styles.addAppointmentButton}
                onPress={() => navigation.navigate('Appointments')}
              >
                <Text style={styles.addAppointmentText}>Schedule Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Health Tips */}
        <Animated.View 
          style={[
            styles.tipCard, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [110, 0]
              })}] 
            }
          ]}
        >
          <View style={styles.tipHeader}>
            <Ionicons name="bulb" size={24} color="#FF69B4" />
            <Text style={styles.tipTitle}>Tip of the Day</Text>
          </View>
          
          <Text style={styles.tipText}>
            Practicing gentle yoga during pregnancy can help reduce stress, improve sleep, and increase strength and flexibility.
          </Text>
          
          <TouchableOpacity 
            style={styles.tipButton}
            onPress={() => navigation.navigate('Yoga')}
          >
            <Text style={styles.tipButtonText}>Try a Yoga Session</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Symptom Tracker */}
        <Animated.View 
          style={[
            styles.symptomTrackerCard, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [130, 0]
              })}] 
            }
          ]}
        >
          <View style={styles.symptomHeader}>
            <View style={styles.symptomHeaderContent}>
              <Ionicons name="fitness" size={24} color="#FF69B4" />
              <Text style={styles.symptomTitle}>How are you feeling today?</Text>
            </View>
            
            <TouchableOpacity>
              <Ionicons name="add-circle" size={24} color="#FF69B4" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.moodSelector}>
            <TouchableOpacity style={styles.moodOption}>
              <View style={styles.moodIconContainer}>
                <Ionicons name="happy" size={24} color="#43A047" />
              </View>
              <Text style={styles.moodText}>Great</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.moodOption, styles.selectedMood]}>
              <View style={styles.moodIconContainer}>
                <Ionicons name="happy-outline" size={24} color="#FF69B4" />
              </View>
              <Text style={[styles.moodText, styles.selectedMoodText]}>Good</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.moodOption}>
              <View style={styles.moodIconContainer}>
                <Ionicons name="sad-outline" size={24} color="#FB8C00" />
              </View>
              <Text style={styles.moodText}>Okay</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.moodOption}>
              <View style={styles.moodIconContainer}>
                <Ionicons name="sad" size={24} color="#E53935" />
              </View>
              <Text style={styles.moodText}>Bad</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.trackSymptomsButton}
            onPress={() => navigation.navigate('Chatbot')}
          >
            <Text style={styles.trackSymptomsText}>Track Symptoms</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  header: {
    paddingTop: StatusBar.currentHeight + 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFE4E1',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  pregnancyInfoContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF9FA',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#FFE4E1',
  },
  weekInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: '#FFE4E1',
  },
  weekTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  weekNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF69B4',
    marginBottom: 5,
  },
  trimester: {
    fontSize: 12,
    color: '#FF69B4',
    fontWeight: '500',
  },
  babyInfoContainer: {
    flex: 1,
    paddingLeft: 20,
    justifyContent: 'center',
  },
  babyInfo: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  babyMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  metricText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginLeft: 5,
  },
  fruitComparison: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  quickAccessContainer: {
    marginTop: 20,
    marginBottom: 5,
  },
  featuresList: {
    paddingHorizontal: 15,
  },
  featureCard: {
    width: CARD_WIDTH,
    height: 100,
    marginRight: 15,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gradientCard: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  sectionContainer: {
    margin: 20,
    marginTop: 15,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF69B4',
    fontWeight: '500',
  },
  tasksContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  taskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FF69B4',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCheckboxCompleted: {
    backgroundColor: '#FF69B4',
  },
  taskText: {
    fontSize: 16,
    color: '#333',
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  waterTrackerCard: {
    margin: 20,
    marginTop: 10,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  waterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  resetText: {
    fontSize: 14,
    color: '#FF69B4',
    fontWeight: '500',
  },
  waterContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waterProgressContainer: {
    marginRight: 20,
  },
  waterActions: {
    flex: 1,
  },
  waterTextContainer: {
    marginBottom: 15,
  },
  waterProgress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  waterRemaining: {
    fontSize: 14,
    color: '#666',
  },
  waterButtons: {
    flexDirection: 'row',
  },
  waterButton: {
    backgroundColor: '#FFE4E1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  waterButtonText: {
    color: '#FF69B4',
    fontSize: 14,
    fontWeight: '600',
  },
  appointmentsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  appointmentDate: {
    width: 50,
    height: 60,
    backgroundColor: '#FFE4E1',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  appointmentDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF69B4',
  },
  appointmentMonth: {
    fontSize: 14,
    color: '#FF69B4',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#FF69B4',
    marginBottom: 8,
  },
  appointmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  appointmentDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  emptyAppointments: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: {
    marginTop: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#666',
  },
  addAppointmentButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  addAppointmentText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tipCard: {
    margin: 20,
    marginTop: 10,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  tipText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
    marginBottom: 20,
  },
  tipButton: {
    backgroundColor: '#FFE4E1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
  },
  tipButtonText: {
    color: '#FF69B4',
    fontSize: 14,
    fontWeight: '600',
  },
  symptomTrackerCard: {
    margin: 20,
    marginTop: 10,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  symptomHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symptomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  moodOption: {
    alignItems: 'center',
  },
  selectedMood: {
    backgroundColor: '#FFF0F5',
    borderRadius: 12,
    padding: 10,
  },
  moodIconContainer: {
    marginBottom: 5,
  },
  moodText: {
    fontSize: 12,
    color: '#666',
  },
  selectedMoodText: {
    color: '#FF69B4',
    fontWeight: '600',
  },
  trackSymptomsButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  trackSymptomsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  temperature: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
    color: '#666',
  },
});

export default HomeScreen;