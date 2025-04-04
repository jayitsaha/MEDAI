// Enhanced body joint tracking with real-time pose detection
import React, { useState, useRef, useEffect } from 'react';
import { Camera } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as ScreenOrientation from 'expo-screen-orientation';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';

// Create a component that wraps the camera and provides real-time pose detection
export class PoseDetectionCamera extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tfReady: false,
      model: null,
      poses: [],
      cameraType: Camera.Constants.Type.front,
      orientation: ScreenOrientation.Orientation.PORTRAIT_UP
    };
    
    // Frame processor variables
    this.textureDims = { width: 1080, height: 1920 };
    this.tensorDims = { width: 152, height: 200 };
    
    // Tensor camera setup
    const TensorCamera = cameraWithTensors(Camera);
    this.TensorCamera = TensorCamera;
  }
  
  async componentDidMount() {
    // Initialize TensorFlow.js
    await tf.ready();
    
    // Set device orientation handler
    ScreenOrientation.addOrientationChangeListener(this.handleOrientation);
    
    // Load the MoveNet model for pose detection
    const detector = await this.loadPoseDetector();
    this.setState({ 
      tfReady: true,
      model: detector 
    });
  }
  
  componentWillUnmount() {
    ScreenOrientation.removeOrientationChangeListeners();
    // Clean up the model to free memory
    if (this.state.model) {
      this.state.model.dispose();
    }
  }
  
  // Handle device orientation changes
  handleOrientation = ({ orientationInfo }) => {
    this.setState({ orientation: orientationInfo.orientation });
  }
  
  // Load the pose detection model
  loadPoseDetector = async () => {
    const model = poseDetection.SupportedModels.MoveNet;
    const detector = await poseDetection.createDetector(
      model,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
        minPoseScore: 0.25
      }
    );
    return detector;
  }
  
  // Handle TensorFlow.js image tensor to detect poses
  handleCameraStream = async (images, updatePreview, gl) => {
    const { model } = this.state;
    const loop = async () => {
      if (!model || !this.props.isActive) {
        requestAnimationFrame(loop);
        return;
      }
      
      const imageTensor = images.next().value;
      
      if (imageTensor) {
        try {
          // Detect poses in the current frame
          const poses = await model.estimatePoses(imageTensor, {
            maxPoses: 1,
            flipHorizontal: this.state.cameraType === Camera.Constants.Type.front
          });
          
          this.setState({ poses });
          
          // Pass detected poses to parent component
          if (poses && poses.length > 0 && this.props.onPosesDetected) {
            // Transform keypoints format to match our application format
            const transformedKeypoints = this.transformKeypoints(poses[0]);
            this.props.onPosesDetected(transformedKeypoints);
          }
          
          tf.dispose(imageTensor);
        } catch (error) {
          console.error('Error estimating poses:', error);
        }
      }
      
      requestAnimationFrame(loop);
    };
    
    loop();
  }
  
  // Transform keypoints to our application format
  transformKeypoints = (pose) => {
    if (!pose || !pose.keypoints) return [];
    
    // MoveNet keypoint names to our application keypoint names mapping
    const keypointMap = {
      'nose': 'nose',
      'left_eye': 'left_eye',
      'right_eye': 'right_eye',
      'left_ear': 'left_ear',
      'right_ear': 'right_ear',
      'left_shoulder': 'left_shoulder',
      'right_shoulder': 'right_shoulder',
      'left_elbow': 'left_elbow',
      'right_elbow': 'right_elbow',
      'left_wrist': 'left_wrist',
      'right_wrist': 'right_wrist',
      'left_hip': 'left_hip',
      'right_hip': 'right_hip',
      'left_knee': 'left_knee',
      'right_knee': 'right_knee',
      'left_ankle': 'left_ankle',
      'right_ankle': 'right_ankle'
    };
    
    return pose.keypoints
      .filter(kp => kp.score > 0.3) // Filter low-confidence keypoints
      .map(kp => ({
        part: keypointMap[kp.name] || kp.name,
        position: {
          x: kp.x / this.tensorDims.width,
          y: kp.y / this.tensorDims.height
        },
        score: kp.score
      }));
  }
  
  // Render tensor camera
  render() {
    const { tfReady, cameraType } = this.state;
    const { style, resizeMode, autorender, cameraProps } = this.props;
    
    if (!tfReady) {
      return (
        <View style={[styles.loadingContainer, style]}>
          <ActivityIndicator size="large" color="#FF69B4" />
          <Text style={styles.loadingText}>Loading pose detection...</Text>
        </View>
      );
    }
    
    return (
      <View style={style}>
        <this.TensorCamera
          ref={ref => { this.camera = ref }}
          style={style}
          type={cameraType}
          cameraTextureHeight={this.textureDims.height}
          cameraTextureWidth={this.textureDims.width}
          resizeHeight={this.tensorDims.height}
          resizeWidth={this.tensorDims.width}
          resizeDepth={3}
          onReady={this.handleCameraStream}
          autorender={autorender}
          useCustomShadersToResize={false}
          {...cameraProps}
        />
        {this.props.children}
      </View>
    );
  }
}

// Pose overlay component using SVG for more accurate body tracking
export const BodyTrackingOverlay = ({ keypoints, connections, color, strokeWidth, width, height }) => {
  if (!keypoints || keypoints.length < 5) return null;
  
  // Skip rendering if dimensions are zero or invalid
  if (!width || !height || width <= 0 || height <= 0) return null;
  
  return (
    <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
      {/* Draw connections between keypoints */}
      {connections.map((pair, index) => {
        const p1 = keypoints.find(kp => kp.part === pair[0]);
        const p2 = keypoints.find(kp => kp.part === pair[1]);
        
        if (p1 && p2 && p1.position && p2.position && 
            p1.score > 0.3 && p2.score > 0.3) {
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
      
      {/* Draw joints with varying sizes based on confidence */}
      {keypoints.map((point, index) => {
        if (point && point.position && point.score > 0.3) {
          // Adjust size based on confidence and joint importance
          const isMainJoint = ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'].includes(point.part);
          const jointSize = isMainJoint ? 6 : 4;
          const adjustedSize = jointSize * Math.min(point.score + 0.3, 1);
          
          return (
            <Circle
              key={`circle-${index}`}
              cx={point.position.x * width}
              cy={point.position.y * height}
              r={adjustedSize}
              fill={color}
            />
          );
        }
        return null;
      })}
      
      {/* Add additional point for accuracy with minimal keypoints */}
      {keypoints.length < 10 && (
        <>
          <Circle cx={width/2} cy={height/2} r={2} fill="rgba(255,255,255,0.5)" />
          <Text
            x={width/2 + 10}
            y={height/2}
            fill="white"
            fontSize="10"
            textAnchor="start"
          >
            Stand back to be fully visible
          </Text>
        </>
      )}
    </Svg>
  );
};

// Standard body connections for human pose
export const POSE_CONNECTIONS = [
  ['nose', 'left_eye'],
  ['nose', 'right_eye'],
  ['left_eye', 'left_ear'],
  ['right_eye', 'right_ear'],
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

// Styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
  }
});