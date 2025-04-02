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
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sample quick questions
const QUICK_QUESTIONS = [
  'What foods should I avoid?',
  'Is it safe to exercise?',
  'When should I call my doctor?',
  'How to manage morning sickness?',
  'What prenatal vitamins do I need?',
  'Normal symptoms vs. warning signs',
];

// Sample chatbot responses (in a real app, this would be connected to a real AI service)
const CHATBOT_RESPONSES = {
  'What foods should I avoid?': `During pregnancy, it's best to avoid:
  • Raw or undercooked meat, poultry, fish, and eggs
  • Unpasteurized dairy products and juices
  • Raw sprouts
  • High-mercury fish (shark, swordfish, king mackerel)
  • Excessive caffeine (limit to 200mg/day)
  • Alcohol (completely avoid)
  
  Always wash fruits and vegetables thoroughly before eating.`,
  
  'Is it safe to exercise?': `Yes, exercise is generally safe and beneficial during pregnancy for most women! 
  
  Benefits include:
  • Reduced back pain and constipation
  • Potentially easier delivery
  • Faster post-delivery recovery
  
  Recommended activities:
  • Walking
  • Swimming
  • Stationary cycling
  • Low-impact aerobics
  • Modified yoga (avoid hot yoga)
  
  Always consult your healthcare provider before starting any exercise program during pregnancy.`,
  
  'When should I call my doctor?': `Contact your healthcare provider immediately if you experience:
  • Vaginal bleeding or fluid leakage
  • Severe abdominal pain or cramping
  • Severe or persistent headaches
  • Decreased fetal movement
  • Vision changes (blurring, seeing spots)
  • Severe swelling in face, hands, or feet
  • Difficulty breathing
  • Fever over 100.4°F (38°C)
  • Persistent vomiting
  
  When in doubt, it's always better to call your healthcare provider.`,
  
  'How to manage morning sickness?': `Tips for managing morning sickness:
  • Eat small, frequent meals throughout the day
  • Keep plain crackers by your bed to eat before getting up
  • Stay hydrated with small sips of water or electrolyte drinks
  • Try ginger tea, candies, or capsules
  • Avoid strong smells and greasy foods
  • Wear acupressure wristbands
  • Take vitamin B6 (with your doctor's approval)
  
  If vomiting is severe or you can't keep fluids down, contact your healthcare provider as you may have hyperemesis gravidarum, which requires medical attention.`,
  
  'What prenatal vitamins do I need?': `Key nutrients in prenatal vitamins include:
  • Folic acid (400-800 mcg) - prevents neural tube defects
  • Iron (27 mg) - prevents anemia and supports baby's growth
  • Calcium (1,000 mg) - builds baby's bones and teeth
  • Vitamin D (600 IU) - helps calcium absorption
  • DHA (200-300 mg) - supports brain and eye development
  • Iodine (150 mcg) - supports thyroid function
  
  Your healthcare provider may recommend specific brands or formulations based on your individual needs.`,
  
  'Normal symptoms vs. warning signs': `Normal pregnancy symptoms include:
  • Nausea/morning sickness
  • Mild swelling in ankles and feet
  • Fatigue
  • Frequent urination
  • Mild backaches
  • Breast tenderness
  
  Warning signs requiring medical attention:
  • Vaginal bleeding
  • Severe abdominal pain
  • Severe headaches
  • Vision changes
  • Sudden severe swelling
  • Lack of fetal movement
  • High fever
  • Difficulty breathing
  
  Always consult your healthcare provider if you're unsure about any symptoms.`,
};

const ChatbotScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  
  const flatListRef = useRef(null);
  
  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory();
  }, []);
  
  // Load chat history from storage
  const loadChatHistory = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem('chat_history');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        // Add welcome message if no chat history
        const welcomeMessage = {
          id: Date.now().toString(),
          text: "Hello! I'm your pregnancy assistant. How can I help you today?",
          sender: "bot",
          timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
        await AsyncStorage.setItem('chat_history', JSON.stringify([welcomeMessage]));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };
  
  // Save chat history to storage
  const saveChatHistory = async (updatedMessages) => {
    try {
      await AsyncStorage.setItem('chat_history', JSON.stringify(updatedMessages));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };
  
  // Send a message
  const sendMessage = async () => {
    if (inputText.trim() === '') return;
    
    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    await saveChatHistory(updatedMessages);
    
    // Simulate bot typing
    setShowTypingIndicator(true);
    
    // Simulate AI response (in a real app, this would call an AI API)
    setTimeout(() => {
      respondToMessage(userMessage.text, updatedMessages);
      setShowTypingIndicator(false);
    }, 1500);
  };
  
  // Handle quick question selection
  const handleQuickQuestion = (question) => {
    setInputText(question);
    sendMessage();
  };
  
  // Generate bot response
  const respondToMessage = async (message, currentMessages) => {
    setLoading(true);
    
    // In a real app, this would call an AI API
    // For demo purposes, use predefined responses or a default response
    let responseText = '';
    
    // Check for exact matches in our predefined answers
    for (const [question, answer] of Object.entries(CHATBOT_RESPONSES)) {
      if (message.toLowerCase().includes(question.toLowerCase())) {
        responseText = answer;
        break;
      }
    }
    
    // If no matching response, use a default response
    if (responseText === '') {
      responseText = "I'm sorry, I don't have specific information about that. It's best to consult with your healthcare provider for personalized advice about your pregnancy.";
    }
    
    // Create bot message
    const botMessage = {
      id: Date.now().toString(),
      text: responseText,
      sender: 'bot',
      timestamp: new Date().toISOString(),
    };
    
    const updatedMessages = [...currentMessages, botMessage];
    setMessages(updatedMessages);
    await saveChatHistory(updatedMessages);
    setLoading(false);
  };
  
  // Render a chat message
  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    
    return (
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.botBubble
      ]}>
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestampText}>
          {new Date(item.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    );
  };
  
  // Render the typing indicator
  const renderTypingIndicator = () => {
    if (!showTypingIndicator) return null;
    
    return (
      <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
        <View style={styles.typingIndicator}>
          <View style={styles.typingDot} />
          <View style={[styles.typingDot, { marginLeft: 4 }]} />
          <View style={[styles.typingDot, { marginLeft: 4 }]} />
        </View>
      </View>
    );
  };
  
  // Clear chat history
  const clearChat = async () => {
    try {
      // Keep only the welcome message
      const welcomeMessage = {
        id: Date.now().toString(),
        text: "Hello! I'm your pregnancy assistant. How can I help you today?",
        sender: "bot",
        timestamp: new Date().toISOString(),
      };
      
      setMessages([welcomeMessage]);
      await AsyncStorage.setItem('chat_history', JSON.stringify([welcomeMessage]));
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
        ListFooterComponent={renderTypingIndicator}
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
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={styles.sendButton}
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
  typingBubble: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#999',
    opacity: 0.8,
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
});

export default ChatbotScreen;