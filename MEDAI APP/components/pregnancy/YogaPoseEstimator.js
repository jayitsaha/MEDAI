// src/components/pregnancy/YogaPoseEstimator.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  Vibration
} from 'react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line } from 'react-native-svg';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.255.82:5001'; // Update to match your server URL

const YogaPoseEstimator = ({ pose, onClose, onComplete }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [poseAccuracy, setPoseAccuracy] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [keypoints, setKeypoints] = useState([]);
  const [referenceKeypoints, setReferenceKeypoints] = useState([]);
  const [stage, setStage] = useState('preparation'); // preparation, practice, completed
  
  const cameraRef = useRef(null);
  const frameProcessorRef = useRef(null);
  const feedbackProcessorRef = useRef(null);
  
  const { width } = Dimensions.get('window');
  const height = width * (16/9); // Maintain 16:9 aspect ratio
  
  // Get camera permissions on component mount
  useEffect(() => {
    (async () => {
      console.log('YogaPoseEstimator mounted with pose:', pose);
      const { status } = await CameraView.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        console.log("NOT GRANTED");
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to use the yoga pose estimator.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    })();
    
    // Test API connection
    testAPIConnection();
    
    // Get reference pose keypoints on component mount
    fetchReferencePose();
    
    // Cleanup intervals on unmount
    return () => {
      stopAnalysis();
    };
  }, []);
  
  // Test API connection
  const testAPIConnection = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/health`);
      console.log('API Connection Test:', response.data);
    } catch (error) {
      console.error('API Connection Failed:', error.message);
      Alert.alert(
        'API Connection Issue',
        'Could not connect to the AI server. Some features may not work correctly.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Fetch reference pose data from the server (LLM-generated)
  const fetchReferencePose = async () => {
    if (!pose || !pose.id) {
      console.error('No pose ID available for fetching reference');
      return;
    }

    console.log("Fetching reference pose for ID:", pose.id);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/yoga/reference-pose/${pose.id}`);
      if (response.data.success) {
        setReferenceKeypoints(response.data.data.keypoints);
        console.log('Reference pose fetched successfully');
      }
    } catch (error) {
      console.error('Error fetching reference pose:', error);
      setReferenceKeypoints([]); // Use empty array if fetch fails
    }
  };
  
  // Start analyzing yoga pose
  const startAnalysis = () => {
    console.log('Starting pose analysis');
    setIsRecording(true);
    setStage('practice');
    setPoseAccuracy(0);
    setFeedback('Starting analysis... Position yourself in the pose and hold steady.');
    
    // Process frames at regular intervals (every 500ms = 2fps)
    frameProcessorRef.current = setInterval(processFrame, 500);
    
    // Get AI feedback at regular intervals (every 30 seconds)
    feedbackProcessorRef.current = setInterval(getLLMFeedback, 30000);
    
    // Get initial feedback after 5 seconds to give user time to position
    setTimeout(getLLMFeedback, 5000);
  };
  
  // Stop analyzing yoga pose
  const stopAnalysis = () => {
    console.log('Stopping pose analysis');
    setIsRecording(false);
    
    // Clear intervals
    if (frameProcessorRef.current) {
      clearInterval(frameProcessorRef.current);
      frameProcessorRef.current = null;
    }
    
    if (feedbackProcessorRef.current) {
      clearInterval(feedbackProcessorRef.current);
      feedbackProcessorRef.current = null;
    }
  };
  
  // Process a single frame from the camera
  const processFrame = async () => {
    if (!cameraRef.current || isAnalyzing) return;
    
    try {
      setIsAnalyzing(true);
      
      // Capture frame from camera - updated for CameraView
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
        skipProcessing: true
      });
      
      // Send to backend for pose estimation
      const response = await axios.post(`${API_BASE_URL}/api/yoga/pose-estimation`, {
        image: photo.base64,
        poseId: pose.id
      });
      
      if (response.data.success) {
        const { accuracy, keypoints } = response.data.data;
        
        // Update state with results
        setPoseAccuracy(Math.round(accuracy));
        setKeypoints(keypoints);
      }
    } catch (error) {
      console.error('Error during pose estimation:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Get feedback from LLM
  const getLLMFeedback = async (isFinal = false) => {
    if (!cameraRef.current) return;
    
    try {
      setFeedbackLoading(true);
      
      // Capture frame for LLM analysis - updated for CameraView
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
        skipProcessing: true
      });
      
      // Send to backend for LLM feedback
      const response = await axios.post(`${API_BASE_URL}/api/yoga/posture-feedback`, {
        image: photo.base64,
        poseId: pose.id,
        isFinal,
        keypoints
      });
      
      if (response.data.success) {
        setFeedback(response.data.data.feedback);
        console.log('LLM feedback received');
      }
    } catch (error) {
      console.error('Error getting LLM feedback:', error);
      setFeedback('Unable to analyze your posture. Please check your position and try again.');
    } finally {
      setFeedbackLoading(false);
    }
  };
  
  // Complete the session
  const completeSession = async () => {
    // Stop ongoing analysis
    stopAnalysis();
    
    // Get final feedback
    try {
      await getLLMFeedback(true);
    } catch (error) {
      console.error('Error getting final feedback:', error);
    }
    
    // Move to completion stage
    setStage('completed');
  };
  
  // Save session and report back
  const saveSession = () => {
    console.log('Saving session');
    onComplete({
      poseId: pose.id,
      accuracy: poseAccuracy,
      feedback: feedback,
      duration: 'Live session',
      timestamp: new Date().toISOString()
    });
  };
  
  // Render skeleton overlay on the camera view
  const renderSkeleton = (points, color, strokeWidth = 2) => {
    if (!points || points.length < 15) return null;
    
    // Define connections between keypoints for stick figure
    const connections = [
      [0, 1], // nose to left eye
      [0, 2], // nose to right eye
      [1, 3], // left eye to left ear
      [2, 4], // right eye to right ear
      [5, 6], // left shoulder to right shoulder
      [5, 7], // left shoulder to left elbow
      [7, 9], // left elbow to left wrist
      [6, 8], // right shoulder to right elbow
      [8, 10], // right elbow to right wrist
      [5, 11], // left shoulder to left hip
      [6, 12], // right shoulder to right hip
      [11, 12], // left hip to right hip
      [11, 13], // left hip to left knee
      [13, 15], // left knee to left ankle
      [12, 14], // right hip to right knee
      [14, 16]  // right knee to right ankle
    ];
    
    return (
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        {/* Draw lines for connections */}
        {connections.map((pair, index) => {
          const p1 = points[pair[0]];
          const p2 = points[pair[1]];
          
          if (p1 && p2 && p1.position && p2.position) {
            return (
              <Line
                key={`line-${index}`}
                x1={p1.position.x * width}
                y1={p1.position.y * height}
                x2={p2.position.x * width}
                y2={p2.position.y * height}
                stroke={color}
                strokeWidth={strokeWidth}
              />
            );
          }
          return null;
        })}
        
        {/* Draw circles for joints */}
        {points.map((point, index) => {
          if (point && point.position) {
            return (
              <Circle
                key={`circle-${index}`}
                cx={point.position.x * width}
                cy={point.position.y * height}
                r={4}
                fill={color}
              />
            );
          }
          return null;
        })}
      </Svg>
    );
  };
  
  // Render preparation stage
  const renderPreparation = () => {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={"front"}
            cameraTargetResolution="720p"
          />
          
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.descriptionContainer}>
            <Text style={styles.poseName}>{pose ? pose.title : 'Loading pose...'}</Text>
            <Text style={styles.poseDescription}>{pose ? pose.description : 'Please wait...'}</Text>
            
            <View style={styles.instructionContainer}>
              <Ionicons name="information-circle" size={24} color="#FF69B4" />
              <Text style={styles.instructionText}>
                Position yourself so your full body is visible in the camera. The AI will analyze your pose in real-time.
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.startButton} 
            onPress={startAnalysis}
          >
            <Text style={styles.startButtonText}>Start Practice</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };
  
  // Render practice stage (live analysis)
  const renderPractice = () => {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={"front"}
            cameraTargetResolution="720p"
          />
          
          {/* User's skeleton overlay */}
          {keypoints.length > 0 && renderSkeleton(keypoints, '#FF69B4', 3)}
          
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          
          {/* Reference pose display */}
          <View style={styles.referenceContainer}>
            <View style={styles.referenceImageContainer}>
              <Image
                source={{ uri: pose && pose.imageUrl ? pose.imageUrl : 'https://via.placeholder.com/150' }}
                style={styles.referenceImage}
                resizeMode="contain"
              />
              {referenceKeypoints.length > 0 && renderSkeleton(referenceKeypoints, '#4CAF50', 2)}
            </View>
            <Text style={styles.referenceText}>Reference Pose</Text>
          </View>
          
          {/* Accuracy and feedback display */}
          <View style={styles.metricsContainer}>
            <View style={styles.accuracyContainer}>
              <Text style={styles.metricLabel}>Pose Accuracy</Text>
              <View style={[styles.accuracyBar, { borderColor: getAccuracyColor(poseAccuracy) }]}>
                <View 
                  style={[
                    styles.accuracyFill, 
                    { 
                      width: `${poseAccuracy}%`,
                      backgroundColor: getAccuracyColor(poseAccuracy)
                    }
                  ]} 
                />
                <Text style={styles.accuracyText}>{poseAccuracy}%</Text>
              </View>
            </View>
            
            <View style={styles.feedbackContainer}>
              <Text style={styles.metricLabel}>
                AI Guidance {feedbackLoading && <ActivityIndicator size="small" color="#FF69B4" />}
              </Text>
              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
          </View>
          
          {/* Complete button */}
          <TouchableOpacity 
            style={styles.completeButton} 
            onPress={completeSession}
          >
            <Text style={styles.completeButtonText}>Complete Practice</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };
  
  // Render completion stage
  const renderCompletion = () => {
    return (
      <SafeAreaView style={styles.completionContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        <Text style={styles.completionTitle}>Great Job!</Text>
        <Text style={styles.completionText}>
          You completed {pose ? pose.title : 'the pose'} with {poseAccuracy}% accuracy.
        </Text>
        
        <View style={styles.feedbackSummary}>
          <Text style={styles.feedbackTitle}>AI Feedback:</Text>
          <Text style={styles.feedbackSummaryText}>{feedback}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={saveSession}
        >
          <Text style={styles.saveButtonText}>Save Session</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.closeSessionButton} 
          onPress={onClose}
        >
          <Text style={styles.closeSessionButtonText}>Close</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  };
  
  // Render appropriate content based on stage
  const renderContent = () => {
    // if (hasPermission === null) {
    //   return (
    //     <View style={styles.loadingContainer}>
    //       <ActivityIndicator size="large" color="#FF69B4" />
    //       <Text style={styles.loadingText}>Loading camera...</Text>
    //     </View>
    //   );
    // }
    
    if (hasPermission === false) {
      return (
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#FF69B4" />
          <Text style={styles.errorText}>Camera permission denied</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (stage === 'preparation') {
      return renderPreparation();
    }
    
    if (stage === 'practice') {
      return renderPractice();
    }
    
    if (stage === 'completed') {
      return renderCompletion();
    }
    
    return null;
  };
  
  // Helper function to get color based on accuracy
  const getAccuracyColor = (accuracy) => {
    if (accuracy < 40) return '#F44336'; // Red
    if (accuracy < 70) return '#FFC107'; // Yellow
    return '#4CAF50'; // Green
  };
  
  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 15,
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  descriptionContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
  },
  poseName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  poseDescription: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 15,
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 105, 180, 0.2)',
    borderRadius: 12,
    padding: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#FFF',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  startButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#FF69B4',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  referenceContainer: {
    position: 'absolute',
    top: 40,
    left: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    padding: 5,
    alignItems: 'center',
    width: 120,
  },
  referenceImageContainer: {
    width: 110,
    height: 110,
    backgroundColor: '#222',
    borderRadius: 10,
    overflow: 'hidden',
  },
  referenceImage: {
    width: '100%',
    height: '100%',
  },
  referenceText: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 5,
  },
  metricsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
  },
  accuracyContainer: {
    marginBottom: 15,
  },
  metricLabel: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 5,
    fontWeight: '600',
  },
  accuracyBar: {
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    justifyContent: 'center',
  },
  accuracyFill: {
    height: '100%',
    borderRadius: 12,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  accuracyText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  feedbackContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
  },
  feedbackText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
  completeButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#FF69B4',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  completionContainer: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  completionText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  feedbackSummary: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  feedbackSummaryText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeSessionButton: {
    backgroundColor: 'transparent',
    borderRadius: 30,
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666',
  },
  closeSessionButtonText: {
    fontSize: 18,
    color: '#666',
  },
  button: {
    backgroundColor: '#FF69B4',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default YogaPoseEstimator;