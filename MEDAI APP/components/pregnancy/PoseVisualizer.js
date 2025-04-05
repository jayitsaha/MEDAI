// PoseVisualizer.js
import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

// Pose connections for drawing lines between keypoints
const POSE_CONNECTIONS = [
  ['nose', 'left_eye'], 
  ['nose', 'right_eye'], 
  ['left_eye', 'left_ear'],
  ['right_eye', 'right_ear'], 
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'], 
  ['right_shoulder', 'right_elbow'],
  ['left_elbow', 'left_wrist'], 
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'], 
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'], 
  ['left_hip', 'left_knee'],
  ['right_hip', 'right_knee'], 
  ['left_knee', 'left_ankle'],
  ['right_knee', 'right_ankle']
];

// Default joint importance weights
const JOINT_IMPORTANCE = {
  'nose': 0.7,
  'left_eye': 0.5,
  'right_eye': 0.5,
  'left_ear': 0.3,
  'right_ear': 0.3,
  'left_shoulder': 1.0,
  'right_shoulder': 1.0,
  'left_elbow': 0.8,
  'right_elbow': 0.8,
  'left_wrist': 0.7,
  'right_wrist': 0.7,
  'left_hip': 1.0,
  'right_hip': 1.0,
  'left_knee': 0.9,
  'right_knee': 0.9,
  'left_ankle': 0.8,
  'right_ankle': 0.8
};

// Common part names mapped to more readable form
const JOINT_READABLE_NAMES = {
  'nose': 'Head',
  'left_eye': 'L Eye',
  'right_eye': 'R Eye',
  'left_ear': 'L Ear',
  'right_ear': 'R Ear',
  'left_shoulder': 'L Shoulder',
  'right_shoulder': 'R Shoulder',
  'left_elbow': 'L Elbow',
  'right_elbow': 'R Elbow',
  'left_wrist': 'L Wrist',
  'right_wrist': 'R Wrist',
  'left_hip': 'L Hip',
  'right_hip': 'R Hip',
  'left_knee': 'L Knee',
  'right_knee': 'R Knee',
  'left_ankle': 'L Ankle',
  'right_ankle': 'R Ankle'
};

/**
 * Component for visualizing pose keypoints and skeleton
 */
const PoseVisualizer = ({ 
  keypoints, 
  color = 'rgba(255, 105, 180, 0.8)', 
  strokeWidth = 3, 
  screenWidth,
  screenHeight,
  showLabels = false,
  jointImportance = JOINT_IMPORTANCE,
  renderMode = 'high-quality'
}) => {
  if (!keypoints || keypoints.length < 5) return null;
  
  // Create a map for fast keypoint lookup
  const keypointMap = keypoints.reduce((map, kp) => {
    map[kp.part] = kp;
    return map;
  }, {});
  
  // Determine text color for labels
  const textColor = color === 'rgba(255, 105, 180, 0.8)' ? '#fff' : '#000';
  
  // Adjust visualization based on performance mode
  const showAllJoints = renderMode === 'high-quality';
  const showAllConnections = renderMode === 'high-quality';
  
  // Filter keypoints based on importance for low-quality mode
  const filteredKeypoints = showAllJoints ? 
    keypoints : 
    keypoints.filter(kp => jointImportance[kp.part] > 0.7);
  
  // Filter connections for low-quality mode
  const connectionsToShow = showAllConnections ? 
    POSE_CONNECTIONS : 
    POSE_CONNECTIONS.filter(([a, b]) => 
      (jointImportance[a] > 0.7 && jointImportance[b] > 0.7)
    );
  
  return (
    <Svg height="100%" width="100%" style={{position: 'absolute', top: 0, left: 0}}>
      {/* Draw connections (lines between joints) */}
      {connectionsToShow.map((pair, index) => {
        const p1 = keypointMap[pair[0]];
        const p2 = keypointMap[pair[1]];
        
        if (p1 && p2 && p1.position && p2.position) {
          const confidence = Math.min(p1.score || 0.5, p2.score || 0.5);
          
          // Skip if either keypoint has very low confidence
          if (confidence < 0.2) return null;
          
          // Scale position to screen dimensions
          const x1 = p1.position.x * screenWidth;
          const y1 = p1.position.y * screenHeight;
          const x2 = p2.position.x * screenWidth;
          const y2 = p2.position.y * screenHeight;
          
          // Adjust opacity based on confidence
          const opacity = 0.3 + (confidence * 0.7);
          const lineColor = color.replace(')', `, ${opacity})`).replace('rgba', 'rgba');
          
          return (
            <Line
              key={`line-${index}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={lineColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          );
        }
        return null;
      })}
      
      {/* Draw joints (circles) */}
      {filteredKeypoints.map((kp, index) => {
        if (kp && kp.position) {
          // Skip low-confidence keypoints
          if ((kp.score || 0.5) < 0.2) return null;
          
          // Scale to screen dimensions
          const x = kp.position.x * screenWidth;
          const y = kp.position.y * screenHeight;
          
          // Adjust joint size based on importance and confidence
          const importance = jointImportance[kp.part] || 0.5;
          const confidence = kp.score || 0.5;
          const baseSize = 4 + (importance * 4);
          const jointSize = baseSize * (0.5 + (confidence * 0.5));
          
          // Adjust opacity based on confidence
          const opacity = 0.3 + (confidence * 0.7);
          const jointColor = color.replace(')', `, ${opacity})`).replace('rgba', 'rgba');
          
          // For head region keypoints, use smaller circles
          const isHeadKeypoint = ['nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear'].includes(kp.part);
          const finalSize = isHeadKeypoint ? jointSize * 0.7 : jointSize;
          
          return (
            <React.Fragment key={`joint-${index}`}>
              <Circle
                cx={x}
                cy={y}
                r={finalSize}
                fill={jointColor}
              />
              
              {/* Optional labels */}
              {showLabels && importance > 0.7 && (
                <SvgText
                  x={x}
                  y={y - finalSize - 5}
                  fontSize="10"
                  fill={textColor}
                  textAnchor="middle"
                  fontWeight="bold"
                  stroke="#000"
                  strokeWidth="0.5"
                >
                  {JOINT_READABLE_NAMES[kp.part] || kp.part}
                </SvgText>
              )}
            </React.Fragment>
          );
        }
        return null;
      })}
    </Svg>
  );
};

export default React.memo(PoseVisualizer);