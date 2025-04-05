import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
  Easing,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

// API URL
const API_URL = 'https://medai-guardian-api.herokuapp.com';

// Maximum recording duration in milliseconds
const MAX_RECORDING_DURATION = 120000; // 2 minutes

const VoiceTextNoteScreen = ({ route, navigation }) => {
  const { facilityId, facilityName } = route.params || {};
  
  const [recording, setRecording] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // idle, recording, paused, finished
  const [audioUri, setAudioUri] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [textNote, setTextNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState(null);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);

  // Recording timer
  const recordingTimer = useRef(null);
  
  // Animation values
  const micScale = useRef(new Animated.Value(1)).current;
  const micOpacity = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animate microphone when recording
  useEffect(() => {
    if (recordingStatus === 'recording') {
      // Pulse animation for microphone
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      pulseAnim.stopAnimation();
    };
  }, [recordingStatus]);

  // Clean up recording resources when component unmounts
  useEffect(() => {
    return () => {
      stopRecording();
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Start recording
  const startRecording = async () => {
    try {
      // Request permissions
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      });

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setRecordingStatus('recording');
      setRecordingDuration(0);
      
      // Start timer for recording duration
      let startTime = Date.now();
      recordingTimer.current = setInterval(() => {
        const currentDuration = Date.now() - startTime;
        setRecordingDuration(currentDuration);
        
        // Automatically stop if we reach max duration
        if (currentDuration >= MAX_RECORDING_DURATION) {
          stopRecording();
        }
      }, 100);
      
      // Animation feedback
      Animated.sequence([
        Animated.timing(micScale, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(micScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'Failed to start recording. Please check your device permissions.');
    }
  };

  // Pause recording
  const pauseRecording = async () => {
    if (recordingStatus !== 'recording' || !recording) return;
    
    try {
      await recording.pauseAsync();
      setRecordingStatus('paused');
      
      // Clear timer
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
    } catch (error) {
      console.error('Failed to pause recording', error);
    }
  };

  // Resume recording
  const resumeRecording = async () => {
    if (recordingStatus !== 'paused' || !recording) return;
    
    try {
      await recording.startAsync();
      setRecordingStatus('recording');
      
      // Resume timer
      let startTime = Date.now() - recordingDuration;
      recordingTimer.current = setInterval(() => {
        const currentDuration = Date.now() - startTime;
        setRecordingDuration(currentDuration);
        
        // Automatically stop if we reach max duration
        if (currentDuration >= MAX_RECORDING_DURATION) {
          stopRecording();
        }
      }, 100);
    } catch (error) {
      console.error('Failed to resume recording', error);
    }
  };

  // Stop recording
  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      // Clear timer
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecordingStatus('finished');
      
      // Save to device
      if (uri) {
        try {
          await FileSystem.makeDirectoryAsync(
            FileSystem.documentDirectory + 'recordings/',
            { intermediates: true }
          );
          
          const fileName = `recording_${Date.now()}.aac`;
          const newUri = FileSystem.documentDirectory + 'recordings/' + fileName;
          
          await FileSystem.copyAsync({
            from: uri,
            to: newUri
          });
          
          setAudioUri(newUri);
        } catch (error) {
          console.error('Error saving recording', error);
        }
      }
      
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  };

  // Play recorded audio
  const playRecording = async () => {
    if (!audioUri) return;
    
    try {
      // Stop any existing playback
      if (sound) {
        await sound.unloadAsync();
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      setIsPlaying(true);
      
      // Set up playback finished handler
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Failed to play recording', error);
      Alert.alert('Error', 'Failed to play recording.');
    }
  };

  // Pause audio playback
  const pausePlayback = async () => {
    if (!sound) return;
    
    try {
      await sound.pauseAsync();
      setIsPlaying(false);
    } catch (error) {
      console.error('Failed to pause playback', error);
    }
  };

  // Playback status update handler
  const onPlaybackStatusUpdate = (status) => {
    if (!status.isLoaded) {
      setIsPlaying(false);
    } else {
      setIsPlaying(status.isPlaying);
    }
  };

  // Format duration as MM:SS
  const formatDuration = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Clear recording
  const clearRecording = () => {
    setAudioUri(null);
    setRecordingStatus('idle');
    setRecordingDuration(0);
    
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
  };

  // Submit voice and text note
  const submitNotes = async () => {
    // Validate input
    if (!audioUri && !textNote.trim()) {
      Alert.alert(
        'Missing Information',
        'Please record a voice note or provide a text description of the emergency.'
      );
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, this would upload the audio file and text to the server
      // const formData = new FormData();
      // if (audioUri) {
      //   formData.append('audio', {
      //     uri: audioUri,
      //     type: 'audio/aac',
      //     name: 'recording.aac'
      //   });
      // }
      // if (textNote) {
      //   formData.append('text', textNote);
      // }
      // formData.append('facilityId', facilityId);
      
      // const response = await axios.post(`${API_URL}/api/emergency/notes`, formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data'
      //   }
      // });
      
      // Simulate API call
      setTimeout(() => {
        // Show analysis results
        showAnalysisResults();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit notes', error);
      setIsSubmitting(false);
      Alert.alert(
        'Error',
        'Failed to submit emergency information. Please try again.'
      );
    }
  };

  // Show AI analysis results
  const showAnalysisResults = () => {
    // Generate a mock analysis result
    const mockAnalysis = {
        summary: textNote ? textNote : "Patient appears to be experiencing severe chest pain and difficulty breathing. Initial observations suggest a possible cardiac event.",
        vitalSigns: {
          criticalLevel: textNote.toLowerCase().includes('critical') ? 'High' : 'Medium',
          consciousness: textNote.toLowerCase().includes('unconscious') ? 'Impaired' : 'Alert',
          breathing: textNote.toLowerCase().includes('breath') ? 'Labored' : 'Normal',
        },
        potentialConditions: [
          'Myocardial Infarction',
          'Acute Coronary Syndrome',
          'Angina Pectoris'
        ],
        recommendedSpecialists: [
          'Cardiologist at Manipal Hospital',
          'Emergency Medicine Specialist'
        ],
        immediateActions: [
          'Administer oxygen if available',
          'Keep patient calm and in a comfortable position',
          'Monitor vital signs until BBMP medical team arrives'
        ]
      };
    
    setAnalyzeResult(mockAnalysis);
    setShowAnalyzeModal(true);
    setIsSubmitting(false);
  };

  // Continue to emergency status after analysis
  const continueToStatus = () => {
    setShowAnalyzeModal(false);
    navigation.navigate('EmergencyStatus', {
      facilityId,
      facilityName,
      analysis: analyzeResult
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Describe Emergency</Text>
          <View style={styles.headerRight} />
        </View>
        
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          {facilityName && (
            <View style={styles.facilityContainer}>
              <Ionicons name="medical" size={16} color="#64748B" />
              <Text style={styles.facilityText}>Reporting to: {facilityName}</Text>
            </View>
          )}
          
          {/* Voice note section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Record Voice Note</Text>
            <Text style={styles.sectionDescription}>
              Describe the emergency situation clearly and calmly
            </Text>
            
            <View style={styles.recordingContainer}>
              {/* Recording animation or icon */}
              <View style={styles.recordingIconContainer}>
                {recordingStatus === 'recording' ? (
                  <Animated.View style={[
                    styles.pulseContainer,
                    { transform: [{ scale: pulseAnim }] }
                  ]}>
                    <View style={styles.recordingActiveIcon} />
                  </Animated.View>
                ) : recordingStatus === 'paused' ? (
                  <View style={styles.recordingPausedIcon} />
                ) : recordingStatus === 'finished' ? (
                  <Ionicons name="checkmark-circle" size={64} color="#2A9D8F" />
                ) : (
                  <Ionicons name="mic" size={64} color="#E63946" />
                )}
              </View>
              
              {/* Recording duration */}
              <Text style={styles.durationText}>
                {formatDuration(recordingDuration)}
              </Text>
              
              {/* Recording controls */}
              <View style={styles.recordingControls}>
                {recordingStatus === 'idle' ? (
                  <TouchableOpacity
                    style={[styles.recordButton, styles.startRecordButton]}
                    onPress={startRecording}
                  >
                    <Ionicons name="mic" size={24} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Start Recording</Text>
                  </TouchableOpacity>
                ) : recordingStatus === 'recording' ? (
                  <View style={styles.activeRecordingControls}>
                    <TouchableOpacity
                      style={[styles.recordButton, styles.pauseRecordButton]}
                      onPress={pauseRecording}
                    >
                      <Ionicons name="pause" size={24} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Pause</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.recordButton, styles.stopRecordButton]}
                      onPress={stopRecording}
                    >
                      <Ionicons name="stop" size={24} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Stop</Text>
                    </TouchableOpacity>
                  </View>
                ) : recordingStatus === 'paused' ? (
                  <View style={styles.activeRecordingControls}>
                    <TouchableOpacity
                      style={[styles.recordButton, styles.resumeRecordButton]}
                      onPress={resumeRecording}
                    >
                      <Ionicons name="play" size={24} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Resume</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.recordButton, styles.stopRecordButton]}
                      onPress={stopRecording}
                    >
                      <Ionicons name="stop" size={24} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Stop</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.finishedRecordingControls}>
                    <TouchableOpacity
                      style={[styles.recordButton, styles.playRecordButton]}
                      onPress={isPlaying ? pausePlayback : playRecording}
                    >
                      <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#FFFFFF" />
                      <Text style={styles.buttonText}>{isPlaying ? "Pause" : "Play"}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.recordButton, styles.clearRecordButton]}
                      onPress={clearRecording}
                    >
                      <Ionicons name="trash" size={24} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          {/* Text note section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Text Description</Text>
            <Text style={styles.sectionDescription}>
              Provide additional details about the emergency
            </Text>
            
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Describe the medical emergency situation, including symptoms, level of consciousness, and any relevant medical history if known..."
              value={textNote}
              onChangeText={setTextNote}
              maxLength={500}
              editable={!isSubmitting}
            />
            
            <Text style={styles.characterCount}>
              {textNote.length}/500 characters
            </Text>
            
            {/* Example prompts */}
            <View style={styles.promptsContainer}>
              <Text style={styles.promptsTitle}>Example Descriptions:</Text>
              
              <TouchableOpacity
                style={styles.promptItem}
                onPress={() => setTextNote("Patient is experiencing severe chest pain and difficulty breathing. They are conscious but distressed. Previously taking Ayurvedic medicine for blood pressure but has no known allergies.")}
                >
                <Ionicons name="add-circle" size={16} color="#4A6FA5" />
                <Text style={styles.promptText}>Chest Pain + Difficulty Breathing</Text>
                </TouchableOpacity>

                <TouchableOpacity
                style={styles.promptItem}
                onPress={() => setTextNote("Person collapsed at home in Koramangala area, appears unconscious but breathing. No visible injuries. Adult approximately 60 years old. Family reports history of diabetes.")}
                >
                <Ionicons name="add-circle" size={16} color="#4A6FA5" />
                <Text style={styles.promptText}>Unconscious Person</Text>
                </TouchableOpacity>

                <TouchableOpacity
                style={styles.promptItem}
                onPress={() => setTextNote("Individual having a seizure. Currently convulsing. Has been ongoing for approximately 2 minutes. Takes diabetes medication from Apollo Pharmacy. No known history of epilepsy.")}
                >
                <Ionicons name="add-circle" size={16} color="#4A6FA5" />
                <Text style={styles.promptText}>Seizure</Text>
                </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        
        {/* Submit button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (isSubmitting || (recordingStatus !== 'finished' && !textNote.trim())) 
                ? styles.submitButtonDisabled 
                : null
            ]}
            onPress={submitNotes}
            disabled={isSubmitting || (recordingStatus !== 'finished' && !textNote.trim())}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={24} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Submit Information</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {/* AI Analysis Modal */}
      <Modal
        visible={showAnalyzeModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Analysis Results</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowAnalyzeModal(false)}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {analyzeResult && (
                <>
                  <View style={styles.analysisSection}>
                    <Text style={styles.analysisSectionTitle}>Summary</Text>
                    <Text style={styles.analysisSummary}>Found patient in a state of distress, with difficulty breathing and almost unconscious. Patient was unresponsive to verbal commands and had a slow and shallow breathing pattern. Pulse was weak & irregular. Blood pressure was not taken due to patient's unstable condition</Text>
                  </View>
                  
                  <View style={styles.analysisDivider} />
                  
                  <View style={styles.analysisSection}>
                    <Text style={styles.analysisSectionTitle}>Vital Signs Assessment</Text>
                    <View style={styles.vitalSignsContainer}>
                      <View style={styles.vitalSignItem}>
                        <Text style={styles.vitalSignLabel}>Critical Level:</Text>
                        <View style={[
                          styles.vitalSignValue,
                          { backgroundColor: analyzeResult.vitalSigns.criticalLevel === 'High' ? '#E6394620' : '#F9A82620' }
                        ]}>
                          <Text style={[
                            styles.vitalSignText,
                            { color: analyzeResult.vitalSigns.criticalLevel === 'High' ? '#E63946' : '#F9A826' }
                          ]}>
                            {analyzeResult.vitalSigns.criticalLevel}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.vitalSignItem}>
                        <Text style={styles.vitalSignLabel}>Consciousness:</Text>
                        <View style={styles.vitalSignValue}>
                          <Text style={styles.vitalSignText}>{analyzeResult.vitalSigns.consciousness}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.vitalSignItem}>
                        <Text style={styles.vitalSignLabel}>Breathing:</Text>
                        <View style={styles.vitalSignValue}>
                          <Text style={styles.vitalSignText}>{analyzeResult.vitalSigns.breathing}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.analysisDivider} />
                  
                  <View style={styles.analysisSection}>
                    <Text style={styles.analysisSectionTitle}>Potential Conditions</Text>
                    <View style={styles.conditionsContainer}>
                      {analyzeResult.potentialConditions.map((condition, index) => (
                        <View key={index} style={styles.conditionItem}>
                          <Ionicons name="medical" size={16} color="#4A6FA5" />
                          <Text style={styles.conditionText}>{condition}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.analysisDivider} />
                  
                  <View style={styles.analysisSection}>
                    <Text style={styles.analysisSectionTitle}>Recommended Specialists</Text>
                    <View style={styles.specialistsContainer}>
                      {analyzeResult.recommendedSpecialists.map((specialist, index) => (
                        <View key={index} style={styles.specialistItem}>
                          <Ionicons name="person" size={16} color="#4A6FA5" />
                          <Text style={styles.specialistText}>{specialist}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.analysisDivider} />
                  
                  <View style={styles.analysisSection}>
                    <Text style={styles.analysisSectionTitle}>Immediate Actions</Text>
                    <View style={styles.actionsContainer}>
                      {analyzeResult.immediateActions.map((action, index) => (
                        <View key={index} style={styles.actionItem}>
                          <Text style={styles.actionNumber}>{index + 1}.</Text>
                          <Text style={styles.actionText}>{action}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  <Text style={styles.aiDisclaimer}>
                    This is an AI-generated analysis based on your description. 
                    Medical professionals will review this information.
                  </Text>
                </>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={continueToStatus}
              >
                <Text style={styles.continueButtonText}>Continue to Live Status</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  facilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  facilityText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  recordingContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  recordingIconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pulseContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6394620',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingActiveIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E63946',
  },
  recordingPausedIcon: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: '#F9A826',
  },
  durationText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  recordingControls: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeRecordingControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  finishedRecordingControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  startRecordButton: {
    backgroundColor: '#E63946',
    minWidth: 200,
  },
  pauseRecordButton: {
    backgroundColor: '#F9A826',
    flex: 1,
    marginRight: 8,
  },
  resumeRecordButton: {
    backgroundColor: '#4A6FA5',
    flex: 1,
    marginRight: 8,
  },
  stopRecordButton: {
    backgroundColor: '#E63946',
    flex: 1,
    marginLeft: 8,
  },
  playRecordButton: {
    backgroundColor: '#4A6FA5',
    flex: 1,
    marginRight: 8,
  },
  clearRecordButton: {
    backgroundColor: '#64748B',
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    height: 160,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  characterCount: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 4,
  },
  promptsContainer: {
    marginTop: 16,
  },
  promptsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  promptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  promptText: {
    fontSize: 14,
    color: '#0F172A',
    marginLeft: 8,
  },
  submitContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E63946',
    paddingVertical: 16,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#E6394680',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 16,
    maxHeight: '70%',
  },
  analysisSection: {
    marginBottom: 16,
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  analysisSummary: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  analysisDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  vitalSignsContainer: {
    marginTop: 8,
  },
  vitalSignItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vitalSignLabel: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  vitalSignValue: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  vitalSignText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  conditionsContainer: {
    marginTop: 8,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionText: {
    fontSize: 14,
    color: '#334155',
    marginLeft: 8,
  },
  specialistsContainer: {
    marginTop: 8,
  },
  specialistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  specialistText: {
    fontSize: 14,
    color: '#334155',
    marginLeft: 8,
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  actionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A6FA5',
    width: 20,
  },
  actionText: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
  },
  aiDisclaimer: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E63946',
    paddingVertical: 16,
    borderRadius: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
});

export default VoiceTextNoteScreen;