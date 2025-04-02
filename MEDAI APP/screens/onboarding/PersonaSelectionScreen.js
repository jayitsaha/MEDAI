// src/screens/onboarding/PersonaSelectionScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const PersonaSelectionScreen = ({ onPersonaSelected }) => {
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [animation] = useState(new Animated.Value(0));
  
  // Animation for the cards
  const startAnimation = () => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  React.useEffect(() => {
    startAnimation();
  }, []);

  const selectPersona = async (persona) => {
    try {
      await AsyncStorage.setItem('userType', persona);
      setSelectedPersona(persona);
      
      // Delay to show selection before navigating
      setTimeout(() => {
        onPersonaSelected(persona);
      }, 300);
    } catch (error) {
      console.error('Error saving user type:', error);
    }
  };

  // Animation values
  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ImageBackground 
        source={{ uri: 'https://source.unsplash.com/random/1080x1920/?medical,soft,blue' }} 
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.overlay}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Image 
                source={require('../../assets/medai-logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>MEDAI</Text>
              <Text style={styles.subtitle}>
                Personalized AI assistance for your health journey
              </Text>
            </View>

            <Animated.View 
              style={[
                styles.personaContainer,
                { opacity, transform: [{ translateY }] }
              ]}
            >
              <Text style={styles.selectText}>Select your profile</Text>
              
              <TouchableOpacity
                style={[
                  styles.personaCard,
                  selectedPersona === 'alzheimers' && styles.selectedCard
                ]}
                onPress={() => selectPersona('alzheimers')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#6A5ACD', '#836FFF']}
                  start={[0, 0]}
                  end={[1, 0]}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.iconContainer}>
                      <FontAwesome5 name="brain" size={32} color="white" />
                    </View>
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardTitle}>Alzheimer's Care</Text>
                      <Text style={styles.cardDescription}>
                        Medication tracking, spatial awareness, and helpful reminders
                      </Text>
                    </View>
                    {selectedPersona === 'alzheimers' && (
                      <Ionicons name="checkmark-circle" size={28} color="white" style={styles.checkmark} />
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.personaCard,
                  selectedPersona === 'pregnancy' && styles.selectedCard
                ]}
                onPress={() => selectPersona('pregnancy')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#FF69B4', '#FF8FAB']}
                  start={[0, 0]}
                  end={[1, 0]}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="woman" size={32} color="white" />
                    </View>
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardTitle}>Pregnancy Support</Text>
                      <Text style={styles.cardDescription}>
                        Prenatal care, diet guidance, yoga exercises, and appointment scheduling
                      </Text>
                    </View>
                    {selectedPersona === 'pregnancy' && (
                      <Ionicons name="checkmark-circle" size={28} color="white" style={styles.checkmark} />
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Your health journey starts here
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginHorizontal: 32,
    lineHeight: 24,
  },
  personaContainer: {
    marginVertical: 32,
  },
  selectText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 24,
    textAlign: 'center',
  },
  personaCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    transform: [{ scale: 1 }]
  },
  selectedCard: {
    transform: [{ scale: 1.05 }],
    borderWidth: 2,
    borderColor: 'white',
  },
  cardGradient: {
    padding: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  checkmark: {
    marginLeft: 10,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  }
});

export default PersonaSelectionScreen;