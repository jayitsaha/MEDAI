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
  ScrollView,
  Animated,
  PermissionsAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Voice from '@react-native-voice/voice'; // Import for speech-to-text
import ChatbotService from '../../services/ChatbotService';

// Quick questions for easy access
const QUICK_QUESTIONS = [
  'What foods should I avoid?',
  'Is it safe to exercise?',
  'When should I call my doctor?',
  'How to manage morning sickness?',
  'What prenatal vitamins do I need?',
];

// Thinking steps to show in the thinking box
const THINKING_STEPS = [
  "Analyzing your question...",
  "Retrieving medical information...",
  "Considering pregnancy context...",
  "Formulating response..."
];

// Render a complete chat interface for pregnancy assistant
const ChatbotScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [showThinking, setShowThinking] = useState(false);
  const [speechResults, setSpeechResults] = useState([]);
  const [speechError, setSpeechError] = useState('');
  const [voiceVolume, setVoiceVolume] = useState(0);
  
  const flatListRef = useRef(null);
  const thinkingTimerRef = useRef(null);
  const thinkingOpacity = useRef(new Animated.Value(0)).current;
  const volumeAnimation = useRef(new Animated.Value(0)).current;
  
  // Load chat history and initialize voice recognition when component mounts
  useEffect(() => {
    loadChatHistory();
    initVoiceRecognition();
    
    return () => {
      // Clean up timers and voice recognition on unmount
      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current);
      }
      Voice.destroy().then(() => {
        console.log('Voice recognition destroyed');
      });
    };
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
          text: "Hello! I'm your pregnancy assistant. How can I help you today?",
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
  
  // Start the thinking animation and cycle through steps
  const startThinking = () => {
    setThinkingStep(0);
    setShowThinking(true);
    
    // Fade in the thinking box
    Animated.timing(thinkingOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Cycle through thinking steps
    thinkingTimerRef.current = setInterval(() => {
      setThinkingStep(prev => (prev + 1) % THINKING_STEPS.length);
    }, 1500);
  };
  
  // Stop the thinking animation
  const stopThinking = () => {
    if (thinkingTimerRef.current) {
      clearInterval(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
    
    // Fade out the thinking box
    Animated.timing(thinkingOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowThinking(false);
    });
  };
  
  // Send a message and get simulated streaming response
  const sendMessage = async () => {
    if (inputText.trim() === '' || loading) return;
    
    const messageText = inputText.trim();
    setInputText('');
    setLoading(true);
    startThinking();
    
    try {
      // Add user message to chat
      const userMessage = {
        id: Date.now().toString(),
        text: messageText,
        sender: 'user',
        timestamp: new Date().toISOString(),
      };
      
      await ChatbotService.addMessageToHistory(userMessage);
      
      // Create temporary bot message for simulated streaming
      const botMessageId = (Date.now() + 1).toString();
      const botMessage = {
        id: botMessageId,
        text: '',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isStreaming: true,
      };
      
      await ChatbotService.addMessageToHistory(botMessage);
      setStreamingMessageId(botMessageId);
      
      // Update messages to show both user message and empty bot message
      const updatedMessages = await ChatbotService.getChatHistory();
      setMessages(updatedMessages);
      
      // Simulate random thinking time - makes it feel more natural
      const thinkingTime = Math.floor(Math.random() * 1500) + 1500; // 1.5-3 seconds
      setTimeout(async () => {
        // Get simulated streaming response (internally calls the non-streaming API)
        await ChatbotService.getStreamingResponse(
          messageText,
          // Called for each chunk of the simulated streaming response
          async (chunk) => {
            // Update the bot message with the new chunk
            const updatedMessages = await ChatbotService.getChatHistory();
            const botMessageIndex = updatedMessages.findIndex(msg => msg.id === botMessageId);
            
            if (botMessageIndex !== -1) {
              const updatedBot = {
                ...updatedMessages[botMessageIndex],
                text: updatedMessages[botMessageIndex].text + chunk,
              };
              
              updatedMessages[botMessageIndex] = updatedBot;
              await ChatbotService.updateMessage(botMessageId, { text: updatedBot.text });
              setMessages(updatedMessages);
            }
          },
          // Called when simulated streaming is complete
          async () => {
            setLoading(false);
            setStreamingMessageId(null);
            
            // Only stop thinking when streaming is complete
            stopThinking();
            
            // Update the message to remove the streaming flag
            await ChatbotService.updateMessage(botMessageId, { isStreaming: false });
            const finalMessages = await ChatbotService.getChatHistory();
            setMessages(finalMessages);
          },
          // Called on error
          (error) => {
            console.error('Response error:', error);
            setLoading(false);
            stopThinking();
            setStreamingMessageId(null);
            handleErrorMessage();
          }
        );
      }, thinkingTime);
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
      stopThinking();
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
  
  // Initialize voice recognition
  const initVoiceRecognition = async () => {
    // Set up voice recognition event listeners
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechVolumeChanged = onSpeechVolumeChanged;
    
    // Request microphone permission on Android
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'The app needs access to your microphone to transcribe your voice.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Microphone permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };
  
  // Voice recognition event handlers
  const onSpeechStart = () => {
    console.log('Speech started');
    setIsListening(true);
    setSpeechError('');
    
    // Create pulse animation for recording
    Animated.loop(
      Animated.sequence([
        Animated.timing(volumeAnimation, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(volumeAnimation, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };
  
  const onSpeechEnd = () => {
    console.log('Speech ended');
    setIsListening(false);
    // Stop animation
    volumeAnimation.setValue(0);
    Animated.timing(volumeAnimation).stop();
    
    // If we have results, submit the message
    if (speechResults.length > 0 && inputText.trim() !== '') {
      // Use setTimeout to ensure the input is updated before sending
      setTimeout(() => {
        sendMessage();
      }, 300);
    }
  };
  
  const onSpeechResults = (event) => {
    console.log('Speech results:', event);
    if (event.value && event.value.length > 0) {
      setSpeechResults(event.value);
      setInputText(event.value[0]);
    }
  };
  
  const onSpeechError = (event) => {
    console.error('Speech recognition error:', event);
    setIsListening(false);
    setSpeechError(event.error?.message || 'Error recognizing speech');
    // Stop animation
    volumeAnimation.setValue(0);
    Animated.timing(volumeAnimation).stop();
  };
  
  const onSpeechVolumeChanged = (event) => {
    setVoiceVolume(event.value);
  };
  
  // Start speech recognition
  const startSpeechToText = async () => {
    try {
      if (isListening) {
        return stopSpeechToText();
      }
      
      setSpeechResults([]);
      await Voice.start('en-US');
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
      setSpeechError('Failed to start speech recognition');
    }
  };
  
  // Stop speech recognition
  const stopSpeechToText = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
      // Stop animation
      volumeAnimation.setValue(0);
      Animated.timing(volumeAnimation).stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  };
  
  // Render a chat message
  const renderMessage = ({ item, index }) => {
    const isUser = item.sender === 'user';
    const isStreaming = item.id === streamingMessageId;
    
    // Create a compound view with thinking box + message if this is the streaming message
    return (
      <>
        {/* Show thinking box right above the streaming message */}
        {isStreaming && showThinking && (
          <Animated.View style={[styles.thinkingBox, { opacity: thinkingOpacity }]}>
            <Text style={styles.thinkingTitle}>Thinking...</Text>
            <Text style={styles.thinkingStep}>{THINKING_STEPS[thinkingStep]}</Text>
            <View style={styles.thinkingProgress}>
              {THINKING_STEPS.map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.progressDot,
                    index === thinkingStep ? styles.activeProgressDot : null
                  ]} 
                />
              ))}
            </View>
          </Animated.View>
        )}
        
        {/* The actual message bubble */}
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.botBubble
        ]}>
          <Text style={styles.messageText}>{item.text}</Text>
          
          {isStreaming && (
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
      </>
    );
  };
  
  // Clear chat history
  const clearChat = async () => {
    try {
      await ChatbotService.clearChatHistory();
      
      // Add welcome message back
      const welcomeMessage = {
        id: Date.now().toString(),
        text: "Hello! I'm your pregnancy assistant. How can I help you today?",
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
      
      {/* Chat messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      
      {/* Thinking box for when we're waiting for a message but it hasn't started streaming yet */}
      {showThinking && !streamingMessageId && (
        <View style={styles.floatingThinkingContainer}>
          <Animated.View 
            style={[
              styles.thinkingBox,
              { opacity: thinkingOpacity }
            ]}
          >
            <Text style={styles.thinkingTitle}>Thinking...</Text>
            <Text style={styles.thinkingStep}>{THINKING_STEPS[thinkingStep]}</Text>
            <View style={styles.thinkingProgress}>
              {THINKING_STEPS.map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.progressDot,
                    index === thinkingStep ? styles.activeProgressDot : null
                  ]} 
                />
              ))}
            </View>
          </Animated.View>
        </View>
      )}
      
      {/* Input and buttons area */}
      
      {/* Quick questions horizontal scrolling */}
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
            disabled={loading}
          >
            <Text style={styles.quickQuestionText}>{question}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Message input and buttons */}
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
        
        {/* Voice input button with animation */}
        <TouchableOpacity
          style={[
            styles.voiceButton,
            isListening && styles.listeningButton
          ]}
          onPress={startSpeechToText}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Animated.View
            style={[
              styles.voicePulse,
              {
                transform: [{ scale: volumeAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.3]
                }) }],
                opacity: volumeAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.7]
                })
              }
            ]}
          />
          <Ionicons 
            name={isListening ? "mic" : "mic-outline"} 
            size={20} 
            color="#FFFFFF" 
          />
          {speechError ? (
            <View style={styles.errorTooltip}>
              <Text style={styles.errorText}>{speechError}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
        
        {/* Send button */}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
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
    lineHeight: 22,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF69B4',
    opacity: 0.8,
  },
  thinkingBox: {
    backgroundColor: '#FFD1E0', // Much more solid pink background
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 15,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#FF4081', // Brighter pink border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, // Higher shadow opacity
    shadowRadius: 4,
    elevation: 5, // Higher elevation
  },
  thinkingTitle: {
    fontWeight: 'bold',
    color: '#D81B60', // Deep pink color for title
    marginBottom: 5,
    fontSize: 15, // Slightly larger
  },
  thinkingStep: {
    color: '#000000', // Black text for maximum contrast
    fontSize: 14, // Slightly larger
    marginBottom: 8,
    fontWeight: '600', // Bolder font
  },
  thinkingProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DDD',
    marginHorizontal: 3,
  },
  activeProgressDot: {
    backgroundColor: '#FF69B4',
    width: 8,
    height: 8,
    borderRadius: 4,
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
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    overflow: 'visible', // Allow pulse effect to overflow
    zIndex: 1,
  },
  listeningButton: {
    backgroundColor: '#FF4081', // Darker pink when listening
  },
  voicePulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF69B4',
    zIndex: -1,
  },
  errorTooltip: {
    position: 'absolute',
    bottom: 45,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 6,
    width: 150,
    zIndex: 2,
  },
  errorText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#FFC0CB', // Lighter pink for disabled state
    opacity: 0.7,
  },
  loatingThinkingContainer: {
    position: 'absolute',
    bottom: 120, // Position just above the input area
    left: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: '#FFF',
  }
});

export default ChatbotScreen;