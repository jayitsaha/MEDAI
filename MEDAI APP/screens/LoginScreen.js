// src/screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const logoOpacity = new Animated.Value(0);
  const formOpacity = new Animated.Value(0);
  const logoTranslateY = new Animated.Value(-50);
  const formTranslateY = new Animated.Value(50);
  
  useEffect(() => {
    // Animate logo and form on component mount
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(formTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);
  
  const handleLogin = async () => {
    setError('');
    
    if (!userId.trim()) {
      setError('Please enter your User ID');
      return;
    }
    
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate a network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple routing logic based on user ID
      if (userId.toLowerCase() === 'rashi') {
        await AsyncStorage.setItem('user_type', 'pregnancy');
        await AsyncStorage.setItem('user_name', 'Rashi');
        navigation.replace('PregnancyHome');
      } else if (userId.toLowerCase() === 'jayit') {
        await AsyncStorage.setItem('user_type', 'alzheimers');
        await AsyncStorage.setItem('user_name', 'Jayit');
        navigation.replace('AlzheimersHome');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidView}
        >
          <View style={styles.contentContainer}>
            {/* Logo Section */}
            <Animated.View 
              style={[
                styles.logoContainer,
                {
                  opacity: logoOpacity,
                  transform: [{ translateY: logoTranslateY }]
                }
              ]}
            >
              <Image 
                source={require('../assets/medai-logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>MEDAI</Text>
              <Text style={styles.tagline}>Your personal health companion</Text>
            </Animated.View>
            
            {/* Login Form */}
            <Animated.View 
              style={[
                styles.formContainer,
                {
                  opacity: formOpacity,
                  transform: [{ translateY: formTranslateY }]
                }
              ]}
            >
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.subText}>Sign in to continue</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>User ID</Text>
                <TextInput
                  style={styles.input}
                  value={userId}
                  onChangeText={setUserId}
                  placeholder="Enter your User ID"
                  placeholderTextColor="#aaa"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#aaa"
                  secureTextEntry
                />
              </View>
              
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={() => {}}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity>
                  <Text style={styles.signUpText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4A6572', // Muted blue
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#90A4AE', // Light muted blue
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4A6572',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#90A4AE',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#4A6572',
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#4A6572',
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    marginBottom: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#4A6572',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#4A6572',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#90A4AE',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: '#90A4AE',
    fontSize: 14,
  },
  signUpText: {
    color: '#4A6572',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;