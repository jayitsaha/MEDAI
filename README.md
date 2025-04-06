# MEDAI - AI-Powered Healthcare Assistant

<div align="center">
  
![MEDAI Logo](https://res.cloudinary.com/dqyfo532e/image/upload/c_pad,w_500,h_500,ar_1:1/v1743966026/medai-logo_wwfe6e.png)

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://semver.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-v0.70+-61dafb.svg)](https://reactnative.dev/)
[![Flask](https://img.shields.io/badge/Flask-v2.0+-black.svg)](https://flask.palletsprojects.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-Powered-EE4C2C.svg)](https://pytorch.org/)
[![Groq](https://img.shields.io/badge/Groq-Powered-purple.svg)](https://groq.com/)
[![Meta AI](https://img.shields.io/badge/Meta%20AI-Powered-0668E1.svg)](https://ai.meta.com/)

**MEDAI is an AI-powered healthcare assistant designed to provide personalized support for both Alzheimer's patients and pregnant women.**

</div>

## 🌟 Overview

MEDAI combines cutting-edge AI technology with user-friendly mobile interfaces to address the unique healthcare needs of vulnerable populations. The application offers specialized care pathways for:

- **Alzheimer's Patients**: Medication management, safe zone tracking, and fall detection
- **Pregnant Women**: Nutrition guidance, yoga assistance, personalized chatbot support, and appointment scheduling

Built with privacy, accessibility, and medical accuracy at its core, MEDAI aims to improve healthcare outcomes through personalized digital interventions.

## ✨ Key Features

### For Alzheimer's Patients
- 💊 **Smart Medication Management**: Scan, identify, and track medications with reminders
- 🗺️ **Safe Zone Monitoring**: Set geographic boundaries for patient safety
- 🚨 **Fall Detection**: Automatic detection of falls using device accelerometer data
- 📋 **Simplified Interface**: Easy-to-navigate design for cognitive accessibility

### For Pregnant Women
- 🧘‍♀️ **AI Yoga Assistant**: Real-time pose estimation and pregnancy-safe guidance
- 🍎 **Nutrition Tracker**: Food identification, dietary recommendations, and meal planning
- 💬 **Pregnancy Assistant**: Personalized chatbot for pregnancy questions and concerns
- 📅 **Appointment Scheduler**: Manage prenatal appointments and reminders

### Core Technology
- 🧠 **Hybrid AI**: Powered by Meta's Llama models and Groq's fast inference engine
- 📷 **Computer Vision**: Meta's Detectron2 for medication recognition with Groq Vision for food identification
- 📊 **Personalized Analytics**: Track health metrics with PyTorch ML models and specialized algorithms
- 📱 **On-Device AI**: PyTorch Mobile for privacy-sensitive processing and Groq for cloud acceleration
- 🔒 **Privacy-Focused**: Local processing for sensitive data with secure cloud processing for complex tasks

## 📱 Screenshots

<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 30px;">
  <img src="https://res.cloudinary.com/dqyfo532e/image/upload/v1743966771/login_screen_b9xzxb.jpg" alt="Login Screen" width="200"/>
  <img src="https://res.cloudinary.com/dqyfo532e/image/upload/v1743966770/safezone_lnmctx.jpg" alt="Safezone Feature" width="200"/>
  <img src="https://res.cloudinary.com/dqyfo532e/image/upload/v1743966770/preg_dash_ufeobi.jpg" alt="Pregnancy Dashboard" width="200"/>

  <img src="https://res.cloudinary.com/dqyfo532e/image/upload/v1743966770/diet_bjd4nm.jpg" alt="Diet Planner" width="200"/>
  <img src="https://res.cloudinary.com/dqyfo532e/image/upload/v1743966770/yoga_dkwf7k.jpg" alt="Yoga Guidance" width="200"/>
  <img src="https://res.cloudinary.com/dqyfo532e/image/upload/v1743966770/guardian_login_vecwhx.jpg" alt="Guardian Login" width="200"/>

  <img src="https://res.cloudinary.com/dqyfo532e/image/upload/v1743966771/pat_guardian_dash_mmk2gu.jpg" alt="Patient-Guardian Dashboard" width="200"/>
  <img src="https://res.cloudinary.com/dqyfo532e/image/upload/v1743966770/emergency_jjnnv0.jpg" alt="Emergency Screen" width="200"/>
</div>



## 🛠️ Technology Stack

### Mobile Application
- **Framework**: React Native (Meta's cross-platform framework)
- **Navigation**: React Navigation with Stack and Tab navigators
- **State Management**: React Hooks and Context API with AsyncStorage
- **UI Components**: Expo-based components with custom styling
- **Icons**: Ionicons from Expo Vector Icons
- **Notifications**: Expo notifications with local scheduling
- **Sensors**: Device accelerometer access for fall detection
- **Camera**: React Native Camera for medication and food scanning
- **Geolocation**: Safe zone tracking for Alzheimer's patients

### Backend Server
- **Framework**: Flask (Python) with Flask-CORS for API access
- **AI Models**:
  - Groq client for fast LLama 3.3-70B inference and chat completions
  - Meta's Llama models for specialized medical NLP tasks
  - PyTorch, Detectron2 and DinoV2 for computer vision and pose estimation
  - Vision AI integration for medication and food identification
- **APIs**: RESTful endpoints with JSON responses and SSE for streaming
- **Storage**: File-based storage with UUID generation for resources
- **Authentication**: Token-based system with AsyncStorage integration

## 📋 Project Structure

```
MEDAI/
├── mobile-app/                    # React Native application
│   ├── screens/                   # App screens organized by user type
│   │   ├── alzheimers/            # Alzheimer's patient screens
│   │   │   ├── HomeScreen.js      # Main dashboard for Alzheimer's pathway
│   │   │   ├── MedicationScreen.js # Medication tracking interface
│   │   │   └── SafeZoneScreen.js  # Geofencing safety features
│   │   ├── pregnancy/             # Pregnancy screens
│   │   │   ├── HomeScreen.js      # Main dashboard for pregnancy pathway
│   │   │   ├── YogaScreen.js      # Yoga pose guidance with AI
│   │   │   ├── ChatbotScreen.js   # Pregnancy assistant chatbot
│   │   │   ├── DietScreen.js      # Nutrition and meal planning
│   │   │   └── AppointmentScreen.js # Appointment scheduling
│   │   └── onboarding/            # Shared onboarding screens
│   │       └── PersonaSelectionScreen.js # User pathway selection
│   ├── services/                  # Core services
│   │   ├── FallDetectionService.js # Accelerometer monitoring
│   │   └── NotificationService.js  # Push notification handling
│   ├── components/                # Reusable UI components
│   └── App.js                     # Application entry point
│
└── server/                        # Flask backend server
    ├── ai/                        # AI modules
    │   ├── chatbot.py             # Pregnancy assistant chatbot
    │   ├── fall_detection.py      # Fall detection algorithms
    │   ├── ocr.py                 # Optical character recognition
    │   ├── grok_vision.py         # Vision AI integration
    │   └── AdvancedYogaPoseEstimator.py # Yoga pose estimation
    ├── static/                    # Static files and uploads
    │   └── uploads/               # User-uploaded images for processing
    └── app.py                     # Server entry point with RESTful API endpoints
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- Python (v3.8+)
- React Native development environment
- Groq API key
- Meta AI models (if using local inference)
- Expo CLI (for mobile development)

### Server Setup
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/medai.git
   cd medai-server
   ```

2. Create a virtual environment and install dependencies
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Create a `.env` file with your API keys
   ```
   GROQ_API_KEY=your_groq_api_key_here
   META_AI_API_KEY=your_meta_ai_key_here  # If using Meta's AI services
   ```

4. Start the server
   ```bash
   python app.py
   ```
   The server will be running on http://localhost:5001

### Mobile App Setup
1. Navigate to the mobile app directory
   ```bash
   cd MEDAI APP
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Update the API endpoint in `services/api.js` to point to your server

4. Start the application
   ```bash
   npx expo start
   ```

## 📖 Usage Examples

### Medication Management
```javascript
// Scan medication using the device camera
const scanMedication = async () => {
  const image = await captureImage();
  const response = await api.post('/api/ocr/medicine', { image });
  
  if (response.data.success) {
    // Display medication information
    setMedication(response.data.data);
  }
};
```

### Pregnancy Assistant ChatBot
```javascript
// Chat with the AI pregnancy assistant
const sendMessage = async (message) => {
  const payload = {
    message,
    week: pregnancyWeek,
    history: chatHistory,
    stream: true  // Use streaming response
  };
  
  // Connect to SSE endpoint for streaming response
  const eventSource = new EventSource(`${API_URL}/api/chatbot/pregnancy`);
  
  eventSource.onmessage = (event) => {
    if (event.data === "[DONE]") {
      eventSource.close();
      return;
    }
    
    const chunk = JSON.parse(event.data);
    // Process the streamed response chunk
    updateChatHistory(chunk.choices[0].delta.content);
  };
  
  // Send message to start the stream
  await api.post('/api/chatbot/pregnancy', payload);
};
```

### Yoga Pose Estimation
```javascript
// Analyze yoga pose from camera frame
const analyzePose = async (frameData) => {
  const payload = {
    image: frameData,
    poseId: currentPose.id
  };
  
  const response = await api.post('/api/yoga/pose-estimation', payload);
  
  if (response.data.success) {
    const { accuracy, keypoints, feedback } = response.data.data;
    updatePoseGuidance(accuracy, feedback);
    renderPoseOverlay(keypoints);
  }
};
```

## 🔄 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check endpoint |
| `/api/ocr/prescription` | POST | Process a prescription image with vision AI |
| `/api/ocr/medicine` | POST | Identify medication from image |
| `/api/chatbot/pregnancy` | POST | Get responses from pregnancy assistant (supports SSE streaming) |
| `/api/chat` | POST | General purpose chat with Groq's LLama model |
| `/api/fall-detection/analyze` | POST | Analyze accelerometer data for falls |
| `/api/medication/info` | GET | Get detailed medication information |
| `/api/diet/meal-plan` | POST | Generate personalized meal plans |
| `/api/diet/nutrition-tips` | GET | Get pregnancy nutrition tips by week |
| `/api/food/identify` | POST | Identify food items from images |
| `/api/food/inventory` | GET/POST/DELETE | Manage user's food inventory |
| `/api/food/recipe-suggestions` | POST | Generate recipes from available ingredients |
| `/api/yoga/pose-estimation` | POST | Estimate yoga pose accuracy |
| `/api/yoga/posture-feedback` | POST | Get AI feedback on yoga posture |
| `/api/yoga/reference-pose/<pose_id>` | GET | Get reference keypoints for yoga poses |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the project's coding standards and includes appropriate tests.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Meta](https://ai.meta.com/) for React Native and AI research foundations
- [Groq](https://groq.com/) for high-performance LLM inference
- [PyTorch](https://pytorch.org/) for machine learning capabilities
- [Flask](https://flask.palletsprojects.com/) for the backend framework
- [Expo](https://expo.dev/) for React Native development tools
- [React Navigation](https://reactnavigation.org/) for app navigation
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) for persistent storage
- All the contributors who have helped shape MEDAI

---

<div align="center">
  <p>Made with ❤️ for better healthcare accessibility</p>
  <p>© 2025 MEDAI Team</p>
</div>
