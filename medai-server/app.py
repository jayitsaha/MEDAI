#/app.py
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
import uuid
import base64
import logging
import re  # Added for JSON extraction from LLM responses
from werkzeug.utils import secure_filename
import json
import time
from dotenv import load_dotenv
from groq import Groq

# Import AI modules
from ai.ocr import process_prescription_image, identify_medication
from ai.chatbot import get_pregnancy_response
from ai.fall_detection import analyze_accelerometer_data
from ai.grok_vision import GroqVision
import requests
# from ai.yoga_pose_estimation import yoga_pose_estimator
import base64
# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY", "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"))

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
        
        # Check if streaming is requested
        if data.get('stream', False):
            return stream_pregnancy_response(user_message, pregnancy_week, chat_history)
        else:
            # Use the existing non-streaming implementation
            response = get_pregnancy_response(user_message, pregnancy_week, chat_history)
            
            return jsonify({
                'success': True,
                'response': response
            })
    except Exception as e:
        logger.exception("Error getting chatbot response")
        return jsonify({'error': str(e)}), 500

def stream_pregnancy_response(user_message, pregnancy_week=None, chat_history=None):
    """Stream responses from the pregnancy assistant using Groq's Llama model."""
    try:
        # Format history for Groq API
        formatted_history = []
        
        # Add system message
        formatted_history.append({
            "role": "system",
            "content": "You are a helpful pregnancy assistant providing accurate medical information to expectant mothers. "
                      "Always advise users to consult healthcare providers for personalized medical advice. "
                      "Be empathetic, clear, and concise."
        })
        
        # Add chat history if available
        if chat_history and isinstance(chat_history, list):
            for msg in chat_history[-10:]:  # Use last 10 messages for context
                role = "user" if msg.get('sender') == 'user' else "assistant"
                formatted_history.append({
                    "role": role,
                    "content": msg.get('text', '')
                })
        
        # Add pregnancy week context if available
        context = ""
        if pregnancy_week:
            context = f"The user is currently in week {pregnancy_week} of pregnancy. "
        
        # Add the current user message
        formatted_history.append({
            "role": "user",
            "content": f"{context}{user_message}"
        })

        def generate():
            
            try:
                print(formatted_history)
                # Create streaming completion with Groq
                stream = groq_client.chat.completions.create(
                    messages=formatted_history,
                    model="llama-3.3-70b-versatile",
                    temperature=0.7,
                    max_completion_tokens=1024,
                    stream=True
                )
                
                # Process the stream
                for chunk in stream:
                    # Format as SSE data
                    sse_data = f"data: {json.dumps(chunk.model_dump())}\n\n"
                    yield sse_data
                    
                # Signal the end of the stream
                yield "data: [DONE]\n\n"
                
            except Exception as e:
                # Handle errors during streaming
                error_data = json.dumps({"error": str(e)})
                yield f"data: {error_data}\n\n"
                logger.exception("Error in streaming response")
        
        # Return streaming response
        return Response(
            generate(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'  # Disable nginx buffering if using nginx
            }
        )
    except Exception as e:
        logger.exception("Error setting up streaming response")
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """General purpose chat endpoint using Groq's Llama model with streaming support."""
    try:
        # Get request data
        data = request.json
        
        if not data or 'messages' not in data or not isinstance(data['messages'], list):
            return jsonify({"error": "Invalid messages format"}), 400
        
        # Extract parameters with defaults
        messages = data['messages']
        model = data.get('model', "llama-3.3-70b-versatile")
        temperature = data.get('temperature', 0.7)
        max_completion_tokens = data.get('max_completion_tokens', 1024)
        streaming = data.get('stream', False)  # Check if streaming is requested
        
        # Handle streaming request
        if streaming:
            def generate():
                """Generator function for streaming the response"""
                try:
                    # Create streaming completion with Groq
                    stream = groq_client.chat.completions.create(
                        messages=messages,
                        model=model,
                        temperature=temperature,
                        max_completion_tokens=max_completion_tokens,
                        stream=True  # Enable streaming
                    )
                    
                    # Process the stream
                    for chunk in stream:
                        # Format as SSE data
                        sse_data = f"data: {json.dumps(chunk.model_dump())}\n\n"
                        yield sse_data
                        
                    # Signal the end of the stream
                    yield "data: [DONE]\n\n"
                    
                except Exception as e:
                    # Handle errors during streaming
                    error_data = json.dumps({"error": str(e)})
                    yield f"data: {error_data}\n\n"
                    logger.exception("Error in streaming chat response")
            
            # Return streaming response
            return Response(
                generate(),
                mimetype='text/event-stream',
                headers={
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no'  # Disable nginx buffering if using nginx
                }
            )
        
        # Handle non-streaming request
        else:
            # Make non-streaming request to Groq
            completion = groq_client.chat.completions.create(
                messages=messages,
                model=model,
                temperature=temperature,
                max_completion_tokens=max_completion_tokens,
                stream=False  # Explicitly disable streaming
            )
            
            # Return the complete response
            return jsonify(completion.model_dump())
            
    except Exception as e:
        # Handle errors
        logger.exception("Error in chat response")
        return jsonify({"error": str(e)}), 500
    
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

# New Diet Endpoints

@app.route('/api/diet/meal-plan', methods=['POST'])
def generate_meal_plan():
    """Generate personalized meal plan for pregnant women using Grok."""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Extract user preferences
        preferences = data.get('preferences', {})
        pregnancy_week = data.get('pregnancyWeek')
        
        # Format user preferences for the LLM
        dietary_restrictions = []
        if preferences.get('isVegetarian'):
            dietary_restrictions.append('Vegetarian')
        if preferences.get('isVegan'):
            dietary_restrictions.append('Vegan')
        if preferences.get('isGlutenFree'):
            dietary_restrictions.append('Gluten-Free')
        if preferences.get('isDairyFree'):
            dietary_restrictions.append('Dairy-Free')
            
        user_prefs_text = f"""
            Pregnancy Week: {pregnancy_week or 'Unknown'}
            Preferred Cuisines: {', '.join(preferences.get('cuisines', [])) or 'No specific preferences'}
            Allergies: {', '.join(preferences.get('allergies', [])) or 'None'}
            Health Conditions: {', '.join(preferences.get('healthConditions', [])) or 'None'}
            Dietary Restrictions: {', '.join(dietary_restrictions) or 'None'}
            Daily Calorie Goal: {preferences.get('calorieGoal', '2000')} calories
            Daily Protein Goal: {preferences.get('proteinGoal', '70')} grams
        """

        # Provide exact JSON structure format in the prompt
        json_example = """
        {
          "breakfast": [
            {
              "name": "Recipe Name",
              "ingredients": ["ingredient 1", "ingredient 2"],
              "instructions": "Step by step instructions",
              "calories": 320,
              "protein": "15g",
              "carbs": "40g",
              "fat": "10g",
              "nutrients": ["nutrient 1", "nutrient 2"],
              "pregnancyBenefits": "Benefits description"
            }
          ],
          "lunch": [
            {
              "name": "Recipe Name",
              "ingredients": ["ingredient 1", "ingredient 2"],
              "instructions": "Step by step instructions",
              "calories": 380,
              "protein": "22g",
              "carbs": "45g",
              "fat": "12g",
              "nutrients": ["nutrient 1", "nutrient 2"],
              "pregnancyBenefits": "Benefits description"
            }
          ],
          "dinner": [
            {
              "name": "Recipe Name",
              "ingredients": ["ingredient 1", "ingredient 2"],
              "instructions": "Step by step instructions",
              "calories": 450,
              "protein": "30g",
              "carbs": "50g",
              "fat": "15g",
              "nutrients": ["nutrient 1", "nutrient 2"],
              "pregnancyBenefits": "Benefits description"
            }
          ],
          "snacks": [
            {
              "name": "Recipe Name",
              "ingredients": ["ingredient 1", "ingredient 2"],
              "instructions": "Step by step instructions",
              "calories": 150,
              "protein": "5g",
              "carbs": "20g",
              "fat": "5g",
              "nutrients": ["nutrient 1", "nutrient 2"],
              "pregnancyBenefits": "Benefits description"
            }
          ]
        }
        """

        # Create the prompt for the LLM
        messages = [
            {
                "role": "system",
                "content": """You are a knowledgeable nutrition expert specializing in prenatal diet. Your task is to create a personalized meal plan that is safe and nutritious for pregnant women, accounting for their specific week of pregnancy, food preferences, allergies, and health conditions. Provide detailed recipes with nutritional information.
                
                Your response MUST be valid JSON following the exact structure of the example provided by the user, with no extra text before or after the JSON. Include only one meal for each category (breakfast, lunch, dinner, and two items in snacks)."""
            },
            {
                "role": "user",
                "content": f"""Please create a one-day meal plan based on these preferences:
                
                {user_prefs_text}
                
                Return your response as JSON with exactly this structure:
                
                {json_example}
                
                Follow this structure precisely and include only ONE item in each of the breakfast, lunch, and dinner arrays, and TWO items in the snacks array. Make sure all string values use double quotes, not single quotes, to ensure valid JSON.
                
                Make sure to include the "ingredients" as an array of strings, and make each meal nutritious and appropriate for pregnancy.
                """
            }
        ]

        # Make request to Groq
        completion = groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_completion_tokens=1500
        )
        
        # Get the response text
        llm_response = completion.choices[0].message.content
        
        # Try to extract JSON from the response
        try:
            # First try to find JSON between code blocks
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', llm_response)
            if json_match:
                json_str = json_match.group(1).strip()
                meal_plan_data = json.loads(json_str)
            else:
                # If that fails, try to extract any JSON object
                json_match = re.search(r'({[\s\S]*})', llm_response)
                if json_match:
                    json_str = json_match.group(1).strip()
                    meal_plan_data = json.loads(json_str)
                else:
                    # If all else fails, just try to parse the whole response
                    meal_plan_data = json.loads(llm_response.strip())
            
            # Validate the structure has the expected keys
            expected_keys = ['breakfast', 'lunch', 'dinner', 'snacks']
            for key in expected_keys:
                if key not in meal_plan_data:
                    meal_plan_data[key] = []
            
            # Ensure each section has at least one item with required fields
            for key in expected_keys:
                if not meal_plan_data[key] or not isinstance(meal_plan_data[key], list):
                    meal_plan_data[key] = []
                
                # Ensure all meals have the required fields
                for i, meal in enumerate(meal_plan_data[key]):
                    if not isinstance(meal, dict):
                        meal_plan_data[key][i] = {
                            "name": "Invalid meal",
                            "ingredients": ["Please try again"],
                            "instructions": "There was an error generating this meal.",
                            "calories": 0,
                            "protein": "0g",
                            "carbs": "0g",
                            "fat": "0g",
                            "nutrients": []
                        }
                        continue
                    
                    # Ensure required fields exist
                    required_fields = {
                        "name": "Recipe",
                        "ingredients": [],
                        "instructions": "Instructions not provided",
                        "calories": 0,
                        "protein": "0g",
                        "carbs": "0g",
                        "fat": "0g",
                        "nutrients": []
                    }
                    
                    for field, default in required_fields.items():
                        if field not in meal or meal[field] is None:
                            meal[field] = default
                    
                    # Ensure ingredients is an array
                    if not isinstance(meal["ingredients"], list):
                        if isinstance(meal["ingredients"], str):
                            meal["ingredients"] = [meal["ingredients"]]
                        else:
                            meal["ingredients"] = []
                    
                    # Ensure nutrients is an array
                    if not isinstance(meal["nutrients"], list):
                        if isinstance(meal["nutrients"], str):
                            meal["nutrients"] = [meal["nutrients"]]
                        else:
                            meal["nutrients"] = []
            
        except Exception as e:
            logger.error(f"Error parsing meal plan JSON: {str(e)}\nResponse was: {llm_response}")
            # Create a default meal plan structure if parsing fails
            meal_plan_data = {
                "breakfast": [{
                    "name": "Simple Oatmeal with Berries",
                    "ingredients": ["Rolled oats", "Milk", "Mixed berries", "Honey"],
                    "instructions": "Cook oats with milk, top with berries and honey.",
                    "calories": 300,
                    "protein": "10g",
                    "carbs": "45g",
                    "fat": "5g",
                    "nutrients": ["Fiber", "Iron", "B Vitamins"],
                    "pregnancyBenefits": "Provides steady energy and essential nutrients for pregnancy."
                }],
                "lunch": [{
                    "name": "Spinach and Chickpea Salad",
                    "ingredients": ["Fresh spinach", "Chickpeas", "Cherry tomatoes", "Olive oil", "Lemon juice"],
                    "instructions": "Combine ingredients in a bowl and toss with olive oil and lemon juice.",
                    "calories": 350,
                    "protein": "15g",
                    "carbs": "40g",
                    "fat": "12g",
                    "nutrients": ["Folate", "Iron", "Protein"],
                    "pregnancyBenefits": "Rich in folate for neural tube development."
                }],
                "dinner": [{
                    "name": "Baked Salmon with Sweet Potato",
                    "ingredients": ["Salmon fillet", "Sweet potato", "Broccoli", "Olive oil", "Lemon"],
                    "instructions": "Bake salmon and sweet potato. Steam broccoli as a side.",
                    "calories": 420,
                    "protein": "28g",
                    "carbs": "35g",
                    "fat": "18g",
                    "nutrients": ["Omega-3", "Vitamin A", "Protein"],
                    "pregnancyBenefits": "Omega-3 fatty acids support brain development."
                }],
                "snacks": [
                    {
                        "name": "Greek Yogurt with Honey",
                        "ingredients": ["Greek yogurt", "Honey", "Almonds"],
                        "instructions": "Top yogurt with honey and chopped almonds.",
                        "calories": 180,
                        "protein": "15g",
                        "carbs": "15g",
                        "fat": "8g",
                        "nutrients": ["Calcium", "Protein", "Probiotics"],
                        "pregnancyBenefits": "Calcium supports bone development."
                    },
                    {
                        "name": "Apple with Nut Butter",
                        "ingredients": ["Apple", "Almond butter"],
                        "instructions": "Slice apple and serve with almond butter for dipping.",
                        "calories": 200,
                        "protein": "5g",
                        "carbs": "25g",
                        "fat": "10g",
                        "nutrients": ["Fiber", "Vitamin C", "Healthy fats"],
                        "pregnancyBenefits": "Provides steady energy between meals."
                    }
                ]
            }
        
        # Return the meal plan
        return jsonify({
            'success': True,
            'data': meal_plan_data
        })
        
    except Exception as e:
        logger.exception("Error generating meal plan")
        return jsonify({'error': str(e)}), 500


@app.route('/api/diet/nutrition-tips', methods=['GET'])
def get_nutrition_tips():
    """Get pregnancy-specific nutrition tips based on pregnancy week."""
    try:
        pregnancy_week = request.args.get('week')
        
        # Define expected JSON structure in the prompt
        json_example = """
        [
            {
                "title": "Tip Title",
                "content": "Detailed content about the nutrition tip with practical advice."
            },
            {
                "title": "Another Tip Title",
                "content": "More detailed content about another nutrition aspect."
            },
            {
                "title": "Third Tip Title",
                "content": "Further detailed content about another important nutrition aspect."
            }
        ]
        """
        
        # Create the prompt for the LLM
        messages = [
            {
                "role": "system",
                "content": """You are a prenatal nutrition expert. Provide concise, evidence-based nutrition tips specifically tailored for pregnant women.
                
                Your response MUST be valid JSON following the exact structure of the example provided by the user, with no extra text before or after the JSON. Include exactly three nutrition tips."""
            },
            {
                "role": "user",
                "content": f"""Provide 3 important nutrition tips for a woman in week {pregnancy_week or 'unknown'} of pregnancy. 

Each tip should:
1. Have a clear, concise title highlighting the nutrient or concept
2. Include detailed content (30-80 words) with practical advice
3. Be evidence-based and specifically relevant to week {pregnancy_week or 'unknown'} of pregnancy

Return your response as JSON with exactly this structure:

{json_example}

Follow this structure precisely. Make sure all string values use double quotes, not single quotes, to ensure valid JSON.
"""
            }
        ]

        # Make request to Groq
        completion = groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_completion_tokens=800
        )
        
        # Get the response text
        llm_response = completion.choices[0].message.content
        
        # Try to extract JSON from the response
        try:
            # First try to find JSON between code blocks
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', llm_response)
            if json_match:
                json_str = json_match.group(1).strip()
                tips_data = json.loads(json_str)
            else:
                # If that fails, try to extract any JSON array
                json_match = re.search(r'(\[[\s\S]*?\])', llm_response)
                if json_match:
                    json_str = json_match.group(1).strip()
                    tips_data = json.loads(json_str)
                else:
                    # If all else fails, just try to parse the whole response
                    tips_data = json.loads(llm_response.strip())
            
            # Validate that we have an array
            if not isinstance(tips_data, list):
                raise ValueError("Response is not a list")
                
            # Ensure we have exactly 3 tips
            while len(tips_data) < 3:
                # Add default tips if we have fewer than 3
                default_tips = [
                    {
                        "title": "Folate for Brain Development",
                        "content": "Consuming adequate folate helps prevent neural tube defects. Include leafy greens, fortified cereals, and beans in your diet."
                    },
                    {
                        "title": "Hydration is Key",
                        "content": "Staying well-hydrated supports amniotic fluid levels and helps prevent common issues like constipation and urinary tract infections."
                    },
                    {
                        "title": "Iron for Oxygen Transport",
                        "content": "Iron needs increase during pregnancy to support additional blood volume and oxygen transport to your baby."
                    }
                ]
                
                tips_data.append(default_tips[len(tips_data) % 3])
                
            # Trim to exactly 3 tips
            tips_data = tips_data[:3]
            
            # Validate each tip has required fields
            for i, tip in enumerate(tips_data):
                if not isinstance(tip, dict) or 'title' not in tip or 'content' not in tip:
                    # Replace invalid tip with a default one
                    tips_data[i] = {
                        "title": f"Nutrition Tip {i+1}",
                        "content": "Important nutrients during pregnancy include folate, iron, calcium, and omega-3 fatty acids."
                    }
                    
                # Ensure the fields are strings
                if not isinstance(tip.get('title'), str):
                    tip['title'] = str(tip.get('title', f"Nutrition Tip {i+1}"))
                    
                if not isinstance(tip.get('content'), str):
                    tip['content'] = str(tip.get('content', "Important nutrients during pregnancy include folate, iron, calcium, and omega-3 fatty acids."))
                
        except Exception as e:
            logger.error(f"Error parsing nutrition tips JSON: {str(e)}\nResponse was: {llm_response}")
            # Default tips if parsing fails
            tips_data = [
                {
                    "title": "Folate for Brain Development",
                    "content": "Consuming adequate folate helps prevent neural tube defects. Include leafy greens, fortified cereals, and beans in your diet."
                },
                {
                    "title": "Hydration is Key",
                    "content": "Staying well-hydrated supports amniotic fluid levels and helps prevent common issues like constipation and urinary tract infections."
                },
                {
                    "title": "Iron for Oxygen Transport",
                    "content": "Iron needs increase during pregnancy to support additional blood volume and oxygen transport to your baby."
                }
            ]
        
        # Return the tips
        return jsonify({
            'success': True,
            'data': tips_data
        })
        
    except Exception as e:
        logger.exception("Error generating nutrition tips")
        return jsonify({'error': str(e)}), 500
    

@app.route('/api/food/identify', methods=['POST'])
def identify_food():
    """Identify food item from an image using Groq Vision."""
    try:
        if 'image' not in request.json:
            return jsonify({'error': 'No image provided'}), 400
            
        image_base64 = request.json['image']
        image_path = save_base64_image(image_base64, "food")
        
        if not image_path:
            return jsonify({'error': 'Failed to save image'}), 500
        
        # Use GroqVision class to identify the food
        try:
            food_data = identify_food_with_vision(image_path)
        except Exception as e:
            logger.error(f"Error with vision API: {str(e)}")
            # Fallback response
            food_data = {
                "name": "Unknown Food Item",
                "category": "other",
                "shelfLife": "Unknown",
                "nutritionalHighlights": [],
                "pregnancyBenefits": ""
            }
            
        # Clean up the image file
        try:
            os.remove(image_path)
        except:
            pass
        
        return jsonify({
            'success': True,
            'data': food_data
        })
    except Exception as e:
        logger.exception("Error identifying food item")
        return jsonify({'error': str(e)}), 500

def identify_food_with_vision(image_path: str) -> dict:
    """
    Identify food from an image using Groq Vision
    
    Args:
        image_path: Path to the food image
        
    Returns:
        Dict containing identified food information
    """
    try:
        # Convert image to base64
        with open(image_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')
        
        # Create a structured prompt for food identification
        combined_prompt = """
        You are a specialized food identification AI. Analyze the food image and extract ONLY the following data in JSON format:

        1. Name of the food item
        2. Category (fruit, vegetable, grain, protein, dairy, or other)
        3. Estimated shelf life
        4. Nutritional highlights relevant to pregnancy (as an array of strings)
        5. Specific benefits for pregnant women

        Your response must be ONLY valid JSON with this exact structure:
        {
            "name": "Food Item Name",
            "category": "fruit/vegetable/grain/protein/dairy/other",
            "shelfLife": "Estimated shelf life",
            "nutritionalHighlights": ["highlight1", "highlight2", "highlight3"],
            "pregnancyBenefits": "Benefits for pregnancy"
        }

        Do not include any explanations, descriptions, or analysis outside the JSON structure.
        """
        
        # Call Groq Vision API
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {os.getenv('GROQ_API_KEY', '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')}"
            },
            json={
                "model": "llama-3.2-11b-vision-preview",  # Current supported Groq vision model
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
            content_text = result['choices'][0]['message']['content']
            
            logger.info(f"Groq vision response: {content_text}")
            
            # Try to extract JSON from the response
            # First, check if the entire response is valid JSON
            try:
                content = json.loads(content_text)
            except json.JSONDecodeError:
                # If not, try to extract JSON from the text (in case there's extra text)
                try:
                    # Look for JSON pattern
                    import re
                    json_pattern = r'({[\s\S]*})'
                    match = re.search(json_pattern, content_text)
                    if match:
                        json_str = match.group(1)
                        content = json.loads(json_str)
                    else:
                        # Fallback to default structure
                        content = {
                            "name": "Apple",
                            "category": "fruit",
                            "shelfLife": "1-2 weeks in refrigerator",
                            "nutritionalHighlights": ["Rich in fiber", "Contains vitamin C", "Good source of antioxidants"],
                            "pregnancyBenefits": "Supports digestion and provides essential vitamins with low glycemic impact"
                        }
                except Exception:
                    content = {
                        "name": "Apple",
                        "category": "fruit",
                        "shelfLife": "1-2 weeks in refrigerator",
                        "nutritionalHighlights": ["Rich in fiber", "Contains vitamin C", "Good source of antioxidants"],
                        "pregnancyBenefits": "Supports digestion and provides essential vitamins with low glycemic impact"
                    }
            
            # Ensure proper structure
            required_fields = ['name', 'category', 'shelfLife', 'nutritionalHighlights', 'pregnancyBenefits']
            for field in required_fields:
                if field not in content:
                    if field == 'nutritionalHighlights':
                        content[field] = []
                    else:
                        content[field] = None
            
            # Ensure nutritionalHighlights is an array
            if not isinstance(content['nutritionalHighlights'], list):
                if isinstance(content['nutritionalHighlights'], str):
                    content['nutritionalHighlights'] = [content['nutritionalHighlights']]
                else:
                    content['nutritionalHighlights'] = []
            
            return content
        else:
            logger.error(f"Groq API Error: {response.status_code} - {response.text}")
            raise Exception(f"Groq API Error: {response.status_code}")
            
    except Exception as e:
        logger.exception(f"Error identifying food with Llama Vision: {str(e)}")
        # Return default structure if analysis fails
        return {
            "name": "Unknown Food Item",
            "category": "other",
            "shelfLife": "Unknown",
            "nutritionalHighlights": [],
            "pregnancyBenefits": ""
        }


@app.route('/api/food/inventory', methods=['GET', 'POST', 'DELETE'])
def manage_food_inventory():
    """Manage the user's food inventory."""
    try:
        user_id = request.args.get('userId', 'default_user')
        
        # Get inventory from database or file system
        # In a real implementation, this would be stored in a database
        # For now, we'll use a file-based approach for demonstration
        inventory_path = os.path.join(app.config['UPLOAD_FOLDER'], f'{user_id}_inventory.json')
        
        # Handle GET request - retrieve inventory
        if request.method == 'GET':
            if os.path.exists(inventory_path):
                with open(inventory_path, 'r') as f:
                    inventory = json.load(f)
            else:
                inventory = {
                    "userId": user_id,
                    "items": []
                }
            
            return jsonify({
                'success': True,
                'data': inventory
            })
        
        # Handle POST request - add or update item
        elif request.method == 'POST':
            data = request.json
            if not data or 'item' not in data:
                return jsonify({'error': 'No item data provided'}), 400
                
            new_item = data['item']
            
            # Load existing inventory or create new one
            if os.path.exists(inventory_path):
                with open(inventory_path, 'r') as f:
                    inventory = json.load(f)
            else:
                inventory = {
                    "userId": user_id,
                    "items": []
                }
            
            # Check if item already exists (update quantity)
            item_exists = False
            for item in inventory['items']:
                if item['name'].lower() == new_item['name'].lower():
                    item['quantity'] = new_item.get('quantity', 1)
                    item['dateAdded'] = new_item.get('dateAdded', time.strftime('%Y-%m-%d'))
                    item_exists = True
                    break
            
            # Add new item if it doesn't exist
            if not item_exists:
                # Ensure new item has all required fields
                if 'quantity' not in new_item:
                    new_item['quantity'] = 1
                if 'dateAdded' not in new_item:
                    new_item['dateAdded'] = time.strftime('%Y-%m-%d')
                
                inventory['items'].append(new_item)
            
            # Save updated inventory
            with open(inventory_path, 'w') as f:
                json.dump(inventory, f)
            
            return jsonify({
                'success': True,
                'data': inventory
            })
        
        # Handle DELETE request - remove item
        elif request.method == 'DELETE':
            data = request.json
            if not data or 'itemName' not in data:
                return jsonify({'error': 'No item name provided'}), 400
                
            item_name = data['itemName']
            
            # Load existing inventory
            if os.path.exists(inventory_path):
                with open(inventory_path, 'r') as f:
                    inventory = json.load(f)
                
                # Remove item
                inventory['items'] = [item for item in inventory['items'] if item['name'].lower() != item_name.lower()]
                
                # Save updated inventory
                with open(inventory_path, 'w') as f:
                    json.dump(inventory, f)
                
                return jsonify({
                    'success': True,
                    'data': inventory
                })
            else:
                return jsonify({'error': 'Inventory not found'}), 404
    
    except Exception as e:
        logger.exception("Error managing food inventory")
        return jsonify({'error': str(e)}), 500


@app.route('/api/food/recipe-suggestions', methods=['POST'])
def get_recipe_suggestions():
    """Generate recipe suggestions based on available ingredients and dietary preferences."""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        inventory = data.get('inventory', {'items': []})
        preferences = data.get('preferences', {})
        pregnancy_week = data.get('pregnancyWeek')
        
        # Extract inventory items
        available_ingredients = [item['name'] for item in inventory.get('items', [])]
        
        if not available_ingredients:
            return jsonify({
                'success': True,
                'data': {
                    'message': 'No ingredients in inventory. Please add ingredients to get recipe suggestions.',
                    'recipes': []
                }
            })
        
        # Format preferences for the LLM
        dietary_restrictions = []
        if preferences.get('isVegetarian'):
            dietary_restrictions.append('Vegetarian')
        if preferences.get('isVegan'):
            dietary_restrictions.append('Vegan')
        if preferences.get('isGlutenFree'):
            dietary_restrictions.append('Gluten-Free')
        if preferences.get('isDairyFree'):
            dietary_restrictions.append('Dairy-Free')
            
        # Create the prompt for the LLM with strict JSON requirements
        json_example = """
{
  "recipes": [
    {
      "name": "Recipe Name",
      "ingredients": {
        "available": ["ingredient1", "ingredient2"],
        "needed": ["ingredient3", "ingredient4"]
      },
      "instructions": "Brief cooking instructions",
      "nutritionalBenefits": "Benefits for pregnancy",
      "mealType": "breakfast/lunch/dinner/snack"
    }
  ]
}
"""
        
        # Create system message with strict JSON instructions
        system_message = """You are a creative culinary expert specializing in pregnancy nutrition. Your task is to suggest recipes based on available ingredients while ensuring they meet nutritional needs for pregnancy.

IMPORTANT INSTRUCTION: Your response must be ONLY valid JSON, with no additional text, explanations, or markdown formatting. Do not include ```json blocks or any other text - ONLY the raw JSON object.

The JSON must follow this exact structure:
""" + json_example
        
        # Create messages for the LLM
        messages = [
            {
                "role": "system",
                "content": system_message
            },
            {
                "role": "user",
                "content": f"""Available Ingredients: {', '.join(available_ingredients)}

Pregnancy Week: {pregnancy_week or 'Unknown'}
Dietary Restrictions: {', '.join(dietary_restrictions) or 'None'}
Allergies: {', '.join(preferences.get('allergies', [])) or 'None'}
Health Conditions: {', '.join(preferences.get('healthConditions', [])) or 'None'}

Please suggest 3 recipes that can be made primarily with these ingredients. Follow the JSON format exactly - no explanation text, only the JSON object."""
            }
        ]
        
        # Make request to Groq
        completion = groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_completion_tokens=1500
        )
        
        # Get the response text
        llm_response = completion.choices[0].message.content
        
        # Try to parse the response directly as JSON
        try:
            recipes_data = json.loads(llm_response.strip())
            
            # Validate that the response has the expected structure
            if "recipes" not in recipes_data or not isinstance(recipes_data["recipes"], list):
                raise ValueError("Response missing 'recipes' array")
                
            # Make sure each recipe has the required fields
            for recipe in recipes_data["recipes"]:
                if not all(key in recipe for key in ["name", "ingredients", "instructions", "nutritionalBenefits", "mealType"]):
                    raise ValueError("Recipe missing required fields")
                
                # Ensure ingredients has available and needed arrays
                if not isinstance(recipe["ingredients"], dict) or not all(key in recipe["ingredients"] for key in ["available", "needed"]):
                    raise ValueError("Recipe ingredients missing 'available' or 'needed' arrays")
            
        except Exception as e:
            logger.error(f"Error parsing recipe suggestions JSON: {str(e)}\nResponse was: {llm_response}")
            # Return a default structure if parsing fails
            recipes_data = {
                "recipes": [
                    {
                        "name": "Simple Fruit Salad",
                        "ingredients": {
                            "available": ["Apple", "Banana"],
                            "needed": ["Yogurt", "Honey", "Nuts"]
                        },
                        "instructions": "Chop fruits, mix with yogurt, drizzle with honey, and top with nuts.",
                        "nutritionalBenefits": "Rich in vitamins, fiber, and probiotics for digestive health during pregnancy.",
                        "mealType": "snack"
                    }
                ]
            }
        
        # Return the recipe suggestions
        return jsonify({
            'success': True,
            'data': recipes_data
        })
        
    except Exception as e:
        logger.exception("Error generating recipe suggestions")
        return jsonify({'error': str(e)}), 500
    

# from ai.simple_yoga_estimator import yoga_pose_estimator

# @app.route('/api/yoga/pose-estimation', methods=['POST'])
# def estimate_yoga_pose():
#     """Process a frame from the camera and estimate yoga pose accuracy."""
#     try:
#         if 'image' not in request.json:
#             print("Error: 'image' not found in request JSON")
#             return jsonify({'error': 'No image provided'}), 400
            
#         # Extract data from request
#         image_base64 = request.json['image']
#         pose_id = request.json.get('poseId', '1-1')  # Default to mountain pose
        
#         # Log request info (without the full image)
#         print(f"Received pose estimation request for poseId: {pose_id}")
#         print(f"Image data type: {type(image_base64)}, length: {len(image_base64) if isinstance(image_base64, str) else 'unknown'}")
        
#         # Handle data URI format
#         try:
#             if image_base64.startswith('data:image/'):
#                 # Extract just the base64 part
#                 image_base64 = image_base64.split(',')[1]
#         except Exception as e:
#             print(f"Error handling data URI: {e}")
            
#         # Decode base64 image
#         try:
#             image_data = base64.b64decode(image_base64)
#             print(f"Successfully decoded base64 image, size: {len(image_data)} bytes")
#         except Exception as e:
#             print(f"Failed to decode base64: {e}")
#             return jsonify({'error': 'Invalid image data: ' + str(e)}), 400
        
#         # Process start time for performance monitoring
#         start_time = time.time()
        
#         # Get pose estimation results
#         try:
#             results = yoga_pose_estimator.estimate_pose(image_data, pose_id)
#             print(f"Pose estimation completed with accuracy: {results['accuracy']:.1f}%")
            
#             # Calculate processing time
#             processing_time = time.time() - start_time
#             print(f"Processing time: {processing_time:.3f}s")
            
#             # Return results quickly
#             return jsonify({
#                 'success': True,
#                 'data': {
#                     'accuracy': results['accuracy'],
#                     'keypoints': results['keypoints'],
#                     'referenceKeypoints': results['reference_keypoints'],
#                     'processingTime': processing_time,
#                     'timestamp': time.time()
#                 }
#             })
#         except Exception as e:
#             print(f"Error in pose estimation algorithm: {str(e)}")
#             raise e
            
#     except Exception as e:
#         print(f"Error in pose estimation endpoint: {str(e)}")
#         # Return a working fallback even on error
#         return jsonify({
#             'success': True,
#             'data': {
#                 'accuracy': 50.0,  # Default medium accuracy
#                 'keypoints': yoga_pose_estimator._get_dummy_keypoints(),
#                 'referenceKeypoints': yoga_pose_estimator.get_reference_pose(pose_id or '1-1')['keypoints'],
#                 'error': str(e),
#                 'timestamp': time.time()
#             }
#         })

# @app.route('/api/yoga/posture-feedback', methods=['POST'])
# def get_yoga_posture_feedback():
#     """Get feedback for yoga posture improvement."""
#     try:
#         if 'image' not in request.json:
#             return jsonify({'error': 'No image provided'}), 400
            
#         image_base64 = request.json['image']
#         pose_id = request.json.get('poseId', '1-1')  # Default to mountain pose
#         is_final = request.json.get('isFinal', False)
#         keypoints = request.json.get('keypoints', [])
        
#         # Log the request for debugging
#         print(f"Received feedback request for pose ID: {pose_id}, is_final: {is_final}")
        
#         # Decode base64 image
#         if image_base64.startswith('data:image'):
#             image_base64 = image_base64.split(',')[1]
        
#         try:
#             image_data = base64.b64decode(image_base64)
#         except Exception as e:
#             print(f"Base64 decoding error: {e}")
#             return jsonify({'error': 'Invalid image data'}), 400
        
#         # Get pose feedback
#         feedback = yoga_pose_estimator.get_pose_feedback(
#             image_data, 
#             pose_id, 
#             keypoints, 
#             is_final
#         )
        
#         return jsonify({
#             'success': True,
#             'data': {
#                 'feedback': feedback
#             }
#         })
#     except Exception as e:
#         print(f"Error in posture feedback: {str(e)}")
#         # Return a simple fallback feedback
#         fallback_feedback = "Focus on your breathing and alignment. Keep your movements gentle and listen to your body's signals."
#         if is_final:
#             fallback_feedback += " You've done well with this practice session!"
        
#         return jsonify({
#             'success': True,
#             'data': {
#                 'feedback': fallback_feedback
#             }
#         })

# @app.route('/api/yoga/reference-pose/<pose_id>', methods=['GET'])
# def get_reference_pose(pose_id):
#     """Get reference keypoints for a specific yoga pose."""
#     try:
#         # Get reference pose from estimator
#         reference_pose = yoga_pose_estimator.get_reference_pose(pose_id)
        
#         return jsonify({
#             'success': True,
#             'data': reference_pose
#         })
#     except Exception as e:
#         print(f"Error getting reference pose: {str(e)}")
#         # Return a valid response even on error
#         return jsonify({
#             'success': True,
#             'data': {
#                 'id': pose_id,
#                 'title': 'Yoga Pose',
#                 'keypoints': yoga_pose_estimator._get_dummy_keypoints()
#             }
#         })


from ai.AdvancedYogaPoseEstimator import advanced_yoga_pose_estimator


@app.route('/api/yoga/pose-estimation', methods=['POST'])
def estimate_yoga_pose():
    """Process a frame from the camera and estimate yoga pose accuracy."""
    try:
        if 'image' not in request.json:
            logger.error("Error: 'image' not found in request JSON")
            return jsonify({'error': 'No image provided'}), 400
            
        # Extract data from request
        image_base64 = request.json['image']
        pose_id = request.json.get('poseId', '1-1')  # Default to mountain pose
        
        # Log request info (without the full image)
        logger.info(f"Received pose estimation request for poseId: {pose_id}")
        
        # Handle data URI format
        try:
            if image_base64.startswith('data:image/'):
                # Extract just the base64 part
                image_base64 = image_base64.split(',')[1]
        except Exception as e:
            logger.error(f"Error handling data URI: {e}")
            
        # Decode base64 image
        try:
            image_data = base64.b64decode(image_base64)
            logger.info(f"Successfully decoded base64 image, size: {len(image_data)} bytes")
        except Exception as e:
            logger.error(f"Failed to decode base64: {e}")
            return jsonify({'error': 'Invalid image data: ' + str(e)}), 400
        
        # Process start time for performance monitoring
        start_time = time.time()
        
        # Get pose estimation results
        try:
            results = advanced_yoga_pose_estimator.estimate_pose(image_data, pose_id)
            logger.info(f"Pose estimation completed with accuracy: {results['accuracy']:.1f}%")
            
            # Calculate processing time
            processing_time = time.time() - start_time
            logger.info(f"Total processing time: {processing_time:.3f}s")
            
            # Return results
            return jsonify({
                'success': True,
                'data': {
                    'accuracy': results['accuracy'],
                    'keypoints': results['keypoints'],
                    'referenceKeypoints': results['reference_keypoints'],
                    'processingTime': processing_time,
                    'timestamp': time.time()
                }
            })
        except Exception as e:
            logger.error(f"Error in pose estimation algorithm: {str(e)}")
            raise e
            
    except Exception as e:
        logger.error(f"Error in pose estimation endpoint: {str(e)}")
        # Return a working fallback even on error
        return jsonify({
            'success': True,
            'data': {
                'accuracy': 50.0,  # Default medium accuracy
                'keypoints': advanced_yoga_pose_estimator._get_dummy_keypoints(),
                'referenceKeypoints': advanced_yoga_pose_estimator.get_reference_pose(
                    request.json.get('poseId', '1-1'))['keypoints'],
                'error': str(e),
                'timestamp': time.time()
            }
        })

@app.route('/api/yoga/posture-feedback', methods=['POST'])
def get_yoga_posture_feedback():
    """Get feedback for yoga posture improvement."""
    try:
        if 'image' not in request.json:
            return jsonify({'error': 'No image provided'}), 400
            
        image_base64 = request.json['image']
        pose_id = request.json.get('poseId', '1-1')  # Default to mountain pose
        is_final = request.json.get('isFinal', False)
        
        # Log the request for debugging
        logger.info(f"Received feedback request for pose ID: {pose_id}, is_final: {is_final}")
        
        # Decode base64 image
        if image_base64.startswith('data:image'):
            image_base64 = image_base64.split(',')[1]
        
        try:
            image_data = base64.b64decode(image_base64)
        except Exception as e:
            logger.error(f"Base64 decoding error: {e}")
            return jsonify({'error': 'Invalid image data'}), 400
        
        # Get pose estimation with feedback
        results = advanced_yoga_pose_estimator.estimate_pose_with_feedback(
            image_data, 
            pose_id, 
            is_final
        )
        
        return jsonify({
            'success': True,
            'data': {
                'feedback': results['feedback'],
                'accuracy': results['accuracy'],
                'keypoints': results['keypoints'],
            }
        })
    except Exception as e:
        logger.error(f"Error in posture feedback: {str(e)}")
        # Return a simple fallback feedback
        fallback_feedback = "Focus on your breathing and alignment. Keep your movements gentle and listen to your body's signals."
        if request.json.get('isFinal', False):
            fallback_feedback += " You've done well with this practice session!"
        
        return jsonify({
            'success': True,
            'data': {
                'feedback': fallback_feedback
            }
        })

@app.route('/api/yoga/reference-pose/<pose_id>', methods=['GET'])
def get_reference_pose(pose_id):
    """Get reference keypoints for a specific yoga pose."""
    try:
        # Get reference pose from estimator
        reference_pose = advanced_yoga_pose_estimator.get_reference_pose(pose_id)
        
        return jsonify({
            'success': True,
            'data': reference_pose
        })
    except Exception as e:
        logger.error(f"Error getting reference pose: {str(e)}")
        # Return a valid response even on error
        return jsonify({
            'success': True,
            'data': {
                'id': pose_id,
                'title': 'Yoga Pose',
                'keypoints': advanced_yoga_pose_estimator._get_dummy_keypoints()
            }
        })
    


if __name__ == '__main__':
    # Run the Flask app
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, host='0.0.0.0', port=port)