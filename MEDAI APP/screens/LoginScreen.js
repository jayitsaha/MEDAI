// src/screens/LoginScreen.js
import React, { useState, useRef } from 'react';
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
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation, onLogin }) => {
  // Use refs to maintain input values outside of React's render cycle
  const userIdRef = useRef('');
  const passwordRef = useRef('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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
    
    setIsLoading(true);
    
    try {
      console.log('Attempting login for user:', userId);
      
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
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/medai-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>MEDAI</Text>
          <Text style={styles.tagline}>Your personal health companion</Text>
        </View>
        
        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subText}>Sign in to continue</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>User ID</Text>
            <TextInput
              style={styles.input}
              defaultValue=""
              onChangeText={(text) => {
                userIdRef.current = text;
              }}
              placeholder="Enter your User ID"
              placeholderTextColor="#aaa"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              defaultValue=""
              onChangeText={(text) => {
                passwordRef.current = text;
              }}
              placeholder="Enter your password"
              placeholderTextColor="#aaa"
              secureTextEntry
            />
          </View>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => Alert.alert('Coming Soon', 'This feature is not available yet.')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Sign up is not available yet.')}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4A6572',
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#90A4AE',
    textAlign: 'center',
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