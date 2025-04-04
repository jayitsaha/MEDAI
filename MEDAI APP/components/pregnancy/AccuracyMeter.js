// Create a new component AccuracyMeter.js

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AccuracyMeter = ({ accuracy, size = 'large' }) => {
  // Animated values for smooth transitions
  const animatedAccuracy = useRef(new Animated.Value(0)).current;
  const ringWidth = size === 'large' ? 12 : 8;
  const fontSize = size === 'large' ? 24 : 16;
  const diameter = size === 'large' ? 150 : 80;
  
  // Update animated value when accuracy changes
  useEffect(() => {
    Animated.timing(animatedAccuracy, {
      toValue: accuracy,
      duration: 500,
      useNativeDriver: false
    }).start();
  }, [accuracy]);
  
  // Calculate colors based on accuracy
  const getColor = () => {
    if (accuracy < 40) return '#FF6B6B'; // Red
    if (accuracy < 60) return '#FFD166'; // Yellow
    if (accuracy < 80) return '#06D6A0'; // Green
    return '#118AB2'; // Blue for excellent
  };
  
  // Get feedback icon based on accuracy
  const getFeedbackIcon = () => {
    if (accuracy < 40) return 'alert-circle';
    if (accuracy < 60) return 'information-circle';
    if (accuracy < 80) return 'checkmark-circle';
    return 'star';
  };
  
  // Get text feedback
  const getFeedbackText = () => {
    if (accuracy < 40) return 'Needs Work';
    if (accuracy < 60) return 'Getting Better';
    if (accuracy < 80) return 'Good Form';
    return 'Excellent!';
  };
  
  // Calculate the circle circumference
  const radius = (diameter - ringWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate the arc length based on accuracy percentage
  const arcLength = animatedAccuracy.interpolate({
    inputRange: [0, 100],
    outputRange: [0, circumference]
  });
  
  // The "empty" part of the circle
  const emptyArcLength = Animated.subtract(circumference, arcLength);
  
  // Rotation to start from the top
  const rotation = -90;
  
  return (
    <View style={styles.container}>
      {/* Accuracy Circle */}
      <View style={[styles.circleContainer, { width: diameter, height: diameter }]}>
        {/* Background Circle */}
        <View style={[
          styles.backgroundCircle, 
          { 
            width: diameter, 
            height: diameter,
            borderWidth: ringWidth,
            borderColor: 'rgba(200, 200, 200, 0.2)'
          }
        ]} />
        
        {/* Animated SVG Arc */}
        <Animated.View 
          style={[
            styles.progressCircle,
            { 
              width: diameter, 
              height: diameter,
              borderWidth: ringWidth,
              borderColor: getColor(),
              // Only show part of the border based on progress
              borderTopColor: 'transparent',
              borderRightColor: accuracy > 25 ? getColor() : 'transparent',
              borderBottomColor: accuracy > 50 ? getColor() : 'transparent',
              borderLeftColor: accuracy > 75 ? getColor() : 'transparent',
              transform: [{ rotateZ: `${rotation}deg` }],
              opacity: animatedAccuracy.interpolate({
                inputRange: [0, 100],
                outputRange: [0.5, 1]
              })
            }
          ]}
        />
        
        {/* Accuracy Text */}
        <View style={styles.textContainer}>
          <Text style={[styles.accuracyText, { fontSize }]}>
            {Math.round(accuracy)}%
          </Text>
        </View>
      </View>
      
      {/* Feedback Text */}
      <View style={styles.feedbackContainer}>
        <Ionicons name={getFeedbackIcon()} size={24} color={getColor()} />
        <Text style={[styles.feedbackText, { color: getColor() }]}>
          {getFeedbackText()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backgroundCircle: {
    position: 'absolute',
    borderRadius: 1000,
  },
  progressCircle: {
    position: 'absolute',
    borderRadius: 1000,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  accuracyText: {
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  feedbackText: {
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 16,
  }
});

export default AccuracyMeter;