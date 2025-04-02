from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import base64
import logging
from werkzeug.utils import secure_filename
import json
import time

# Import AI modules
from ai.ocr import process_prescription_image, identify_medication
from ai.chatbot import get_pregnancy_response
from ai.fall_detection import analyze_accelerometer_data
from ai.grok_vision import GroqVision

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static/uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

# In-memory data storage
# These would be stored in AsyncStorage on the React Native client
medications_data = {
    "Aricept": {
        "active_ingredient": "Donepezil",
        "dosage_forms": "Tablets: 5mg, 10mg, 23mg",
        "usage": "Treatment of mild to moderate Alzheimer's disease",
        "side_effects": "Nausea, diarrhea, insomnia, fatigue, vomiting, muscle cramps",
        "warnings": "May cause slow heart rate. Use with caution in patients with cardiac conditions.",
        "interactions": "NSAIDs, anticholinergic medications, ketoconazole, quinidine",
        "pregnancy_category": "C - Risk cannot be ruled out"
    },
    "Namenda": {
        "active_ingredient": "Memantine",
        "dosage_forms": "Tablets: 5mg, 10mg; Solution: 2mg/mL",
        "usage": "Treatment of moderate to severe Alzheimer's disease",
        "side_effects": "Dizziness, headache, confusion, constipation",
        "warnings": "Adjust dosage in patients with renal impairment",
        "interactions": "NMDA antagonists, carbonic anhydrase inhibitors, sodium bicarbonate",
        "pregnancy_category": "B - No evidence of risk in humans"
    },
    "Exelon": {
        "active_ingredient": "Rivastigmine",
        "dosage_forms": "Capsules: 1.5mg, 3mg, 4.5mg, 6mg; Patch: 4.6mg/24h, 9.5mg/24h",
        "usage": "Treatment of mild to moderate Alzheimer's disease and Parkinson's disease dementia",
        "side_effects": "Nausea, vomiting, decreased appetite, dizziness",
        "warnings": "Significant gastrointestinal adverse reactions including nausea and vomiting",
        "interactions": "Cholinomimetic and anticholinergic medications",
        "pregnancy_category": "B - No evidence of risk in humans"
    }
}

# Helper function to save uploaded images
def save_base64_image(base64_string, filename_prefix="image"):
    try:
        # Remove the base64 prefix if present (e.g., "data:image/jpeg;base64,")
        if "base64," in base64_string:
            base64_string = base64_string.split("base64,")[1]
            
        image_data = base64.b64decode(base64_string)
        filename = f"{filename_prefix}_{uuid.uuid4().hex}.jpg"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        with open(filepath, "wb") as f:
            f.write(image_data)
            
        return filepath
    except Exception as e:
        logger.error(f"Error saving base64 image: {str(e)}")
        return None

# API Endpoints

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify server is running."""
    return jsonify({
        'status': 'ok',
        'message': 'MEDAI AI server is running'
    })

@app.route('/api/ocr/prescription', methods=['POST'])
def ocr_prescription():
    """Process a prescription image and extract medication information using Grok Vision."""
    try:
        if 'image' not in request.json:
            return jsonify({'error': 'No image provided'}), 400
            
        image_base64 = request.json['image']
        image_path = save_base64_image(image_base64, "prescription")
        
        if not image_path:
            return jsonify({'error': 'Failed to save image'}), 500
            
        # Process prescription with Grok Vision
        prescription_data = GroqVision.analyze_prescription(image_path)
        
        # Clean up the image file
        try:
            os.remove(image_path)
        except:
            pass
        
        # Generate a unique ID for the prescription
        prescription_id = str(uuid.uuid4())[:8]
        
        # Return data to be stored in AsyncStorage by the client
        return jsonify({
            'success': True,
            'data': {
                'id': prescription_id,
                'date': prescription_data.get('date') or time.strftime('%Y-%m-%d'),
                'medicines': prescription_data.get('medicines', [])
            }
        })
    except Exception as e:
        logger.exception("Error processing prescription")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ocr/medicine', methods=['POST'])
def scan_medicine():
    """Identify a medication from an image using Grok Vision."""
    try:
        if 'image' not in request.json:
            return jsonify({'error': 'No image provided'}), 400
            
        image_base64 = request.json['image']
        image_path = save_base64_image(image_base64, "medicine")
        
        if not image_path:
            return jsonify({'error': 'Failed to save image'}), 500
            
        # Identify the medication in the image using Grok Vision
        medication_info = GroqVision.identify_medication(image_path)
        
        # Check for prescription match if prescriptionId is provided
        if 'prescriptionData' in request.json:
            try:
                prescription_data = request.json['prescriptionData']
                
                # Check if medication name is in prescription
                medication_name = medication_info.get('name', '').lower()
                medicines_in_prescription = [med.get('name', '').lower() for med in prescription_data.get('medicines', [])]
                
                medication_info['matchesPrescription'] = medication_name in medicines_in_prescription
            except:
                medication_info['matchesPrescription'] = False
        else:
            medication_info['matchesPrescription'] = True  # Default if no prescription provided
        
        # Clean up the image file
        try:
            os.remove(image_path)
        except:
            pass
        
        return jsonify({
            'success': True,
            'data': medication_info
        })
    except Exception as e:
        logger.exception("Error scanning medicine")
        return jsonify({'error': str(e)}), 500

# @app.route('/api/ocr/medicine', methods=['POST'])
# def scan_medicine():
#     """Identify a medication from an image."""
#     try:
#         if 'image' not in request.json:
#             return jsonify({'error': 'No image provided'}), 400
            
#         image_base64 = request.json['image']
#         image_path = save_base64_image(image_base64, "medicine")
        
#         if not image_path:
#             return jsonify({'error': 'Failed to save image'}), 500
            
#         # Identify the medication in the image
#         medication_info = identify_medication(image_path)
        
#         # Check for prescription match if prescriptionId is provided
#         if 'prescriptionData' in request.json:
#             try:
#                 prescription_data = request.json['prescriptionData']
                
#                 # Simplified validation: check if medication name is in prescription
#                 medication_name = medication_info.get('name', '').lower()
#                 medicines_in_prescription = [med.get('name', '').lower() for med in prescription_data.get('medicines', [])]
                
#                 medication_info['matchesPrescription'] = medication_name in medicines_in_prescription
#             except:
#                 medication_info['matchesPrescription'] = False
#         else:
#             medication_info['matchesPrescription'] = True  # Default if no prescription provided
        
#         # Clean up the image file
#         try:
#             os.remove(image_path)
#         except:
#             pass
        
#         return jsonify({
#             'success': True,
#             'data': medication_info
#         })
#     except Exception as e:
#         logger.exception("Error scanning medicine")
#         return jsonify({'error': str(e)}), 500

@app.route('/api/chatbot/pregnancy', methods=['POST'])
def pregnancy_chatbot():
    """Get responses from the pregnancy assistant chatbot."""
    try:
        data = request.json
        if 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400
            
        user_message = data['message']
        pregnancy_week = data.get('week')
        chat_history = data.get('history', [])
        
        # Get response from the chatbot AI
        response = get_pregnancy_response(user_message, pregnancy_week, chat_history)
        
        return jsonify({
            'success': True,
            'response': response
        })
    except Exception as e:
        logger.exception("Error getting chatbot response")
        return jsonify({'error': str(e)}), 500

@app.route('/api/fall-detection/analyze', methods=['POST'])
def detect_fall():
    """Analyze accelerometer data to detect falls."""
    try:
        data = request.json
        if 'accelerometerData' not in data:
            return jsonify({'error': 'No accelerometer data provided'}), 400
            
        accelerometer_data = data['accelerometerData']
        
        # Analyze the accelerometer data for fall detection
        fall_detected, confidence, fall_type = analyze_accelerometer_data(accelerometer_data)
        
        return jsonify({
            'success': True,
            'fallDetected': fall_detected,
            'confidence': confidence,
            'fallType': fall_type if fall_detected else None
        })
    except Exception as e:
        logger.exception("Error analyzing fall detection data")
        return jsonify({'error': str(e)}), 500

@app.route('/api/medication/info', methods=['GET'])
def medication_info():
    """Get detailed information about a medication."""
    try:
        medication_name = request.args.get('name')
        if not medication_name:
            return jsonify({'error': 'No medication name provided'}), 400
        
        # Check if medication exists in our in-memory data
        med_info = medications_data.get(medication_name)
        
        if not med_info:
            # Try case-insensitive search
            for name, info in medications_data.items():
                if name.lower() == medication_name.lower():
                    med_info = info
                    break
        
        if not med_info:
            return jsonify({'error': 'Medication not found'}), 404
            
        return jsonify({
            'success': True,
            'data': {
                'name': medication_name,
                **med_info
            }
        })
    except Exception as e:
        logger.exception("Error retrieving medication info")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run the Flask app
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, host='0.0.0.0', port=port)