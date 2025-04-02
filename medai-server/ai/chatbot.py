import random
import re
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

# Response templates for common pregnancy questions
RESPONSE_TEMPLATES = {
    'diet': [
        "During pregnancy, focus on a balanced diet with fruits, vegetables, whole grains, lean proteins, and dairy. "
        "Foods to avoid include: raw or undercooked meat, unpasteurized dairy, high-mercury fish, and alcohol.",
        
        "A healthy pregnancy diet should include folate-rich foods (leafy greens, citrus), calcium sources (dairy), "
        "iron (lean meats, beans), and omega-3 fatty acids (fatty fish like salmon, walnuts). Stay hydrated and "
        "consider prenatal vitamins."
    ],
    
    'exercise': [
        "Exercise during pregnancy is generally safe and beneficial. Good options include walking, swimming, "
        "stationary cycling, and modified yoga or Pilates. Aim for 150 minutes of moderate activity per week.",
        
        "Regular prenatal exercise can help manage weight, improve sleep, reduce back pain, and may make labor easier. "
        "Avoid exercises that involve lying flat on your back after the first trimester and high-impact activities."
    ],
    
    'symptoms': [
        "Common pregnancy symptoms include morning sickness, fatigue, frequent urination, tender breasts, and mood changes. "
        "Contact your doctor for severe symptoms like heavy bleeding, severe pain, vision changes, or difficulty breathing.",
        
        "Pregnancy symptoms vary between individuals. Physical symptoms may include nausea, fatigue, and swelling. "
        "Emotional symptoms can include mood swings and anxiety. Most symptoms are normal, but discuss any concerns with your doctor."
    ],
    
    'complications': [
        "Contact your doctor immediately if you experience vaginal bleeding, severe abdominal pain, severe headaches, "
        "vision changes, sudden swelling, reduced fetal movement, or fever.",
        
        "Pregnancy complications can include gestational diabetes, preeclampsia, and preterm labor. Regular prenatal visits "
        "help detect these issues early. Know the warning signs and don't hesitate to contact your healthcare provider."
    ],
    
    'development': [
        "By week 8, all organs are beginning to form. By week 12, fingers and toes are distinct. Around week 20, "
        "you may feel movement, and by week 24, the baby has a chance of survival outside the womb.",
        
        "Baby development varies by trimester. First trimester: organ systems form. Second trimester: features develop and "
        "movement begins. Third trimester: baby gains weight and prepares for birth."
    ],
    
    'labor': [
        "Labor signs include regular contractions, water breaking, lower back pain, and bloody show. Early labor may last "
        "hours with mild contractions. Active labor features stronger contractions. Transition is intense but short.",
        
        "Prepare for labor by learning about the stages, pain management options, and creating a birth plan. "
        "Consider taking a childbirth class. Pack your hospital bag by 36 weeks."
    ]
}

def get_pregnancy_response(user_message, pregnancy_week=None, chat_history=None):
    """
    Generate a response to a pregnancy-related question.
    
    Args:
        user_message (str): The user's message or question
        pregnancy_week (int, optional): The current pregnancy week
        chat_history (list, optional): Previous messages for context
        
    Returns:
        str: A response to the user's message
    """
    try:
        # Convert user message to lowercase for easier matching
        message_lower = user_message.lower()
        
        # Check if the message matches any of our predefined topics
        for topic, responses in RESPONSE_TEMPLATES.items():
            if topic_match(message_lower, topic):
                # Select a response from the available templates for this topic
                response = random.choice(responses)
                
                # Personalize response with pregnancy week if available
                if pregnancy_week and topic == 'development':
                    response = personalize_development_response(response, pregnancy_week)
                    
                return response
        
        # Use GPT-like response generation for general questions
        return generate_general_response(user_message, pregnancy_week, chat_history)
    except Exception as e:
        logger.exception("Error generating pregnancy response")
        return "I'm sorry, I'm having trouble processing your question right now. Please try again or ask about a specific topic like diet, exercise, or symptoms during pregnancy."

def topic_match(message, topic):
    """Determine if a message matches a topic based on keywords."""
    topic_keywords = {
        'diet': ['diet', 'food', 'eat', 'eating', 'nutrition', 'meal', 'vitamin', 'nutrient', 'avoid', 'safe to eat'],
        'exercise': ['exercise', 'workout', 'activity', 'yoga', 'walk', 'swimming', 'active', 'fitness', 'safe to exercise'],
        'symptoms': ['symptom', 'feeling', 'nausea', 'sick', 'morning sickness', 'tired', 'fatigue', 'pain', 'ache', 'normal to feel'],
        'complications': ['complication', 'problem', 'risk', 'danger', 'warning', 'emergency', 'worried', 'concern'],
        'development': ['development', 'growing', 'size', 'baby size', 'fetus', 'milestone', 'develop', 'week', 'month', 'trimester'],
        'labor': ['labor', 'birth', 'delivery', 'contraction', 'water break', 'hospital', 'due date', 'sign of labor']
    }
    
    return any(keyword in message for keyword in topic_keywords.get(topic, []))

def personalize_development_response(response, week):
    """Add personalized information based on pregnancy week."""
    week = int(week)
    # Early pregnancy (weeks 1-13)
    if week <= 13:
        addition = f" At week {week}, your baby is about the size of a {get_size_comparison(week)} and is developing rapidly."
    # Mid pregnancy (weeks 14-27)
    elif week <= 27:
        addition = f" Now at week {week}, your baby is about the size of a {get_size_comparison(week)} and you might be feeling movement!"
    # Late pregnancy (weeks 28-40+)
    else:
        addition = f" At week {week}, your baby is about the size of a {get_size_comparison(week)} and is preparing for birth."
    
    return response + addition

def get_size_comparison(week):
    """Get a fruit/object comparison for the baby's size at a given week."""
    size_comparisons = {
        4: "poppy seed",
        5: "sesame seed",
        6: "pea",
        7: "blueberry",
        8: "kidney bean",
        9: "grape",
        10: "kumquat",
        11: "fig",
        12: "lime",
        13: "lemon",
        14: "navel orange",
        15: "apple",
        16: "avocado",
        17: "pear",
        18: "bell pepper",
        19: "tomato",
        20: "banana",
        21: "carrot",
        22: "papaya",
        23: "mango",
        24: "cantaloupe",
        25: "cauliflower",
        26: "lettuce",
        27: "cabbage",
        28: "eggplant",
        29: "acorn squash",
        30: "cucumber",
        31: "coconut",
        32: "squash",
        33: "pineapple",
        34: "butternut squash",
        35: "honeydew melon",
        36: "head of romaine lettuce",
        37: "bunch of Swiss chard",
        38: "winter melon",
        39: "small pumpkin",
        40: "watermelon"
    }
    
    # Default to closest week if exact week not in dictionary
    week = int(week)
    if week not in size_comparisons:
        closest_week = min(size_comparisons.keys(), key=lambda x: abs(x - week))
        return size_comparisons[closest_week]
    
    return size_comparisons[week]

def generate_general_response(user_message, pregnancy_week=None, chat_history=None):
    """Generate a general response when no specific template matches."""
    # Sample general responses
    general_responses = [
        "That's a great question about pregnancy. It's always best to discuss specific concerns with your healthcare provider, but I can share that many women have similar questions.",
        
        "During pregnancy, your body undergoes many changes, and it's normal to have questions. Your doctor is the best resource for personalized advice.",
        
        "Every pregnancy is unique, but your question is common among expectant mothers. I recommend discussing this at your next prenatal visit.",
        
        "This is something many pregnant women wonder about. While I can provide general information, your healthcare provider can offer personalized guidance based on your specific situation."
    ]
    
    # Personalize with pregnancy week if available
    if pregnancy_week:
        week_specific_responses = [
            f"At week {pregnancy_week}, many women have similar questions. Your prenatal visits are a great time to discuss this with your healthcare provider.",
            
            f"Week {pregnancy_week} is an important time in your pregnancy journey. This is a good question to bring up at your next checkup.",
            
            f"During week {pregnancy_week} of pregnancy, your baby continues to develop, and it's normal to have questions like this. Your doctor can provide the best guidance."
        ]
        general_responses.extend(week_specific_responses)
    
    # Look for specific keywords to give more directed response
    lower_message = user_message.lower()
    
    if "pain" in lower_message or "hurt" in lower_message:
        return "If you're experiencing pain, it's important to contact your healthcare provider. While some discomfort can be normal during pregnancy, your doctor can help determine if your symptoms require attention."
    
    if "sleep" in lower_message or "sleeping" in lower_message:
        return "Sleep challenges are common during pregnancy. Try sleeping on your left side with pillows supporting your belly and between your knees. Establish a relaxing bedtime routine and avoid screens before bed. If sleep problems persist, discuss them with your healthcare provider."
    
    if "tired" in lower_message or "fatigue" in lower_message:
        return "Fatigue is very common during pregnancy, especially in the first and third trimesters. Make sure you're getting enough rest, staying hydrated, and eating regular, nutritious meals. If fatigue is severe or sudden, talk to your healthcare provider."
    
    return random.choice(general_responses)