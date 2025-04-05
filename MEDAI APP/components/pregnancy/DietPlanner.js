// components/pregnancy/DietPlanner.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const API_URL = 'http://192.168.107.82:5001';
const DietPlanner = ({ pregnancyWeek, navigation }) => {
  // State for user preferences
  const [preferences, setPreferences] = useState({
    cuisines: [],
    allergies: [],
    healthConditions: [],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isDairyFree: false,
    calorieGoal: '2000',
    proteinGoal: '70',
  });

  // State for meal plans
  const [mealPlan, setMealPlan] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [nutritionTips, setNutritionTips] = useState([]);
  const [inputCuisine, setInputCuisine] = useState('');
  const [inputAllergy, setInputAllergy] = useState('');
  const [inputCondition, setInputCondition] = useState('');
  
  // Cuisine suggestions
  const cuisineSuggestions = [
    'Italian', 'Mediterranean', 'Indian', 'Chinese', 'Japanese', 
    'Mexican', 'Thai', 'Greek', 'Middle Eastern', 'American'
  ];
  
  // Common allergies
  const commonAllergies = [
    'Peanuts', 'Tree nuts', 'Milk', 'Eggs', 'Fish', 
    'Shellfish', 'Wheat', 'Soy', 'Sesame'
  ];
  
  // Health conditions relevant to pregnancy
  const pregnancyConditions = [
    'Gestational diabetes', 'Preeclampsia', 'Morning sickness', 
    'Acid reflux', 'Iron deficiency', 'Vitamin D deficiency'
  ];

  // Load saved preferences and meal plans
  useEffect(() => {
    loadData();
    // Generate nutrition tips on component mount
    generateNutritionTips();
  }, [pregnancyWeek]);

  const loadData = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem('diet_preferences');
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
      
      const savedMealPlan = await AsyncStorage.getItem('meal_plan');
      if (savedMealPlan) {
        setMealPlan(JSON.parse(savedMealPlan));
      }
    } catch (error) {
      console.error('Error loading diet data:', error);
    }
  };

  const savePreferences = async () => {
    try {
      await AsyncStorage.setItem('diet_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const saveMealPlan = async (plan) => {
    try {
      await AsyncStorage.setItem('meal_plan', JSON.stringify(plan));
    } catch (error) {
      console.error('Error saving meal plan:', error);
    }
  };

  // Generate meal recommendations using server-side Grok LLM
  const generateMealPlan = async () => {
    setLoading(true);
    try {
      // Make request to the server's dedicated meal plan endpoint
      const response = await axios.post(`${API_URL}/api/diet/meal-plan`, {
        pregnancyWeek: pregnancyWeek,
        preferences: preferences
      });

      // Check if request was successful
      if (response.data.success) {
        const mealPlanData = response.data.data;
        
        // Update the meal plan state
        setMealPlan(mealPlanData);
        saveMealPlan(mealPlanData);
      } else {
        console.error('Error from server:', response.data.error);
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate nutrition tips using server-side Grok LLM
  const generateNutritionTips = async () => {
    try {
      // Make request to the server's dedicated nutrition tips endpoint
      const response = await axios.get(`${API_URL}/api/diet/nutrition-tips`, {
        params: { week: pregnancyWeek }
      });

      // Check if request was successful
      if (response.data.success) {
        const tipsData = response.data.data;
        setNutritionTips(tipsData);
      } else {
        console.error('Error from server:', response.data.error);
      }
    } catch (error) {
      console.error('Error generating nutrition tips:', error);
      // Set default tips if there's an error
      setNutritionTips([
        {
          title: "Folate for Brain Development",
          content: "Consuming adequate folate helps prevent neural tube defects. Include leafy greens, fortified cereals, and beans in your diet."
        },
        {
          title: "Hydration is Key",
          content: "Staying well-hydrated supports amniotic fluid levels and helps prevent common issues like constipation and urinary tract infections."
        },
        {
          title: "Iron for Oxygen Transport",
          content: "Iron needs increase during pregnancy to support additional blood volume and oxygen transport to your baby."
        }
      ]);
    }
  };

  // Add item to preferences lists
  const addItem = (list, item, setter) => {
    if (item.trim() === '' || preferences[list].includes(item)) return;
    const updatedPreferences = {
      ...preferences,
      [list]: [...preferences[list], item]
    };
    setPreferences(updatedPreferences);
    setter('');
    savePreferences();
  };

  // Remove item from preferences lists
  const removeItem = (list, index) => {
    const updatedList = [...preferences[list]];
    updatedList.splice(index, 1);
    setPreferences({...preferences, [list]: updatedList});
    savePreferences();
  };

  // Toggle boolean preferences
  const toggleSwitch = (preference) => {
    setPreferences({
      ...preferences,
      [preference]: !preferences[preference]
    });
    savePreferences();
  };

  // Handle numeric input changes
  const handleNumericInput = (value, field) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setPreferences({
      ...preferences,
      [field]: numericValue
    });
  };

  // Open meal detail modal
  const openMealDetail = (meal) => {
    setSelectedMeal(meal);
    setModalVisible(true);
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

  // Render nutrition tip card
  const renderTipCard = ({ item }) => {
    return (
      <View style={styles.tipCard}>
        <View style={styles.tipIconContainer}>
          <MaterialCommunityIcons name="lightbulb-outline" size={24} color="#558B2F" />
        </View>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>{item.title}</Text>
          <Text style={styles.tipText}>{item.content}</Text>
        </View>
      </View>
    );
  };

  // Render meal detail modal
  const renderMealDetailModal = () => {
    if (!selectedMeal) return null;
    
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
            
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="restaurant-outline" size={28} color="#558B2F" />
                <Text style={styles.modalTitle}>{selectedMeal.name}</Text>
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

              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                {selectedMeal.ingredients && selectedMeal.ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#558B2F" />
                    <Text style={styles.ingredientText}>{ingredient}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                <Text style={styles.instructionsText}>{selectedMeal.instructions}</Text>
              </View>
              
              {selectedMeal.nutrients && selectedMeal.nutrients.length > 0 && (
                <View style={styles.nutrientsContainer}>
                  <Text style={styles.sectionTitle}>Key Nutrients</Text>
                  <View style={styles.nutrientsList}>
                    {selectedMeal.nutrients.map((nutrient, index) => (
                      <View key={index} style={styles.nutrientItem}>
                        <Ionicons name="star" size={16} color="#558B2F" />
                        <Text style={styles.nutrientText}>{nutrient}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {selectedMeal.pregnancyBenefits && (
                <View style={styles.pregnancyBenefitsContainer}>
                  <Text style={styles.sectionTitle}>Pregnancy Benefits</Text>
                  <Text style={styles.benefitsText}>{selectedMeal.pregnancyBenefits}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Render preferences section
  const renderPreferences = () => {
    if (!showPreferences) return null;
    
    return (
      <View style={styles.preferencesContainer}>
        <Text style={styles.preferencesTitle}>Dietary Preferences</Text>
        
        {/* Cuisines */}
        <View style={styles.preferenceSection}>
          <Text style={styles.preferenceLabel}>Preferred Cuisines</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputCuisine}
              onChangeText={setInputCuisine}
              placeholder="Add cuisine"
            />
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => addItem('cuisines', inputCuisine, setInputCuisine)}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.suggestionContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {cuisineSuggestions.map((cuisine, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => addItem('cuisines', cuisine, setInputCuisine)}
                >
                  <Text style={styles.suggestionText}>{cuisine}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.chipContainer}>
            {preferences.cuisines.map((item, index) => (
              <View key={index} style={styles.chip}>
                <Text style={styles.chipText}>{item}</Text>
                <TouchableOpacity onPress={() => removeItem('cuisines', index)}>
                  <Ionicons name="close-circle" size={18} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
        
        {/* Allergies */}
        <View style={styles.preferenceSection}>
          <Text style={styles.preferenceLabel}>Allergies</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputAllergy}
              onChangeText={setInputAllergy}
              placeholder="Add allergy"
            />
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => addItem('allergies', inputAllergy, setInputAllergy)}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.suggestionContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {commonAllergies.map((allergy, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => addItem('allergies', allergy, setInputAllergy)}
                >
                  <Text style={styles.suggestionText}>{allergy}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.chipContainer}>
            {preferences.allergies.map((item, index) => (
              <View key={index} style={styles.chip}>
                <Text style={styles.chipText}>{item}</Text>
                <TouchableOpacity onPress={() => removeItem('allergies', index)}>
                  <Ionicons name="close-circle" size={18} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
        
        {/* Health Conditions */}
        <View style={styles.preferenceSection}>
          <Text style={styles.preferenceLabel}>Health Conditions</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputCondition}
              onChangeText={setInputCondition}
              placeholder="Add health condition"
            />
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => addItem('healthConditions', inputCondition, setInputCondition)}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.suggestionContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {pregnancyConditions.map((condition, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => addItem('healthConditions', condition, setInputCondition)}
                >
                  <Text style={styles.suggestionText}>{condition}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.chipContainer}>
            {preferences.healthConditions.map((item, index) => (
              <View key={index} style={styles.chip}>
                <Text style={styles.chipText}>{item}</Text>
                <TouchableOpacity onPress={() => removeItem('healthConditions', index)}>
                  <Ionicons name="close-circle" size={18} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
        
        {/* Dietary Restrictions */}
        <View style={styles.preferenceSection}>
          <Text style={styles.preferenceLabel}>Dietary Restrictions</Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Vegetarian</Text>
            <Switch
              trackColor={{ false: "#E0E0E0", true: "#AED581" }}
              thumbColor={preferences.isVegetarian ? "#558B2F" : "#f4f3f4"}
              onValueChange={() => toggleSwitch('isVegetarian')}
              value={preferences.isVegetarian}
            />
          </View>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Vegan</Text>
            <Switch
              trackColor={{ false: "#E0E0E0", true: "#AED581" }}
              thumbColor={preferences.isVegan ? "#558B2F" : "#f4f3f4"}
              onValueChange={() => toggleSwitch('isVegan')}
              value={preferences.isVegan}
            />
          </View>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Gluten-Free</Text>
            <Switch
              trackColor={{ false: "#E0E0E0", true: "#AED581" }}
              thumbColor={preferences.isGlutenFree ? "#558B2F" : "#f4f3f4"}
              onValueChange={() => toggleSwitch('isGlutenFree')}
              value={preferences.isGlutenFree}
            />
          </View>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Dairy-Free</Text>
            <Switch
              trackColor={{ false: "#E0E0E0", true: "#AED581" }}
              thumbColor={preferences.isDairyFree ? "#558B2F" : "#f4f3f4"}
              onValueChange={() => toggleSwitch('isDairyFree')}
              value={preferences.isDairyFree}
            />
          </View>
        </View>
        
        {/* Nutrition Goals */}
        <View style={styles.preferenceSection}>
          <Text style={styles.preferenceLabel}>Nutrition Goals</Text>
          
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Daily Calories:</Text>
            <TextInput
              style={[styles.input, styles.numberInput]}
              value={preferences.calorieGoal}
              onChangeText={(value) => handleNumericInput(value, 'calorieGoal')}
              keyboardType="numeric"
              placeholder="Calories"
            />
            <Text style={styles.unitText}>kcal</Text>
          </View>
          
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Daily Protein:</Text>
            <TextInput
              style={[styles.input, styles.numberInput]}
              value={preferences.proteinGoal}
              onChangeText={(value) => handleNumericInput(value, 'proteinGoal')}
              keyboardType="numeric"
              placeholder="Protein"
            />
            <Text style={styles.unitText}>g</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Diet & Nutrition</Text>
            <Text style={styles.headerSubtitle}>
              AI-powered meal recommendations for your pregnancy
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowPreferences(!showPreferences)}
            >
              <Ionicons name={showPreferences ? "chevron-up" : "options"} size={22} color="#558B2F" />
            </TouchableOpacity>
          </View>
        </View>
        
        {renderPreferences()}
        
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={generateMealPlan}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="nutrition" size={20} color="#FFF" />
                <Text style={styles.generateButtonText}>Generate Personalized Meal Plan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Nutrition Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionHeaderTitle}>Nutrition Tips</Text>
          <FlatList
            data={nutritionTips}
            renderItem={renderTipCard}
            keyExtractor={(item, index) => `tip-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tipsList}
          />
        </View>
        
        {/* Meal Plan Section */}
        <View style={styles.mealPlanSection}>
          <Text style={styles.sectionHeaderTitle}>Your Meal Plan</Text>
          
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
              data={mealPlan[selectedMealType] || []}
              renderItem={renderMealCard}
              keyExtractor={(item, index) => `${selectedMealType}-${index}`}
              contentContainerStyle={styles.mealsContainer}
              ListEmptyComponent={
                <View style={styles.emptyMealList}>
                  <Ionicons name="restaurant-outline" size={50} color="#DDD" />
                  <Text style={styles.emptyText}>
                    {loading 
                      ? "Generating your personalized meal plan..."
                      : "No meals yet. Generate your personalized meal plan!"}
                  </Text>
                </View>
              }
              scrollEnabled={false}
            />
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
  scrollContent: {
    paddingBottom: 30,
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
  headerTextContainer: {
    flex: 1,
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
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  preferencesContainer: {
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
  preferencesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  preferenceSection: {
    marginBottom: 20,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  numberInput: {
    flex: 0.5,
    marginHorizontal: 10,
  },
  inputLabel: {
    fontSize: 14,
    color: '#555',
    width: 120,
  },
  unitText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 5,
  },
  addButton: {
    backgroundColor: '#558B2F',
    borderRadius: 8,
    padding: 10,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionContainer: {
    marginBottom: 10,
  },
  suggestionChip: {
    backgroundColor: '#F0F4C3',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 12,
    color: '#558B2F',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECEFF1',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 12,
    color: '#333',
    marginRight: 5,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 14,
    color: '#555',
  },
  actionContainer: {
    margin: 15,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#558B2F',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  tipsSection: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 15,
    marginBottom: 10,
  },
  tipsList: {
    paddingLeft: 15,
    paddingRight: 5,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    width: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tipIconContainer: {
    marginRight: 10,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  tipText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
  mealPlanSection: {
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
    backgroundColor: '#F5F5F5',
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
    paddingBottom: 10,
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
    width: 70,
    height: 70,
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
    width: 200,
    height: 180,
    marginBottom: 20,
    alignSelf: 'center',
    borderRadius: 12,
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
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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
  detailImageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginLeft: 10,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingredientText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
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
  pregnancyBenefitsContainer: {
    marginBottom: 20,
  },
  benefitsText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    fontStyle: 'italic',
  }
});

export default DietPlanner;