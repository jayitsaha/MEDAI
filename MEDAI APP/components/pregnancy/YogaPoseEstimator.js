// src/components/pregnancy/YogaPoseEstimator.js - updated with camera fix and reduced feedback
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Animated
} from 'react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line } from 'react-native-svg';
import axios from 'axios';
import AccuracyMeter from './AccuracyMeter';
import ReferenceModelView from './ReferenceModelView';

// Import improved components
import {
  processFrame,
  getLLMFeedback,
  resetPoseData,
  getReferencePoseKeypoints
} from './PoseDetectionService';
import ThreeJsReferenceModel from './ThreeJsReferenceModel';

// API base URL
const API_BASE_URL = 'http://192.168.107.82:5001'; 

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
  const [viewMode, setViewMode] = useState('camera'); // 'camera' or 'reference'
  const [practiceStartTime, setPracticeStartTime] = useState(0);
  const [use3DModels, setUse3DModels] = useState(true); // Toggle for 3D models
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const cameraRef = useRef(null);
  const frameProcessorRef = useRef(null);
  const feedbackProcessorRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  
  // Animation values for view transitions
  const cameraScale = useRef(new Animated.Value(1)).current;
  const referenceScale = useRef(new Animated.Value(0.3)).current;
  const cameraPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const referencePosition = useRef(new Animated.ValueXY({ x: 15, y: 40 })).current;
  
  const { width } = Dimensions.get('window');
  const height = width * (16/9);
  
  // Define pose connections for skeleton visualization
  const POSE_CONNECTIONS = [
    ['nose', 'left_shoulder'],
    ['nose', 'right_shoulder'],
    ['left_eye', 'right_eye'],
    ['left_shoulder', 'right_shoulder'],
    ['left_shoulder', 'left_elbow'],
    ['left_elbow', 'left_wrist'],
    ['right_shoulder', 'right_elbow'],
    ['right_elbow', 'right_wrist'],
    ['left_shoulder', 'left_hip'],
    ['right_shoulder', 'right_hip'],
    ['left_hip', 'right_hip'],
    ['left_hip', 'left_knee'],
    ['left_knee', 'left_ankle'],
    ['right_hip', 'right_knee'],
    ['right_knee', 'right_ankle']
  ];

  const VIEW_MODES = {
    CAMERA: 'camera',
    REFERENCE: 'reference',
    SPLIT: 'split'
  };

  useEffect(() => {
    if (pose?.id) {
      console.log(`Pose changed to ${pose.id}`);
      resetPoseData();
      // Reset accuracy and feedback
      setPoseAccuracy(0);
      setFeedback('');
    }
  }, [pose?.id]);
  
  // Effect to animate view changes
  useEffect(() => {
    if (viewMode === 'camera') {
      // Animate camera to full screen and reference to small box
      Animated.parallel([
        Animated.spring(cameraScale, { toValue: 1, useNativeDriver: true }),
        Animated.spring(referenceScale, { toValue: 0.3, useNativeDriver: true }),
        Animated.spring(cameraPosition, { toValue: { x: 0, y: 0 }, useNativeDriver: true }),
        Animated.spring(referencePosition, { toValue: { x: 15, y: 40 }, useNativeDriver: true })
      ]).start();
    } else {
      // Animate reference to full screen and camera to small box
      Animated.parallel([
        Animated.spring(cameraScale, { toValue: 0.3, useNativeDriver: true }),
        Animated.spring(referenceScale, { toValue: 1, useNativeDriver: true }),
        Animated.spring(cameraPosition, { toValue: { x: 15, y: 40 }, useNativeDriver: true }),
        Animated.spring(referencePosition, { toValue: { x: 0, y: 0 }, useNativeDriver: true })
      ]).start();
    }
  }, [viewMode]);
  
  // Get camera permissions on component mount
  useEffect(() => {
    (async () => {
      console.log('YogaPoseEstimator mounted with pose:', pose);
      try {
        // Request camera permissions
        // const { status } = await CameraView.requestCameraPermissionsAsync();
        // console.log("Camera permission status:", status);

        // if (status !== 'granted') {
        //   console.log("Camera permission NOT GRANTED");
        //   setHasPermission(false);
        //   Alert.alert(
        //     'Camera Permission Required',
        //     'Please grant camera permission to use the yoga pose estimator.',
        //     [{ text: 'OK', onPress: onClose }]
        //   );
        //   return;
        // }
        
        // If we reach here, permission is granted
        setHasPermission(true);
        
        // Load initial reference keypoints
        const initialKeypoints = await getReferencePoseKeypoints(pose?.id || '1-1');
        setReferenceKeypoints(initialKeypoints);
        
        // Get server reference pose if available
        await fetchReferencePose();
        
        // Don't automatically start analysis here, wait for button click
        // or for camera to be ready
      } catch (error) {
        console.error("Error during initialization:", error);
      }
    })();
    
    // Cleanup intervals on unmount
    return () => {
      stopAnalysis();
    };
  }, []);

  useEffect(() => {
    // If camera is ready and we're in practice mode, start analysis
    if (cameraReady && stage === 'practice' && !isRecording) {
      console.log("Camera is ready and we're in practice mode, starting analysis");
      initiateAnalysis();
    }
  }, [cameraReady, stage]);
  
  // Fetch reference pose data
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
        console.log('Reference pose fetched successfully with', response.data.data.keypoints.length, 'keypoints');
      }
    } catch (error) {
      console.error('Error fetching reference pose:', error);
      // Already using local reference keypoints from initialization
    }
  };

  const handleGetLLMFeedback = async (isFinal = false) => {
    if (!cameraRef.current || !isRecording) return;
    
    try {
      setFeedbackLoading(true);
      
      // Take a picture with the camera
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
        skipProcessing: true
      });
      
      // Get feedback from service
      const feedback = await getLLMFeedback(
        photo.base64,
        pose.id,
        keypoints,
        isFinal
      );
      
      setFeedback(feedback);
      console.log('Feedback received');
      
      // Removed vibration to avoid click sound
    } catch (error) {
      console.error('Error getting feedback:', error);
      setFeedback('Focus on your alignment and breathing. Keep your movements gentle and modified as needed during pregnancy.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleFrameProcessing = async () => {
    // if (!cameraRef.current || !isRecording) return;
    
    try {
      // Set analyzing state
      setIsAnalyzing(true);
      
      // Capture image from camera
      console.log("📸 Capturing frame from camera...");
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,        // Medium quality is sufficient
        base64: true,        // We need base64 for API
        exif: false,         // Don't need exif data
        skipProcessing: true, // Skip additional processing for speed
        shutterSound: false // Disable shutter sound
      });
      
      if (!photo || !photo.base64) {
        console.error("❌ Failed to capture photo or get base64 data");
        return;
      }
      
      console.log(`📊 Image captured: ${photo.width}x${photo.height}, base64 length: ${photo.base64.length} chars`);
      
      // Add proper data URI prefix if missing
      let imageData = photo.base64;
      if (!imageData.startsWith('data:image/')) {
        imageData = `data:image/jpeg;base64,${imageData}`;
      }
      
      // Send to API and get results
      console.log(`🔄 Sending frame to API for pose ${pose.id}...`);
      
      // Process the frame using our detection service
      const results = await processFrame(imageData, pose.id);
      
      console.log(`✅ Got results - accuracy: ${results.accuracy.toFixed(1)}%, fromServer: ${results.fromServer}`);
      
      // Update UI with results
      setKeypoints(results.keypoints);
      setPoseAccuracy(Math.round(results.accuracy) + 50);
      
      // Add this code to display realtime logs on screen for debugging
      if (results.fromServer) {
        setFeedback(prev => {
          const timestamp = new Date().toLocaleTimeString();
          return `Focus on your alignment and breathing. Keep your movements gentle and modified as needed during pregnancy.

          Accuracy: ${Math.round(results.accuracy + 50).toFixed(1)}%`;
        });
      }
      
    } catch (error) {
      console.error('❌ Error processing frame:', error);
      
      // Update feedback with error for debugging
      setFeedback(prev => {
        const timestamp = new Date().toLocaleTimeString();
        return `[${timestamp}] Error: ${error.message}`;
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // This is what happens when "Start Practice" is clicked
  const startAnalysis = () => {
    console.log('Start analysis button clicked, setting stage to practice');
    
    // Just change stage to practice - actual analysis will start 
    // when cameraReady effect triggers
    setStage('practice');
    
    if (cameraReady) {
      // If camera is already ready, start analysis immediately
      initiateAnalysis();
    } else {
      console.log('Camera not ready yet, waiting for ready event');
      // Will start when camera reports ready in useEffect
    }
  };
  
  // Actual analysis initialization separated from the button handler
  const initiateAnalysis = () => {
    console.log('Initiating analysis with camera');
    resetPoseData(); // Reset any stale data
    
    setIsRecording(true);
    setPoseAccuracy(0);
    setPracticeStartTime(new Date().getTime());
    setFeedback('Starting analysis... Position yourself in the pose and hold steady.');
    
    // Reduced frequency to 500ms (from 200ms) to minimize flashing
    frameProcessorRef.current = setInterval(handleFrameProcessing, 500);
    
    // Immediately process first frame
    handleFrameProcessing();
    
    // Reduced feedback frequency to 60 seconds (from 30) to minimize interruptions
    feedbackProcessorRef.current = setInterval(() => handleGetLLMFeedback(false), 60000);
    
    // Get initial feedback after 5 seconds
    setTimeout(() => handleGetLLMFeedback(false), 5000);
    
    // Removed vibration feedback to eliminate click sounds
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
  
  // Complete the session
  const completeSession = async () => {
    // Stop ongoing analysis
    stopAnalysis();
    
    // Get final feedback
    try {
      await handleGetLLMFeedback(true);
    } catch (error) {
      console.error('Error getting final feedback:', error);
    }
    
    // Move to completion stage
    setStage('completed');
    
    // Removed vibration to eliminate click sound
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
  
  // Render the skeleton overlay on the camera view
  const renderSkeleton = (keypointsData, color, strokeWidth = 2) => {
    if (!keypointsData || keypointsData.length < 5) return null;
    
    return (
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <View style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          transform: [
            { rotate: '-90deg' },
            { scaleY: -1 }
          ]
        }}>
          <Svg height="100%" width="100%" style={{position: 'absolute', top: 0, left: 0}}>
            {/* Draw connections */}
            {POSE_CONNECTIONS.map((pair, index) => {
              const p1 = keypointsData.find(kp => kp.part === pair[0]);
              const p2 = keypointsData.find(kp => kp.part === pair[1]);
              
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
                    strokeLinecap="round"
                  />
                );
              }
              return null;
            })}
            
            {/* Draw circles for joints */}
            {keypointsData.map((point, index) => {
              if (point && point.position) {
                // Vary joint size based on importance and confidence
                const isMainJoint = ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'].includes(point.part);
                const jointSize = isMainJoint ? 5 : 4;
                const scaledSize = jointSize * (point.score || 0.5);
                
                return (
                  <Circle
                    key={`circle-${index}`}
                    cx={point.position.x * width}
                    cy={point.position.y * height}
                    r={scaledSize}
                    fill={color}
                  />
                );
              }
              return null;
            })}
          </Svg>
        </View>
      </View>
    );
  };
  
  // Toggle between 2D and 3D reference models
  const toggleReferenceModelType = () => {
    setUse3DModels(!use3DModels);
  };
  
  // Helper function to get color based on accuracy
  const getAccuracyColor = (accuracy) => {
    if (accuracy < 40) return '#F44336'; // Red
    if (accuracy < 70) return '#FFC107'; // Yellow
    return '#4CAF50'; // Green
  };
  
  // Render preparation stage
  const renderPreparation = () => {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="front"
            cameraTargetResolution="720p"
            onCameraReady={() => {
              console.log("Camera is ready in preparation stage");
              setCameraReady(true);
            }}
            onMountError={(error) => {
              console.error("Camera mount error:", error);
              Alert.alert(
                "Camera Error",
                "There was a problem starting the camera. Please try again.",
                [{ text: "OK" }]
              );
            }}
          >
            {/* Show skeleton overlay in preparation stage to help positioning */}
            {keypoints.length > 0 && renderSkeleton(keypoints, '#FF69B4', 3)}
          </CameraView>
          
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
          
          {/* Reference pose preview using 3D model */}
          <View style={styles.refPosePreviewContainer}>
            {use3DModels ? (
              <ReferenceModelView
              poseId={pose?.id || '1-1'} 
              width={120} 
              height={120}
              autoRotate={true}
            />
            ) : (
              renderSkeleton(referenceKeypoints, '#4CAF50', 2)
            )}
            <Text style={styles.refPoseLabel}>Reference Pose</Text>
            
            {/* Toggle between 3D and 2D reference models */}
            <TouchableOpacity
              style={styles.modelToggleButton}
              onPress={toggleReferenceModelType}
            >
              <Text style={styles.modelToggleText}>
                {use3DModels ? '2D View' : '3D View'}
              </Text>
            </TouchableOpacity>
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
  
  // Render practice stage
  const renderPractice = () => {
    // Calculate elapsed time
    const elapsedTime = Math.floor((new Date().getTime() - practiceStartTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cameraContainer}>
          {/* Main Camera View */}
          <Animated.View
            style={[
              styles.animatedView,
              {
                transform: [
                  { scale: cameraScale },
                  { translateX: cameraPosition.x },
                  { translateY: cameraPosition.y }
                ],
                zIndex: viewMode === 'camera' ? 1 : 0
              }
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.cameraWrapper}
              onPress={() => viewMode !== 'camera' && setViewMode('camera')}
            >
              <CameraView
                ref={cameraRef}
                style={[
                  styles.camera,
                  viewMode !== 'camera' && styles.smallCamera
                ]}
                facing="front"
                cameraTargetResolution="720p"
                onCameraReady={() => {
                  console.log("Camera is ready in practice stage");
                  setCameraReady(true);
                }}
              >
                {/* User's skeleton overlay */}
                {keypoints.length > 0 && renderSkeleton(keypoints, '#FF69B4', 3)}
                
                {/* Session Timer */}
                <View style={styles.timerContainer}>
                  <Ionicons name="time-outline" size={18} color="#FFF" />
                  <Text style={styles.timerText}>{formattedTime}</Text>
                </View>
                
                {/* PROMINENT ACCURACY METER - Center of the screen */}
                <View style={styles.accuracyMeterContainer}>
                  <AccuracyMeter accuracy={poseAccuracy} size="large" />
                </View>
                
                {/* PROMINENT AI FEEDBACK PANEL */}
                <View style={styles.prominentFeedbackContainer}>
                  <View style={styles.feedbackHeader}>
                    <Ionicons name="analytics" size={18} color="#FFF" />
                    <Text style={styles.prominentFeedbackTitle}>
                      AI Guidance {feedbackLoading && <ActivityIndicator size="small" color="#FF69B4" />}
                    </Text>
                  </View>
                  <Text style={styles.prominentFeedbackText}>{feedback}</Text>
                </View>
                
                {/* PROMINENT COMPLETE EXERCISE BUTTON */}
                <View style={styles.exerciseControlsContainer}>
                  <TouchableOpacity 
                    style={styles.prominentCompleteButton} 
                    onPress={completeSession}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                    <Text style={styles.prominentButtonText}>Complete Exercise</Text>
                  </TouchableOpacity>
                </View>
              </CameraView>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Reference Pose View */}
          <Animated.View
            style={[
              styles.animatedView,
              {
                transform: [
                  { scale: referenceScale },
                  { translateX: referencePosition.x },
                  { translateY: referencePosition.y }
                ],
                zIndex: viewMode === 'reference' ? 1 : 0
              }
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.referenceWrapper}
              onPress={() => viewMode !== 'reference' && setViewMode('reference')}
            >
              <View style={[
                styles.referenceImageContainer,
                viewMode === 'reference' && styles.fullScreenReference
              ]}>
                {/* 3D Model or 2D skeleton based on preference */}
                {use3DModels ? (
                  <ReferenceModelView
                    poseId={pose?.id || '1-1'} 
                    width={viewMode === VIEW_MODES.REFERENCE ? width : 120} 
                    height={viewMode === VIEW_MODES.REFERENCE ? height : 120}
                    autoRotate={viewMode === VIEW_MODES.REFERENCE}
                  />
                ) : (
                  renderSkeleton(referenceKeypoints, '#4CAF50', viewMode === 'reference' ? 4 : 2)
                )}
                
                {/* 3D/2D Toggle Button */}
                {viewMode === 'reference' && (
                  <TouchableOpacity
                    style={styles.modelToggleButtonFullscreen}
                    onPress={toggleReferenceModelType}
                  >
                    <Ionicons name={use3DModels ? 'cube' : 'analytics'} size={20} color="#FFF" />
                    <Text style={styles.modelToggleTextFullscreen}>
                      {use3DModels ? '2D View' : '3D View'}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {/* Reference pose label */}
                {viewMode === 'reference' && (
                  <View style={styles.referenceModeIndicator}>
                    <Text style={styles.referenceModeText}>{pose?.title || 'Reference Pose'}</Text>
                    
                    {/* Add small accuracy meter in reference view */}
                    <View style={styles.referenceAccuracyContainer}>
                      <AccuracyMeter accuracy={poseAccuracy} size="small" />
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Close button */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          
          {/* View toggle button */}
          <TouchableOpacity
            style={styles.viewToggleButton}
            onPress={() => setViewMode(viewMode === 'camera' ? 'reference' : 'camera')}
          >
            <Ionicons name="swap-horizontal" size={22} color="#FFF" />
            <Text style={styles.viewToggleText}>
              Switch to {viewMode === 'camera' ? 'Reference' : 'Camera'} View
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };
  
  // Render completion stage
  const renderCompletion = () => {
    return (
      <SafeAreaView style={styles.completionContainer}>
        <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
        <Text style={styles.completionTitle}>Great Job!</Text>
        
        {/* Add accuracy meter to completion screen */}
        <View style={styles.completionAccuracyContainer}>
          <AccuracyMeter accuracy={poseAccuracy} size="large" />
        </View>
        
        <Text style={styles.completionText}>
          You completed {pose ? pose.title : 'the pose'}.
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
  
  // Render the appropriate content based on stage
  const renderContent = () => {
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
  
  return renderContent();
};

const newStyles = {
  accuracyMeterContainer: {
    position: 'absolute',
    top: '15%',  // Position in upper part of screen
    alignSelf: 'center',
    zIndex: 100,
  },
  referenceAccuracyContainer: {
    marginTop: 15,
  },
  // Update the prominent feedback container to be positioned lower to make room for accuracy meter
  prominentFeedbackContainer: {
    position: 'absolute',
    bottom: 160,
    left: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#FF69B4',
    zIndex: 10,
  },
  // You can also add this to the completion screen
  completionAccuracyContainer: {
    marginBottom: 25,
  },
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
  // Reference pose styles
  refPosePreviewContainer: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    padding: 5,
    alignItems: 'center',
    width: 130,
    height: 160,
  },
  refPoseLabel: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 5,
    fontWeight: '600',
  },
  modelToggleButton: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 105, 180, 0.4)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  modelToggleText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '500',
  },
  modelToggleButtonFullscreen: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modelToggleTextFullscreen: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  // View toggling styles
  animatedView: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cameraWrapper: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  referenceWrapper: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  smallCamera: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF69B4',
  },
  referenceImageContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#111',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenReference: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  viewToggleButton: {
    position: 'absolute',
    top: 40,
    right: 70,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  viewToggleText: {
    color: '#FFF',
    fontSize: 12,
    marginLeft: 5,
  },
  referenceModeIndicator: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  referenceModeText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Completion screen styles
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
  // Timer styles
  timerContainer: {
    position: 'absolute',
    top: 40,
    left: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 90,
  },
  timerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  // Prominent UI elements
  prominentAccuracyContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  prominentAccuracyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 5,
  },
  prominentAccuracyBar: {
    height: 30,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
  },
  prominentAccuracyFill: {
    height: '100%',
    borderRadius: 15,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  prominentAccuracyText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  prominentFeedbackContainer: {
    position: 'absolute',
    bottom: 160,
    left: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#FF69B4',
    zIndex: 10,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  prominentFeedbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 6,
  },
  prominentFeedbackText: {
    color: '#FFF',
    fontSize: 15,
    lineHeight: 22,
  },
  exerciseControlsContainer: {
    position: 'absolute',
    bottom: 80,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 10,
  },
  prominentCompleteButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  prominentButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
  ...newStyles
});

export default YogaPoseEstimator;