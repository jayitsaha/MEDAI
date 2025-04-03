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
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Voice from '@react-native-voice/voice';
import ChatbotService from '../../services/ChatbotService';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get('window');

// Quick questions for easy access - expanded with more helpful pregnancy questions
const QUICK_QUESTIONS = [
  'What foods should I avoid?',
  'Safe exercises during pregnancy?',
  'When to call my doctor?',
  'Managing morning sickness?',
  'Prenatal vitamin recommendations?',
  'Sleep tips for pregnancy?',
  'Common pregnancy symptoms?',
];

// Thinking steps to show in the thinking animation
const THINKING_STEPS = [
  "Analyzing your question...",
  "Retrieving medical information...",
  "Considering your pregnancy stage...",
  "Formulating detailed response..."
];

// Render a complete chat interface for pregnancy assistant
const ChatbotScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [speechResults, setSpeechResults] = useState([]);
  const [speechError, setSpeechError] = useState('');
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [quickQuestionsExpanded, setQuickQuestionsExpanded] = useState(false);
  
  const flatListRef = useRef(null);
  const thinkingTimerRef = useRef(null);
  const thinkingOpacity = useRef(new Animated.Value(0)).current;
  const volumeAnimation = useRef(new Animated.Value(0)).current;
  const quickQuestionsHeight = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);
  
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
          text: "Hello! I'm your pregnancy assistant. I'm here to provide evidence-based information and support through your pregnancy journey. How can I help you today?",
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
    setIsThinking(true);
    
    // Reset opacity to 0 first to ensure animation starts fresh
    thinkingOpacity.setValue(0);
    
    // Fade in the thinking box with spring animation for more natural feel
    Animated.timing(thinkingOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Cycle through thinking steps
    thinkingTimerRef.current = setInterval(() => {
      setThinkingStep(prev => (prev + 1) % THINKING_STEPS.length);
    }, 1800);
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
      setIsThinking(false);
    });
  };
  
  // Toggle quick questions expansion
  const toggleQuickQuestions = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const newValue = !quickQuestionsExpanded;
    setQuickQuestionsExpanded(newValue);
    
    Animated.spring(quickQuestionsHeight, {
      toValue: newValue ? 110 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };
  
  // Send a message and get simulated streaming response
  const sendMessage = async () => {
    if (inputText.trim() === '' || loading) return;
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
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
      
      // Use a consistent delay before starting the streaming
      const thinkingTime = Math.floor(Math.random() * 1500) + 1500;
      setTimeout(async () => {
        // Get simulated streaming response
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
            
            // Update the message to remove the streaming flag
            await ChatbotService.updateMessage(botMessageId, { isStreaming: false });
            const finalMessages = await ChatbotService.getChatHistory();
            setMessages(finalMessages);
            
            // Only stop thinking and clear streaming ID AFTER everything is updated
            // This ensures the thinking box remains visible until streaming is truly complete
            setTimeout(() => {
              stopThinking();
              setStreamingMessageId(null);
            }, 500); // Small delay to ensure smooth transition
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
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setInputText(question);
    // Use setTimeout to ensure the input is updated before sending
    setTimeout(() => {
      sendMessage();
    }, 100);
    
    // Collapse quick questions after selection
    setQuickQuestionsExpanded(false);
    Animated.spring(quickQuestionsHeight, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
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
    
    // Create pulse animation for recording with sequential animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(volumeAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(volumeAnimation, {
          toValue: 0.3,
          duration: 800,
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
      
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
  
  // Format timestamp for messages
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Render a chat message
  const renderMessage = ({ item, index }) => {
    const isUser = item.sender === 'user';
    const isStreaming = item.id === streamingMessageId;
    const showDate = index === 0 || 
      new Date(item.timestamp).toDateString() !== 
      new Date(messages[index - 1].timestamp).toDateString();
    
    return (
      <>
        {/* Show date separator if needed */}
        {showDate && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>
              {new Date(item.timestamp).toLocaleDateString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
            <View style={styles.dateLine} />
          </View>
        )}
        
        {/* Show thinking box above the streaming message */}
        {isStreaming && isThinking && (
          <Animated.View 
            style={[
              styles.thinkingBox, 
              { opacity: thinkingOpacity },
              isUser ? { marginLeft: 30 } : { marginRight: 30 }
            ]}
          >
            <View style={styles.thinkingHeader}>
              <FontAwesome5 name="brain" size={16} color="#6A3EA1" />
              <Text style={styles.thinkingTitle}>Thinking</Text>
            </View>
            <Text style={styles.thinkingStep}>{THINKING_STEPS[thinkingStep]}</Text>
            <View style={styles.thinkingProgress}>
              {THINKING_STEPS.map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.progressDot,
                    i === thinkingStep ? styles.activeProgressDot : null
                  ]} 
                />
              ))}
            </View>
          </Animated.View>
        )}
        
        {/* Message row with avatar and bubble */}
        <View style={[
          styles.messageRow,
          isUser ? styles.userMessageRow : styles.botMessageRow
        ]}>
          {/* Bot avatar */}
          {!isUser && (
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#8A56AC', '#6A3EA1']}
                style={styles.avatar}
              >
                <FontAwesome5 name="baby" size={14} color="#FFFFFF" />
              </LinearGradient>
            </View>
          )}
          
          {/* Message content */}
          <View style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.botBubble,
            item.text.length > 100 && styles.largeMessageBubble
          ]}>
            <Text style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.botMessageText
            ]}>
              {item.text}
            </Text>
            
            {/* Typing indicator for streaming messages */}
            {isStreaming && (
              <View style={styles.typingIndicator}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            )}
            
            {/* Timestamp */}
            <Text style={styles.timestampText}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
          
          {/* User avatar placeholder (for alignment) */}
          {isUser && <View style={styles.avatarPlaceholder} />}
        </View>
      </>
    );
  };
  
  // Clear chat history
  const clearChat = async () => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      
      await ChatbotService.clearChatHistory();
      
      // Add welcome message back
      const welcomeMessage = {
        id: Date.now().toString(),
        text: "Hello! I'm your pregnancy assistant. I'm here to provide evidence-based information and support through your pregnancy journey. How can I help you today?",
        sender: "bot",
        timestamp: new Date().toISOString(),
      };
      
      await ChatbotService.addMessageToHistory(welcomeMessage);
      setMessages([welcomeMessage]);
      
      // Reset all states
      setIsThinking(false);
      setStreamingMessageId(null);
      setLoading(false);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {/* Custom gradient header */}
        <LinearGradient
          colors={['#8A56AC', '#6A3EA1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Pregnancy Assistant</Text>
          <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>
        
        {/* Chat messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            // Add extra space at the bottom for better UX
            <View style={{ height: 20 }} />
          }
        />
        
        {/* Thinking box for when we're waiting but haven't started streaming */}
        {/* {isThinking && (
          <View style={styles.floatingThinkingContainer}>
            <Animated.View 
              style={[
                styles.thinkingBox,
                { opacity: thinkingOpacity }
              ]}
            >
              <View style={styles.thinkingHeader}>
                <FontAwesome5 name="brain" size={16} color="#6A3EA1" />
                <Text style={styles.thinkingTitle}>Thinking</Text>
              </View>
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
        )} */}
        
        {/* Quick questions toggle button */}
        <TouchableOpacity 
          style={styles.quickQuestionsToggle}
          onPress={toggleQuickQuestions}
          activeOpacity={0.7}
        >
          <Text style={styles.quickQuestionsToggleText}>
            {quickQuestionsExpanded ? "Hide suggestions" : "Show suggestions"}
          </Text>
          <Ionicons 
            name={quickQuestionsExpanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#6A3EA1" 
          />
        </TouchableOpacity>
        
        {/* Quick questions expandable section */}
        <Animated.View style={[
          styles.quickQuestionsContainer,
          { height: quickQuestionsHeight }
        ]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickQuestionsContent}
          >
            {QUICK_QUESTIONS.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQuestionButton}
                onPress={() => handleQuickQuestion(question)}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.quickQuestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
        
        {/* Message input and buttons */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your question..."
            placeholderTextColor="#9E9E9E"
            multiline
            maxLength={500}
            blurOnSubmit={false}
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
                    outputRange: [1, 1.5]
                  }) }],
                  opacity: volumeAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.5]
                  })
                }
              ]}
            />
            <Ionicons 
              name={isListening ? "mic" : "mic-outline"} 
              size={22} 
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
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9F5FF', // Light purple background for softer feel
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  clearButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dateText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginHorizontal: 8,
    fontWeight: '500',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  botMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 32,
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  largeMessageBubble: {
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: '#6A3EA1', // Deeper purple for user
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#FFFFFF', // White for bot with border
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F0E6FF',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#424242',
  },
  timestampText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  thinkingInline: {
    marginTop: 8,
    marginBottom: 16,
    marginLeft: 40,
    maxWidth: '80%',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 5,
    height: 20,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6A3EA1',
    marginRight: 4,
    opacity: 0.8,
  },
  typingDot1: {
    animationName: 'bounce',
    animationDuration: '0.6s',
    animationIterationCount: 'infinite',
  },
  typingDot2: {
    animationName: 'bounce',
    animationDuration: '0.6s',
    animationDelay: '0.2s',
    animationIterationCount: 'infinite',
  },
  typingDot3: {
    animationName: 'bounce',
    animationDuration: '0.6s',
    animationDelay: '0.4s',
    animationIterationCount: 'infinite',
  },
  thinkingBox: {
    backgroundColor: '#F0E6FF', // Light purple background
    borderRadius: 16,
    padding: 14,
    marginVertical: 10,
    marginHorizontal: 0,
    borderWidth: 1,
    borderColor: '#E2D1FF', // Slightly darker border
    shadowColor: '#6A3EA1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 50,
  },
  thinkingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  thinkingTitle: {
    fontWeight: '600',
    color: '#6A3EA1', // Deep purple for title
    marginLeft: 6,
    fontSize: 14,
  },
  thinkingStep: {
    color: '#424242', // Dark text for readability
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '400',
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
    backgroundColor: '#D1C4E9',
    marginHorizontal: 3,
  },
  activeProgressDot: {
    backgroundColor: '#6A3EA1',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  floatingThinkingContainer: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    zIndex: 999,
    backgroundColor: 'transparent',
  },
  quickQuestionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: '#F0E6FF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2D1FF',
  },
  quickQuestionsToggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6A3EA1',
    marginRight: 4,
  },
  quickQuestionsContainer: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  quickQuestionsContent: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  quickQuestionButton: {
    backgroundColor: '#F0E6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 6,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E2D1FF',
  },
  quickQuestionText: {
    fontSize: 13,
    color: '#6A3EA1',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0E6FF',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    maxHeight: 120,
    minHeight: 48,
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6A3EA1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    overflow: 'visible', // Allow pulse effect to overflow
    zIndex: 1,
    shadowColor: '#6A3EA1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  listeningButton: {
    backgroundColor: '#C2185B', // Pink/red when listening
  },
  voicePulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6A3EA1',
    zIndex: -1,
  },
  errorTooltip: {
    position: 'absolute',
    bottom: 55,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    padding: 8,
    borderRadius: 8,
    width: 150,
    zIndex: 2,
  },
  errorText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6A3EA1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#6A3EA1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#BDB4C7',
    shadowOpacity: 0.1,
  },
});

export default ChatbotScreen;