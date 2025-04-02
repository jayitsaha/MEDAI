// src/services/ChatbotService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Flask server API endpoint
const API_BASE_URL = 'http://192.168.255.82:5001/api'

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
    return message;
  } catch (error) {
    console.error('Error adding message to history:', error);
    throw error;
  }
};

// Update a message in chat history
const updateMessageInHistory = async (messageId, newText) => {
  try {
    const history = await getChatHistory();
    const updatedHistory = history.map(msg => 
      msg.id === messageId ? { ...msg, text: newText } : msg
    );
    await AsyncStorage.setItem('chat_history', JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error updating message in history:', error);
  }
};

// Clear chat history
const clearChatHistory = async () => {
  try {
    await AsyncStorage.removeItem('chat_history');
    return true;
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return false;
  }
};

// Get non-streaming response from Groq API
const getResponse = async (userMessage, onComplete, onError) => {
  try {
    // First create and save user message
    const userMessageObj = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),

    };
    console.log(userMessageObj)
    await addMessageToHistory(userMessageObj);
    
    // Create loading bot message
    const botMessageObj = {
      id: (Date.now() + 1).toString(),
      text: 'Thinking...',
      sender: 'bot',
      timestamp: new Date().toISOString(),
    };
    await addMessageToHistory(botMessageObj);
    
    // Get recent chat history for context
    const chatHistory = await getChatHistory();
    const recentHistory = chatHistory.slice(-10); // Last 10 messages
    
    // Format history for Groq API
    const formattedHistory = recentHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
    
    // Make the fetch request without streaming
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful pregnancy assistant providing accurate medical information to expectant mothers. Always advise users to consult healthcare providers for personalized medical advice. Be empathetic, clear, and concise.'
          },
          ...formattedHistory.slice(0, -2), // Exclude the last user message and loading bot message
          {
            role: 'user',
            content: userMessage
          }
        ],
        model: 'llama-3.3-70b-versatile',
        stream: false, // Disable streaming
        temperature: 0.7,
        max_completion_tokens: 1024,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    
    // Parse the response JSON
    const responseData = await response.json();
    const botResponse = responseData.choices?.[0]?.message?.content || 
                        responseData.choices?.[0]?.content || 
                        "I'm sorry, I couldn't generate a response.";
    
    // Update the bot message with the complete response
    await updateMessageInHistory(botMessageObj.id, botResponse);
    
    // Notify caller with complete response
    if (onComplete) onComplete(botMessageObj.id, botResponse);
    
    return botMessageObj.id;
  } catch (error) {
    console.error('Error getting response:', error);
    if (onError) onError(error);
    throw error;
  }
};

export default {
  getChatHistory,
  addMessageToHistory,
  updateMessageInHistory,
  clearChatHistory,
  getResponse, // Renamed from getStreamingResponse
};