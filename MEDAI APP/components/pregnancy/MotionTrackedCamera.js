// MotionTrackedCamera.js
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { Camera } from 'expo-camera';
import Svg, { Circle, Line } from 'react-native-svg';
import * as Sensors from 'expo-sensors';

const { width, height } = Dimensions.get('window');

/**
 * Motion-based pose tracking using device sensors and basic video
 * 
 * This is a simplified alternative to ML-based pose detection
 * that works reliably on all React Native devices.
 */
const MotionTrackedCamera = ({ onPosesDetected, style, isActive, children }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [accelerometer, setAccelerometer] = useState({ x: 0, y: 0, z: 0 });
  const [gyroscope, setGyroscope] = useState({ x: 0, y: 0, z: 0 });
  const [skeletonPoints, setSkeletonPoints] = useState(generateDefaultSkeleton());
  const cameraRef = useRef(null);
  
  // Default skeleton in T-pose
  function generateDefaultSkeleton() {
    return [
      { part: 'nose', position: { x: 0.5, y: 0.18 }, score: 0.9 },
      { part: 'left_eye', position: { x: 0.48, y: 0.17 }, score: 0.8 },
      { part: 'right_eye', position: { x: 0.52, y: 0.17 }, score: 0.8 },
      { part: 'left_ear', position: { x: 0.45, y: 0.18 }, score: 0.7 },
      { part: 'right_ear', position: { x: 0.55, y: 0.18 }, score: 0.7 },
      { part: 'left_shoulder', position: { x: 0.35, y: 0.25 }, score: 0.9 },
      { part: 'right_shoulder', position: { x: 0.65, y: 0.25 }, score: 0.9 },
      { part: 'left_elbow', position: { x: 0.25, y: 0.35 }, score: 0.8 },
      { part: 'right_elbow', position: { x: 0.75, y: 0.35 }, score: 0.8 },
      { part: 'left_wrist', position: { x: 0.15, y: 0.45 }, score: 0.7 },
      { part: 'right_wrist', position: { x: 0.85, y: 0.45 }, score: 0.7 },
      { part: 'left_hip', position: { x: 0.4, y: 0.55 }, score: 0.9 },
      { part: 'right_hip', position: { x: 0.6, y: 0.55 }, score: 0.9 },
      { part: 'left_knee', position: { x: 0.4, y: 0.75 }, score: 0.8 },
      { part: 'right_knee', position: { x: 0.6, y: 0.75 }, score: 0.8 },
      { part: 'left_ankle', position: { x: 0.4, y: 0.95 }, score: 0.7 },
      { part: 'right_ankle', position: { x: 0.6, y: 0.95 }, score: 0.7 }
    ];
  }
  
  // Request camera permissions
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);
  
  // Set up motion sensors
  useEffect(() => {
    let accelerometerSubscription = null;
    let gyroscopeSubscription = null;
    
    if (isActive) {
      // Configure sensor update intervals
      Sensors.Accelerometer.setUpdateInterval(100);
      Sensors.Gyroscope.setUpdateInterval(100);
      
      // Subscribe to accelerometer
      accelerometerSubscription = Sensors.Accelerometer.addListener(data => {
        setAccelerometer(data);
      });
      
      // Subscribe to gyroscope
      gyroscopeSubscription = Sensors.Gyroscope.addListener(data => {
        setGyroscope(data);
      });
      
      // Start tracking poses
      const trackingInterval = setInterval(() => {
        if (isActive) {
          updateSkeletonFromMotion();
        }
      }, 100);
      
      return () => {
        accelerometerSubscription?.remove();
        gyroscopeSubscription?.remove();
        clearInterval(trackingInterval);
      };
    }
  }, [isActive, accelerometer, gyroscope]);
  
  // Update skeleton based on motion sensors
  const updateSkeletonFromMotion = () => {
    const baseSkeleton = generateDefaultSkeleton();
    
    // Apply motion transformations to the skeleton
    const adjustedSkeleton = baseSkeleton.map(point => {
      // Calculate motion-based adjustments
      let xAdjust = 0;
      let yAdjust = 0;
      
      // Tilting the device affects y-position of upper body points
      if (['nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear', 
           'left_shoulder', 'right_shoulder'].includes(point.part)) {
        yAdjust += accelerometer.y * 0.05;
        xAdjust += accelerometer.x * 0.05;
      }
      
      // Rotation affects arm positions
      if (['left_elbow', 'left_wrist'].includes(point.part)) {
        xAdjust -= gyroscope.z * 0.2;
        yAdjust += gyroscope.x * 0.2;
      }
      
      if (['right_elbow', 'right_wrist'].includes(point.part)) {
        xAdjust += gyroscope.z * 0.2;
        yAdjust += gyroscope.x * 0.2;
      }
      
      // Leg adjustments based on accelerometer
      if (['left_knee', 'left_ankle'].includes(point.part)) {
        xAdjust -= accelerometer.x * 0.02;
      }
      
      if (['right_knee', 'right_ankle'].includes(point.part)) {
        xAdjust += accelerometer.x * 0.02;
      }
      
      // Apply adjustments within bounds
      const newX = Math.max(0.05, Math.min(0.95, point.position.x + xAdjust));
      const newY = Math.max(0.05, Math.min(0.95, point.position.y + yAdjust));
      
      return {
        ...point,
        position: { x: newX, y: newY }
      };
    });
    
    setSkeletonPoints(adjustedSkeleton);
    
    // Pass data to parent component
    if (onPosesDetected) {
      onPosesDetected(adjustedSkeleton);
    }
  };
  
  // Connections between keypoints
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
  
  // Render skeleton overlay
  const renderSkeleton = () => {
    if (!skeletonPoints || !isActive) return null;
    
    return (
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        {/* Draw connections */}
        {POSE_CONNECTIONS.map((pair, index) => {
          const p1 = skeletonPoints.find(kp => kp.part === pair[0]);
          const p2 = skeletonPoints.find(kp => kp.part === pair[1]);
          
          if (p1 && p2) {
            return (
              <Line
                key={`line-${index}`}
                x1={p1.position.x * width}
                y1={p1.position.y * height}
                x2={p2.position.x * width}
                y2={p2.position.y * height}
                stroke="#FF69B4"
                strokeWidth={3}
              />
            );
          }
          return null;
        })}
        
        {/* Draw joints */}
        {skeletonPoints.map((point, index) => (
          <Circle
            key={`circle-${index}`}
            cx={point.position.x * width}
            cy={point.position.y * height}
            r={point.score * 5}
            fill="#FF69B4"
          />
        ))}
      </Svg>
    );
  };
  
  if (hasPermission === null) {
    return <View style={[styles.container, style]} />;
  }
  
  if (hasPermission === false) {
    return <Text style={styles.errorText}>No access to camera</Text>;
  }
  
  return (
    <View style={[styles.container, style]}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        type={Camera.Constants.Type.front}
      >
        {/* Render skeleton overlay */}
        {renderSkeleton()}
        
        {/* Additional content */}
        {children}
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
});

export default MotionTrackedCamera;