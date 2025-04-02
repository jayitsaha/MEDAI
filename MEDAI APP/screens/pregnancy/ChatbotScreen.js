// src/screens/pregnancy/ChatbotScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ChatbotService from '../../services/ChatbotService'; // Make sure to import the correct service

// Sample quick questions
const QUICK_QUESTIONS = [
  'What foods should I avoid?',
  'Is it safe to exercise?',
  'When should I call my doctor?',
  'How to manage morning sickness?',
  'What prenatal vitamins do I need?',
  'Normal symptoms vs. warning signs',
];

const ChatbotScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const flatListRef = useRef(null);
  
  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory();
  }, []);
  
  // Load chat history from storage
  const loadChatHistory = async () => {
    try {
      const savedMessages = await ChatbotService.getChatHistory();
      if (savedMessages && savedMessages.length > 0) {
        setMessages(savedMessages);
      } else {
        // Add welcome message if no chat history
        const welcomeMessage = {
          id: Date.now().toString(),
          text: "Hello! I'm your pregnancy assistant powered by Llama. How can I help you today?",
          sender: "bot",
          timestamp: new Date().toISOString(),
        };
        
        await ChatbotService.addMessageToHistory(welcomeMessage);
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };
  
  // Send a message
  const sendMessage = async () => {
    if (inputText.trim() === '' || loading) return;
    
    const messageText = inputText.trim();
    setInputText('');
    setLoading(true);
    console.log(messageText)
    try {
      // Get non-streaming response
      
      await ChatbotService.getResponse(
        messageText,
        // Called when response is complete
        (messageId, finalText) => {
          setLoading(false);
          loadChatHistory(); // Refresh messages
        },
        // Called on error
        (error) => {
          console.error('Response error:', error);
          setLoading(false);
          
          // Add error message to chat
          handleErrorMessage();
        }
      );
      
      // Reload messages to get both user message and initial bot message
      const updatedMessages = await ChatbotService.getChatHistory();
      setMessages(updatedMessages);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
      handleErrorMessage();
    }
  };
  
  // Handle error message
  const handleErrorMessage = async () => {
    const errorMessage = {
      id: Date.now().toString(),
      text: "I'm sorry, I couldn't process your request. Please try again later.",
      sender: 'bot',
      timestamp: new Date().toISOString(),
    };
    
    await ChatbotService.addMessageToHistory(errorMessage);
    const updatedMessages = await ChatbotService.getChatHistory();
    setMessages(updatedMessages);
  };
  
  // Handle quick question selection
  const handleQuickQuestion = (question) => {
    setInputText(question);
    // Use setTimeout to ensure the input is updated before sending
    setTimeout(() => {
      sendMessage();
    }, 100);
  };
  
  // Render a chat message
  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    const isThinking = item.text === 'Thinking...';
    
    return (
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.botBubble
      ]}>
        <Text style={styles.messageText}>{item.text}</Text>
        
        {isThinking && (
          <View style={styles.typingIndicator}>
            <View style={styles.typingDot} />
            <View style={[styles.typingDot, { marginLeft: 4 }]} />
            <View style={[styles.typingDot, { marginLeft: 4 }]} />
          </View>
        )}
        
        <Text style={styles.timestampText}>
          {new Date(item.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    );
  };
  
  // Clear chat history
  const clearChat = async () => {
    try {
      await ChatbotService.clearChatHistory();
      
      // Add welcome message back
      const welcomeMessage = {
        id: Date.now().toString(),
        text: "Hello! I'm your pregnancy assistant powered by Llama. How can I help you today?",
        sender: "bot",
        timestamp: new Date().toISOString(),
      };
      
      await ChatbotService.addMessageToHistory(welcomeMessage);
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pregnancy Assistant</Text>
        <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={20} color="#FF69B4" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current.scrollToEnd({ animated: true })}
      />
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickQuestionsContainer}
      >
        {QUICK_QUESTIONS.map((question, index) => (
          <TouchableOpacity
            key={index}
            style={styles.quickQuestionButton}
            onPress={() => handleQuickQuestion(question)}
          >
            <Text style={styles.quickQuestionText}>{question}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (inputText.trim() === '' || loading) && styles.disabledButton
          ]}
          onPress={sendMessage}
          disabled={inputText.trim() === '' || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  messagesList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginVertical: 5,
    elevation: 1,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#E6E6FA', // Light purple
    borderBottomRightRadius: 5,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE4E1', // Soft pink
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  timestampText: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 5,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#999',
    opacity: 0.8,
    // Add animation
  },
  quickQuestionsContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  quickQuestionButton: {
    backgroundColor: '#FFE4E1',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 18,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#FFCDC7',
  },
  quickQuestionText: {
    fontSize: 14,
    color: '#FF69B4',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    alignSelf: 'flex-end',
  },
  disabledButton: {
    backgroundColor: '#FFC0CB', // Lighter pink for disabled state
    opacity: 0.7,
  },
});

export default ChatbotScreen;