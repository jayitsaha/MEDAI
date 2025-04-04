// ReferencePoseModels.js - Realistic human poses for yoga references
import React, { useState, useRef, useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path, G, Circle, Ellipse, Rect } from 'react-native-svg';

// Create realistic human-like SVG models for each yoga pose
export const getReferencePoseSVG = (poseId, width, height) => {
  const models = {
    // Mountain Pose (1-1)
    '1-1': (
      <Svg width={width} height={height} viewBox="0 0 200 400">
        {/* Head */}
        <Circle cx="100" cy="50" r="25" fill="#FFD5B5" />
        
        {/* Neck */}
        <Rect x="95" y="75" width="10" height="15" fill="#FFD5B5" />
        
        {/* Torso */}
        <Path d="M75,90 L125,90 L130,200 L70,200 Z" fill="#FFC0CB" />
        
        {/* Arms */}
        <Path d="M75,95 L55,150 L50,200 L60,200 L70,150 Z" fill="#FFD5B5" />
        <Path d="M125,95 L145,150 L150,200 L140,200 L130,150 Z" fill="#FFD5B5" />
        
        {/* Legs */}
        <Path d="M85,200 L75,350 L90,350 L95,200 Z" fill="#FFD5B5" />
        <Path d="M115,200 L125,350 L110,350 L105,200 Z" fill="#FFD5B5" />
        
        {/* Feet */}
        <Ellipse cx="82.5" cy="360" rx="15" ry="5" fill="#FFD5B5" />
        <Ellipse cx="117.5" cy="360" rx="15" ry="5" fill="#FFD5B5" />
        
        {/* Face features */}
        <Circle cx="90" cy="45" r="3" fill="#000" />
        <Circle cx="110" cy="45" r="3" fill="#000" />
        <Path d="M95,60 Q100,65 105,60" stroke="#000" strokeWidth="2" fill="none" />
      </Svg>
    ),
    
    // Cat-Cow Stretch (1-2)
    '1-2': (
      <Svg width={width} height={height} viewBox="0 0 300 200">
        {/* Head */}
        <Circle cx="50" cy="70" r="20" fill="#FFD5B5" />
        
        {/* Body - Curved for cat pose */}
        <Path d="M70,70 C120,30 180,30 250,70" stroke="#FFC0CB" strokeWidth="40" fill="none" />
        
        {/* Arms */}
        <Rect x="70" y="100" width="15" height="60" rx="5" fill="#FFD5B5" />
        <Rect x="235" y="100" width="15" height="60" rx="5" fill="#FFD5B5" />
        
        {/* Legs */}
        <Rect x="110" y="100" width="15" height="60" rx="5" fill="#FFD5B5" />
        <Rect x="195" y="100" width="15" height="60" rx="5" fill="#FFD5B5" />
        
        {/* Face features */}
        <Circle cx="45" cy="65" r="3" fill="#000" />
        <Circle cx="55" cy="65" r="3" fill="#000" />
        <Path d="M47,75 Q50,78 53,75" stroke="#000" strokeWidth="1.5" fill="none" />
      </Svg>
    ),
    
    // Seated Side Stretch (1-3)
    '1-3': (
      <Svg width={width} height={height} viewBox="0 0 250 300">
        {/* Head - tilted */}
        <Circle cx="90" cy="50" r="25" fill="#FFD5B5" />
        
        {/* Torso - bent to side */}
        <Path d="M90,75 C150,100 170,150 130,170" stroke="#FFC0CB" strokeWidth="35" fill="none" />
        
        {/* Arm reaching up */}
        <Path d="M100,90 C120,60 140,30 160,10" stroke="#FFD5B5" strokeWidth="12" fill="none" />
        
        {/* Other arm down */}
        <Path d="M80,100 C70,120 60,140 50,150" stroke="#FFD5B5" strokeWidth="12" fill="none" />
        
        {/* Legs in seated position */}
        <Path d="M120,170 L190,170 L190,180 L120,180 Z" fill="#FFD5B5" />
        <Path d="M120,170 L50,170 L50,180 L120,180 Z" fill="#FFD5B5" />
        
        {/* Face features */}
        <Circle cx="85" cy="45" r="3" fill="#000" />
        <Circle cx="95" cy="45" r="3" fill="#000" />
        <Path d="M87,55 Q90,58 93,55" stroke="#000" strokeWidth="1.5" fill="none" />
      </Svg>
    ),
    
    // Warrior II (2-1)
    '2-1': (
      <Svg width={width} height={height} viewBox="0 0 400 250">
        {/* Head */}
        <Circle cx="200" cy="50" r="25" fill="#FFD5B5" />
        
        {/* Torso */}
        <Rect x="185" y="75" width="30" height="75" fill="#FFC0CB" />
        
        {/* Arms stretched out */}
        <Path d="M200,90 L50,90" stroke="#FFD5B5" strokeWidth="12" fill="none" />
        <Path d="M200,90 L350,90" stroke="#FFD5B5" strokeWidth="12" fill="none" />
        
        {/* Legs in warrior stance */}
        <Path d="M185,150 L120,220 L110,220 L175,150 Z" fill="#FFD5B5" />
        <Path d="M215,150 L300,220 L310,220 L225,150 Z" fill="#FFD5B5" />
        
        {/* Feet */}
        <Rect x="100" y="215" width="25" height="10" rx="5" fill="#FFD5B5" />
        <Rect x="290" y="215" width="25" height="10" rx="5" fill="#FFD5B5" />
        
        {/* Face features looking right */}
        <Circle cx="210" cy="45" r="3" fill="#000" />
        <Circle cx="220" cy="45" r="3" fill="#000" />
        <Path d="M210,55 Q215,58 220,55" stroke="#000" strokeWidth="1.5" fill="none" />
      </Svg>
    ),
    
    // Wide-Legged Forward Fold (2-2)
    '2-2': (
      <Svg width={width} height={height} viewBox="0 0 300 300">
        {/* Head - folded forward */}
        <Circle cx="150" cy="180" r="25" fill="#FFD5B5" />
        
        {/* Torso - bent forward */}
        <Path d="M150,205 Q150,150 150,100" stroke="#FFC0CB" strokeWidth="35" fill="none" />
        
        {/* Arms hanging down */}
        <Path d="M130,150 Q120,170 110,190" stroke="#FFD5B5" strokeWidth="12" fill="none" />
        <Path d="M170,150 Q180,170 190,190" stroke="#FFD5B5" strokeWidth="12" fill="none" />
        
        {/* Legs wide */}
        <Path d="M150,100 L70,220" stroke="#FFD5B5" strokeWidth="20" fill="none" />
        <Path d="M150,100 L230,220" stroke="#FFD5B5" strokeWidth="20" fill="none" />
        
        {/* Feet */}
        <Rect x="55" y="220" width="30" height="10" rx="5" fill="#FFD5B5" />
        <Rect x="215" y="220" width="30" height="10" rx="5" fill="#FFD5B5" />
      </Svg>
    ),
    
    // Supported Triangle Pose (2-3)
    '2-3': (
      <Svg width={width} height={height} viewBox="0 0 300 300">
        {/* Head */}
        <Circle cx="80" cy="100" r="25" fill="#FFD5B5" />
        
        {/* Torso - angled */}
        <Path d="M80,125 L150,170" stroke="#FFC0CB" strokeWidth="30" fill="none" />
        
        {/* Extended arm */}
        <Path d="M120,150 L200,100" stroke="#FFD5B5" strokeWidth="12" fill="none" />
        
        {/* Lower arm reaching down */}
        <Path d="M90,145 L50,220" stroke="#FFD5B5" strokeWidth="12" fill="none" />
        
        {/* Legs in triangle stance */}
        <Path d="M150,170 L80,270" stroke="#FFD5B5" strokeWidth="20" fill="none" />
        <Path d="M150,170 L220,270" stroke="#FFD5B5" strokeWidth="20" fill="none" />
        
        {/* Feet */}
        <Rect x="65" y="265" width="30" height="10" rx="5" fill="#FFD5B5" />
        <Rect x="205" y="265" width="30" height="10" rx="5" fill="#FFD5B5" />
        
        {/* Face features */}
        <Circle cx="75" cy="95" r="3" fill="#000" />
        <Circle cx="85" cy="95" r="3" fill="#000" />
        <Path d="M77,105 Q80,108 83,105" stroke="#000" strokeWidth="1.5" fill="none" />
      </Svg>
    ),
    
    // Modified Squat (3-1)
    '3-1': (
      <Svg width={width} height={height} viewBox="0 0 200 300">
        {/* Head */}
        <Circle cx="100" cy="80" r="25" fill="#FFD5B5" />
        
        {/* Torso */}
        <Path d="M100,105 L100,170" stroke="#FFC0CB" strokeWidth="35" fill="none" />
        
        {/* Arms */}
        <Path d="M80,130 L50,170" stroke="#FFD5B5" strokeWidth="12" fill="none" />
        <Path d="M120,130 L150,170" stroke="#FFD5B5" strokeWidth="12" fill="none" />
        
        {/* Legs in squat position */}
        <Path d="M85,170 C60,180 50,220 60,240" stroke="#FFD5B5" strokeWidth="18" fill="none" />
        <Path d="M115,170 C140,180 150,220 140,240" stroke="#FFD5B5" strokeWidth="18" fill="none" />
        
        {/* Feet */}
        <Ellipse cx="65" cy="245" rx="15" ry="5" fill="#FFD5B5" />
        <Ellipse cx="135" cy="245" rx="15" ry="5" fill="#FFD5B5" />
        
        {/* Face features */}
        <Circle cx="90" cy="75" r="3" fill="#000" />
        <Circle cx="110" cy="75" r="3" fill="#000" />
        <Path d="M95,85 Q100,88 105,85" stroke="#000" strokeWidth="1.5" fill="none" />
      </Svg>
    ),
    
    // Seated Butterfly (3-2)
    '3-2': (
      <Svg width={width} height={height} viewBox="0 0 250 250">
        {/* Head */}
        <Circle cx="125" cy="60" r="25" fill="#FFD5B5" />
        
        {/* Torso */}
        <Path d="M125,85 L125,150" stroke="#FFC0CB" strokeWidth="35" fill="none" />
        
        {/* Arms */}
        <Path d="M105,110 L75,160" stroke="#FFD5B5" strokeWidth="12" fill="none" />
        <Path d="M145,110 L175,160" stroke="#FFD5B5" strokeWidth="12" fill="none" />
        
        {/* Legs in butterfly position */}
        <Path d="M125,150 C100,150 80,180 60,170" stroke="#FFD5B5" strokeWidth="15" fill="none" />
        <Path d="M125,150 C150,150 170,180 190,170" stroke="#FFD5B5" strokeWidth="15" fill="none" />
        
        {/* Feet together */}
        <Ellipse cx="125" cy="190" rx="25" ry="10" fill="#FFD5B5" />
        
        {/* Face features */}
        <Circle cx="115" cy="55" r="3" fill="#000" />
        <Circle cx="135" cy="55" r="3" fill="#000" />
        <Path d="M120,65 Q125,68 130,65" stroke="#000" strokeWidth="1.5" fill="none" />
      </Svg>
    ),
    
    // Side-Lying Relaxation (3-3)
    '3-3': (
      <Svg width={width} height={height} viewBox="0 0 350 200">
        {/* Head */}
        <Circle cx="50" cy="70" r="25" fill="#FFD5B5" />
        
        {/* Torso - lying on side */}
        <Path d="M75,70 L180,70" stroke="#FFC0CB" strokeWidth="35" fill="none" />
        
        {/* Top arm */}
        <Path d="M120,55 L140,30" stroke="#FFD5B5" strokeWidth="12" fill="none" />
        
        {/* Bottom arm */}
        <Path d="M120,85 L150,100" stroke="#FFD5B5" strokeWidth="12" fill="none" />
        
        {/* Legs bent */}
        <Path d="M180,70 L240,40" stroke="#FFD5B5" strokeWidth="18" fill="none" />
        <Path d="M180,70 L240,100" stroke="#FFD5B5" strokeWidth="18" fill="none" />
        
        {/* Pillow under head */}
        <Ellipse cx="40" cy="80" rx="35" ry="15" fill="#E0E0E0" />
        
        {/* Face features - side view */}
        <Circle cx="60" cy="65" r="3" fill="#000" />
        <Path d="M65,70 L70,70" stroke="#000" strokeWidth="1.5" fill="none" />
      </Svg>
    )
  };
  
  // Return the appropriate pose model or a default if not found
  return models[poseId] || (
    <Svg width={width} height={height} viewBox="0 0 200 400">
      <Circle cx="100" cy="50" r="25" fill="#FFD5B5" />
      <Path d="M100,75 L100,200" stroke="#FFC0CB" strokeWidth="30" fill="none" />
      <Path d="M100,100 L50,150" stroke="#FFD5B5" strokeWidth="10" fill="none" />
      <Path d="M100,100 L150,150" stroke="#FFD5B5" strokeWidth="10" fill="none" />
      <Path d="M100,200 L70,350" stroke="#FFD5B5" strokeWidth="15" fill="none" />
      <Path d="M100,200 L130,350" stroke="#FFD5B5" strokeWidth="15" fill="none" />
    </Svg>
  );
};

// Component to render the human-like reference pose
const HumanReferencePose = ({ poseId, width, height, style }) => {
  return (
    <View style={[{ width, height }, style]}>
      {getReferencePoseSVG(poseId, width, height)}
    </View>
  );
};

export default HumanReferencePose;