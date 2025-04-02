# ai/groq_vision.py
import os
import base64
import requests
import json
import logging
from typing import Dict, Any, Optional

# Configure logging
logger = logging.getLogger(__name__)

# Configure Groq API settings
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "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")
GROQ_API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

class GroqVision:
    """Groq Vision LLM integration for analyzing medical images"""
    
    @staticmethod
    def analyze_prescription(image_path: str) -> Dict[str, Any]:
        """
        Analyze a prescription image using Groq Vision
        
        Args:
            image_path: Path to the prescription image
            
        Returns:
            Dict containing extracted prescription information
        """
        try:
            # Convert image to base64
            with open(image_path, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode('utf-8')
            
            # Create a more structured prompt for prescription analysis
            combined_prompt = """
            You are a specialized medical data extraction AI. Analyze the prescription image and extract ONLY the following data in JSON format:

            1. Date of prescription (format as YYYY-MM-DD)
            2. List of medications with these exact fields for each:
               - name: The medication name
               - dosage: Complete dosage instructions
               - frequency: How often to take it
               - quantity: Number of units prescribed
               - pillsPerDay: Number of pills to take per day (as a string)

            Your response must be ONLY valid JSON with this exact structure:
            {
                "date": "YYYY-MM-DD",
                "medicines": [
                    {
                        "name": "Medication Name",
                        "dosage": "Complete dosage information",
                        "frequency": "Frequency information",
                        "quantity": "Quantity information",
                        "pillsPerDay": "Number of pills per day"
                    }
                ]
            }

            Do not include any explanations, descriptions, or analysis outside the JSON structure.
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
                content_text = result['choices'][0]['message']['content']

                print(f"Groq response: {content_text}")
                
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
                            content = {"date": None, "medicines": []}
                    except Exception:
                        content = {"date": None, "medicines": []}
                
                # Ensure proper structure
                if 'medicines' not in content:
                    content['medicines'] = []
                if 'date' not in content:
                    content['date'] = None
                
                # Normalize the data format
                for medicine in content['medicines']:
                    for field in ['name', 'dosage', 'frequency', 'quantity', 'pillsPerDay']:
                        if field not in medicine:
                            medicine[field] = None
                
                return content
            else:
                logger.error(f"Groq API Error: {response.status_code} - {response.text}")
                raise Exception(f"Groq API Error: {response.status_code}")
                
        except Exception as e:
            logger.exception(f"Error analyzing prescription with Groq: {str(e)}")
            # Return default structure if analysis fails
            return {
                "date": None,
                "medicines": []
            }
    
    @staticmethod
    def identify_medication(image_path: str) -> Dict[str, Any]:
        """
        Identify medication from an image using Groq Vision
        
        Args:
            image_path: Path to the medication image
            
        Returns:
            Dict containing identified medication information
        """
        try:
            # Convert image to base64
            with open(image_path, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode('utf-8')
            
            # Create a structured prompt for medication identification
            combined_prompt = """
            You are a specialized pharmaceutical data extraction AI. Analyze the medication image and extract ONLY the following data in JSON format:

            1. Medication name
            2. Approximate pill count (if visible)
            3. Any visible expiry date
            4. Detailed description of the pills (color, shape, markings)

            Your response must be ONLY valid JSON with this exact structure:
            {
                "name": "Medication Name",
                "pillCount": number or null,
                "expiryDate": "YYYY-MM-DD" or null,
                "description": "Detailed description of the medication"
            }

            Do not include any explanations, descriptions, or analysis outside the JSON structure.
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
                content_text = result['choices'][0]['message']['content']
                print(f"Groq response: {content_text}")
                
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
                                "name": None,
                                "pillCount": None,
                                "expiryDate": None,
                                "description": "Could not analyze medication image"
                            }
                    except Exception:
                        content = {
                            "name": None,
                            "pillCount": None,
                            "expiryDate": None,
                            "description": "Could not analyze medication image"
                        }
                
                # Ensure proper structure
                for required_field in ['name', 'pillCount', 'expiryDate', 'description']:
                    if required_field not in content:
                        content[required_field] = None
                
                return content
            else:
                logger.error(f"Groq API Error: {response.status_code} - {response.text}")
                raise Exception(f"Groq API Error: {response.status_code}")
                
        except Exception as e:
            logger.exception(f"Error identifying medication with Groq: {str(e)}")
            # Return default structure if analysis fails
            return {
                "name": None,
                "pillCount": None,
                "expiryDate": None,
                "description": "Could not analyze medication image"
            }