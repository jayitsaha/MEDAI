// ReferenceModelView.js - Fixed version with fallbacks
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import PoseVisualizer from './PoseVisualizer';
import { getReferencePoseKeypoints } from './PoseDetectionService';

/**
 * Component for displaying yoga pose reference models with fallback mechanisms
 */
const ReferenceModelView = ({ 
  poseId, 
  width, 
  height, 
  autoRotate = true,
  backgroundColor = '#1a1a1a'
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [referenceKeypoints, setReferenceKeypoints] = useState([]);
  
  const webViewRef = useRef(null);
  const loadTimeoutRef = useRef(null);
  
  // Load reference keypoints for fallback visualization
  useEffect(() => {
    const loadKeypoints = async () => {
      try {
        const keypoints = await getReferencePoseKeypoints(poseId);
        setReferenceKeypoints(keypoints);
      } catch (err) {
        console.error('Error loading reference keypoints:', err);
      }
    };
    
    loadKeypoints();
  }, [poseId]);
  
  // Set a timeout for loading the 3D model
  useEffect(() => {
    // Set a timeout to switch to fallback mode if the 3D model doesn't load
    loadTimeoutRef.current = setTimeout(() => {
      if (loading && !error) {
        console.log('3D model loading timeout, switching to fallback mode');
        setFallbackMode(true);
        setLoading(false);
      }
    }, 5000); // 5 second timeout
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [loading, error]);
  
  // Get simplified 3D model
  const getSimplifiedModel = (poseId) => {
    // Map poseId to a basic model configuration
    const models = {
      '1-1': { // Mountain Pose
        standing: true,
        arms: 'down',
        description: 'Stand with feet hip-width apart, arms at sides'
      },
      '1-2': { // Cat-Cow
        hands_knees: true,
        description: 'Start on hands and knees, alternating between arching and rounding back'
      },
      '1-3': { // Seated Side Stretch
        seated: true,
        arms: 'one_up',
        description: 'Sit cross-legged, one arm overhead, side bend'
      },
      '2-1': { // Warrior II
        standing: true,
        arms: 'extended',
        legs: 'wide',
        description: 'Feet wide apart, arms extended, one knee bent'
      },
      '2-2': { // Wide-Legged Forward Fold
        standing: true,
        forward_fold: true,
        legs: 'wide',
        description: 'Feet wide apart, fold forward'
      },
      '2-3': { // Triangle Pose
        standing: true,
        side_bend: true,
        legs: 'wide',
        description: 'Feet wide apart, one arm down, one up, side bend'
      },
      '3-1': { // Modified Squat
        squat: true,
        description: 'Feet wide, bend knees into squat'
      },
      '3-2': { // Seated Butterfly
        seated: true,
        butterfly: true,
        description: 'Seated with feet together, knees out'
      },
      '3-3': { // Side-Lying Relaxation
        side_lying: true,
        description: 'Lie on side with support'
      }
    };
    
    return models[poseId] || models['1-1'];
  };
  
  // Generate the HTML content for the WebView using minimal Three.js
  const generateHtml = (poseId) => {
    const model = getSimplifiedModel(poseId);
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        body { 
          margin: 0; 
          overflow: hidden; 
          width: 100vw; 
          height: 100vh;
          background-color: ${backgroundColor};
          touch-action: none;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        canvas { 
          width: 100%; 
          height: 100%; 
          display: block;
        }
        #loading {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: ${backgroundColor};
          color: white;
          font-size: 14px;
          z-index: 100;
        }
        #loading-spinner {
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-left-color: #FF69B4;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        #error {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: ${backgroundColor};
          color: white;
          font-size: 14px;
          text-align: center;
          padding: 20px;
          box-sizing: border-box;
          z-index: 101;
        }
        #error-icon {
          font-size: 40px;
          margin-bottom: 15px;
          color: #FF6B6B;
        }
        .fade-in {
          animation: fadeIn 0.5s;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      </style>
    </head>
    <body>
      <div id="loading">
        <div id="loading-spinner"></div>
        <div>Loading 3D model...</div>
      </div>
      
      <div id="error">
        <div id="error-icon">⚠️</div>
        <div>Unable to load 3D model</div>
        <div style="margin-top: 10px; font-size: 12px; opacity: 0.7;">
          Using alternative visualization
        </div>
      </div>
      
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
      
      <script>
        // Simple error handler
        window.addEventListener('error', function(e) {
          console.error('Error in 3D model:', e.message);
          document.getElementById('loading').style.display = 'none';
          document.getElementById('error').style.display = 'flex';
          window.ReactNativeWebView?.postMessage('error');
        });
        
        // Set a timeout to detect if Three.js loads properly
        const threeJsLoadingTimeout = setTimeout(() => {
          if (typeof THREE === 'undefined') {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').style.display = 'flex';
            window.ReactNativeWebView?.postMessage('error');
          }
        }, 3000);
        
        try {
          // Create a basic human figure
          const createBasicHumanFigure = () => {
            const figure = new THREE.Group();
            
            // Create materials
            const skinMaterial = new THREE.MeshStandardMaterial({ 
              color: 0xffe0bd,
              roughness: 0.7,
              metalness: 0.1
            });
            
            const clothingMaterial = new THREE.MeshStandardMaterial({ 
              color: 0x7ca1e5,
              roughness: 0.8,
              metalness: 0
            });
            
            // Create simplified body parts
            // Head
            const head = new THREE.Mesh(
              new THREE.SphereGeometry(0.15, 16, 16),
              skinMaterial
            );
            
            // Torso
            const torso = new THREE.Mesh(
              new THREE.CylinderGeometry(0.2, 0.15, 0.6, 8),
              clothingMaterial
            );
            
            // Position based on pose type
            const poseType = ${JSON.stringify(model)};
            
            if (poseType.standing) {
              // Standing pose
              head.position.set(0, 1.6, 0);
              torso.position.set(0, 1.2, 0);
              
              // Add limbs for standing pose
              addStandingPoseLimbs(figure, skinMaterial, clothingMaterial, poseType);
            } 
            else if (poseType.seated || poseType.butterfly) {
              // Seated pose
              head.position.set(0, 1.0, 0);
              torso.position.set(0, 0.6, 0);
              torso.scale.set(1, 0.8, 1);
              
              // Add limbs for seated pose
              addSeatedPoseLimbs(figure, skinMaterial, clothingMaterial, poseType);
            }
            else if (poseType.hands_knees) {
              // Hands and knees (cat-cow) pose
              head.position.set(0, 0.4, 0.3);
              torso.position.set(0, 0.4, 0);
              torso.rotation.x = Math.PI / 2;
              torso.scale.set(1, 1.2, 1);
              
              // Add limbs for cat-cow pose
              addCatCowPoseLimbs(figure, skinMaterial, clothingMaterial);
            }
            else if (poseType.squat) {
              // Squat pose
              head.position.set(0, 1.0, 0);
              torso.position.set(0, 0.7, 0);
              torso.scale.set(1, 0.7, 1);
              
              // Add limbs for squat pose
              addSquatPoseLimbs(figure, skinMaterial, clothingMaterial);
            }
            else if (poseType.side_lying) {
              // Side-lying pose
              head.position.set(-0.4, 0.15, 0);
              torso.position.set(0, 0.15, 0);
              torso.rotation.z = Math.PI / 2;
              torso.scale.set(1, 1.2, 1);
              
              // Add limbs for side-lying pose
              addSideLyingPoseLimbs(figure, skinMaterial, clothingMaterial);
            }
            
            // Add body parts to figure
            figure.add(head);
            figure.add(torso);
            
            return figure;
          };
          
          // Helper function for adding limbs in standing poses
          function addStandingPoseLimbs(figure, skinMaterial, clothingMaterial, poseType) {
            // Arms
            const leftArm = new THREE.Mesh(
              new THREE.CylinderGeometry(0.05, 0.04, 0.6, 8),
              skinMaterial
            );
            
            const rightArm = new THREE.Mesh(
              new THREE.CylinderGeometry(0.05, 0.04, 0.6, 8),
              skinMaterial
            );
            
            // Legs
            const leftLeg = new THREE.Mesh(
              new THREE.CylinderGeometry(0.07, 0.05, 0.8, 8),
              clothingMaterial
            );
            
            const rightLeg = new THREE.Mesh(
              new THREE.CylinderGeometry(0.07, 0.05, 0.8, 8),
              clothingMaterial
            );
            
            // Position limbs based on pose variant
            if (poseType.arms === 'extended') {
              // Arms extended (warrior II)
              leftArm.position.set(-0.4, 1.4, 0);
              leftArm.rotation.z = Math.PI / 2;
              
              rightArm.position.set(0.4, 1.4, 0);
              rightArm.rotation.z = -Math.PI / 2;
            } 
            else if (poseType.arms === 'one_up') {
              // One arm up (side stretch)
              leftArm.position.set(-0.15, 1.3, 0);
              leftArm.rotation.z = Math.PI / 8;
              
              rightArm.position.set(0.1, 1.6, 0);
              rightArm.rotation.z = -Math.PI / 2.5;
            } 
            else {
              // Default arms position (down)
              leftArm.position.set(-0.2, 1.2, 0);
              rightArm.position.set(0.2, 1.2, 0);
            }
            
            // Position legs based on pose variant
            if (poseType.legs === 'wide') {
              // Wide stance
              leftLeg.position.set(-0.3, 0.5, 0);
              rightLeg.position.set(0.3, 0.5, 0);
            } 
            else {
              // Default stance
              leftLeg.position.set(-0.1, 0.5, 0);
              rightLeg.position.set(0.1, 0.5, 0);
            }
            
            // Side bend if specified
            if (poseType.side_bend) {
              figure.rotation.z = Math.PI / 12; // Subtle side bend
            }
            
            // Forward fold if specified
            if (poseType.forward_fold) {
              figure.rotation.x = Math.PI / 4; // Forward fold
            }
            
            // Add limbs to figure
            figure.add(leftArm, rightArm, leftLeg, rightLeg);
          }
          
          // Helper for seated poses
          function addSeatedPoseLimbs(figure, skinMaterial, clothingMaterial, poseType) {
            // Arms
            const leftArm = new THREE.Mesh(
              new THREE.CylinderGeometry(0.05, 0.04, 0.5, 8),
              skinMaterial
            );
            
            const rightArm = new THREE.Mesh(
              new THREE.CylinderGeometry(0.05, 0.04, 0.5, 8),
              skinMaterial
            );
            
            // Legs (thighs)
            const leftThigh = new THREE.Mesh(
              new THREE.CylinderGeometry(0.07, 0.06, 0.4, 8),
              clothingMaterial
            );
            
            const rightThigh = new THREE.Mesh(
              new THREE.CylinderGeometry(0.07, 0.06, 0.4, 8),
              clothingMaterial
            );
            
            // Lower legs
            const leftLowerLeg = new THREE.Mesh(
              new THREE.CylinderGeometry(0.06, 0.04, 0.4, 8),
              skinMaterial
            );
            
            const rightLowerLeg = new THREE.Mesh(
              new THREE.CylinderGeometry(0.06, 0.04, 0.4, 8),
              skinMaterial
            );
            
            // Position arms
            if (poseType.arms === 'one_up') {
              // One arm up (side stretch)
              leftArm.position.set(-0.15, 0.8, 0);
              leftArm.rotation.z = Math.PI / 8;
              
              rightArm.position.set(0.1, 1.1, 0);
              rightArm.rotation.z = -Math.PI / 2.5;
            } 
            else {
              // Default arms position
              leftArm.position.set(-0.2, 0.8, 0);
              leftArm.rotation.z = Math.PI / 4;
              
              rightArm.position.set(0.2, 0.8, 0);
              rightArm.rotation.z = -Math.PI / 4;
            }
            
            // Position legs
            if (poseType.butterfly) {
              // Butterfly pose
              leftThigh.position.set(-0.2, 0.3, 0.1);
              leftThigh.rotation.set(Math.PI / 2, 0, Math.PI / 6);
              
              rightThigh.position.set(0.2, 0.3, 0.1);
              rightThigh.rotation.set(Math.PI / 2, 0, -Math.PI / 6);
              
              leftLowerLeg.position.set(-0.3, 0.25, 0.3);
              leftLowerLeg.rotation.set(Math.PI / 2, 0, Math.PI / 3);
              
              rightLowerLeg.position.set(0.3, 0.25, 0.3);
              rightLowerLeg.rotation.set(Math.PI / 2, 0, -Math.PI / 3);
            } 
            else {
              // Cross-legged pose
              leftThigh.position.set(-0.15, 0.3, 0.1);
              leftThigh.rotation.set(Math.PI / 2, 0, Math.PI / 4);
              
              rightThigh.position.set(0.15, 0.3, 0.1);
              rightThigh.rotation.set(Math.PI / 2, 0, -Math.PI / 4);
              
              leftLowerLeg.position.set(0.1, 0.2, 0.3);
              leftLowerLeg.rotation.set(Math.PI / 2, 0, Math.PI / 2);
              
              rightLowerLeg.position.set(-0.1, 0.2, 0.3);
              rightLowerLeg.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
            }
            
            // Side bend if specified
            if (poseType.side_bend) {
              figure.rotation.z = Math.PI / 12; // Subtle side bend
            }
            
            // Add limbs to figure
            figure.add(leftArm, rightArm, leftThigh, rightThigh, leftLowerLeg, rightLowerLeg);
          }
          
          // Helper for cat-cow pose
          function addCatCowPoseLimbs(figure, skinMaterial, clothingMaterial) {
            // Arms (hands to shoulders)
            const leftArm = new THREE.Mesh(
              new THREE.CylinderGeometry(0.05, 0.04, 0.5, 8),
              skinMaterial
            );
            
            const rightArm = new THREE.Mesh(
              new THREE.CylinderGeometry(0.05, 0.04, 0.5, 8),
              skinMaterial
            );
            
            // Legs (knees to hips)
            const leftLeg = new THREE.Mesh(
              new THREE.CylinderGeometry(0.07, 0.06, 0.5, 8),
              clothingMaterial
            );
            
            const rightLeg = new THREE.Mesh(
              new THREE.CylinderGeometry(0.07, 0.06, 0.5, 8),
              clothingMaterial
            );
            
            // Position limbs
            leftArm.position.set(-0.3, 0.4, -0.25);
            leftArm.rotation.x = -Math.PI / 2;
            
            rightArm.position.set(0.3, 0.4, -0.25);
            rightArm.rotation.x = -Math.PI / 2;
            
            leftLeg.position.set(-0.3, 0.4, 0.25);
            leftLeg.rotation.x = Math.PI / 2;
            
            rightLeg.position.set(0.3, 0.4, 0.25);
            rightLeg.rotation.x = Math.PI / 2;
            
            // Add limbs to figure
            figure.add(leftArm, rightArm, leftLeg, rightLeg);
          }
          
          // Helper for squat pose
          function addSquatPoseLimbs(figure, skinMaterial, clothingMaterial) {
            // Arms
            const leftArm = new THREE.Mesh(
              new THREE.CylinderGeometry(0.05, 0.04, 0.5, 8),
              skinMaterial
            );
            
            const rightArm = new THREE.Mesh(
              new THREE.CylinderGeometry(0.05, 0.04, 0.5, 8),
              skinMaterial
            );
            
            // Thighs
            const leftThigh = new THREE.Mesh(
              new THREE.CylinderGeometry(0.07, 0.06, 0.3, 8),
              clothingMaterial
            );
            
            const rightThigh = new THREE.Mesh(
              new THREE.CylinderGeometry(0.07, 0.06, 0.3, 8),
              clothingMaterial
            );
            
            // Lower legs
            const leftLowerLeg = new THREE.Mesh(
              new THREE.CylinderGeometry(0.06, 0.04, 0.4, 8),
              skinMaterial
            );
            
            const rightLowerLeg = new THREE.Mesh(
              new THREE.CylinderGeometry(0.06, 0.04, 0.4, 8),
              skinMaterial
            );
            
            // Position arms
            leftArm.position.set(-0.3, 0.8, 0.2);
            leftArm.rotation.x = Math.PI / 4;
            
            rightArm.position.set(0.3, 0.8, 0.2);
            rightArm.rotation.x = Math.PI / 4;
            
            // Position legs (bent in squat)
            leftThigh.position.set(-0.2, 0.5, 0);
            leftThigh.rotation.x = Math.PI / 3;
            
            rightThigh.position.set(0.2, 0.5, 0);
            rightThigh.rotation.x = Math.PI / 3;
            
            leftLowerLeg.position.set(-0.3, 0.3, 0.2);
            leftLowerLeg.rotation.x = -Math.PI / 3;
            
            rightLowerLeg.position.set(0.3, 0.3, 0.2);
            rightLowerLeg.rotation.x = -Math.PI / 3;
            
            // Add limbs to figure
            figure.add(leftArm, rightArm, leftThigh, rightThigh, leftLowerLeg, rightLowerLeg);
          }
          
          // Helper for side-lying pose
          function addSideLyingPoseLimbs(figure, skinMaterial, clothingMaterial) {
            // Arms
            const topArm = new THREE.Mesh(
              new THREE.CylinderGeometry(0.05, 0.04, 0.5, 8),
              skinMaterial
            );
            
            const bottomArm = new THREE.Mesh(
              new THREE.CylinderGeometry(0.05, 0.04, 0.4, 8),
              skinMaterial
            );
            
            // Legs
            const topLeg = new THREE.Mesh(
              new THREE.CylinderGeometry(0.07, 0.06, 0.5, 8),
              clothingMaterial
            );
            
            const bottomLeg = new THREE.Mesh(
              new THREE.CylinderGeometry(0.07, 0.06, 0.5, 8),
              clothingMaterial
            );
            
            // Position in side-lying pose
            topArm.position.set(0.2, 0.3, 0);
            topArm.rotation.z = -Math.PI / 4;
            
            bottomArm.position.set(-0.1, 0, 0);
            bottomArm.rotation.z = Math.PI / 2;
            
            topLeg.position.set(0.3, -0.1, 0);
            topLeg.rotation.z = -Math.PI / 6;
            
            bottomLeg.position.set(0.1, -0.2, 0);
            bottomLeg.rotation.z = -Math.PI / 4;
            
            // Add limbs to figure
            figure.add(topArm, bottomArm, topLeg, bottomLeg);
          }
        
          // Set up the scene
          function setupScene() {
            clearTimeout(threeJsLoadingTimeout);
            
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(${JSON.stringify(backgroundColor)});
            
            // Camera
            const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 1, 3);
            
            // Renderer
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            document.body.appendChild(renderer.domElement);
            
            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(1, 1, 1);
            scene.add(directionalLight);
            
            // Create human figure
            const humanFigure = createBasicHumanFigure();
            scene.add(humanFigure);
            
            // Add a simple floor grid for larger views only
            if (${width} > 150) {
              const gridSize = 5;
              const gridDivisions = 10;
              const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x444444);
              gridHelper.position.y = -0.5;
              scene.add(gridHelper);
            }
            
            // Animation variables
            const autoRotate = ${autoRotate};
            
            // Animation loop
            function animate() {
              requestAnimationFrame(animate);
              
              if (autoRotate) {
                humanFigure.rotation.y += 0.005;
              }
              
              renderer.render(scene, camera);
            }
            
            // Handle window resize
            function handleResize() {
              camera.aspect = window.innerWidth / window.innerHeight;
              camera.updateProjectionMatrix();
              renderer.setSize(window.innerWidth, window.innerHeight);
            }
            
            window.addEventListener('resize', handleResize);
            
            // Remove loading indicator and start animation
            setTimeout(() => {
              const loadingElement = document.getElementById('loading');
              loadingElement.style.display = 'none';
              
              // Notify React Native that loading is complete
              window.ReactNativeWebView?.postMessage('loaded');
            }, 300);
            
            // Start animation
            animate();
          }
          
          // Initialize the scene after a short delay to ensure DOM is ready
          if (document.readyState === 'complete') {
            setupScene();
          } else {
            window.addEventListener('load', setupScene);
          }
        } catch (e) {
          console.error('Setup error:', e);
          document.getElementById('loading').style.display = 'none';
          document.getElementById('error').style.display = 'flex';
          window.ReactNativeWebView?.postMessage('error');
        }
      </script>
    </body>
    </html>
    `;
  };
  
  // Handle WebView messages
  const handleWebViewMessage = (event) => {
    const message = event.nativeEvent.data;
    
    if (message === 'loaded') {
      // Clear timeout and update state
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      setLoading(false);
      setFallbackMode(false);
    } 
    else if (message === 'error') {
      // Clear timeout and switch to fallback mode
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      setError(true);
      setLoading(false);
      setFallbackMode(true);
    }
  };
  
  // Generate HTML
  const html = generateHtml(poseId);
  
  // Determine if we should show the fallback 2D visualization
  const shouldShowFallback = fallbackMode || error;
  
  return (
    <View style={[styles.container, { width, height }]}>
      {!shouldShowFallback ? (
        <WebView
          ref={webViewRef}
          source={{ html }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          scrollEnabled={false}
          bounces={false}
          originWhitelist={['*']}
          startInLoadingState={false}
          onError={() => {
            setError(true);
            setLoading(false);
            setFallbackMode(true);
          }}
        />
      ) : (
        // Fallback to 2D skeleton view
        <View style={[styles.fallbackContainer, { backgroundColor }]}>
          {referenceKeypoints.length > 0 ? (
            <>
              <PoseVisualizer
                keypoints={referenceKeypoints}
                color="#4CAF50"
                strokeWidth={4}
                screenWidth={width}
                screenHeight={height}
                showLabels={width > 200}
              />
              <Text style={styles.fallbackText}>2D Reference Model</Text>
            </>
          ) : (
            <ActivityIndicator size="large" color="#FF69B4" />
          )}
        </View>
      )}
      
      {loading && !shouldShowFallback && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF69B4" />
          <Text style={styles.loadingText}>Loading 3D model...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 14,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fallbackText: {
    color: '#FFF',
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    fontSize: 12,
  }
});

export default React.memo(ReferenceModelView);