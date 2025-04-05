// Improved PoseDetectionService.js
import axios from 'axios';
import { throttle } from 'lodash';

// API base URL - update this to match your actual server URL
const API_BASE_URL = 'http://192.168.107.82:5001';

// Keypoint names for visualization
const KEYPOINT_NAMES = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
];

// Pose connections for drawing lines between keypoints
const POSE_CONNECTIONS = [
  ['nose', 'left_eye'], ['nose', 'right_eye'], ['left_eye', 'left_ear'],
  ['right_eye', 'right_ear'], ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'], ['right_shoulder', 'right_elbow'],
  ['left_elbow', 'left_wrist'], ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'], ['left_hip', 'left_knee'],
  ['right_hip', 'right_knee'], ['left_knee', 'left_ankle'],
  ['right_knee', 'right_ankle']
];

// Default keypoint positions for different poses (fallback only)
const DEFAULT_POSE_KEYPOINTS = {
  // Mountain Pose (1-1)
  '1-1': [
    { part: 'nose', position: { x: 0.5, y: 0.12 }, score: 1.0 },
    { part: 'left_eye', position: { x: 0.48, y: 0.11 }, score: 1.0 },
    { part: 'right_eye', position: { x: 0.52, y: 0.11 }, score: 1.0 },
    { part: 'left_ear', position: { x: 0.46, y: 0.12 }, score: 1.0 },
    { part: 'right_ear', position: { x: 0.54, y: 0.12 }, score: 1.0 },
    { part: 'left_shoulder', position: { x: 0.45, y: 0.22 }, score: 1.0 },
    { part: 'right_shoulder', position: { x: 0.55, y: 0.22 }, score: 1.0 },
    { part: 'left_elbow', position: { x: 0.42, y: 0.38 }, score: 1.0 },
    { part: 'right_elbow', position: { x: 0.58, y: 0.38 }, score: 1.0 },
    { part: 'left_wrist', position: { x: 0.39, y: 0.52 }, score: 1.0 },
    { part: 'right_wrist', position: { x: 0.61, y: 0.52 }, score: 1.0 },
    { part: 'left_hip', position: { x: 0.47, y: 0.55 }, score: 1.0 },
    { part: 'right_hip', position: { x: 0.53, y: 0.55 }, score: 1.0 },
    { part: 'left_knee', position: { x: 0.47, y: 0.75 }, score: 1.0 },
    { part: 'right_knee', position: { x: 0.53, y: 0.75 }, score: 1.0 },
    { part: 'left_ankle', position: { x: 0.47, y: 0.95 }, score: 1.0 },
    { part: 'right_ankle', position: { x: 0.53, y: 0.95 }, score: 1.0 }
  ],
  // Other poses are defined in the backend
};

// API state tracking
let apiState = {
  lastRequest: 0,
  failedAttempts: 0,
  backoffTime: 1000, // Start with 1 second backoff
  maxBackoff: 5000,  // Maximum 5 second backoff
  isProcessing: false
};

// Result tracking for smooth transitions
let lastResponse = {
  keypoints: null,
  accuracy: 50,
  timestamp: 0
};

/**
 * Throttled function to process pose frames. This prevents overwhelming
 * the backend with too many API calls.
 */
export const processFrame = throttle(async (imageData, poseId) => {
  try {
    // Make sure we don't have parallel requests in flight
    if (apiState.isProcessing) {
      console.log('⏳ Skipping frame - API request already in progress');
      
      // Still return the last results for smooth visualization
      if (lastResponse.keypoints) {
        return {
          keypoints: addSmallVariation(lastResponse.keypoints),
          accuracy: lastResponse.accuracy,
          fromServer: false
        };
      }
      
      return {
        keypoints: DEFAULT_POSE_KEYPOINTS[poseId] || DEFAULT_POSE_KEYPOINTS['1-1'],
        accuracy: 50,
        fromServer: false
      };
    }
    
    const currentTime = Date.now();
    
    // Check if we should backoff due to previous failures
    if (apiState.failedAttempts > 0) {
      const timePassedSinceLastRequest = currentTime - apiState.lastRequest;
      if (timePassedSinceLastRequest < apiState.backoffTime) {
        console.log(`⏳ Backing off server requests for ${(apiState.backoffTime - timePassedSinceLastRequest)/1000}s (failures: ${apiState.failedAttempts})`);
        
        // Return the last known keypoints with small variation
        if (lastResponse.keypoints) {
          return {
            keypoints: addSmallVariation(lastResponse.keypoints),
            accuracy: lastResponse.accuracy,
            fromServer: false
          };
        }
        
        // No previous keypoints - use defaults
        return {
          keypoints: DEFAULT_POSE_KEYPOINTS[poseId] || DEFAULT_POSE_KEYPOINTS['1-1'],
          accuracy: 50,
          fromServer: false
        };
      }
    }
    
    // Make sure image data is properly formatted
    if (typeof imageData !== 'string') {
      throw new Error('Image data must be a string');
    }
    
    // Add proper data URI prefix if missing
    if (!imageData.startsWith('data:image/')) {
      imageData = `data:image/jpeg;base64,${imageData}`;
    }
    
    // Mark that we're processing a request
    apiState.isProcessing = true;
    apiState.lastRequest = currentTime;
    
    console.log(`🌐 Sending frame to server for pose ${poseId}`);
    
    // Calculate timeout based on failure count (increasing backoff)
    const timeoutMs = 3000 + Math.min(apiState.failedAttempts * 500, 2000);
    
    try {
      // Send to backend with appropriate timeout
      const response = await axios.post(
        `${API_BASE_URL}/api/yoga/pose-estimation`,
        {
          image: imageData,
          poseId: poseId
        },
        { 
          timeout: timeoutMs,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log(`📡 Server response status: ${response.status}`);
      
      if (response.data && response.data.success) {
        console.log(`✅ Got results: ${response.data.data.accuracy.toFixed(1)}% accuracy`);
        
        // Reset failure count
        apiState.failedAttempts = 0;
        apiState.backoffTime = 1000; // Reset backoff
        
        // Save response for future use
        lastResponse = {
          keypoints: response.data.data.keypoints,
          accuracy: response.data.data.accuracy,
          timestamp: Date.now()
        };
        
        // Return the response
        return {
          keypoints: response.data.data.keypoints,
          accuracy: response.data.data.accuracy,
          fromServer: true
        };
      } else {
        throw new Error('Invalid server response format');
      }
      
    } catch (error) {
      console.warn(`❌ Server request failed: ${error.message}`);
      
      // Increase failure count and backoff time
      apiState.failedAttempts++;
      apiState.backoffTime = Math.min(
        apiState.backoffTime * 1.5, 
        apiState.maxBackoff
      );
      
      // Log detailed error information
      if (error.response) {
        console.error(`Server responded with status ${error.response.status}`);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server');
      }
      
      // Use last successful response with variation if available
      if (lastResponse.keypoints) {
        // Add variation to make movement look natural
        return {
          keypoints: addSmallVariation(lastResponse.keypoints),
          accuracy: lastResponse.accuracy,
          fromServer: false
        };
      }
    } finally {
      // Mark that we're done processing
      apiState.isProcessing = false;
    }
    
    // Fallback to default keypoints if we don't have anything else
    console.log('⚠️ Using default keypoints');
    return {
      keypoints: DEFAULT_POSE_KEYPOINTS[poseId] || DEFAULT_POSE_KEYPOINTS['1-1'],
      accuracy: 50,
      fromServer: false
    };
    
  } catch (error) {
    console.error('❌ Unexpected error in processFrame:', error);
    
    // Mark that we're done processing
    apiState.isProcessing = false;
    
    // If we have previous keypoints, use those with variation
    if (lastResponse.keypoints) {
      return {
        keypoints: addSmallVariation(lastResponse.keypoints),
        accuracy: lastResponse.accuracy,
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
}, 300);  // Throttle to at most one request every 300ms

/**
 * Add small random variations to keypoints to simulate natural movement
 */
const addSmallVariation = (keypoints) => {
  return keypoints.map(kp => {
    // Smaller variation for important points like shoulders, hips
    const isStablePoint = ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'].includes(kp.part);
    const variationFactor = isStablePoint ? 0.001 : 0.003;
    
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
 * Throttled function to get feedback from the server
 */
export const getLLMFeedback = throttle(async (imageData, poseId, keypoints, isFinal = false) => {
  try {
    console.log(`Getting feedback for pose ${poseId}, final=${isFinal}`);
    
    // Send to backend (with a longer timeout for LLM processing)
    const response = await axios.post(
      `${API_BASE_URL}/api/yoga/posture-feedback`,
      {
        image: imageData,
        poseId: poseId,
        isFinal,
        keypoints
      },
      { timeout: 10000 } // 10 second timeout for LLM processing
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
}, 2000);  // Throttle to at most one request every 2 seconds

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
  lastResponse = {
    keypoints: null,
    accuracy: 50,
    timestamp: 0
  };
  
  // Don't reset API state - that should persist
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