// src/screens/pregnancy/DietScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sample meal data (in a real app, this would come from an API or be personalized)
const SAMPLE_MEALS = {
  breakfast: [
    {
      id: 'b1',
      name: 'Greek Yogurt with Berries',
      image: 'https://example.com/yogurt.jpg', // Placeholder
      calories: 320,
      protein: '15g',
      carbs: '40g',
      fat: '10g',
      nutrients: ['Calcium', 'Vitamin C', 'Protein'],
      description: 'Greek yogurt topped with mixed berries, honey, and granola.'
    },
    {
      id: 'b2',
      name: 'Spinach and Feta Omelette',
      image: 'https://example.com/omelette.jpg', // Placeholder
      calories: 380,
      protein: '22g',
      carbs: '12g',
      fat: '28g',
      nutrients: ['Folate', 'Iron', 'Protein'],
      description: 'Three-egg omelette with spinach, feta cheese, and whole grain toast.'
    }
  ],
  lunch: [
    {
      id: 'l1',
      name: 'Quinoa Salad with Avocado',
      image: 'https://example.com/quinoa.jpg', // Placeholder
      calories: 420,
      protein: '12g',
      carbs: '55g',
      fat: '18g',
      nutrients: ['Fiber', 'Healthy Fats', 'Iron'],
      description: 'Quinoa mixed with fresh vegetables, avocado, and lemon-olive oil dressing.'
    },
    {
      id: 'l2',
      name: 'Lentil Soup with Whole Grain Bread',
      image: 'https://example.com/lentil.jpg', // Placeholder
      calories: 380,
      protein: '18g',
      carbs: '60g',
      fat: '8g',
      nutrients: ['Iron', 'Fiber', 'Folate'],
      description: 'Hearty lentil soup with carrots, celery, and onions. Served with whole grain bread.'
    }
  ],
  dinner: [
    {
      id: 'd1',
      name: 'Baked Salmon with Sweet Potato',
      image: 'https://example.com/salmon.jpg', // Placeholder
      calories: 450,
      protein: '32g',
      carbs: '38g',
      fat: '16g',
      nutrients: ['Omega-3', 'Vitamin A', 'Vitamin D'],
      description: 'Baked salmon fillet with roasted sweet potato and steamed broccoli.'
    },
    {
      id: 'd2',
      name: 'Chicken and Vegetable Stir Fry',
      image: 'https://example.com/stirfry.jpg', // Placeholder
      calories: 410,
      protein: '35g',
      carbs: '30g',
      fat: '15g',
      nutrients: ['Protein', 'Vitamin C', 'Iron'],
      description: 'Stir-fried chicken with bell peppers, snap peas, carrots, and brown rice.'
    }
  ],
  snacks: [
    {
      id: 's1',
      name: 'Apple with Almond Butter',
      image: 'https://example.com/apple.jpg', // Placeholder
      calories: 210,
      protein: '5g',
      carbs: '25g',
      fat: '10g',
      nutrients: ['Fiber', 'Healthy Fats', 'Vitamin C'],
      description: 'Sliced apple with 2 tablespoons of almond butter.'
    },
    {
      id: 's2',
      name: 'Hummus with Vegetable Sticks',
      image: 'https://example.com/hummus.jpg', // Placeholder
      calories: 180,
      protein: '6g',
      carbs: '20g',
      fat: '8g',
      nutrients: ['Protein', 'Fiber', 'Vitamin A'],
      description: 'Carrot, cucumber, and bell pepper sticks with 1/4 cup hummus.'
    }
  ]
};

const DietScreen = () => {
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [waterIntake, setWaterIntake] = useState(0);
  const [dailyMeals, setDailyMeals] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [customMeal, setCustomMeal] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    description: ''
  });
  const [waterTarget] = useState(2500); // Target in ml (about 8-10 glasses)
  
  // Load saved data on component mount
  useEffect(() => {
    loadData();
  }, []);
  
  // Load water intake and daily meals from storage
  const loadData = async () => {
    try {
      const savedWaterIntake = await AsyncStorage.getItem('water_intake');
      if (savedWaterIntake) {
        setWaterIntake(parseInt(savedWaterIntake));
      }
      
      const savedMeals = await AsyncStorage.getItem('daily_meals');
      if (savedMeals) {
        setDailyMeals(JSON.parse(savedMeals));
      } else {
        // If no saved meals, initialize with sample meals
        setDailyMeals(SAMPLE_MEALS);
      }
    } catch (error) {
      console.error('Error loading diet data:', error);
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
  
  // Save daily meals to storage
  const saveDailyMeals = async (meals) => {
    try {
      await AsyncStorage.setItem('daily_meals', JSON.stringify(meals));
    } catch (error) {
      console.error('Error saving daily meals:', error);
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
  
  // Open meal detail modal
  const openMealDetail = (meal) => {
    setSelectedMeal(meal);
    setModalVisible(true);
  };
  
  // Add custom meal
  const addCustomMeal = () => {
    if (customMeal.name.trim() === '') return;
    
    const newMeal = {
      id: Date.now().toString(),
      name: customMeal.name,
      image: null, // No image for custom meals
      calories: parseInt(customMeal.calories) || 0,
      protein: customMeal.protein || '0g',
      carbs: customMeal.carbs || '0g',
      fat: customMeal.fat || '0g',
      nutrients: [],
      description: customMeal.description || 'Custom meal'
    };
    
    const updatedMeals = {
      ...dailyMeals,
      [selectedMealType]: [...(dailyMeals[selectedMealType] || []), newMeal]
    };
    
    setDailyMeals(updatedMeals);
    saveDailyMeals(updatedMeals);
    
    // Reset form
    setCustomMeal({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      description: ''
    });
    
    setModalVisible(false);
  };
  
  // Remove meal
  const removeMeal = (mealId) => {
    const updatedMeals = {
      ...dailyMeals,
      [selectedMealType]: dailyMeals[selectedMealType].filter(meal => meal.id !== mealId)
    };
    
    setDailyMeals(updatedMeals);
    saveDailyMeals(updatedMeals);
    setModalVisible(false);
  };
  
  // Render meal card
  const renderMealCard = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.mealCard}
        onPress={() => openMealDetail(item)}
        activeOpacity={0.8}
      >
        <View style={styles.mealImageContainer}>
          {/* In a real app, use actual images */}
          <View style={styles.mealPlaceholder}>
            <Ionicons name="restaurant" size={30} color="#558B2F" />
          </View>
        </View>
        
        <View style={styles.mealInfo}>
          <Text style={styles.mealName}>{item.name}</Text>
          
          <View style={styles.mealNutrition}>
            <Text style={styles.calorieText}>{item.calories} cal</Text>
            
            <View style={styles.macros}>
              <Text style={styles.macroText}>P: {item.protein}</Text>
              <Text style={styles.macroText}>C: {item.carbs}</Text>
              <Text style={styles.macroText}>F: {item.fat}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render meal detail modal
  const renderMealDetailModal = () => {
    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            
            {selectedMeal ? (
              <ScrollView contentContainerStyle={styles.modalContent}>
                <Text style={styles.modalTitle}>{selectedMeal.name}</Text>
                
                <View style={styles.mealImageContainer}>
                  {/* In a real app, use actual images */}
                  <View style={[styles.mealPlaceholder, styles.detailPlaceholder]}>
                    <Ionicons name="restaurant" size={50} color="#558B2F" />
                  </View>
                </View>
                
                <View style={styles.nutritionContainer}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{selectedMeal.calories}</Text>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                  </View>
                  
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{selectedMeal.protein}</Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                  
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{selectedMeal.carbs}</Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                  </View>
                  
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{selectedMeal.fat}</Text>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                  </View>
                </View>
                
                <View style={styles.descriptionContainer}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.descriptionText}>{selectedMeal.description}</Text>
                </View>
                
                {selectedMeal.nutrients && selectedMeal.nutrients.length > 0 && (
                  <View style={styles.nutrientsContainer}>
                    <Text style={styles.sectionTitle}>Key Nutrients</Text>
                    <View style={styles.nutrientsList}>
                      {selectedMeal.nutrients.map((nutrient, index) => (
                        <View key={index} style={styles.nutrientItem}>
                          <Ionicons name="checkmark-circle" size={18} color="#558B2F" />
                          <Text style={styles.nutrientText}>{nutrient}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeMeal(selectedMeal.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                  <Text style={styles.removeText}>Remove Meal</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <ScrollView contentContainerStyle={styles.modalContent}>
                <Text style={styles.modalTitle}>Add Custom Meal</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Meal Name*</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customMeal.name}
                    onChangeText={(text) => setCustomMeal({...customMeal, name: text})}
                    placeholder="Enter meal name"
                  />
                </View>
                
                <View style={styles.macroInputRow}>
                  <View style={styles.macroInput}>
                    <Text style={styles.inputLabel}>Calories</Text>
                    <TextInput
                      style={styles.textInput}
                      value={customMeal.calories}
                      onChangeText={(text) => setCustomMeal({...customMeal, calories: text})}
                      placeholder="Cal"
                      keyboardType="number-pad"
                    />
                  </View>
                  
                  <View style={styles.macroInput}>
                    <Text style={styles.inputLabel}>Protein</Text>
                    <TextInput
                      style={styles.textInput}
                      value={customMeal.protein}
                      onChangeText={(text) => setCustomMeal({...customMeal, protein: text})}
                      placeholder="g"
                    />
                  </View>
                  
                  <View style={styles.macroInput}>
                    <Text style={styles.inputLabel}>Carbs</Text>
                    <TextInput
                      style={styles.textInput}
                      value={customMeal.carbs}
                      onChangeText={(text) => setCustomMeal({...customMeal, carbs: text})}
                      placeholder="g"
                    />
                  </View>
                  
                  <View style={styles.macroInput}>
                    <Text style={styles.inputLabel}>Fat</Text>
                    <TextInput
                      style={styles.textInput}
                      value={customMeal.fat}
                      onChangeText={(text) => setCustomMeal({...customMeal, fat: text})}
                      placeholder="g"
                    />
                  </View>
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={customMeal.description}
                    onChangeText={(text) => setCustomMeal({...customMeal, description: text})}
                    placeholder="Enter meal description"
                    multiline
                    numberOfLines={4}
                  />
                </View>
                
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addCustomMeal}
                  disabled={!customMeal.name.trim()}
                >
                  <Text style={styles.addButtonText}>Add Meal</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    );
  };
  
  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Diet & Nutrition</Text>
          <Text style={styles.headerSubtitle}>
            Personalized meal plans for your pregnancy journey
          </Text>
        </View>
        
        <View style={styles.waterTracker}>
          <View style={styles.waterHeader}>
            <Text style={styles.waterTitle}>Water Intake</Text>
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
        
        <View style={styles.mealSection}>
          <View style={styles.mealTypeSelector}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mealTypes}
            >
              <TouchableOpacity 
                style={[
                  styles.mealTypeButton, 
                  selectedMealType === 'breakfast' && styles.activeMealType
                ]}
                onPress={() => setSelectedMealType('breakfast')}
              >
                <Ionicons
                  name="sunny"
                  size={18}
                  color={selectedMealType === 'breakfast' ? '#FFFFFF' : '#558B2F'}
                />
                <Text 
                  style={[
                    styles.mealTypeText, 
                    selectedMealType === 'breakfast' && styles.activeMealTypeText
                  ]}
                >
                  Breakfast
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.mealTypeButton, 
                  selectedMealType === 'lunch' && styles.activeMealType
                ]}
                onPress={() => setSelectedMealType('lunch')}
              >
                <Ionicons
                  name="restaurant"
                  size={18}
                  color={selectedMealType === 'lunch' ? '#FFFFFF' : '#558B2F'}
                />
                <Text 
                  style={[
                    styles.mealTypeText, 
                    selectedMealType === 'lunch' && styles.activeMealTypeText
                  ]}
                >
                  Lunch
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.mealTypeButton, 
                  selectedMealType === 'dinner' && styles.activeMealType
                ]}
                onPress={() => setSelectedMealType('dinner')}
              >
                <Ionicons
                  name="moon"
                  size={18}
                  color={selectedMealType === 'dinner' ? '#FFFFFF' : '#558B2F'}
                />
                <Text 
                  style={[
                    styles.mealTypeText, 
                    selectedMealType === 'dinner' && styles.activeMealTypeText
                  ]}
                >
                  Dinner
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.mealTypeButton, 
                  selectedMealType === 'snacks' && styles.activeMealType
                ]}
                onPress={() => setSelectedMealType('snacks')}
              >
                <Ionicons
                  name="cafe"
                  size={18}
                  color={selectedMealType === 'snacks' ? '#FFFFFF' : '#558B2F'}
                />
                <Text 
                  style={[
                    styles.mealTypeText, 
                    selectedMealType === 'snacks' && styles.activeMealTypeText
                  ]}
                >
                  Snacks
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          
          <View style={styles.mealList}>
            <FlatList
              data={dailyMeals[selectedMealType] || []}
              renderItem={renderMealCard}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.mealsContainer}
              ListEmptyComponent={
                <View style={styles.emptyMealList}>
                  <Ionicons name="restaurant-outline" size={50} color="#DDD" />
                  <Text style={styles.emptyText}>No meals added yet</Text>
                </View>
              }
              scrollEnabled={false}
            />
            
            <TouchableOpacity
              style={styles.addMealButton}
              onPress={() => {
                setSelectedMeal(null);
                setModalVisible(true);
              }}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
              <Text style={styles.addMealText}>Add Custom Meal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {renderMealDetailModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
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
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
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
    height: 20,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#558B2F',
    borderRadius: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  waterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  waterButton: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  waterButtonText: {
    color: '#558B2F',
    fontWeight: '600',
  },
  mealSection: {
    marginBottom: 20,
  },
  mealTypeSelector: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  mealTypes: {
    paddingHorizontal: 15,
  },
  mealTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
  },
  activeMealType: {
    backgroundColor: '#558B2F',
  },
  mealTypeText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#558B2F',
  },
  activeMealTypeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  mealList: {
    padding: 15,
  },
  mealsContainer: {
    paddingBottom: 15,
  },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mealImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 15,
  },
  mealPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailPlaceholder: {
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  mealInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  mealNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calorieText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#558B2F',
  },
  macros: {
    flexDirection: 'row',
  },
  macroText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  emptyMealList: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#558B2F',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  addMealText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
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
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    padding: 5,
  },
  modalContent: {
    padding: 20,
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#558B2F',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  nutrientsContainer: {
    marginBottom: 20,
  },
  nutrientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  nutrientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 10,
  },
  nutrientText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 5,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 10,
  },
  removeText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  macroInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  macroInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  addButton: {
    backgroundColor: '#558B2F',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DietScreen;