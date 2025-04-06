// src/screens/LoginScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RectButton } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation, onLogin }) => {
  // Use refs to maintain input values outside of React's render cycle
  const userIdRef = useRef('');
  const passwordRef = useRef('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userIdFocused, setUserIdFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(height)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const buttonOpacityAnim = useRef(new Animated.Value(1)).current;
  const errorAnim = useRef(new Animated.Value(0)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;
  const loadingRotateAnim = useRef(new Animated.Value(0)).current;
  const userIdAnimatedWidth = useRef(new Animated.Value(0)).current;
  const passwordAnimatedWidth = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  
  // Animation for the logo pulse
  const logoPulse = useRef(new Animated.Value(1)).current;
  
  // Run entrance animations on component mount
  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // 1. Fade in the screen
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 2. Animate the logo entrance
      Animated.spring(logoAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      // 3. Slide up the form
      Animated.spring(formAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      })
    ]).start();

    // Start the continuous pulse animation for the logo
    startLogoPulse();
    
    // Start loading animation if needed
    if (isLoading) {
      startLoadingAnimation();
    }
  }, []);
  
  // Watch for error changes to trigger shake animation
  useEffect(() => {
    if (error) {
      Animated.sequence([
        // Make error text visible
        Animated.timing(errorAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Shake animation
        Animated.sequence([
          Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shake, { toValue: 5, duration: 50, useNativeDriver: true }),
          Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true })
        ])
      ]).start();
    } else {
      // Fade out error message
      Animated.timing(errorAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [error]);
  
  // Watch for loading state changes
  useEffect(() => {
    if (isLoading) {
      startLoadingAnimation();
    } else {
      stopLoadingAnimation();
    }
  }, [isLoading]);

  // Function to start the continuous logo pulse animation
  const startLogoPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    ).start();
  };
  
  // Start the loading spinner animation
  const startLoadingAnimation = () => {
    Animated.timing(loadingAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    Animated.loop(
      Animated.timing(loadingRotateAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };
  
  // Stop the loading spinner animation
  const stopLoadingAnimation = () => {
    Animated.timing(loadingAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    loadingRotateAnim.setValue(0);
  };
  
  // Handle button press animation
  const animateButtonPress = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(buttonScaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacityAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonScaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacityAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };
  
  // Animation for input focus
  const animateInputFocus = (isUserIdInput, isFocused) => {
    const animValue = isUserIdInput ? userIdAnimatedWidth : passwordAnimatedWidth;
    Animated.timing(animValue, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    
    if (isUserIdInput) {
      setUserIdFocused(isFocused);
    } else {
      setPasswordFocused(isFocused);
    }
  };
  
  const handleLogin = async () => {
    const userId = userIdRef.current;
    const password = passwordRef.current;
    
    setError('');
    
    if (!userId.trim()) {
      setError('Please enter your User ID');
      return;
    }
    
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    
    // Animate button press before starting login process
    animateButtonPress();
    setIsLoading(true);
    
    try {
      console.log('Attempting login for user:', userId);
      
      // Simulate network delay for animation to be visible
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simple login validation
      if (userId.toLowerCase() === 'rashi') {
        await AsyncStorage.setItem('user_name', 'Rashi');
        // Call the onLogin callback from App.js with the user type
        if (onLogin) {
          console.log('Calling onLogin with userType: pregnancy');
          await onLogin('pregnancy');
        } else {
          console.warn('onLogin prop is not available');
          // Fallback to old method
          await AsyncStorage.setItem('userType', 'pregnancy');
          await AsyncStorage.setItem('isLoggedIn', 'true');
        }
      } else if (userId.toLowerCase() === 'jayit') {
        await AsyncStorage.setItem('user_name', 'Jayit');
        // Call the onLogin callback from App.js with the user type
        if (onLogin) {
          console.log('Calling onLogin with userType: alzheimers');
          await onLogin('alzheimers');
        } else {
          console.warn('onLogin prop is not available');
          // Fallback to old method
          await AsyncStorage.setItem('userType', 'alzheimers');
          await AsyncStorage.setItem('isLoggedIn', 'true');
        }
      } else {
        setError('Invalid credentials. Please try again.');
        setIsLoading(false);
        return;
      }
      
      console.log('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate loading rotation
  const spin = loadingRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  // Calculate the underline width for inputs
  const userIdUnderlineWidth = userIdAnimatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '93%'],
  });
  
  const passwordUnderlineWidth = passwordAnimatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { opacity: fadeAnim }
      ]}
    >
      <StatusBar barStyle="dark-content" />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section - with animations */}
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                opacity: logoAnim,
                transform: [
                  { scale: logoAnim },
                  { translateY: logoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  })},
                  { scale: logoPulse } // Add the pulse animation
                ]
              }
            ]}
          >
            <Image 
              source={require('../assets/medai-logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.appName}>MEDAI</Text>

            
            <Animated.Text 
              style={[
                styles.tagline,
                {
                  opacity: logoAnim.interpolate({
                    inputRange: [0, 0.7, 1],
                    outputRange: [0, 0, 1]
                  })
                }
              ]}
            >
              Your personal health companion
            </Animated.Text>
          </Animated.View>
          
          {/* Form Container - with animations */}
          <Animated.View 
            style={[
              styles.formContainer,
              {
                transform: [
                  { translateY: formAnim },
                  { translateX: shake } // Add shake animation for errors
                ]
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.welcomeText,
                {
                  opacity: formAnim.interpolate({
                    inputRange: [0, height * 0.5],
                    outputRange: [1, 0],
                    extrapolate: 'clamp',
                  }),
                  transform: [
                    {
                      translateX: formAnim.interpolate({
                        inputRange: [0, height * 0.5],
                        outputRange: [0, -20],
                        extrapolate: 'clamp',
                      })
                    }
                  ]
                }
              ]}
            >
              Welcome Back
            </Animated.Text>
            
            <Animated.Text 
              style={[
                styles.subText,
                {
                  opacity: formAnim.interpolate({
                    inputRange: [0, height * 0.4],
                    outputRange: [1, 0],
                    extrapolate: 'clamp',
                  }),
                  transform: [
                    {
                      translateX: formAnim.interpolate({
                        inputRange: [0, height * 0.4],
                        outputRange: [0, -15],
                        extrapolate: 'clamp',
                      })
                    }
                  ]
                }
              ]}
            >
              Sign in to continue
            </Animated.Text>
            
            {/* User ID Input with animation */}
            <Animated.View 
              style={[
                styles.inputContainer,
                {
                  opacity: formAnim.interpolate({
                    inputRange: [0, height * 0.3],
                    outputRange: [1, 0],
                    extrapolate: 'clamp',
                  }),
                  transform: [
                    {
                      translateY: formAnim.interpolate({
                        inputRange: [0, height * 0.3],
                        outputRange: [0, 20],
                        extrapolate: 'clamp',
                      })
                    }
                  ]
                }
              ]}
            >
              <Text style={[
                styles.inputLabel,
                userIdFocused && styles.inputLabelFocused
              ]}>
                User ID
              </Text>
              <View>
                <TextInput
                  style={[
                    styles.input,
                    userIdFocused && styles.inputFocused
                  ]}
                  defaultValue=""
                  onChangeText={(text) => {
                    userIdRef.current = text;
                  }}
                  placeholder="Enter your User ID"
                  placeholderTextColor="#aaa"
                  autoCapitalize="none"
                  onFocus={() => animateInputFocus(true, true)}
                  onBlur={() => animateInputFocus(true, false)}
                />
                {/* <Animated.View 
                  style={[
                    styles.inputUnderline,
                    { width: userIdUnderlineWidth, marginLeft: 10  }
                  ]} 
                /> */}
              </View>
            </Animated.View>
            
            {/* Password Input with animation */}
            <Animated.View 
              style={[
                styles.inputContainer,
                {
                  opacity: formAnim.interpolate({
                    inputRange: [0, height * 0.2],
                    outputRange: [1, 0],
                    extrapolate: 'clamp',
                  }),
                  transform: [
                    {
                      translateY: formAnim.interpolate({
                        inputRange: [0, height * 0.2],
                        outputRange: [0, 20],
                        extrapolate: 'clamp',
                      })
                    }
                  ]
                }
              ]}
            >
              <Text style={[
                styles.inputLabel,
                passwordFocused && styles.inputLabelFocused
              ]}>
                Password
              </Text>
              <View>
                <TextInput
                  style={[
                    styles.input,
                    passwordFocused && styles.inputFocused
                  ]}
                  defaultValue=""
                  onChangeText={(text) => {
                    passwordRef.current = text;
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor="#aaa"
                  secureTextEntry
                  onFocus={() => animateInputFocus(false, true)}
                  onBlur={() => animateInputFocus(false, false)}
                />
                {/* <Animated.View 
                  style={[
                    styles.inputUnderline,
                    { width: passwordUnderlineWidth }
                  ]} 
                /> */}
              </View>
            </Animated.View>
            
            {/* Animated Error Message */}
            <Animated.Text 
              style={[
                styles.errorText,
                {
                  opacity: errorAnim,
                  transform: [
                    {
                      translateY: errorAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-10, 0]
                      })
                    }
                  ]
                }
              ]}
            >
              {error}
            </Animated.Text>
            
            {/* Forgot Password Link */}
            <Animated.View
              style={[
                styles.forgotPassword,
                {
                  opacity: formAnim.interpolate({
                    inputRange: [0, height * 0.15],
                    outputRange: [1, 0],
                    extrapolate: 'clamp',
                  })
                }
              ]}
            >
              <TouchableOpacity 
                onPress={() => Alert.alert('Coming Soon', 'This feature is not available yet.')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </Animated.View>
            
            {/* Animated Login Button */}
            <Animated.View
              style={[
                {
                  opacity: formAnim.interpolate({
                    inputRange: [0, height * 0.1],
                    outputRange: [1, 0],
                    extrapolate: 'clamp',
                  }),
                  transform: [
                    { scale: buttonScaleAnim }
                  ]
                }
              ]}
            >
              <TouchableOpacity 
                style={[
                  styles.loginButton, 
                  isLoading && styles.loginButtonDisabled
                ]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <Animated.View 
                    style={[
                      styles.loadingContainer,
                      { opacity: loadingAnim }
                    ]}
                  >
                    <Animated.View 
                      style={[
                        styles.loadingIndicator,
                        { transform: [{ rotate: spin }] }
                      ]}
                    />
                    <Text style={styles.loginButtonText}>Signing In...</Text>
                  </Animated.View>
                ) : (
                  <Animated.Text 
                    style={[
                      styles.loginButtonText,
                      { opacity: buttonOpacityAnim }
                    ]}
                  >
                    Sign In
                  </Animated.Text>
                )}
              </TouchableOpacity>
            </Animated.View>
            
            {/* Footer Container */}
            <Animated.View 
              style={[
                styles.footerContainer,
                {
                  opacity: formAnim.interpolate({
                    inputRange: [0, height * 0.05],
                    outputRange: [1, 0],
                    extrapolate: 'clamp',
                  })
                }
              ]}
            >
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Sign up is not available yet.')}>
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 170,
    height: 170,
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4A6572',
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: -10,
  },
  tagline: {
    fontSize: 14,
    color: '#90A4AE',
    textAlign: 'center',
    marginTop: 5
  },
  formContainer: {
    width: '100%',
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
    transition: '0.3s',
  },
  inputLabelFocused: {
    color: '#4A6572',
    fontWeight: '600',
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
  inputFocused: {
    borderColor: '#4A6572',
    backgroundColor: 'rgba(74, 101, 114, 0.05)',
  },
  inputUnderline: {
    height: 2,
    backgroundColor: '#4183D7',
    position: 'absolute',
    bottom: -1,
    left: 0,
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
    overflow: 'hidden',
  },
  loginButtonDisabled: {
    backgroundColor: '#90A4AE',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    borderTopColor: 'transparent',
    marginRight: 8,
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