// src/screens/pregnancy/DietScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DietPlanner from '../../components/pregnancy/DietPlanner';

const DietScreen = ({ navigation, route }) => {
  const [waterIntake, setWaterIntake] = useState(0);
  const [pregnancyWeek, setPregnancyWeek] = useState(null);
  const [waterTarget] = useState(2500); // Target in ml (about 8-10 glasses)
  
  // Load saved data on component mount
  useEffect(() => {
    loadData();
    fetchPregnancyWeek();
  }, []);
  
  // Load water intake from storage
  const loadData = async () => {
    try {
      const savedWaterIntake = await AsyncStorage.getItem('water_intake');
      if (savedWaterIntake) {
        setWaterIntake(parseInt(savedWaterIntake));
      }
    } catch (error) {
      console.error('Error loading water intake data:', error);
    }
  };
  
  // Fetch pregnancy week from storage
  const fetchPregnancyWeek = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const parsedData = JSON.parse(userData);
        setPregnancyWeek(parsedData.pregnancyWeek || null);
      }
    } catch (error) {
      console.error('Error fetching pregnancy week:', error);
    }
  };
  
  // Save water intake to storage
  const saveWaterIntake = async (amount) => {
    try {
      await AsyncStorage.setItem('water_intake', amount.toString());
    } catch (error) {
      console.error('Error saving water intake:', error);
    }
  };
  
  // Add water intake
  const addWater = (ml) => {
    const newIntake = Math.min(waterIntake + ml, waterTarget);
    setWaterIntake(newIntake);
    saveWaterIntake(newIntake);
  };
  
  // Reset water intake
  const resetWater = () => {
    setWaterIntake(0);
    saveWaterIntake(0);
  };
  
  // Calculate water intake percentage
  const waterPercentage = (waterIntake / waterTarget) * 100;
  
  return (
    <View style={styles.container}>
      <ScrollView stickyHeaderIndices={[0]}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Nutrition</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Home')}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Water Tracker */}
        <View style={styles.waterTracker}>
          <View style={styles.waterHeader}>
            <Text style={styles.waterTitle}>Daily Water Intake</Text>
            <TouchableOpacity onPress={resetWater}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(waterPercentage, 100)}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {waterIntake} / {waterTarget} ml
            </Text>
          </View>
          
          <View style={styles.waterInfo}>
            <Ionicons name="information-circle-outline" size={18} color="#666" />
            <Text style={styles.waterInfoText}>
              Staying hydrated is essential during pregnancy. Aim for 8-10 glasses daily.
            </Text>
          </View>
          
          <View style={styles.waterButtons}>
            <TouchableOpacity 
              style={styles.waterButton}
              onPress={() => addWater(250)}
            >
              <Ionicons name="water-outline" size={18} color="#558B2F" />
              <Text style={styles.waterButtonText}>250ml</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.waterButton}
              onPress={() => addWater(500)}
            >
              <Ionicons name="water-outline" size={18} color="#558B2F" />
              <Text style={styles.waterButtonText}>500ml</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.waterButton}
              onPress={() => addWater(1000)}
            >
              <Ionicons name="water" size={18} color="#558B2F" />
              <Text style={styles.waterButtonText}>1000ml</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Diet Planner */}
        <DietPlanner pregnancyWeek={pregnancyWeek} navigation={navigation} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 5,
  },
  waterTracker: {
    margin: 15,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    fontWeight: '600',
    color: '#333',
  },
  resetText: {
    fontSize: 14,
    color: '#558B2F',
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 18,
    backgroundColor: '#E8F5E9',
    borderRadius: 9,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#558B2F',
    borderRadius: 9,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  waterInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  waterInfoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
  },
  waterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    flex: 1,
    marginHorizontal: 4,
  },
  waterButtonText: {
    color: '#558B2F',
    fontWeight: '600',
    marginLeft: 5,
    fontSize: 12,
  }
});

export default DietScreen;