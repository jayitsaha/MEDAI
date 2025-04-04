// ThreeJsReferenceModel.js
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const ThreeJsReferenceModel = ({ poseId, width, height, autoRotate = true }) => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef(null);
  
  // Map pose IDs to model parameters
  const getPoseModelParams = (poseId) => {
    const poses = {
      // Mountain Pose (1-1)
      '1-1': {
        position: 'standing',
        arms: 'sides',
        legs: 'together',
        rotation: 0 // front facing
      },
      // Cat-Cow Stretch (1-2)
      '1-2': {
        position: 'hands_knees',
        arms: 'straight',
        legs: 'kneeling',
        spine: 'arched', // Cat pose default
        rotation: 90 // side view
      },
      // Seated Side Stretch (1-3)
      '1-3': {
        position: 'seated',
        arms: 'overhead_side',
        legs: 'crossed',
        spine: 'side_bend',
        rotation: 45 // angled view
      },
      // Warrior II (2-1)
      '2-1': {
        position: 'standing',
        arms: 'extended',
        legs: 'wide_bent',
        rotation: 90 // side view
      },
      // Wide-Legged Forward Fold (2-2)
      '2-2': {
        position: 'standing',
        arms: 'hanging',
        legs: 'wide',
        spine: 'folded',
        rotation: 0 // front view
      },
      // Supported Triangle Pose (2-3)
      '2-3': {
        position: 'standing',
        arms: 'triangle',
        legs: 'wide_straight',
        spine: 'side_bend',
        rotation: 90 // side view
      },
      // Modified Squat (3-1)
      '3-1': {
        position: 'squat',
        arms: 'forward',
        legs: 'wide_bent',
        rotation: 0 // front view
      },
      // Seated Butterfly (3-2)
      '3-2': {
        position: 'seated',
        arms: 'forward',
        legs: 'butterfly',
        rotation: 0 // front view
      },
      // Side-Lying Relaxation (3-3)
      '3-3': {
        position: 'side_lying',
        arms: 'relaxed',
        legs: 'bent',
        rotation: 90 // side view
      }
    };
    
    return poses[poseId] || poses['1-1']; // Default to mountain pose if not found
  };
  
  // Generate the HTML content for the WebView
  const generateHtml = (poseId) => {
    const modelParams = getPoseModelParams(poseId);
    
    // Convert pose parameters to a JSON string for the WebView
    const poseParamsJson = JSON.stringify(modelParams);
    
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
          background-color: #1a1a1a;
        }
        canvas { 
          width: 100%; 
          height: 100%; 
          display: block;
        }
      </style>
    </head>
    <body>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.min.js"></script>
      <script>
        // Parse pose parameters from React Native
        const poseParams = ${poseParamsJson};
        
        // Set up the scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);
        
        // Set up the camera
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 1, 3);
        
        // Set up the renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.outputEncoding = THREE.sRGBEncoding;
        document.body.appendChild(renderer.domElement);
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        
        // Add orbit controls
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.7;
        controls.enabled = ${autoRotate}; // Enable/disable based on autoRotate prop
        
        // Create a simple human figure based on pose parameters
        function createHumanFigure(params) {
          const figure = new THREE.Group();
          
          // Create materials
          const skinMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffe0bd,  // skin tone
            roughness: 0.7,
            metalness: 0.1
          });
          
          const clothingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x7ca1e5,  // light blue clothing
            roughness: 0.8,
            metalness: 0
          });
          
          // Create head
          const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 32, 32),
            skinMaterial
          );
          head.position.y = 1.6;
          figure.add(head);
          
          // Create torso
          const torso = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.15, 0.6, 16),
            clothingMaterial
          );
          torso.position.y = 1.2;
          figure.add(torso);
          
          // Create limbs based on pose parameters
          createLimbs(figure, params, skinMaterial, clothingMaterial);
          
          // Adjust figure based on position parameter
          adjustFigurePosition(figure, params);
          
          // Rotate figure based on rotation parameter
          figure.rotation.y = THREE.Math.degToRad(params.rotation || 0);
          
          return figure;
        }
        
        // Create limbs (arms and legs) based on parameters
        function createLimbs(figure, params, skinMaterial, clothingMaterial) {
          // Arms
          const upperArmGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 16);
          const lowerArmGeometry = new THREE.CylinderGeometry(0.04, 0.03, 0.3, 16);
          
          // Left arm
          const leftUpperArm = new THREE.Mesh(upperArmGeometry, skinMaterial);
          const leftLowerArm = new THREE.Mesh(lowerArmGeometry, skinMaterial);
          const leftHand = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 16, 16),
            skinMaterial
          );
          
          // Right arm
          const rightUpperArm = new THREE.Mesh(upperArmGeometry, skinMaterial);
          const rightLowerArm = new THREE.Mesh(lowerArmGeometry, skinMaterial);
          const rightHand = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 16, 16),
            skinMaterial
          );
          
          // Legs
          const upperLegGeometry = new THREE.CylinderGeometry(0.07, 0.06, 0.4, 16);
          const lowerLegGeometry = new THREE.CylinderGeometry(0.055, 0.05, 0.4, 16);
          
          // Left leg
          const leftUpperLeg = new THREE.Mesh(upperLegGeometry, clothingMaterial);
          const leftLowerLeg = new THREE.Mesh(lowerLegGeometry, skinMaterial);
          const leftFoot = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.05, 0.15),
            skinMaterial
          );
          
          // Right leg
          const rightUpperLeg = new THREE.Mesh(upperLegGeometry, clothingMaterial);
          const rightLowerLeg = new THREE.Mesh(lowerLegGeometry, skinMaterial);
          const rightFoot = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.05, 0.15),
            skinMaterial
          );
          
          // Position arms and legs according to pose parameters
          positionArmsAndLegs(
            figure, params,
            leftUpperArm, leftLowerArm, leftHand,
            rightUpperArm, rightLowerArm, rightHand,
            leftUpperLeg, leftLowerLeg, leftFoot,
            rightUpperLeg, rightLowerLeg, rightFoot
          );
        }
        
        // Position arms and legs based on pose parameters
        function positionArmsAndLegs(
          figure, params,
          leftUpperArm, leftLowerArm, leftHand,
          rightUpperArm, rightLowerArm, rightHand,
          leftUpperLeg, leftLowerLeg, leftFoot,
          rightUpperLeg, rightLowerLeg, rightFoot
        ) {
          // Adjust arms based on the 'arms' parameter
          if (params.arms === 'sides') {
            // Arms at sides for mountain pose
            setupArmAtSide(leftUpperArm, leftLowerArm, leftHand, true);
            setupArmAtSide(rightUpperArm, rightLowerArm, rightHand, false);
          } else if (params.arms === 'extended') {
            // Arms extended for warrior II
            setupArmExtended(leftUpperArm, leftLowerArm, leftHand, true);
            setupArmExtended(rightUpperArm, rightLowerArm, rightHand, false);
          } else if (params.arms === 'overhead_side') {
            // One arm overhead for side stretch
            setupArmAtSide(leftUpperArm, leftLowerArm, leftHand, true);
            setupArmOverhead(rightUpperArm, rightLowerArm, rightHand);
          } else if (params.arms === 'triangle') {
            // Arms for triangle pose
            setupArmExtended(leftUpperArm, leftLowerArm, leftHand, true);
            setupArmDown(rightUpperArm, rightLowerArm, rightHand);
          } else if (params.arms === 'straight') {
            // Arms straight for cat-cow
            setupArmsForward(leftUpperArm, leftLowerArm, leftHand, true);
            setupArmsForward(rightUpperArm, rightLowerArm, rightHand, false);
          } else if (params.arms === 'forward') {
            // Arms forward
            setupArmsForward(leftUpperArm, leftLowerArm, leftHand, true, 0.3);
            setupArmsForward(rightUpperArm, rightLowerArm, rightHand, false, 0.3);
          } else if (params.arms === 'hanging') {
            // Arms hanging down (for forward fold)
            setupArmDown(leftUpperArm, leftLowerArm, leftHand, true);
            setupArmDown(rightUpperArm, rightLowerArm, rightHand, false);
          } else if (params.arms === 'relaxed') {
            // Relaxed arm position
            setupRelaxedArms(leftUpperArm, leftLowerArm, leftHand, true);
            setupRelaxedArms(rightUpperArm, rightLowerArm, rightHand, false);
          }
          
          // Adjust legs based on the 'legs' parameter
          if (params.legs === 'together') {
            // Legs together for mountain pose
            setupLegStraight(leftUpperLeg, leftLowerLeg, leftFoot, true, 0);
            setupLegStraight(rightUpperLeg, rightLowerLeg, rightFoot, false, 0);
          } else if (params.legs === 'wide_bent') {
            // Wide stance with bent knee for warrior poses
            setupLegWideBent(leftUpperLeg, leftLowerLeg, leftFoot, true);
            setupLegWideBent(rightUpperLeg, rightLowerLeg, rightFoot, false);
          } else if (params.legs === 'wide') {
            // Wide stance for wide-legged positions
            setupLegStraight(leftUpperLeg, leftLowerLeg, leftFoot, true, 0.2);
            setupLegStraight(rightUpperLeg, rightLowerLeg, rightFoot, false, 0.2);
          } else if (params.legs === 'wide_straight') {
            // Wide stance with straight legs for triangle
            setupLegStraight(leftUpperLeg, leftLowerLeg, leftFoot, true, 0.25);
            setupLegStraight(rightUpperLeg, rightLowerLeg, rightFoot, false, 0.25);
          } else if (params.legs === 'kneeling') {
            // Kneeling position for cat-cow
            setupLegKneeling(leftUpperLeg, leftLowerLeg, leftFoot, true);
            setupLegKneeling(rightUpperLeg, rightLowerLeg, rightFoot, false);
          } else if (params.legs === 'butterfly') {
            // Butterfly pose legs
            setupLegButterfly(leftUpperLeg, leftLowerLeg, leftFoot, true);
            setupLegButterfly(rightUpperLeg, rightLowerLeg, rightFoot, false);
          } else if (params.legs === 'crossed') {
            // Crossed legs for seated poses
            setupLegCrossed(leftUpperLeg, leftLowerLeg, leftFoot, true);
            setupLegCrossed(rightUpperLeg, rightLowerLeg, rightFoot, false);
          } else if (params.legs === 'bent') {
            // Bent legs for side-lying
            setupLegBent(leftUpperLeg, leftLowerLeg, leftFoot, true);
            setupLegBent(rightUpperLeg, rightLowerLeg, rightFoot, false);
          }
          
          // Add all parts to the figure
          figure.add(leftUpperArm, leftLowerArm, leftHand);
          figure.add(rightUpperArm, rightLowerArm, rightHand);
          figure.add(leftUpperLeg, leftLowerLeg, leftFoot);
          figure.add(rightUpperLeg, rightLowerLeg, rightFoot);
        }
        
        // Helper functions to position limbs for different poses
        function setupArmAtSide(upperArm, lowerArm, hand, isLeft) {
          const side = isLeft ? -1 : 1;
          
          upperArm.position.set(side * 0.2, 1.4, 0);
          upperArm.rotation.z = side * Math.PI / 2;
          
          lowerArm.position.set(side * 0.45, 1.4, 0);
          lowerArm.rotation.z = side * Math.PI / 2;
          
          hand.position.set(side * 0.65, 1.4, 0);
        }
        
        function setupArmExtended(upperArm, lowerArm, hand, isLeft) {
          const side = isLeft ? -1 : 1;
          
          upperArm.position.set(side * 0.2, 1.4, 0);
          upperArm.rotation.z = side * Math.PI / 2;
          upperArm.rotation.y = 0;
          
          lowerArm.position.set(side * 0.45, 1.4, 0);
          lowerArm.rotation.z = side * Math.PI / 2;
          
          hand.position.set(side * 0.65, 1.4, 0);
        }
        
        function setupArmOverhead(upperArm, lowerArm, hand) {
          upperArm.position.set(0.1, 1.5, 0);
          upperArm.rotation.z = -Math.PI / 2.5;
          
          lowerArm.position.set(0.3, 1.7, 0);
          lowerArm.rotation.z = -Math.PI / 3;
          
          hand.position.set(0.4, 1.9, 0);
        }
        
        function setupArmDown(upperArm, lowerArm, hand, isLeft) {
          const side = isLeft ? -1 : 1;
          
          upperArm.position.set(side * 0.2, 1.3, 0);
          upperArm.rotation.z = side * Math.PI / 3;
          
          lowerArm.position.set(side * 0.3, 1.0, 0);
          lowerArm.rotation.z = side * Math.PI / 3;
          
          hand.position.set(side * 0.4, 0.8, 0);
        }
        
        function setupArmsForward(upperArm, lowerArm, hand, isLeft, height = 0) {
          const side = isLeft ? -1 : 1;
          
          upperArm.position.set(side * 0.2, 1.4 - height, 0.1);
          upperArm.rotation.x = Math.PI / 2;
          
          lowerArm.position.set(side * 0.2, 1.4 - height, 0.4);
          lowerArm.rotation.x = Math.PI / 2;
          
          hand.position.set(side * 0.2, 1.4 - height, 0.6);
        }
        
        function setupRelaxedArms(upperArm, lowerArm, hand, isLeft) {
          const side = isLeft ? -1 : 1;
          
          upperArm.position.set(side * 0.2, 1, 0.1);
          upperArm.rotation.x = Math.PI / 4;
          upperArm.rotation.z = side * Math.PI / 3;
          
          lowerArm.position.set(side * 0.3, 0.8, 0.2);
          lowerArm.rotation.x = Math.PI / 4;
          lowerArm.rotation.z = side * Math.PI / 3;
          
          hand.position.set(side * 0.4, 0.7, 0.3);
        }
        
        function setupLegStraight(upperLeg, lowerLeg, foot, isLeft, offset = 0) {
          const side = isLeft ? -1 : 1;
          
          upperLeg.position.set(side * (0.1 + offset), 0.8, 0);
          upperLeg.rotation.x = Math.PI;
          
          lowerLeg.position.set(side * (0.1 + offset), 0.4, 0);
          lowerLeg.rotation.x = Math.PI;
          
          foot.position.set(side * (0.1 + offset), 0.15, 0.05);
        }
        
        function setupLegWideBent(upperLeg, lowerLeg, foot, isLeft) {
          const side = isLeft ? -1 : 1;
          
          upperLeg.position.set(side * 0.25, 0.8, 0);
          upperLeg.rotation.x = Math.PI * 0.9;
          upperLeg.rotation.z = side * Math.PI * 0.1;
          
          lowerLeg.position.set(side * 0.3, 0.5, 0.1);
          lowerLeg.rotation.x = Math.PI * 1.1;
          
          foot.position.set(side * 0.3, 0.3, 0.15);
          foot.rotation.y = side * Math.PI * 0.15;
        }
        
        function setupLegKneeling(upperLeg, lowerLeg, foot, isLeft) {
          const side = isLeft ? -1 : 1;
          
          upperLeg.position.set(side * 0.15, 0.6, -0.1);
          upperLeg.rotation.x = Math.PI * 1.5;
          
          lowerLeg.position.set(side * 0.15, 0.6, -0.4);
          lowerLeg.rotation.x = Math.PI;
          
          foot.position.set(side * 0.15, 0.35, -0.5);
          foot.rotation.x = Math.PI * 0.5;
        }
        
        function setupLegButterfly(upperLeg, lowerLeg, foot, isLeft) {
          const side = isLeft ? -1 : 1;
          
          upperLeg.position.set(side * 0.15, 0.5, 0);
          upperLeg.rotation.x = Math.PI;
          upperLeg.rotation.z = side * Math.PI * 0.25;
          
          lowerLeg.position.set(side * 0.3, 0.5, 0.2);
          lowerLeg.rotation.x = Math.PI;
          lowerLeg.rotation.z = side * Math.PI * 0.35;
          
          foot.position.set(0, 0.3, 0.3);
          foot.rotation.y = side * Math.PI * 0.25;
        }
        
        function setupLegCrossed(upperLeg, lowerLeg, foot, isLeft) {
          const side = isLeft ? -1 : 1;
          const offset = isLeft ? 0.1 : -0.1;
          
          upperLeg.position.set(side * 0.1, 0.5, offset);
          upperLeg.rotation.x = Math.PI * 1.1;
          upperLeg.rotation.z = side * Math.PI * 0.2;
          
          lowerLeg.position.set(side * -0.1, 0.35, 0.2 + offset);
          lowerLeg.rotation.x = Math.PI * 0.8;
          lowerLeg.rotation.z = side * Math.PI * -0.1;
          
          foot.position.set(side * -0.2, 0.25, 0.25 + offset);
          foot.rotation.y = side * Math.PI * -0.2;
        }
        
        function setupLegBent(upperLeg, lowerLeg, foot, isLeft) {
          const side = isLeft ? -1 : 1;
          const offset = isLeft ? 0 : 0.05;
          
          upperLeg.position.set(0, 0.5 + offset, side * 0.1);
          upperLeg.rotation.x = Math.PI * 1.5;
          upperLeg.rotation.z = side * Math.PI * 0.1;
          
          lowerLeg.position.set(-0.1, 0.5 + offset, side * 0.3);
          lowerLeg.rotation.x = Math.PI * 1.8;
          
          foot.position.set(-0.25, 0.5 + offset, side * 0.4);
          foot.rotation.x = Math.PI * 0.5;
          foot.rotation.z = side * Math.PI * 0.15;
        }
        
        // Adjust the entire figure based on the position parameter
        function adjustFigurePosition(figure, params) {
          if (params.position === 'seated') {
            figure.position.y = -0.6;
          } else if (params.position === 'hands_knees') {
            figure.position.y = -0.7;
            figure.rotation.x = Math.PI * 0.25;
          } else if (params.position === 'squat') {
            figure.position.y = -0.5;
          } else if (params.position === 'side_lying') {
            figure.position.y = -0.5;
            figure.rotation.z = Math.PI * 0.5;
          }
          
          // Adjust spine based on spine parameter
          if (params.spine === 'folded') {
            figure.rotation.x = Math.PI * 0.4;
          } else if (params.spine === 'arched') {
            // For cat pose, arch the back
            figure.rotation.x = -Math.PI * 0.1;
          } else if (params.spine === 'side_bend') {
            figure.rotation.z = Math.PI * 0.12;
          }
        }
        
        // Create the human figure
        const humanFigure = createHumanFigure(poseParams);
        scene.add(humanFigure);
        
        // Add a grid floor
        const gridHelper = new THREE.GridHelper(5, 10, 0x444444, 0x444444);
        gridHelper.position.y = -1;
        scene.add(gridHelper);
        
        // Notify React Native when the scene is ready
        window.addEventListener('load', function() {
          window.ReactNativeWebView.postMessage('loaded');
        });
        
        // Add auto-rotation
        let autoRotationEnabled = ${autoRotate};
        
        // Animation loop
        function animate() {
          requestAnimationFrame(animate);
          
          if (autoRotationEnabled) {
            humanFigure.rotation.y += 0.005;
          }
          
          controls.update();
          renderer.render(scene, camera);
        }
        
        // Handle window resize
        window.addEventListener('resize', function() {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Start animation
        animate();
      </script>
    </body>
    </html>
    `;
  };
  
  // Handle WebView messages
  const handleWebViewMessage = (event) => {
    if (event.nativeEvent.data === 'loaded') {
      setLoading(false);
    }
  };
  
  // Get the HTML content based on the pose ID
  const html = generateHtml(poseId);
  
  return (
    <View style={[styles.container, { width, height }]}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webView}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
      />
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF69B4" />
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
});

export default ThreeJsReferenceModel;