# ai/yoga_pose_estimation.py
import os
import base64
import numpy as np
import torch
import cv2
import time
import json
import logging
import re  # Added for JSON extraction from LLM responses
from typing import Dict, List, Tuple, Any, Optional
import requests
from PIL import Image
from io import BytesIO

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "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")
GROQ_API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

class YogaPoseEstimator:
    """YogaPoseEstimator model for analyzing and providing feedback on yoga poses."""
    
    def __init__(self):
        """Initialize the YogaPoseEstimator."""
        # Reference pose data cache
        self._reference_poses = {}
        
        # Load YogaNet model (using MoveNet Thunder as a base for this example)
        try:
            import tensorflow as tf
            import tensorflow_hub as hub
            
            # Load MoveNet Thunder model from TensorFlow Hub
            self.model = hub.load('https://tfhub.dev/google/movenet/singlepose/thunder/4')
            self.movenet = self.model.signatures['serving_default']
            self.use_tf = True
            logger.info("Loaded MoveNet Thunder model from TensorFlow Hub")
        except ImportError:
            logger.warning("TensorFlow not available, using OpenCV-based pose estimation")
            self.use_tf = False
            # Fallback to OpenCV DNN models if TensorFlow isn't available
            try:
                # Load OpenPose model (simplified version for demo purposes)
                proto_file = "models/pose/mpi/pose_deploy_linevec_faster_4_stages.prototxt"
                weight_file = "models/pose/mpi/pose_iter_160000.caffemodel"
                
                if os.path.exists(proto_file) and os.path.exists(weight_file):
                    self.net = cv2.dnn.readNetFromCaffe(proto_file, weight_file)
                    logger.info("Loaded OpenPose model from OpenCV")
                else:
                    logger.warning(f"OpenPose model files not found at {proto_file}")
                    self.net = None
            except Exception as e:
                logger.error(f"Error loading OpenCV pose model: {str(e)}")
                self.net = None
    
    def preprocess_image(self, image_data: bytes) -> np.ndarray:
        """
        Preprocess the input image for the pose estimation model.
        
        Args:
            image_data: JPEG image data as bytes
            
        Returns:
            Preprocessed image as numpy array
        """
        try:
            # Convert to PIL Image
            image = Image.open(BytesIO(image_data))
            
            # For TensorFlow model
            if self.use_tf:
                # Resize to match model input size
                image = image.resize((256, 256))
                
                # Convert to numpy array
                image_np = np.array(image)
                
                # Add batch dimension
                image_np = np.expand_dims(image_np, axis=0)
                
                # Convert to float32 and normalize
                image_np = image_np.astype(np.float32) / 255.0
                
                return image_np
            
            # For OpenCV model
            else:
                # Resize to 368x368 for OpenPose
                image = image.resize((368, 368))
                
                # Convert to numpy array
                image_np = np.array(image)
                
                # Return as BGR format
                return cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        
        except Exception as e:
            logger.error(f"Error in preprocessing image: {str(e)}")
            # Return a default image if processing fails
            return np.zeros((368, 368, 3), dtype=np.uint8)
    
    def detect_pose_tensorflow(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detect pose keypoints using TensorFlow MoveNet model.
        
        Args:
            image: Preprocessed image as numpy array
            
        Returns:
            List of keypoint dictionaries
        """
        try:
            # Get model prediction
            input_tensor = torch.tensor(image, dtype=torch.float32)
            outputs = self.movenet(input_tensor)
            
            # Extract keypoints
            keypoints = outputs['output_0'].numpy()[0, 0, :, :4]
            
            # Format keypoints
            formatted_keypoints = []
            keypoint_names = [
                'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
                'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
                'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
                'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
            ]
            
            for idx, (y, x, score, _) in enumerate(keypoints):
                if idx < len(keypoint_names):
                    formatted_keypoints.append({
                        'part': keypoint_names[idx],
                        'position': {
                            'x': float(x),
                            'y': float(y)
                        },
                        'score': float(score)
                    })
            
            return formatted_keypoints
            
        except Exception as e:
            logger.error(f"Error in TensorFlow pose detection: {str(e)}")
            return []
    
    def detect_pose_opencv(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detect pose keypoints using OpenCV DNN.
        
        Args:
            image: Preprocessed image as numpy array
            
        Returns:
            List of keypoint dictionaries
        """
        try:
            if self.net is None:
                # Return dummy keypoints if model not loaded
                return self._get_dummy_keypoints()
            
            # Prepare the image
            input_height, input_width = 368, 368
            
            # Create a blob from the image
            blob = cv2.dnn.blobFromImage(image, 1.0 / 255, (input_width, input_height), 
                                         (0, 0, 0), swapRB=False, crop=False)
            
            # Set the input
            self.net.setInput(blob)
            
            # Forward pass
            output = self.net.forward()
            
            # Get image dimensions
            h, w = image.shape[:2]
            
            # Format keypoints
            formatted_keypoints = []
            keypoint_names = [
                'nose', 'neck', 
                'right_shoulder', 'right_elbow', 'right_wrist', 
                'left_shoulder', 'left_elbow', 'left_wrist',
                'right_hip', 'right_knee', 'right_ankle',
                'left_hip', 'left_knee', 'left_ankle',
                'right_eye', 'left_eye',
                'right_ear', 'left_ear'
            ]
            
            # Number of points detected
            num_points = output.shape[1]
            
            # Extract keypoints
            for i in range(num_points):
                if i < len(keypoint_names):
                    # Confidence map for a specific body part
                    prob_map = output[0, i, :, :]
                    
                    # Find global maxima of the probability map
                    _, prob, _, point = cv2.minMaxLoc(prob_map)
                    
                    # Scale point to input image dimensions
                    x = (point[0] * w) / output.shape[3]
                    y = (point[1] * h) / output.shape[2]
                    
                    # Add keypoint if confidence is above threshold
                    if prob > 0.1:
                        formatted_keypoints.append({
                            'part': keypoint_names[i],
                            'position': {
                                'x': float(x / w),  # Normalize to 0-1
                                'y': float(y / h)   # Normalize to 0-1
                            },
                            'score': float(prob)
                        })
            
            return formatted_keypoints
            
        except Exception as e:
            logger.error(f"Error in OpenCV pose detection: {str(e)}")
            return self._get_dummy_keypoints()
    
    def _get_dummy_keypoints(self) -> List[Dict[str, Any]]:
        """
        Generate dummy keypoints for testing when no model is available.
        
        Returns:
            List of keypoint dictionaries with standard positions
        """
        # Standard pose in mountain pose (simplified)
        keypoint_names = [
            'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
            'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
            'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
            'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
        ]
        
        # Fixed dummy positions (simplified mountain pose)
        positions = [
            (0.5, 0.1),  # nose
            (0.45, 0.09),  # left_eye
            (0.55, 0.09),  # right_eye
            (0.4, 0.1),  # left_ear
            (0.6, 0.1),  # right_ear
            (0.4, 0.25),  # left_shoulder
            (0.6, 0.25),  # right_shoulder
            (0.35, 0.4),  # left_elbow
            (0.65, 0.4),  # right_elbow
            (0.3, 0.55),  # left_wrist
            (0.7, 0.55),  # right_wrist
            (0.45, 0.55),  # left_hip
            (0.55, 0.55),  # right_hip
            (0.45, 0.75),  # left_knee
            (0.55, 0.75),  # right_knee
            (0.45, 0.95),  # left_ankle
            (0.55, 0.95)   # right_ankle
        ]
        
        # Create keypoint list
        formatted_keypoints = []
        for i, (name, pos) in enumerate(zip(keypoint_names, positions)):
            formatted_keypoints.append({
                'part': name,
                'position': {
                    'x': pos[0],
                    'y': pos[1]
                },
                'score': 0.9  # High confidence for dummy data
            })
        
        return formatted_keypoints
    
    def evaluate_pose(self, detected_keypoints: List[Dict[str, Any]], reference_keypoints: List[Dict[str, Any]]) -> float:
        """
        Evaluate pose accuracy by comparing detected keypoints to reference keypoints.
        
        Args:
            detected_keypoints: List of keypoints detected from user image
            reference_keypoints: List of keypoints from reference pose
            
        Returns:
            Accuracy score (0-100)
        """
        if not detected_keypoints or not reference_keypoints:
            return 0.0
        
        try:
            # Create dictionaries for quick lookup
            detected_dict = {kp['part']: kp for kp in detected_keypoints}
            reference_dict = {kp['part']: kp for kp in reference_keypoints}
            
            # Calculate accuracy for each matching keypoint
            total_score = 0.0
            count = 0
            
            # Define important keypoints with weights
            keypoint_weights = {
                'left_shoulder': 1.5,
                'right_shoulder': 1.5,
                'left_hip': 1.5,
                'right_hip': 1.5,
                'left_knee': 1.2,
                'right_knee': 1.2,
                'left_ankle': 1.0,
                'right_ankle': 1.0,
                'left_elbow': 1.0,
                'right_elbow': 1.0,
                'left_wrist': 0.8,
                'right_wrist': 0.8
            }
            
            total_weight = 0.0
            
            for part, weight in keypoint_weights.items():
                if part in detected_dict and part in reference_dict:
                    # Get positions
                    detected_pos = detected_dict[part]['position']
                    reference_pos = reference_dict[part]['position']
                    
                    # Calculate Euclidean distance (normalized)
                    distance = ((detected_pos['x'] - reference_pos['x']) ** 2 + 
                                (detected_pos['y'] - reference_pos['y']) ** 2) ** 0.5
                    
                    # Convert distance to similarity score (1.0 means perfect match)
                    # Max distance is √2 (across the diagonal of a 1x1 square)
                    similarity = max(0, 1.0 - distance / 0.5)
                    
                    # Apply weight and add to total
                    total_score += similarity * weight
                    total_weight += weight
                    count += 1
            
            # Calculate overall accuracy
            if count > 0 and total_weight > 0:
                accuracy = (total_score / total_weight) * 100
                return max(0, min(100, accuracy))
            else:
                return 0.0
                
        except Exception as e:
            logger.error(f"Error evaluating pose: {str(e)}")
            return 50.0  # Default medium accuracy on error
    
    def get_reference_pose(self, pose_id: str) -> Dict[str, Any]:
        """
        Get reference pose keypoints for a specific yoga pose.
        Uses LLM to generate keypoints if they're not already cached.
        
        Args:
            pose_id: Identifier for the yoga pose
            
        Returns:
            Dictionary with reference keypoints and metadata
        """
        # Check if we have this pose cached
        if pose_id in self._reference_poses:
            return self._reference_poses[pose_id]
        
        # Get pose information from database or predefined data
        # In a real implementation, these would be loaded from a database
        pose_info = self._get_pose_info(pose_id)
        
        if not pose_info:
            logger.warning(f"No pose info found for ID: {pose_id}")
            # Return default reference pose
            self._reference_poses[pose_id] = {
                'id': pose_id,
                'keypoints': self._generate_default_keypoints()
            }
            return self._reference_poses[pose_id]
        
        # Generate keypoints using LLM
        keypoints = self.generate_reference_pose_with_llm(
            pose_id,
            pose_info.get('title', 'Unknown Pose'),
            pose_info.get('description', '')
        )
        
        # Cache the reference pose
        self._reference_poses[pose_id] = {
            'id': pose_id,
            'keypoints': keypoints
        }
        
        return self._reference_poses[pose_id]
    

    def _get_pose_info(self, pose_id: str) -> Dict[str, Any]:
        """
        Get pose information for a given pose ID.
        In a real implementation, this would query a database.
        
        Args:
            pose_id: Identifier for the yoga pose
            
        Returns:
            Dictionary with pose information
        """
        # Sample pose information for common yoga poses
        poses = {
            '1-1': {
                'title': 'Modified Mountain Pose',
                'description': 'Stand tall with feet hip-width apart, arms at sides. Draw shoulders back and down, engage core gently.'
            },
            '1-2': {
                'title': 'Cat-Cow Stretch',
                'description': 'Start on hands and knees. Alternate between arching back (cow) and rounding spine (cat).'
            },
            '1-3': {
                'title': 'Seated Side Stretch',
                'description': 'Sit cross-legged, reach one arm overhead and lean to opposite side. Hold and repeat on other side.'
            },
            '2-1': {
                'title': 'Warrior II',
                'description': 'Step feet wide apart, turn one foot out. Bend knee over ankle, extend arms and gaze over front hand.'
            },
            '2-2': {
                'title': 'Wide-Legged Forward Fold',
                'description': 'Step feet wide apart, fold forward from hips. Rest hands on floor or blocks if needed.'
            },
            '2-3': {
                'title': 'Supported Triangle Pose',
                'description': 'Step feet wide apart, extend one arm down to shin/block/floor and the other arm up.'
            },
            '3-1': {
                'title': 'Modified Squat',
                'description': 'Stand with feet wider than hips, lower into squat. Use wall or chair for support if needed.'
            },
            '3-2': {
                'title': 'Seated Butterfly',
                'description': 'Sit with soles of feet together, knees out to sides. Sit on blanket for support if needed.'
            },
            '3-3': {
                'title': 'Side-Lying Relaxation',
                'description': 'Lie on left side with pillows supporting head, belly, and between knees.'
            }
        }
        
        return poses.get(pose_id, {})
    
    def _generate_mountain_pose_keypoints(self) -> List[Dict[str, Any]]:
        """Generate keypoints for Mountain Pose."""
        return [
            {'part': 'nose', 'position': {'x': 0.5, 'y': 0.1}, 'score': 1.0},
            {'part': 'left_eye', 'position': {'x': 0.47, 'y': 0.09}, 'score': 1.0},
            {'part': 'right_eye', 'position': {'x': 0.53, 'y': 0.09}, 'score': 1.0},
            {'part': 'left_ear', 'position': {'x': 0.44, 'y': 0.1}, 'score': 1.0},
            {'part': 'right_ear', 'position': {'x': 0.56, 'y': 0.1}, 'score': 1.0},
            {'part': 'left_shoulder', 'position': {'x': 0.42, 'y': 0.22}, 'score': 1.0},
            {'part': 'right_shoulder', 'position': {'x': 0.58, 'y': 0.22}, 'score': 1.0},
            {'part': 'left_elbow', 'position': {'x': 0.4, 'y': 0.38}, 'score': 1.0},
            {'part': 'right_elbow', 'position': {'x': 0.6, 'y': 0.38}, 'score': 1.0},
            {'part': 'left_wrist', 'position': {'x': 0.38, 'y': 0.52}, 'score': 1.0},
            {'part': 'right_wrist', 'position': {'x': 0.62, 'y': 0.52}, 'score': 1.0},
            {'part': 'left_hip', 'position': {'x': 0.46, 'y': 0.54}, 'score': 1.0},
            {'part': 'right_hip', 'position': {'x': 0.54, 'y': 0.54}, 'score': 1.0},
            {'part': 'left_knee', 'position': {'x': 0.46, 'y': 0.74}, 'score': 1.0},
            {'part': 'right_knee', 'position': {'x': 0.54, 'y': 0.74}, 'score': 1.0},
            {'part': 'left_ankle', 'position': {'x': 0.46, 'y': 0.94}, 'score': 1.0},
            {'part': 'right_ankle', 'position': {'x': 0.54, 'y': 0.94}, 'score': 1.0}
        ]
    
    def _generate_cat_cow_pose_keypoints(self) -> List[Dict[str, Any]]:
        """Generate keypoints for Cat-Cow Pose (cat position)."""
        return [
            {'part': 'nose', 'position': {'x': 0.5, 'y': 0.35}, 'score': 1.0},
            {'part': 'left_eye', 'position': {'x': 0.48, 'y': 0.33}, 'score': 1.0},
            {'part': 'right_eye', 'position': {'x': 0.52, 'y': 0.33}, 'score': 1.0},
            {'part': 'left_ear', 'position': {'x': 0.46, 'y': 0.34}, 'score': 1.0},
            {'part': 'right_ear', 'position': {'x': 0.54, 'y': 0.34}, 'score': 1.0},
            {'part': 'left_shoulder', 'position': {'x': 0.38, 'y': 0.4}, 'score': 1.0},
            {'part': 'right_shoulder', 'position': {'x': 0.62, 'y': 0.4}, 'score': 1.0},
            {'part': 'left_elbow', 'position': {'x': 0.3, 'y': 0.5}, 'score': 1.0},
            {'part': 'right_elbow', 'position': {'x': 0.7, 'y': 0.5}, 'score': 1.0},
            {'part': 'left_wrist', 'position': {'x': 0.25, 'y': 0.6}, 'score': 1.0},
            {'part': 'right_wrist', 'position': {'x': 0.75, 'y': 0.6}, 'score': 1.0},
            {'part': 'left_hip', 'position': {'x': 0.4, 'y': 0.65}, 'score': 1.0},
            {'part': 'right_hip', 'position': {'x': 0.6, 'y': 0.65}, 'score': 1.0},
            {'part': 'left_knee', 'position': {'x': 0.35, 'y': 0.75}, 'score': 1.0},
            {'part': 'right_knee', 'position': {'x': 0.65, 'y': 0.75}, 'score': 1.0},
            {'part': 'left_ankle', 'position': {'x': 0.3, 'y': 0.85}, 'score': 1.0},
            {'part': 'right_ankle', 'position': {'x': 0.7, 'y': 0.85}, 'score': 1.0}
        ]
    
    def _generate_seated_side_stretch_keypoints(self) -> List[Dict[str, Any]]:
        """Generate keypoints for Seated Side Stretch (right side)."""
        return [
            {'part': 'nose', 'position': {'x': 0.42, 'y': 0.3}, 'score': 1.0},
            {'part': 'left_eye', 'position': {'x': 0.4, 'y': 0.29}, 'score': 1.0},
            {'part': 'right_eye', 'position': {'x': 0.44, 'y': 0.28}, 'score': 1.0},
            {'part': 'left_ear', 'position': {'x': 0.38, 'y': 0.3}, 'score': 1.0},
            {'part': 'right_ear', 'position': {'x': 0.46, 'y': 0.29}, 'score': 1.0},
            {'part': 'left_shoulder', 'position': {'x': 0.4, 'y': 0.4}, 'score': 1.0},
            {'part': 'right_shoulder', 'position': {'x': 0.5, 'y': 0.38}, 'score': 1.0},
            {'part': 'left_elbow', 'position': {'x': 0.35, 'y': 0.25}, 'score': 1.0},
            {'part': 'right_elbow', 'position': {'x': 0.55, 'y': 0.25}, 'score': 1.0},
            {'part': 'left_wrist', 'position': {'x': 0.28, 'y': 0.15}, 'score': 1.0},
            {'part': 'right_wrist', 'position': {'x': 0.65, 'y': 0.15}, 'score': 1.0},
            {'part': 'left_hip', 'position': {'x': 0.4, 'y': 0.68}, 'score': 1.0},
            {'part': 'right_hip', 'position': {'x': 0.55, 'y': 0.68}, 'score': 1.0},
            {'part': 'left_knee', 'position': {'x': 0.35, 'y': 0.78}, 'score': 1.0},
            {'part': 'right_knee', 'position': {'x': 0.65, 'y': 0.78}, 'score': 1.0},
            {'part': 'left_ankle', 'position': {'x': 0.3, 'y': 0.85}, 'score': 1.0},
            {'part': 'right_ankle', 'position': {'x': 0.75, 'y': 0.82}, 'score': 1.0}
        ]
    
    def _generate_warrior_ii_keypoints(self) -> List[Dict[str, Any]]:
        """Generate keypoints for Warrior II Pose."""
        return [
            {'part': 'nose', 'position': {'x': 0.5, 'y': 0.15}, 'score': 1.0},
            {'part': 'left_eye', 'position': {'x': 0.48, 'y': 0.14}, 'score': 1.0},
            {'part': 'right_eye', 'position': {'x': 0.52, 'y': 0.14}, 'score': 1.0},
            {'part': 'left_ear', 'position': {'x': 0.46, 'y': 0.15}, 'score': 1.0},
            {'part': 'right_ear', 'position': {'x': 0.54, 'y': 0.15}, 'score': 1.0},
            {'part': 'left_shoulder', 'position': {'x': 0.3, 'y': 0.25}, 'score': 1.0},
            {'part': 'right_shoulder', 'position': {'x': 0.7, 'y': 0.25}, 'score': 1.0},
            {'part': 'left_elbow', 'position': {'x': 0.15, 'y': 0.25}, 'score': 1.0},
            {'part': 'right_elbow', 'position': {'x': 0.85, 'y': 0.25}, 'score': 1.0},
            {'part': 'left_wrist', 'position': {'x': 0.05, 'y': 0.25}, 'score': 1.0},
            {'part': 'right_wrist', 'position': {'x': 0.95, 'y': 0.25}, 'score': 1.0},
            {'part': 'left_hip', 'position': {'x': 0.35, 'y': 0.55}, 'score': 1.0},
            {'part': 'right_hip', 'position': {'x': 0.65, 'y': 0.55}, 'score': 1.0},
            {'part': 'left_knee', 'position': {'x': 0.25, 'y': 0.7}, 'score': 1.0},
            {'part': 'right_knee', 'position': {'x': 0.75, 'y': 0.75}, 'score': 1.0},
            {'part': 'left_ankle', 'position': {'x': 0.15, 'y': 0.9}, 'score': 1.0},
            {'part': 'right_ankle', 'position': {'x': 0.85, 'y': 0.9}, 'score': 1.0}
        ]
    
    def _generate_wide_legged_forward_fold_keypoints(self) -> List[Dict[str, Any]]:
        """Generate keypoints for Wide-Legged Forward Fold."""
        return [
            {'part': 'nose', 'position': {'x': 0.5, 'y': 0.6}, 'score': 1.0},
            {'part': 'left_eye', 'position': {'x': 0.48, 'y': 0.58}, 'score': 1.0},
            {'part': 'right_eye', 'position': {'x': 0.52, 'y': 0.58}, 'score': 1.0},
            {'part': 'left_ear', 'position': {'x': 0.46, 'y': 0.56}, 'score': 1.0},
            {'part': 'right_ear', 'position': {'x': 0.54, 'y': 0.56}, 'score': 1.0},
            {'part': 'left_shoulder', 'position': {'x': 0.45, 'y': 0.45}, 'score': 1.0},
            {'part': 'right_shoulder', 'position': {'x': 0.55, 'y': 0.45}, 'score': 1.0},
            {'part': 'left_elbow', 'position': {'x': 0.45, 'y': 0.6}, 'score': 1.0},
            {'part': 'right_elbow', 'position': {'x': 0.55, 'y': 0.6}, 'score': 1.0},
            {'part': 'left_wrist', 'position': {'x': 0.45, 'y': 0.75}, 'score': 1.0},
            {'part': 'right_wrist', 'position': {'x': 0.55, 'y': 0.75}, 'score': 1.0},
            {'part': 'left_hip', 'position': {'x': 0.3, 'y': 0.35}, 'score': 1.0},
            {'part': 'right_hip', 'position': {'x': 0.7, 'y': 0.35}, 'score': 1.0},
            {'part': 'left_knee', 'position': {'x': 0.15, 'y': 0.6}, 'score': 1.0},
            {'part': 'right_knee', 'position': {'x': 0.85, 'y': 0.6}, 'score': 1.0},
            {'part': 'left_ankle', 'position': {'x': 0.15, 'y': 0.9}, 'score': 1.0},
            {'part': 'right_ankle', 'position': {'x': 0.85, 'y': 0.9}, 'score': 1.0}
        ]
    
    def get_pose_feedback(self, image_data: bytes, pose_id: str, detected_keypoints: List[Dict[str, Any]], is_final: bool = False) -> str:
        """
        Get LLM-based feedback on the user's pose using Groq Vision.
        
        Args:
            image_data: JPEG image data as bytes
            pose_id: Identifier for the yoga pose
            detected_keypoints: List of keypoints detected from user image
            is_final: Whether this is the final feedback for the session
            
        Returns:
            Feedback text
        """
        try:
            # Convert image to base64
            base64_image = base64.b64encode(image_data).decode('utf-8')
            
            # Get reference pose
            reference_pose = self.get_reference_pose(pose_id)
            
            # Determine pose name based on ID
            pose_names = {
                '1-1': 'Modified Mountain Pose',
                '1-2': 'Cat-Cow Stretch',
                '1-3': 'Seated Side Stretch',
                '2-1': 'Warrior II',
                '2-2': 'Wide-Legged Forward Fold',
                '2-3': 'Supported Triangle Pose',
                '3-1': 'Modified Squat',
                '3-2': 'Seated Butterfly',
                '3-3': 'Side-Lying Relaxation'
            }
            
            pose_name = pose_names.get(pose_id, 'Yoga Pose')
            
            # Pregnancy safety instructions to include
            pregnancy_safety = """
            Remember that this is a pregnant woman, so feedback must prioritize safety. 
            Caution against:
            - Deep twists that compress the abdomen
            - Poses that put pressure on the belly
            - Holding breath
            - Overstretching (due to relaxin hormone)
            - Lying flat on back after first trimester
            
            Encourage:
            - Modified poses with props if needed
            - Widening stance for balance
            - Listening to the body and backing off if uncomfortable
            """
            
            # Create a structured prompt for pose feedback
            combined_prompt = f"""
            You are a specialized prenatal yoga instructor providing feedback to a pregnant woman. 
            
            TASK: Analyze the yoga pose image and provide helpful guidance on proper alignment and technique for the {pose_name}.
            
            {pregnancy_safety}
            
            For this specific pose ({pose_name}), provide:
            1. Brief 1-2 sentence assessment of overall alignment
            2. 2-3 specific, actionable cues to improve the pose
            3. One encouraging statement
            
            Your feedback should be clear, supportive, and focused on safety for pregnancy.
            
            {"This is their final feedback for this practice session, so include overall summary comments." if is_final else ""}
            
            Keep your response under 150 words.
            """
            
            # Call Groq Vision API
            response = requests.post(
                GROQ_API_ENDPOINT,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {GROQ_API_KEY}"
                },
                json={
                    "model": "llama-3.2-11b-vision-preview",  # Current supported Groq model
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": combined_prompt},
                                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                            ]
                        }
                    ],
                    "temperature": 0.2,
                    "max_tokens": 1024
                }
            )
            
            # Parse the response
            if response.status_code == 200:
                result = response.json()
                # Extract content from Groq's response structure
                content = result['choices'][0]['message']['content']
                return content
            else:
                logger.error(f"Groq API Error: {response.status_code} - {response.text}")
                return "I couldn't analyze your pose at this time. Focus on keeping your alignment comfortable and remember to breathe."
                
        except Exception as e:
            logger.exception(f"Error getting pose feedback: {str(e)}")
            return "Keep your pose aligned with your breath and maintain a comfortable stance. Remember to modify as needed for your pregnancy."
    
    def estimate_pose(self, image_data: bytes, pose_id: str) -> Dict[str, Any]:
        """
        Process image to detect pose, evaluate accuracy, and return results.
        
        Args:
            image_data: JPEG image data as bytes
            pose_id: Identifier for the yoga pose
            
        Returns:
            Dict with pose estimation results
        """
        try:
            # Decode base64 image if needed
            if isinstance(image_data, str):
                if ',' in image_data:
                    image_data = image_data.split(',')[1]
                image_bytes = base64.b64decode(image_data)
            else:
                image_bytes = image_data
            
            # Preprocess image
            preprocessed_image = self.preprocess_image(image_bytes)
            
            # Detect pose keypoints
            if self.use_tf:
                keypoints = self.detect_pose_tensorflow(preprocessed_image)
            else:
                keypoints = self.detect_pose_opencv(preprocessed_image)
            
            # Get reference pose
            reference_pose = self.get_reference_pose(pose_id)
            reference_keypoints = reference_pose['keypoints']
            
            # Evaluate pose accuracy
            accuracy = self.evaluate_pose(keypoints, reference_keypoints)
            
            # Return results
            return {
                'pose_id': pose_id,
                'accuracy': accuracy,
                'keypoints': keypoints,
                'reference_keypoints': reference_keypoints
            }
            
        except Exception as e:
            logger.exception(f"Error estimating pose: {str(e)}")
            # Return fallback results
            return {
                'pose_id': pose_id,
                'accuracy': 50.0,  # Default medium accuracy
                'keypoints': self._get_dummy_keypoints(),
                'reference_keypoints': self.get_reference_pose(pose_id)['keypoints']
            }
    
    def generate_reference_pose_with_llm(self, pose_id: str, pose_name: str, pose_description: str) -> list:
        """
        Generate reference pose keypoints using LLM instead of hardcoded values.
        
        Args:
            pose_id: The ID of the pose
            pose_name: The name of the pose
            pose_description: Description of the pose
            
        Returns:
            List of keypoint dictionaries
        """
        try:
            logger.info(f"Generating reference pose for {pose_name} using LLM")
            
            # Keypoint parts we need
            keypoint_parts = [
                'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
                'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
                'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
                'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
            ]
            
            # Format prompt for the LLM
            prompt = f"""
            You are a computer vision and yoga expert. I need you to generate reference keypoints for a yoga pose.
            
            Pose: {pose_name}
            Description: {pose_description}
            
            Please generate normalized coordinates (x, y) for each keypoint in a standard pose. 
            The coordinates should be normalized between 0 and 1, where:
            - (0,0) is the top left corner
            - (1,1) is the bottom right corner
            - X increases from left to right
            - Y increases from top to bottom
            
            I need coordinates for these keypoints:
            {', '.join(keypoint_parts)}
            
            Response format:
            {{
              "keypoints": [
                {{"part": "nose", "position": {{"x": 0.5, "y": 0.1}}, "score": 1.0}},
                {{"part": "left_eye", "position": {{"x": 0.45, "y": 0.09}}, "score": 1.0}},
                ...and so on for all keypoints...
              ]
            }}
            
            Make sure the coordinates reflect a realistic human pose for {pose_name}.
            For pregnant women, ensure the pose is appropriate and safe during pregnancy.
            """
            
            # Call Groq API
            response = requests.post(
                GROQ_API_ENDPOINT,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {GROQ_API_KEY}"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": "You are a knowledgeable computer vision and yoga expert."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 1000
                }
            )
            
            if response.status_code != 200:
                logger.error(f"LLM API Error: {response.status_code} - {response.text}")
                return self._generate_default_keypoints()
                
            result = response.json()
            content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            # Extract JSON from the response
            json_match = re.search(r'{[\s\S]*}', content)
            if not json_match:
                logger.error("Could not extract JSON from LLM response")
                return self._generate_default_keypoints()
                
            json_str = json_match.group(0)
            data = json.loads(json_str)
            
            # Validate keypoints
            keypoints = data.get('keypoints', [])
            if not keypoints or len(keypoints) < len(keypoint_parts):
                logger.error(f"Incomplete keypoints in LLM response: got {len(keypoints)}, expected {len(keypoint_parts)}")
                return self._generate_default_keypoints()
                
            # Ensure all required parts are present
            parts_set = {kp.get('part') for kp in keypoints}
            missing_parts = set(keypoint_parts) - parts_set
            
            if missing_parts:
                logger.error(f"Missing keypoint parts in LLM response: {missing_parts}")
                return self._generate_default_keypoints()
                
            logger.info(f"Successfully generated reference pose for {pose_name} with LLM")
            return keypoints
            
        except Exception as e:
            logger.exception(f"Error generating reference pose with LLM: {str(e)}")
            return self._generate_default_keypoints()

    def _generate_default_keypoints(self):
        """Generate default keypoints as a fallback"""
        logger.warning("Using default keypoints as fallback")
        
        # This is just a fallback - normally we would use the LLM-generated keypoints
        default_keypoints = [
            {'part': 'nose', 'position': {'x': 0.5, 'y': 0.1}, 'score': 1.0},
            {'part': 'left_eye', 'position': {'x': 0.47, 'y': 0.09}, 'score': 1.0},
            {'part': 'right_eye', 'position': {'x': 0.53, 'y': 0.09}, 'score': 1.0},
            {'part': 'left_ear', 'position': {'x': 0.44, 'y': 0.1}, 'score': 1.0},
            {'part': 'right_ear', 'position': {'x': 0.56, 'y': 0.1}, 'score': 1.0},
            {'part': 'left_shoulder', 'position': {'x': 0.42, 'y': 0.22}, 'score': 1.0},
            {'part': 'right_shoulder', 'position': {'x': 0.58, 'y': 0.22}, 'score': 1.0},
            {'part': 'left_elbow', 'position': {'x': 0.4, 'y': 0.38}, 'score': 1.0},
            {'part': 'right_elbow', 'position': {'x': 0.6, 'y': 0.38}, 'score': 1.0},
            {'part': 'left_wrist', 'position': {'x': 0.38, 'y': 0.52}, 'score': 1.0},
            {'part': 'right_wrist', 'position': {'x': 0.62, 'y': 0.52}, 'score': 1.0},
            {'part': 'left_hip', 'position': {'x': 0.46, 'y': 0.54}, 'score': 1.0},
            {'part': 'right_hip', 'position': {'x': 0.54, 'y': 0.54}, 'score': 1.0},
            {'part': 'left_knee', 'position': {'x': 0.46, 'y': 0.74}, 'score': 1.0},
            {'part': 'right_knee', 'position': {'x': 0.54, 'y': 0.74}, 'score': 1.0},
            {'part': 'left_ankle', 'position': {'x': 0.46, 'y': 0.94}, 'score': 1.0},
            {'part': 'right_ankle', 'position': {'x': 0.54, 'y': 0.94}, 'score': 1.0}
        ]
        
        return default_keypoints

# Create a singleton instance
yoga_pose_estimator = YogaPoseEstimator()