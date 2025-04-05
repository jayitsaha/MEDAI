// src/services/ChatbotService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Define constants
const CHAT_HISTORY_KEY = 'pregnancy_chat_history';
// Update this to your actual server URL - likely http://localhost:5001 for local development
const API_BASE_URL = 'http://192.168.107.82:5001'
class ChatbotService {
  // Retrieve chat history from AsyncStorage
  async getChatHistory() {
    try {
      const jsonValue = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }
  
  // Add a new message to chat history
  async addMessageToHistory(message) {
    try {
      const messages = await this.getChatHistory();
      const updatedMessages = [...messages, message];
      await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedMessages));
      return true;
    } catch (error) {
      console.error('Error adding message to history:', error);
      return false;
    }
  }
  
  // Update an existing message in chat history
  async updateMessage(messageId, updates) {
    try {
      const messages = await this.getChatHistory();
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      
      if (messageIndex !== -1) {
        messages[messageIndex] = { ...messages[messageIndex], ...updates };
        await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating message:', error);
      return false;
    }
  }
  
  // Clear all chat history
  async clearChatHistory() {
    try {
      await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      return false;
    }
  }
  
  // Get a non-streaming response from the server
  async getResponse(userMessage, onComplete, onError) {
    try {
      // Add user message to history
      const userMsg = {
        id: Date.now().toString(),
        text: userMessage,
        sender: 'user',
        timestamp: new Date().toISOString(),
      };
      await this.addMessageToHistory(userMsg);
      
      // Get chat history for context
      const chatHistory = await this.getChatHistory();
      
      // Format messages for the API in the proper format
      const formattedMessages = [
        {
          "role": "system",
          "content": "You are a helpful pregnancy assistant providing accurate medical information to expectant mothers. Always provide evidence-based information and advise consulting healthcare providers for personalized advice. Be empathetic, clear, and concise."
        },
        // Convert chat history to the proper format (last 10 messages)
        ...chatHistory.slice(-10).map(msg => ({
          "role": msg.sender === 'user' ? 'user' : 'assistant',
          "content": msg.text
        }))
      ];
      
      // Make API request
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        messages: formattedMessages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_completion_tokens: 1024,
        stream: false
      });
      
      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        throw new Error('Invalid response format from server');
      }
      
      // Extract the response text
      const responseText = response.data.choices[0].message.content;
      
      // Add bot response
      const botMsg = {
        id: Date.now().toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      
      await this.addMessageToHistory(botMsg);
      
      // Call completion callback
      onComplete(botMsg.id, botMsg.text);
      return true;
    } catch (error) {
      console.error('Error getting response:', error);
      onError(error);
      return false;
    }
  }
  
  // Simulate streaming response from the server
  async getStreamingResponse(userMessage, onChunk, onComplete, onError) {
    try {
      // Get chat history for context
      const chatHistory = await this.getChatHistory();
      
      // Format messages for the API in the proper format
      const formattedMessages = [
        {
          "role": "system",
          "content": "You are a helpful pregnancy assistant providing accurate medical information to expectant mothers. Always provide evidence-based information and advise consulting healthcare providers for personalized advice. Be empathetic, clear, and concise."
        },
        // Convert chat history to the proper format
        ...chatHistory.slice(-10).map(msg => ({
          "role": msg.sender === 'user' ? 'user' : 'assistant',
          "content": msg.text
        })),
        // Add the current user message
        {
          "role": "user",
          "content": userMessage
        }
      ];
      
      console.log('Sending request to:', `${API_BASE_URL}/api/chat`);
      
      try {
        // Make a NON-streaming API request
        const response = await axios.post(`${API_BASE_URL}/api/chat`, {
          messages: formattedMessages,
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          max_completion_tokens: 1024,
          stream: false // No actual streaming from server
        });
        
        // Extract the response text from the different API format
        if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
          throw new Error('Invalid response format from server');
        }
        
        // Get the complete response text
        const fullResponse = response.data.choices[0].message.content;
        
        // If we reach here, the API call was successful
        console.log('API call successful, response length:', fullResponse.length);
        
        // Calculate a natural typing speed - faster for shorter responses
        // Average human reading speed is about 200-250 words per minute
        // Which translates to ~15-20 characters per second
        const baseSpeed = 20; // characters per second
        const words = fullResponse.split(' ').length;
        const charSpeed = Math.max(10, Math.min(40, baseSpeed - (words / 100))); 
        
        // Store the response in the simulated-stream format
        let streamedText = '';
        let position = 0;
        
        // Function to send the next chunk with a slight delay
        const sendNextChunk = () => {
          // Determine a natural chunk size (simulate varying typing speeds)
          // More natural than sending one character at a time
          let chunkSize = Math.floor(Math.random() * 5) + 2; // 2-6 chars
          
          // Adjust for punctuation to create more natural pauses
          const punctuations = ['.', '!', '?', '\n'];
          const nextPeriod = Math.min(...punctuations.map(p => {
            const pos = fullResponse.indexOf(p, position);
            return pos > -1 ? pos : fullResponse.length;
          }));
          
          // Send up to the next punctuation if it's close
          if (nextPeriod < position + 20 && nextPeriod > position) {
            chunkSize = nextPeriod - position + 1;
          }
          
          // Make sure we don't go beyond the text length
          chunkSize = Math.min(chunkSize, fullResponse.length - position);
          
          if (chunkSize > 0) {
            // Get the next chunk
            const chunk = fullResponse.substr(position, chunkSize);
            position += chunkSize;
            streamedText += chunk;
            
            // Send the chunk
            onChunk(chunk);
            
            // Calculate delay for next chunk - natural pauses at punctuation
            let delay = 1000 / charSpeed; // Base delay in ms
            
            if (chunk.match(/[.!?]\s*$/)) {
              delay = 500; // Longer pause after sentences
            } else if (chunk.match(/[,;:]\s*$/)) {
              delay = 300; // Medium pause after phrases
            } else if (chunk.match(/\n/)) {
              delay = 700; // Longer pause at line breaks
            }
            
            // Schedule the next chunk or complete
            if (position < fullResponse.length) {
              setTimeout(sendNextChunk, delay);
            } else {
              // All chunks sent
              setTimeout(() => onComplete(), 100);
            }
          } else {
            // Nothing left to send
            onComplete();
          }
        };
        
        // Start the simulated streaming after a small initial delay
        setTimeout(sendNextChunk, 500);
        
        return true;
        
      } catch (apiError) {
        console.error('API error details:', apiError.response ? apiError.response.status : 'No response');
        
        // Fallback to a local response if API call fails
        console.log('API call failed, using fallback response');
        
        // Create a fallback response
        const fallbackResponse = "I'm sorry, I couldn't connect to the server at the moment. " +
          "This could be because the server is not running or there's a network issue. " +
          "Please try again later, or check if the server is properly configured and running.";
        
        // Simulate streaming with the fallback response
        let position = 0;
        const sendFallbackChunk = () => {
          if (position < fallbackResponse.length) {
            const chunkSize = Math.min(5, fallbackResponse.length - position);
            const chunk = fallbackResponse.substr(position, chunkSize);
            position += chunkSize;
            onChunk(chunk);
            setTimeout(sendFallbackChunk, 50);
          } else {
            onComplete();
          }
        };
        
        // Start the fallback streaming after a delay
        setTimeout(sendFallbackChunk, 500);
        return true;
      }
      
    } catch (error) {
      console.error('Error in getStreamingResponse:', error);
      onError(error);
      return false;
    }
  }
}

// Export a singleton instance
export default new ChatbotService();