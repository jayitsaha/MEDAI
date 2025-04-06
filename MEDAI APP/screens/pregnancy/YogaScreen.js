import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  Dimensions,
  Modal,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VideoPlayer from './VideoPlayer';
import YogaPoseEstimator from '../../components/pregnancy/YogaPoseEstimator';
import YouTubePlayer from './YouTubePlayer'; // Import the YouTubePlayer component

// Sample yoga poses data (in a real app, this would come from an API)
const YOGA_POSES = {
  "firstTrimester": [
    {
      "id": "1-1",
      "title": "Mountain Pose",
      "subtitle": "Improves posture and balance",
      "description": "Stand tall with feet hip-width apart or slightly wider for stability, arms at sides. Draw shoulders back and down, engage core gently. Ground through your feet.",
      "duration": "1-2 minutes",
      "benefits": [
        "Improves posture",
        "Reduces lower back pain",
        "Strengthens thighs and ankles",
        "Grounding and centering"
      ],
      "imageUrl": "https://cdn.yogajournal.com/wp-content/uploads/2021/10/YJ_Mountain-Pose_Andrew-Clark_2400x1350.png", // General Mountain Pose - modify stance as needed
      "videoUrl": "https://www.youtube.com/watch?v=NYhH8Gr35cI" // General Mountain Pose tutorial - emphasize grounding and slight core engagement
    },
    {
      "id": "1-2",
      "title": "Cat-Cow Stretch",
      "subtitle": "Relieves back pain",
      "description": "Start on hands and knees, hands under shoulders, knees under hips. Inhale, drop belly, lift gaze (Cow). Exhale, round spine, tuck chin (Cat). Move with your breath.",
      "duration": "5-10 repetitions",
      "benefits": [
        "Relieves back and hip pain",
        "Improves circulation along the spine",
        "Gently mobilizes the spine and pelvis"
      ],
      "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvz4wHUSmzFizY91XTybgk5fbDgX3Rroa-Pw&s", // GIF showing motion
      "videoUrl": "https://www.youtube.com/watch?v=kqnua4rHVVA" // Cat-Cow Tutorial
    },
    {
      "id": "1-3",
      "title": "Seated Side Stretch",
      "subtitle": "Releases tension in side body",
      "description": "Sit comfortably cross-legged or on a chair. Inhale, reach one arm up. Exhale, lean gently to the opposite side, feeling a stretch along your side body. Keep both sitting bones grounded. Repeat other side.",
      "duration": "30 seconds",
      "benefits": [
        "Stretches intercostal muscles (muscles between ribs)",
        "Opens breathing capacity",
        "Relieves tension in shoulders, neck, and side waist"
      ],
      "imageUrl": "https://images.squarespace-cdn.com/content/v1/609179cff302937e3795455e/1638807564635-SSUUPGRED5HAUULHVDH3/GettyImages-1160605327.jpg",
      "videoUrl": "https://www.youtube.com/watch?v=Jn8HKROkxWM" // Seated Side Stretch Tutorial
    }
  ],
  "secondTrimester": [
    {
      "id": "2-1",
      "title": "Warrior II",
      "subtitle": "Builds strength and stability",
      "description": "Step feet wide apart (about 3-4 feet). Turn right foot out 90 degrees, left foot in slightly. Bend right knee over ankle, keeping knee tracking towards pinky toe. Extend arms parallel to floor, gaze over front fingertips. Keep torso upright.",
      "duration": "30-60 seconds",
      "benefits": [
        "Strengthens legs, ankles, and core",
        "Opens hips and chest",
        "Improves endurance and stamina",
        "Builds confidence"
      ],
       "imageUrl": "https://cdn.yogajournal.com/wp-content/uploads/2021/12/Warrior-2-Pose_Andrew-Clark_2400x1350.jpeg",
       "videoUrl": "https://www.youtube.com/watch?v=Mn6RSIRCV3w" // Warrior II Tutorial
    },
    {
      "id": "2-2",
      "title": "Wide-Legged Forward Fold",
      "subtitle": "Stretches inner thighs and hamstrings",
      "description": "Stand with feet wide, parallel or slightly turned in. Hinge forward from hips with a flat back. Place hands on blocks, thighs, or a chair for support instead of the floor. Avoid deep forward folds; keep spine long, focus on hamstring stretch.",
      "duration": "30-60 seconds",
      "benefits": [
        "Stretches hamstrings and inner thighs",
        "Relieves lower back tension",
        "Calms the mind",
        "Strengthens feet and legs"
      ],
      "imageUrl": "https://www.yogabasics.com/yogabasics2017/wp-content/uploads/2013/12/StandAngle_9744.jpg", // General pose - use props for modification
      "videoUrl": "https://www.youtube.com/watch?v=aS4y73bN0SY" // Tutorial demonstrating modifications with blocks
    },
    {
      "id": "2-3",
      "title": "Supported Triangle Pose",
      "subtitle": "Side body and leg stretch",
      "description": "From a wide stance (like Warrior II legs, but straight front leg), hinge at the front hip, extending torso over front leg. Rest bottom hand on shin, a block, or a chair seat. Extend top arm up. Keep chest open. Avoid twisting the belly; focus on length.",
      "duration": "30 seconds",
      "benefits": [
        "Stretches legs (hamstrings, inner thighs), hips, and spine",
        "Improves balance",
        "Opens chest and shoulders",
        "Relieves sciatic discomfort for some"
      ],
      "imageUrl": "https://www.theyogacollective.com/wp-content/uploads/2019/10/5850642685417750730_IMG_8904-1-1200x800.jpg", // Pose shown with block support
      "videoUrl": "https://www.youtube.com/watch?v=18_yQ-gvNb8" // Triangle Pose tutorial emphasizing block use
    }
  ],
  "thirdTrimester": [
    {
      "id": "3-1",
      "title": "Modified Squat (Supported)",
      "subtitle": "Opens pelvic floor",
      "description": "Stand with feet wider than hip-width, toes turned out slightly. Lower into a squat, keeping back straight. Use a wall, chair, blocks under heels, or partner for support. Alternatively, practice Goddess Pose. Go only as deep as comfortable without straining.",
      "duration": "30-60 seconds or 5-10 breaths",
      "benefits": [
        "Opens pelvis and hips",
        "Stretches pelvic floor muscles",
        "Strengthens legs",
        "May help prepare body for labor"
      ],
      "imageUrl": "https://www.verywellfit.com/thmb/aVMQ_u3PW31M1A7Hg-_A6gVnL-Q=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Verywell-10-3567189-GarlandPoseMalasana-0555-a35756f0541a4768b2014e40d1b55c11.jpg", // Garland pose (Malasana) - modify width/depth and use support
      "videoUrl": "https://www.youtube.com/watch?v=46CgTQXkQJc" // Prenatal squat variations/tutorial
    },
    {
      "id": "3-2",
      "title": "Seated Butterfly (Supported)",
      "subtitle": "Hip opener",
      "description": "Sit tall, bring soles of feet together, let knees fall out to sides. Place feet further from pelvis if needed for comfort. Sit on a folded blanket or cushion to elevate hips, which can increase comfort and reduce strain. Rest hands on ankles or floor.",
      "duration": "1-2 minutes",
      "benefits": [
        "Opens hips and inner thighs",
        "Releases tension in the pelvic region",
        "Improves circulation to the pelvis",
        "Promotes relaxation"
      ],
      "imageUrl": "https://www.yogajournal.com/wp-content/uploads/2023/10/YJ_Baddha-Konasana_1.jpg", // Image with elevated hips variation
      "videoUrl": "https://www.youtube.com/watch?v=ZQVnjWoqFbE" // Baddha Konasana tutorial - emphasize sitting on support
    },
    {
      "id": "3-3",
      "title": "Side-Lying Relaxation (Parsva Savasana)",
      "subtitle": "Rest and rejuvenation",
      "description": "Lie comfortably on your left side (preferred during later pregnancy for optimal circulation). Place pillows: one under your head, one beneath your belly for support, and one between your knees/ankles to align hips. Relax completely.",
      "duration": "5-10 minutes or longer",
      "benefits": [
        "Promotes deep relaxation and rest",
        "Improves circulation for mother and baby",
        "Relieves pressure on internal organs and vena cava",
        "Reduces back strain"
      ],
      "imageUrl": "https://blog.alomoves.com/wp-content/uploads/2019/07/Side-Lying-Savasana.jpg", // Example showing pillow placement
      "videoUrl": "https://www.youtube.com/watch?v=vP--HM3fNww" // Guided relaxation in side-lying position for pregnancy
    }
  ]
};

const YogaScreen = () => {
  const [selectedTrimester, setSelectedTrimester] = useState('firstTrimester');
  const [selectedPose, setSelectedPose] = useState(null);
  const [sessionHistory, setSessionHistory] = useState({});
  const [poseModalVisible, setPoseModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [estimatorVisible, setEstimatorVisible] = useState(false);
  const [estimatorPose, setEstimatorPose] = useState(null);
  
  const screenWidth = Dimensions.get('window').width;
  
  // Load session history on component mount
  useEffect(() => {
    loadSessionHistory();
  }, []);
  
  // Load session history from storage
  const loadSessionHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('yoga_session_history');
      if (savedHistory) {
        setSessionHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading yoga session history:', error);
    }
  };
  
  // Save session history to storage
  const saveSessionHistory = async (history) => {
    try {
      await AsyncStorage.setItem('yoga_session_history', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving yoga session history:', error);
    }
  };
  
  // Record completed session
  const recordSession = async (poseId, sessionData = null) => {
    const timestamp = new Date().toISOString();
    
    // Create session record with either basic or detailed info
    const sessionRecord = sessionData ? {
      timestamp,
      accuracy: sessionData.accuracy,
      feedback: sessionData.feedback,
      duration: sessionData.duration
    } : {
      timestamp
    };
    
    const updatedHistory = {
      ...sessionHistory,
      [poseId]: [...(sessionHistory[poseId] || []), sessionRecord]
    };
    
    setSessionHistory(updatedHistory);
    await saveSessionHistory(updatedHistory);
  };
  
  // Format pose completion status
  const getPoseCompletionStatus = (poseId) => {
    if (!sessionHistory[poseId]) return '2 times';
    
    // Count sessions in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSessions = sessionHistory[poseId].filter(session => {
      const timestamp = typeof session === 'string' ? session : session.timestamp;
      const sessionDate = new Date(timestamp);
      return sessionDate >= sevenDaysAgo;
    });
    
    return `${recentSessions.length} ${recentSessions.length === 1 ? 'time' : 'times'} this week`;
  };
  
  // Handle pose selection and modal display
  const handlePosePress = (pose) => {
    setSelectedPose(pose);
    setPoseModalVisible(true);
  };
  
  // Complete a yoga session (manual mode)
  const completeSession = async () => {
    setLoading(true);
    
    try {
      await recordSession(selectedPose.id);
      
      // Simulate session completion delay
      setTimeout(() => {
        setLoading(false);
        setPoseModalVisible(false);
        // Show completion message
        Alert.alert('Success', 'Session completed successfully!');
      }, 1000);
    } catch (error) {
      console.error('Error completing session:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to complete session. Please try again.');
    }
  };

  // Start AI-guided practice
  const startAIGuidedPractice = () => {
    console.log('Starting AI-guided practice');
    setEstimatorPose(selectedPose);
    setPoseModalVisible(false);
    setEstimatorVisible(true);
  };
  
  // Handle AI session completion
  const handleEstimatorComplete = (sessionData) => {
    console.log('AI session completed:', sessionData);
    // Record AI-guided session with detailed data
    recordSession(sessionData.poseId, sessionData);
    setEstimatorVisible(false);
    // Show success message
    Alert.alert('Success', 'AI-guided session completed successfully!');
  };
  
  // Close the estimator
  const handleEstimatorClose = () => {
    console.log('Closing AI estimator');
    setEstimatorVisible(false);
  };
  
  // Open YouTube URL
  const openYouTubeVideo = (url) => {
    if (url && url.includes('youtube.com')) {
      Linking.openURL(url).catch(err => {
        console.error('Error opening YouTube URL:', err);
        Alert.alert('Error', 'Could not open YouTube video');
      });
    }
  };

  const getYouTubeVideoId = (url) => {
    if (!url || typeof url !== 'string') return null;
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return null;
    
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };
  
  const isYouTubeUrl = (url) => {
    return url && typeof url === 'string' && 
      (url.includes('youtube.com') || url.includes('youtu.be'));
  };
  
  // Render a yoga pose card
  const renderPoseCard = ({ item }) => {
    const completionStatus = getPoseCompletionStatus(item.id);
    
    return (
      <TouchableOpacity 
        style={styles.poseCard}
        onPress={() => handlePosePress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.poseImageContainer}>
          {/* Use actual image instead of placeholder */}
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.posePlaceholder}>
              <Ionicons name="fitness-outline" size={40} color="#FF69B4" />
            </View>
          )}
        </View>
        
        <View style={styles.poseContent}>
          <Text style={styles.poseTitle}>{item.title}</Text>
          <Text style={styles.poseSubtitle}>{item.subtitle}</Text>
          
          <View style={styles.poseStats}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color="#FF69B4" />
              <Text style={styles.statText}>{item.duration}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#FF69B4" />
              <Text style={styles.statText}>{completionStatus}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => handlePosePress(item)}
          >
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render pose details modal
  const renderPoseModal = () => {
    if (!selectedPose) return null;
    
    return (
      <Modal
        visible={poseModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setPoseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setPoseModalVisible(false)}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedPose.title}</Text>
            <Text style={styles.modalSubtitle}>{selectedPose.subtitle}</Text>

            <View style={styles.videoContainer}>
              {videoLoading && (
                <View style={styles.videoLoadingContainer}>
                  <ActivityIndicator size="large" color="#FF69B4" />
                </View>
              )}
              
              {isYouTubeUrl(selectedPose.videoUrl) ? (
                // Use YouTubePlayer for YouTube videos
                <YouTubePlayer
                  videoId={getYouTubeVideoId(selectedPose.videoUrl)}
                  style={styles.video}
                  onReady={() => setVideoLoading(false)}
                  onError={(error) => {
                    console.error('YouTube loading error:', error);
                    setVideoLoading(false);
                  }}
                />
              ) : (
                // Use regular Video component for non-YouTube videos
                selectedPose.imageUrl ? (
                  <Image
                    source={{ uri: selectedPose.imageUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.videoPlaceholder}>
                    <Ionicons name="videocam" size={50} color="#FF69B4" />
                    <Text style={styles.videoPlaceholderText}>Video Guide</Text>
                  </View>
                )
              )}
            </View>

            
            
            
            {/* YouTube button to open the video */}
            {selectedPose.videoUrl && selectedPose.videoUrl.includes('youtube.com') && (
              <TouchableOpacity 
                style={styles.youtubeButton}
                onPress={() => openYouTubeVideo(selectedPose.videoUrl)}
              >
                <Ionicons name="logo-youtube" size={20} color="#FFFFFF" />
                <Text style={styles.youtubeButtonText}>Watch Tutorial on YouTube</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.sectionText}>{selectedPose.description}</Text>
            </View>
            
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Duration</Text>
              <Text style={styles.sectionText}>{selectedPose.duration}</Text>
            </View>
            
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Benefits</Text>
              {selectedPose.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#FF69B4" />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.practiceOptionsContainer}>
              <TouchableOpacity 
                style={styles.aiPracticeButton}
                onPress={startAIGuidedPractice}
              >
                <Ionicons name="analytics-outline" size={24} color="#FFFFFF" />
                <Text style={styles.practiceButtonText}>AI-Guided Practice</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.selfPracticeButton}
                onPress={completeSession}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="person-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.practiceButtonText}>Self-Guided Practice</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Prenatal Yoga</Text>
        <Text style={styles.headerSubtitle}>
          Safe exercises designed for each trimester
        </Text>
      </View>
      
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          <TouchableOpacity 
            style={[
              styles.tab, 
              selectedTrimester === 'firstTrimester' && styles.activeTab
            ]}
            onPress={() => setSelectedTrimester('firstTrimester')}
          >
            <Text 
              style={[
                styles.tabText, 
                selectedTrimester === 'firstTrimester' && styles.activeTabText
              ]}
            >
              First Trimester
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab, 
              selectedTrimester === 'secondTrimester' && styles.activeTab
            ]}
            onPress={() => setSelectedTrimester('secondTrimester')}
          >
            <Text 
              style={[
                styles.tabText, 
                selectedTrimester === 'secondTrimester' && styles.activeTabText
              ]}
            >
              Second Trimester
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab, 
              selectedTrimester === 'thirdTrimester' && styles.activeTab
            ]}
            onPress={() => setSelectedTrimester('thirdTrimester')}
          >
            <Text 
              style={[
                styles.tabText, 
                selectedTrimester === 'thirdTrimester' && styles.activeTabText
              ]}
            >
              Third Trimester
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      <FlatList
        data={YOGA_POSES[selectedTrimester]}
        renderItem={renderPoseCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.posesList}
        showsVerticalScrollIndicator={false}
      />
      
      {renderPoseModal()}
      
      {/* YogaPoseEstimator Modal */}
      <Modal
        visible={estimatorVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleEstimatorClose}
        statusBarTranslucent={true}
        style={{
          margin: 0,
          justifyContent: 'flex-end',
        }}
      >
        {estimatorPose && (
          <YogaPoseEstimator 
            pose={estimatorPose}
            onClose={handleEstimatorClose}
            onComplete={handleEstimatorComplete}
          />
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tabs: {
    paddingHorizontal: 15,
  },
  tab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  activeTab: {
    backgroundColor: '#FFE4E1',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#FF69B4',
    fontWeight: '600',
  },
  posesList: {
    padding: 15,
  },
  poseCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  poseImageContainer: {
    width: 120,
    height: 160,
    backgroundColor: '#F5F5F5',
  },
  posePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE4E1',
  },
  poseContent: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  poseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  poseSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  poseStats: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  statText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 5,
  },
  startButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  modalContent: {
    padding: 20,
    paddingTop: 80,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  videoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 10, // Reduced to make room for YouTube button
    overflow: 'hidden',
  },
  videoLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE4E1',
  },
  videoPlaceholderText: {
    marginTop: 10,
    color: '#FF69B4',
    fontWeight: '600',
  },
  // YouTube button
  youtubeButton: {
    flexDirection: 'row',
    backgroundColor: '#FF0000', // YouTube red
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  youtubeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 10,
  },
  practiceOptionsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    flexDirection: 'column',
    alignItems: 'center',
  },
  aiPracticeButton: {
    backgroundColor: '#4285F4',  // Google blue
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 15,
    flexDirection: 'row',
  },
  
  selfPracticeButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'row',
  },
  practiceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default YogaScreen;