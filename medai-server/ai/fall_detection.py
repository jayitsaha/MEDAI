import numpy as np
import json
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Constants for fall detection algorithm
FALL_THRESHOLD = 2.5  # g-force threshold for potential fall
IMPACT_THRESHOLD = 3.0  # g-force threshold for impact
FREE_FALL_THRESHOLD = 0.3  # g-force threshold for free fall period

def analyze_accelerometer_data(accelerometer_data):
    """
    Analyze accelerometer data to detect falls.
    
    Args:
        accelerometer_data (list): List of dictionaries containing x, y, z accelerometer values
        
    Returns:
        tuple: (fall_detected, confidence, fall_type)
    """
    try:
        # Convert to numpy array for easier processing
        if isinstance(accelerometer_data, str):
            # If data is provided as a JSON string
            accelerometer_data = json.loads(accelerometer_data)
            
        # Extract x, y, z values
        x_values = [data.get('x', 0) for data in accelerometer_data]
        y_values = [data.get('y', 0) for data in accelerometer_data]
        z_values = [data.get('z', 0) for data in accelerometer_data]


        # print(x_values)
        # print(y_values)
        # print(z_values)
        
        # Calculate magnitude of acceleration
        magnitudes = [np.sqrt(x**2 + y**2 + z**2) for x, y, z in zip(x_values, y_values, z_values)]
        
        # Simple fall detection algorithm
        # Look for a pattern of: normal activity -> sudden drop -> impact -> inactivity
        
        fall_detected = False
        free_fall_index = None
        impact_index = None
        
        # 1. Check for free fall (sudden drop in acceleration)
        for i in range(len(magnitudes) - 1):
            if magnitudes[i] > 0.8 and magnitudes[i+1] < FREE_FALL_THRESHOLD:
                print("Free fall detected at index:", i)
                free_fall_index = i
                break
        
        # 2. Check for impact after free fall
        if free_fall_index is not None:
            for i in range(free_fall_index + 1, min(free_fall_index + 15, len(magnitudes))):
                if magnitudes[i] > IMPACT_THRESHOLD:
                    impact_index = i
                    fall_detected = True
                    break
        
        # 3. Calculate confidence based on impact strength
        confidence = 0
        fall_type = "unknown"
        
        if fall_detected:
            impact_value = magnitudes[impact_index]
            confidence = min(100, (impact_value / IMPACT_THRESHOLD) * 70)
            
            # Check for inactivity after impact (optional)
            if impact_index + 10 < len(magnitudes):
                post_impact = magnitudes[impact_index+1:impact_index+10]
                if np.std(post_impact) < 0.5:  # Low movement after impact
                    confidence += 20
            
            # Determine fall type based on orientation changes
            fall_type = determine_fall_type(x_values, y_values, z_values, free_fall_index, impact_index)
        
        return fall_detected, round(confidence), fall_type
    except Exception as e:
        logger.exception("Error analyzing accelerometer data")
        # In case of error, default to safe behavior
        return False, 0, None

def determine_fall_type(x_values, y_values, z_values, free_fall_index, impact_index):
    """Determine the type of fall based on orientation changes."""
    try:
        # Get orientation before fall
        pre_fall_x = np.mean(x_values[max(0, free_fall_index-5):free_fall_index])
        pre_fall_y = np.mean(y_values[max(0, free_fall_index-5):free_fall_index])
        pre_fall_z = np.mean(z_values[max(0, free_fall_index-5):free_fall_index])
        
        # Get orientation after impact
        post_impact_x = np.mean(x_values[impact_index:min(len(x_values), impact_index+5)])
        post_impact_y = np.mean(y_values[impact_index:min(len(y_values), impact_index+5)])
        post_impact_z = np.mean(z_values[impact_index:min(len(z_values), impact_index+5)])
        
        # Calculate changes in orientation
        delta_x = post_impact_x - pre_fall_x
        delta_y = post_impact_y - pre_fall_y
        delta_z = post_impact_z - pre_fall_z
        
        # Determine fall type based on largest orientation change
        max_delta = max(abs(delta_x), abs(delta_y), abs(delta_z))
        
        if max_delta == abs(delta_x):
            return "forward" if delta_x > 0 else "backward"
        elif max_delta == abs(delta_y):
            return "sideways"
        else:
            return "vertical"
    except Exception as e:
        logger.error(f"Error determining fall type: {str(e)}")
        return "unknown"