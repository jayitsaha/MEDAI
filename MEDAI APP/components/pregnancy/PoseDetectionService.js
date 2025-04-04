// Improved PoseDetectionService.js
import { Dimensions } from 'react-native';
import axios from 'axios';

// API base URL - update this to match your actual server URL
// This should be configurable in your app settings
const API_BASE_URL = 'http://192.168.255.82:5001';

// Default keypoint positions for different poses (fallback only)
const DEFAULT_POSE_KEYPOINTS = {
    // Mountain Pose (1-1)
    '1-1': [
      { part: 'nose', position: { x: 0.5, y: 0.1 }, score: 1.0 },
      { part: 'left_eye', position: { x: 0.47, y: 0.09 }, score: 1.0 },
      { part: 'right_eye', position: { x: 0.53, y: 0.09 }, score: 1.0 },
      { part: 'left_ear', position: { x: 0.44, y: 0.1 }, score: 1.0 },
      { part: 'right_ear', position: { x: 0.56, y: 0.1 }, score: 1.0 },
      { part: 'left_shoulder', position: { x: 0.42, y: 0.22 }, score: 1.0 },
      { part: 'right_shoulder', position: { x: 0.58, y: 0.22 }, score: 1.0 },
      { part: 'left_elbow', position: { x: 0.4, y: 0.38 }, score: 1.0 },
      { part: 'right_elbow', position: { x: 0.6, y: 0.38 }, score: 1.0 },
      { part: 'left_wrist', position: { x: 0.38, y: 0.52 }, score: 1.0 },
      { part: 'right_wrist', position: { x: 0.62, y: 0.52 }, score: 1.0 },
      { part: 'left_hip', position: { x: 0.46, y: 0.54 }, score: 1.0 },
      { part: 'right_hip', position: { x: 0.54, y: 0.54 }, score: 1.0 },
      { part: 'left_knee', position: { x: 0.46, y: 0.74 }, score: 1.0 },
      { part: 'right_knee', position: { x: 0.54, y: 0.74 }, score: 1.0 },
      { part: 'left_ankle', position: { x: 0.46, y: 0.94 }, score: 1.0 },
      { part: 'right_ankle', position: { x: 0.54, y: 0.94 }, score: 1.0 }
    ],
    // Cat-Cow Stretch (1-2)
    '1-2': [
      { part: 'nose', position: { x: 0.5, y: 0.35 }, score: 1.0 },
      { part: 'left_eye', position: { x: 0.48, y: 0.33 }, score: 1.0 },
      { part: 'right_eye', position: { x: 0.52, y: 0.33 }, score: 1.0 },
      { part: 'left_ear', position: { x: 0.46, y: 0.34 }, score: 1.0 },
      { part: 'right_ear', position: { x: 0.54, y: 0.34 }, score: 1.0 },
      { part: 'left_shoulder', position: { x: 0.38, y: 0.4 }, score: 1.0 },
      { part: 'right_shoulder', position: { x: 0.62, y: 0.4 }, score: 1.0 },
      { part: 'left_elbow', position: { x: 0.3, y: 0.5 }, score: 1.0 },
      { part: 'right_elbow', position: { x: 0.7, y: 0.5 }, score: 1.0 },
      { part: 'left_wrist', position: { x: 0.25, y: 0.6 }, score: 1.0 },
      { part: 'right_wrist', position: { x: 0.75, y: 0.6 }, score: 1.0 },
      { part: 'left_hip', position: { x: 0.4, y: 0.65 }, score: 1.0 },
      { part: 'right_hip', position: { x: 0.6, y: 0.65 }, score: 1.0 },
      { part: 'left_knee', position: { x: 0.35, y: 0.75 }, score: 1.0 },
      { part: 'right_knee', position: { x: 0.65, y: 0.75 }, score: 1.0 },
      { part: 'left_ankle', position: { x: 0.3, y: 0.85 }, score: 1.0 },
      { part: 'right_ankle', position: { x: 0.7, y: 0.85 }, score: 1.0 }
    ],
  };
  

// Cached keypoints for interpolation
let lastServerKeypoints = null;
let lastKeypointsTimestamp = 0;
let previousFrameKeypoints = null;
let lastAccuracy = 50;

// Track server connection status
let serverHealth = {
  lastSuccess: 0,
  failedAttempts: 0,
  retryInterval: 5000 // 5 seconds between retries
};

/**
 * Process a camera frame to detect pose keypoints
 */
export const processFrame = async (imageData, poseId) => {

    console.log("IN PROCESS FRAME")
    try {
      const currentTime = Date.now();
      
      // Always try to use the server for the most accurate results
      // unless we've had multiple recent failures
      if (serverHealth.failedAttempts < 3 || currentTime - serverHealth.lastSuccess > serverHealth.retryInterval) {
        try {
          console.log(`🌐 Sending frame to server for pose ${poseId}`);
          
          // Make sure the image data is formatted correctly
          if (typeof imageData !== 'string') {
            throw new Error('Image data must be a string');
          }
          
          // Add proper data URI prefix if missing
          if (!imageData.startsWith('data:image/')) {
            imageData = `data:image/jpeg;base64,${imageData}`;
          }
          
          // Log the size for debugging
          console.log(`📊 Image data size: ~${Math.round(imageData.length/1000)}KB`);
          
          // Send to backend with a reasonable timeout
          const response = await axios.post(
            `${API_BASE_URL}/api/yoga/pose-estimation`,
            {
              image: imageData,
              poseId: poseId
            },
            { 
              timeout: 5000,  // 5 second timeout
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            }
          );
          
          console.log(`📡 Server response status: ${response.status}`);
          
          if (response.data && response.data.success) {
            console.log(`✅ Server response received: ${response.data.data.accuracy}% accuracy`);
            
            // Save server data for next frame
            lastServerKeypoints = response.data.data.keypoints;
            lastKeypointsTimestamp = currentTime;
            lastAccuracy = response.data.data.accuracy;
            
            // Update server health
            serverHealth.lastSuccess = currentTime;
            serverHealth.failedAttempts = 0;
            
            // Initialize previous keypoints if needed
            if (!previousFrameKeypoints) {
              previousFrameKeypoints = lastServerKeypoints;
            }
            
            // Return the server keypoints directly
            return {
              keypoints: lastServerKeypoints,
              accuracy: response.data.data.accuracy,
              fromServer: true
            };
          } else {
            throw new Error('Invalid server response format');
          }
        } catch (error) {
          console.warn(`❌ Server request failed: ${error.message}`);
          serverHealth.failedAttempts++;
          
          // Log detailed error information
          if (error.response) {
            console.error(`Server responded with status ${error.response.status}`);
            console.error('Response data:', error.response.data);
          } else if (error.request) {
            console.error('No response received from server');
          }
        }
      } else {
        console.log(`⏳ Skipping server request, using local processing (failed attempts: ${serverHealth.failedAttempts})`);
      }
      
      // If server request failed or wasn't attempted, use interpolation
      if (lastServerKeypoints && previousFrameKeypoints) {
        console.log('📊 Using interpolated keypoints');
        
        // Interpolate between previous and target keypoints
        const interpolatedKeypoints = interpolateKeypoints(
          previousFrameKeypoints, 
          lastServerKeypoints,
          0.3 // Smoothing factor - higher = more responsive
        );
        
        // Add some random variation to simulate movement
        const keypointsWithVariation = addNaturalVariation(interpolatedKeypoints);
        
        // Add small variation to accuracy too for more responsive feel
        const randomVariation = (Math.random() - 0.5) * 3;
        const displayAccuracy = Math.max(0, Math.min(100, lastAccuracy + randomVariation));
        
        // Save for next frame
        previousFrameKeypoints = keypointsWithVariation;
        
        return {
          keypoints: keypointsWithVariation,
          accuracy: displayAccuracy,
          fromServer: false
        };
      }
      
      // If all else fails, return default keypoints
      console.log('⚠️ Using default keypoints');
      const defaultKeypoints = poseId in DEFAULT_POSE_KEYPOINTS 
        ? DEFAULT_POSE_KEYPOINTS[poseId] 
        : DEFAULT_POSE_KEYPOINTS['1-1']; // Default to mountain pose
        
      // Initialize the previous keypoints for next interpolation
      if (!previousFrameKeypoints) {
        previousFrameKeypoints = addNaturalVariation(defaultKeypoints);
      }
      
      return {
        keypoints: addNaturalVariation(defaultKeypoints),
        accuracy: 50, // Neutral default
        fromServer: false
      };
    } catch (error) {
      console.error('❌ Error in processFrame:', error);
      
      // If we have previous keypoints, use those with variation
      if (previousFrameKeypoints) {
        return {
          keypoints: addNaturalVariation(previousFrameKeypoints),
          accuracy: lastAccuracy || 50,
          fromServer: false
        };
      }
      
      // Last resort - use default pose
      return {
        keypoints: DEFAULT_POSE_KEYPOINTS[poseId] || DEFAULT_POSE_KEYPOINTS['1-1'],
        accuracy: 50,
        fromServer: false
      };
    }
  };

/**
 * Interpolate between two sets of keypoints for smoother transitions
 */
const interpolateKeypoints = (previousKeypoints, targetKeypoints, factor = 0.2) => {
  // Create a map of previous keypoints for easy lookup
  const prevKeypointMap = {};
  previousKeypoints.forEach(kp => {
    prevKeypointMap[kp.part] = kp;
  });

  // Interpolate each keypoint
  return targetKeypoints.map(targetKp => {
    const prevKp = prevKeypointMap[targetKp.part];
    if (!prevKp) return targetKp; // If no previous keypoint, use target directly
    
    // Linear interpolation for position
    const interpolatedPosition = {
      x: prevKp.position.x + (targetKp.position.x - prevKp.position.x) * factor,
      y: prevKp.position.y + (targetKp.position.y - prevKp.position.y) * factor
    };
    
    // Interpolate score as well
    const interpolatedScore = prevKp.score + (targetKp.score - prevKp.score) * factor;
    
    return {
      part: targetKp.part,
      position: interpolatedPosition,
      score: interpolatedScore
    };
  });
};

/**
 * Add small random variations to keypoints to simulate natural movement
 */
const addNaturalVariation = (keypoints) => {
  return keypoints.map(kp => {
    // Smaller variation for important points like shoulders, hips
    const isStablePoint = ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'].includes(kp.part);
    const variationFactor = isStablePoint ? 0.002 : 0.005;
    
    // Generate small random variations
    const xVariation = (Math.random() - 0.5) * variationFactor;
    const yVariation = (Math.random() - 0.5) * variationFactor;
    
    return {
      ...kp,
      position: {
        x: Math.max(0, Math.min(1, kp.position.x + xVariation)),
        y: Math.max(0, Math.min(1, kp.position.y + yVariation))
      }
    };
  });
};

/**
 * Get LLM feedback on yoga pose
 */
export const getLLMFeedback = async (imageData, poseId, keypoints, isFinal = false) => {
  try {
    console.log(`Getting feedback for pose ${poseId}, final=${isFinal}`);
    
    // Send to backend
    const response = await axios.post(
      `${API_BASE_URL}/api/yoga/posture-feedback`,
      {
        image: imageData,
        poseId: poseId,
        isFinal,
        keypoints
      },
      { timeout: 5000 } // 5 second timeout
    );
    
    if (response.data && response.data.success && response.data.data.feedback) {
      console.log('Feedback received from server');
      return response.data.data.feedback;
    }
    
    throw new Error('Invalid feedback response');
  } catch (error) {
    console.error('Error getting LLM feedback:', error);
    
    // Generate fallback feedback locally
    return generateLocalFeedback(poseId, isFinal);
  }
};

/**
 * Generate fallback feedback locally
 */
const generateLocalFeedback = (poseId, isFinal) => {
  // Map of pose IDs to names
  const poseNames = {
    '1-1': 'Mountain Pose',
    '1-2': 'Cat-Cow Stretch',
    '1-3': 'Seated Side Stretch',
    '2-1': 'Warrior II',
    '2-2': 'Wide-Legged Forward Fold',
    '2-3': 'Triangle Pose',
    '3-1': 'Modified Squat',
    '3-2': 'Butterfly Pose',
    '3-3': 'Side-Lying Relaxation'
  };
  
  const poseName = poseNames[poseId] || 'Yoga Pose';
  
  // Feedback templates
  const feedbackTemplates = {
    initial: [
      `Focus on your alignment in ${poseName}. Keep your breathing steady and deep.`,
      `For ${poseName}, ensure your foundation is stable. This creates support for your body.`,
      `In ${poseName}, remember to engage your core gently to support your pregnancy.`,
      `Notice how your body responds to ${poseName}. Make any adjustments needed for comfort.`
    ],
    final: [
      `Great practice with ${poseName}! Continue to build strength and stability with regular practice.`,
      `You've completed your ${poseName} practice. Remember to honor your body's needs as your pregnancy progresses.`,
      `Well done with ${poseName}. As your pregnancy advances, continue to modify poses as needed for comfort.`,
      `Excellent work with ${poseName}. Your consistent practice supports your wellbeing during pregnancy.`
    ]
  };
  
  // Select random feedback from appropriate template
  const templates = isFinal ? feedbackTemplates.final : feedbackTemplates.initial;
  const randomIndex = Math.floor(Math.random() * templates.length);
  
  return templates[randomIndex];
};

/**
 * Reset cached data when changing poses
 */
export const resetPoseData = () => {
  lastServerKeypoints = null;
  lastKeypointsTimestamp = 0;
  previousFrameKeypoints = null;
  lastAccuracy = 50;
};

/**
 * Get reference pose keypoints from server
 */
export const getReferencePoseKeypoints = async (poseId) => {
  try {
    // Try to get from server
    const response = await axios.get(
      `${API_BASE_URL}/api/yoga/reference-pose/${poseId}`,
      { timeout: 3000 }
    );
    
    if (response.data.success && response.data.data.keypoints) {
      return response.data.data.keypoints;
    }
  } catch (error) {
    console.error('Error getting reference pose:', error);
  }
  
  // Fallback to local defaults
  if (poseId in DEFAULT_POSE_KEYPOINTS) {
    return DEFAULT_POSE_KEYPOINTS[poseId];
  }
  return DEFAULT_POSE_KEYPOINTS['1-1']; // Default to mountain pose
};