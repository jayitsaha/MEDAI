// src/services/ChatbotService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL - update this to your Flask server address
const API_URL = 'http://192.168.255.82:5001/api';

// Get response from the pregnancy chatbot
const getPregnancyResponse = async (message, pregnancyWeek = null) => {
  try {
    // Get chat history from AsyncStorage
    const chatHistory = await getChatHistory();
    
    // Call the chatbot API
    const response = await fetch(`${API_URL}/chatbot/pregnancy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        week: pregnancyWeek,
        history: chatHistory.slice(-10) // Send last 10 messages for context
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get response');
    }
    
    // Add new messages to chat history
    const userMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    const botMessage = {
      id: (Date.now() + 1).toString(),
      text: result.response,
      sender: 'bot',
      timestamp: new Date().toISOString()
    };
    
    await addMessageToHistory(userMessage);
    await addMessageToHistory(botMessage);
    
    return result.response;
  } catch (error) {
    console.error('Error getting chatbot response:', error);
    throw error;
  }
};

// Get chat history from AsyncStorage
const getChatHistory = async () => {
  try {
    const historyJson = await AsyncStorage.getItem('chat_history');
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Error getting chat history:', error);
    return [];
  }
};

// Add a message to chat history
const addMessageToHistory = async (message) => {
  try {
    const history = await getChatHistory();
    history.push(message);
    await AsyncStorage.setItem('chat_history', JSON.stringify(history));
  } catch (error) {
    console.error('Error adding message to history:', error);
  }
};

// Clear chat history
const clearChatHistory = async () => {
  try {
    await AsyncStorage.removeItem('chat_history');
  } catch (error) {
    console.error('Error clearing chat history:', error);
  }
};

export default {
  getPregnancyResponse,
  getChatHistory,
  clearChatHistory
};