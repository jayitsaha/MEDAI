// components/pregnancy/FoodScanner.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
// Comment out Camera import temporarily, we'll use just ImagePicker for now
// import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';
const API_URL = 'http://192.168.107.82:5001';

const FoodScanner = ({ pregnancyWeek, navigation, dietPreferences }) => {
  // States for camera and permissions - modified to avoid Camera dependency
  const [hasPermission, setHasPermission] = useState(null);
  // Removed Camera.Constants.Type.back reference
  // const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef(null);
  
  // States for food inventory
  const [inventory, setInventory] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanResultVisible, setScanResultVisible] = useState(false);
  const [quantityToAdd, setQuantityToAdd] = useState("1");
  
  // States for recipe suggestions
  const [recipeSuggestions, setRecipeSuggestions] = useState({ recipes: [] });
  const [showRecipes, setShowRecipes] = useState(false);
  
  // Request permissions on component mount
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      // Load inventory data
      fetchInventory();
    })();
  }, []);
  
  // Fetch user's food inventory
  const fetchInventory = async () => {
    try {
      // Try to get user ID (in a real app this would come from auth)
      const userData = await AsyncStorage.getItem('user_data');
      const userId = userData ? JSON.parse(userData).id : 'default_user';
      
      const response = await axios.get(`${API_URL}/api/food/inventory?userId=${userId}`);
      
      if (response.data.success) {
        setInventory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };
  
  // Add scanned item to inventory
  const addToInventory = async (item) => {
    try {
      // Try to get user ID
      const userData = await AsyncStorage.getItem('user_data');
      const userId = userData ? JSON.parse(userData).id : 'default_user';
      
      // Add quantity to the item
      const itemWithQuantity = {
        ...item,
        quantity: parseInt(quantityToAdd) || 1,
        dateAdded: new Date().toISOString().split('T')[0]
      };
      
      const response = await axios.post(`${API_URL}/api/food/inventory?userId=${userId}`, {
        item: itemWithQuantity
      });
      
      if (response.data.success) {
        setInventory(response.data.data);
        Alert.alert('Success', `Added ${item.name} to your inventory!`);
        setScanResultVisible(false);
        setScanResult(null);
      }
    } catch (error) {
      console.error('Error adding to inventory:', error);
      Alert.alert('Error', 'Failed to add item to inventory. Please try again.');
    }
  };
  
  // Remove item from inventory
  const removeFromInventory = async (itemName) => {
    try {
      // Try to get user ID
      const userData = await AsyncStorage.getItem('user_data');
      const userId = userData ? JSON.parse(userData).id : 'default_user';
      
      const response = await axios.delete(`${API_URL}/api/food/inventory?userId=${userId}`, {
        data: { itemName }
      });
      
      if (response.data.success) {
        setInventory(response.data.data);
        Alert.alert('Success', `Removed ${itemName} from your inventory!`);
      }
    } catch (error) {
      console.error('Error removing from inventory:', error);
      Alert.alert('Error', 'Failed to remove item from inventory. Please try again.');
    }
  };
  
  // Take a picture with the camera
  const takePicture = async () => {
    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });
      
      if (!result.cancelled && result.assets && result.assets[0]) {
        await identifyFood(result.assets[0].base64);
      }
      setShowCamera(false);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Pick image from gallery
  const pickImage = async () => {
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        await identifyFood(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Identify food from image using AI
  const identifyFood = async (base64Image) => {
    try {
      const response = await axios.post(`${API_URL}/api/food/identify`, {
        image: base64Image
      });
      
      if (response.data.success) {
        setScanResult(response.data.data);
        setScanResultVisible(true);
      } else {
        Alert.alert('Error', 'Could not identify food in this image. Please try again.');
      }
    } catch (error) {
      console.error('Error identifying food:', error);
      Alert.alert('Error', 'Failed to identify food. Please try again.');
    }
  };
  
  // Get recipe suggestions based on inventory
  const getRecipeSuggestions = async () => {
    if (inventory.items.length === 0) {
      Alert.alert('Empty Inventory', 'Please add some ingredients to your inventory first.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/food/recipe-suggestions`, {
        inventory: inventory,
        preferences: dietPreferences,
        pregnancyWeek: pregnancyWeek
      });
      
      if (response.data.success) {
        setRecipeSuggestions(response.data.data);
        setShowRecipes(true);
      }
    } catch (error) {
      console.error('Error getting recipe suggestions:', error);
      Alert.alert('Error', 'Failed to get recipe suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Render camera screen - simplified to just launch the device camera
  const renderCamera = () => {
    if (hasPermission === false) {
      return (
        <Modal
          visible={showCamera}
          animationType="slide"
          onRequestClose={() => setShowCamera(false)}
        >
          <View style={styles.cameraContainer}>
            <Text style={styles.permissionText}>
              No access to camera. Please enable camera permissions in your device settings.
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      );
    }
    
    // When showCamera becomes true, we immediately launch the camera picker
    // and set showCamera back to false
    if (showCamera) {
      takePicture();
      setShowCamera(false);
    }
    
    // Return empty view since we're using the native camera UI
    return null;
  };
  
  // Render scan result modal
  const renderScanResultModal = () => {
    if (!scanResult) return null;
    
    return (
      <Modal
        visible={scanResultVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setScanResultVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setScanResultVisible(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.iconContainer}>
                {getCategoryIcon(scanResult.category)}
              </View>
              
              <Text style={styles.modalTitle}>{scanResult.name}</Text>
              
              <View style={styles.infoContainer}>
                <Text style={styles.infoLabel}>Category:</Text>
                <Text style={styles.infoValue}>{scanResult.category}</Text>
              </View>
              
              <View style={styles.infoContainer}>
                <Text style={styles.infoLabel}>Shelf Life:</Text>
                <Text style={styles.infoValue}>{scanResult.shelfLife}</Text>
              </View>
              
              <View style={styles.infoContainer}>
                <Text style={styles.infoLabel}>Nutritional Highlights:</Text>
                {scanResult.nutritionalHighlights && scanResult.nutritionalHighlights.length > 0 ? (
                  <View style={styles.nutrientsList}>
                    {scanResult.nutritionalHighlights.map((highlight, index) => (
                      <View key={index} style={styles.nutrientItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#558B2F" />
                        <Text style={styles.nutrientText}>{highlight}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.infoValue}>No specific highlights available</Text>
                )}
              </View>
              
              {scanResult.pregnancyBenefits && (
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>Pregnancy Benefits:</Text>
                  <Text style={styles.infoValue}>{scanResult.pregnancyBenefits}</Text>
                </View>
              )}
              
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>Quantity:</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={quantityToAdd}
                  onChangeText={setQuantityToAdd}
                  keyboardType="number-pad"
                  placeholder="1"
                />
              </View>
              
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addToInventory(scanResult)}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add to Inventory</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Render recipe suggestions modal
  const renderRecipeSuggestionsModal = () => {
    return (
      <Modal
        visible={showRecipes}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRecipes(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.recipeModalContainer]}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowRecipes(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            
            <Text style={styles.recipesTitle}>Recipe Suggestions</Text>
            <Text style={styles.recipesSubtitle}>Based on your available ingredients</Text>
            
            {recipeSuggestions.recipes && recipeSuggestions.recipes.length > 0 ? (
              <FlatList
                data={recipeSuggestions.recipes}
                keyExtractor={(item, index) => `recipe-${index}`}
                renderItem={({ item }) => (
                  <View style={styles.recipeCard}>
                    <View style={styles.recipeHeader}>
                      <Text style={styles.recipeName}>{item.name}</Text>
                      <View style={styles.mealTypeTag}>
                        <Text style={styles.mealTypeText}>{item.mealType}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.ingredientsContainer}>
                      <Text style={styles.sectionTitle}>Ingredients:</Text>
                      
                      {item.ingredients.available && item.ingredients.available.length > 0 && (
                        <View style={styles.ingredientSection}>
                          <Text style={styles.ingredientSubtitle}>You have:</Text>
                          <View style={styles.ingredientList}>
                            {item.ingredients.available.map((ing, idx) => (
                              <View key={`avail-${idx}`} style={styles.ingredientItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#558B2F" />
                                <Text style={styles.ingredientText}>{ing}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                      
                      {item.ingredients.needed && item.ingredients.needed.length > 0 && (
                        <View style={styles.ingredientSection}>
                          <Text style={styles.ingredientSubtitle}>You need:</Text>
                          <View style={styles.ingredientList}>
                            {item.ingredients.needed.map((ing, idx) => (
                              <View key={`need-${idx}`} style={styles.ingredientItem}>
                                <Ionicons name="add-circle" size={16} color="#FF6B6B" />
                                <Text style={styles.ingredientText}>{ing}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.instructionsContainer}>
                      <Text style={styles.sectionTitle}>Instructions:</Text>
                      <Text style={styles.instructionsText}>{item.instructions}</Text>
                    </View>
                    
                    <View style={styles.benefitsContainer}>
                      <Text style={styles.sectionTitle}>Pregnancy Benefits:</Text>
                      <Text style={styles.benefitsText}>{item.nutritionalBenefits}</Text>
                    </View>
                  </View>
                )}
                contentContainerStyle={styles.recipesList}
              />
            ) : (
              <View style={styles.emptyRecipes}>
                <Ionicons name="restaurant-outline" size={60} color="#DDD" />
                <Text style={styles.emptyText}>
                  No recipe suggestions available. Try adding more ingredients to your inventory.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };
  
  // Helper function to get category icon
  const getCategoryIcon = (category) => {
    const iconSize = 50;
    const iconColor = "#558B2F";
    
    switch (category.toLowerCase()) {
      case 'fruit':
        return <MaterialCommunityIcons name="fruit-cherries" size={iconSize} color={iconColor} />;
      case 'vegetable':
        return <MaterialCommunityIcons name="food-apple" size={iconSize} color={iconColor} />;
      case 'grain':
        return <MaterialCommunityIcons name="barley" size={iconSize} color={iconColor} />;
      case 'protein':
        return <MaterialCommunityIcons name="food-steak" size={iconSize} color={iconColor} />;
      case 'dairy':
        return <MaterialCommunityIcons name="cheese" size={iconSize} color={iconColor} />;
      default:
        return <MaterialCommunityIcons name="food" size={iconSize} color={iconColor} />;
    }
  };
  
  // Render item in inventory list
  const renderInventoryItem = ({ item }) => {
    return (
      <View style={styles.inventoryItem}>
        <View style={styles.itemContent}>
          {getCategoryIcon(item.category)}
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemMeta}>
              {item.quantity} {parseInt(item.quantity) > 1 ? 'items' : 'item'} • Added {item.dateAdded}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.removeItemButton}
          onPress={() => removeFromInventory(item.name)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Food Scanner</Text>
        <Text style={styles.headerSubtitle}>
          Scan your food items and get recipe ideas
        </Text>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.cameraButton]}
          onPress={() => setShowCamera(true)}
        >
          <Ionicons name="camera" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Scan Food</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.galleryButton]}
          onPress={pickImage}
        >
          <Ionicons name="images" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>From Gallery</Text>
        </TouchableOpacity>
      </View>
      
      {/* Get Recipe Suggestions Button */}
      <TouchableOpacity
        style={styles.recipeSuggestionsButton}
        onPress={getRecipeSuggestions}
        disabled={loading || inventory.items.length === 0}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="restaurant" size={20} color="#FFFFFF" />
            <Text style={styles.recipeSuggestionsText}>Get Recipe Ideas</Text>
          </>
        )}
      </TouchableOpacity>
      
      {/* Inventory Section */}
      <View style={styles.inventoryContainer}>
        <Text style={styles.inventoryTitle}>Your Food Inventory</Text>
        
        {inventory.items.length === 0 ? (
          <View style={styles.emptyInventory}>
            <Ionicons name="basket-outline" size={60} color="#DDD" />
            <Text style={styles.emptyText}>
              Your food inventory is empty. Scan items to add them.
            </Text>
          </View>
        ) : (
          <FlatList
            data={inventory.items}
            renderItem={renderInventoryItem}
            keyExtractor={(item, index) => `inventory-${index}`}
            contentContainerStyle={styles.inventoryList}
          />
        )}
      </View>
      
      {/* Camera Modal */}
      {renderCamera()}
      
      {/* Scan Result Modal */}
      {renderScanResultModal()}
      
      {/* Recipe Suggestions Modal */}
      {renderRecipeSuggestionsModal()}
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
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  cameraButton: {
    backgroundColor: '#558B2F',
  },
  galleryButton: {
    backgroundColor: '#7CB342',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  recipeSuggestionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8F00',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 12,
    borderRadius: 10,
  },
  recipeSuggestionsText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  inventoryContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 15,
    marginTop: 0,
    borderRadius: 10,
    padding: 15,
  },
  inventoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  inventoryList: {
    paddingBottom: 20,
  },
  inventoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemDetails: {
    marginLeft: 10,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  itemMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeItemButton: {
    padding: 8,
  },
  emptyInventory: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyRecipes: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cameraButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  flipButton: {
    padding: 15,
  },
  closeButton: {
    padding: 15,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
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
  recipeModalContainer: {
    width: '95%',
    maxHeight: '90%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 5,
  },
  modalContent: {
    padding: 20,
    paddingTop: 50,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoContainer: {
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 14,
    color: '#555',
  },
  nutrientsList: {
    marginTop: 5,
  },
  nutrientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  nutrientText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 5,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  quantityInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 8,
    width: 80,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#558B2F',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  recipesTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
  recipesSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  recipesList: {
    padding: 15,
  },
  recipeCard: {
    backgroundColor: '#F9FBF6',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  mealTypeTag: {
    backgroundColor: '#E8F5E9',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  mealTypeText: {
    fontSize: 12,
    color: '#558B2F',
    fontWeight: '500',
  },
  ingredientsContainer: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  ingredientSection: {
    marginTop: 8,
  },
  ingredientSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 5,
  },
  ingredientList: {
    marginLeft: 5,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ingredientText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 5,
  },
  instructionsContainer: {
    marginBottom: 15,
  },
  instructionsText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  benefitsContainer: {
    marginBottom: 5,
  },
  benefitsText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    fontStyle: 'italic',
  }
});

export default FoodScanner;