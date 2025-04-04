// PoseDetectionCamera.js
import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Dimensions } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useFaceDetector } from 'vision-camera-face-detector';
import Svg, { Circle, Line } from 'react-native-svg';
import { useIsFocused } from '@react-navigation/native';

// Simplified pose detection for React Native
// This uses face detection as an anchor point and estimates body position
const PoseDetectionCamera = ({ onPosesDetected, style, isActive }) => {
  const camera = useRef(null);
  const [detectedPoints, setDetectedPoints] = useState([]);
  const { width, height } = Dimensions.get('window');
  const devices = useCameraDevices();
  const device = devices.front;
  const isFocused = useIsFocused();
  
  // Face detector plugin
  const { frameProcessor, faces } = useFaceDetector({
    fps: 5, // Lower for better performance
  });
  
  // Process camera frame
  const onFrameProcessor = useCallback((frame) => {
    'worklet';
    if (!isActive) return;
    
    // Run face detection
    const detectedFaces = frameProcessor(frame);
    if (detectedFaces && detectedFaces.length > 0) {
      // Generate estimated body keypoints based on face position
      const keypoints = estimateBodyFromFace(detectedFaces[0], frame);
      runOnJS(setDetectedPoints)(keypoints);
      runOnJS(onPosesDetected)(keypoints);
    }
  }, [isActive, frameProcessor]);
  
  // Generate estimated body keypoints based on face
  const estimateBodyFromFace = (face, frame) => {
    'worklet';
    
    // Get normalized face position
    const { bounds } = face;
    const { width: frameWidth, height: frameHeight } = frame;
    
    // Face center point
    const faceCenterX = (bounds.origin.x + bounds.size.width / 2) / frameWidth;
    const faceCenterY = (bounds.origin.y + bounds.size.height / 2) / frameHeight;
    const faceWidth = bounds.size.width / frameWidth;
    
    // Calculate body points relative to face
    const bodyHeight = faceWidth * 9; // Face is approximately 1/9 of body height
    
    // Basic body keypoints based on face position
    return [
      // Head
      {
        part: 'nose',
        position: { x: faceCenterX, y: faceCenterY },
        score: 0.9
      },
      // Shoulders
      {
        part: 'left_shoulder',
        position: { 
          x: faceCenterX - faceWidth * 1.5, 
          y: faceCenterY + faceWidth * 2.5 
        },
        score: 0.8
      },
      {
        part: 'right_shoulder',
        position: { 
          x: faceCenterX + faceWidth * 1.5, 
          y: faceCenterY + faceWidth * 2.5 
        },
        score: 0.8
      },
      // Elbows
      {
        part: 'left_elbow',
        position: { 
          x: faceCenterX - faceWidth * 2.5, 
          y: faceCenterY + faceWidth * 4 
        },
        score: 0.7
      },
      {
        part: 'right_elbow',
        position: { 
          x: faceCenterX + faceWidth * 2.5, 
          y: faceCenterY + faceWidth * 4 
        },
        score: 0.7
      },
      // Wrists
      {
        part: 'left_wrist',
        position: { 
          x: faceCenterX - faceWidth * 3, 
          y: faceCenterY + faceWidth * 5.5 
        },
        score: 0.6
      },
      {
        part: 'right_wrist',
        position: { 
          x: faceCenterX + faceWidth * 3, 
          y: faceCenterY + faceWidth * 5.5 
        },
        score: 0.6
      },
      // Hips
      {
        part: 'left_hip',
        position: { 
          x: faceCenterX - faceWidth, 
          y: faceCenterY + faceWidth * 5.5 
        },
        score: 0.8
      },
      {
        part: 'right_hip',
        position: { 
          x: faceCenterX + faceWidth, 
          y: faceCenterY + faceWidth * 5.5 
        },
        score: 0.8
      },
      // Knees
      {
        part: 'left_knee',
        position: { 
          x: faceCenterX - faceWidth * 1.2, 
          y: faceCenterY + faceWidth * 8 
        },
        score: 0.7
      },
      {
        part: 'right_knee',
        position: { 
          x: faceCenterX + faceWidth * 1.2, 
          y: faceCenterY + faceWidth * 8 
        },
        score: 0.7
      },
      // Ankles
      {
        part: 'left_ankle',
        position: { 
          x: faceCenterX - faceWidth * 1.3, 
          y: faceCenterY + faceWidth * 10.5 
        },
        score: 0.6
      },
      {
        part: 'right_ankle',
        position: { 
          x: faceCenterX + faceWidth * 1.3, 
          y: faceCenterY + faceWidth * 10.5 
        },
        score: 0.6
      }
    ];
  };
  
  // Define connections between keypoints
  const POSE_CONNECTIONS = [
    ['nose', 'left_shoulder'],
    ['nose', 'right_shoulder'],
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
  
  // Render pose overlay
  const renderPoseOverlay = () => {
    if (!detectedPoints || detectedPoints.length < 5) return null;
    
    return (
      <Svg style={StyleSheet.absoluteFill}>
        {/* Connections */}
        {POSE_CONNECTIONS.map((connection, index) => {
          const startPoint = detectedPoints.find(p => p.part === connection[0]);
          const endPoint = detectedPoints.find(p => p.part === connection[1]);
          
          if (startPoint && endPoint) {
            return (
              <Line
                key={`line-${index}`}
                x1={startPoint.position.x * width}
                y1={startPoint.position.y * height}
                x2={endPoint.position.x * width}
                y2={endPoint.position.y * height}
                stroke="#FF69B4"
                strokeWidth={3}
              />
            );
          }
          return null;
        })}
        
        {/* Keypoints */}
        {detectedPoints.map((point, index) => (
          <Circle
            key={`point-${index}`}
            cx={point.position.x * width}
            cy={point.position.y * height}
            r={4 + point.score * 2}
            fill="#FF69B4"
          />
        ))}
      </Svg>
    );
  };
  
  if (!device) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color="#FF69B4" />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, style]}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive && isFocused}
        frameProcessor={onFrameProcessor}
        frameProcessorFps={5}
      />
      {renderPoseOverlay()}
      {props.children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
  },
});

export default PoseDetectionCamera;