// src/components/VideoPlayer.js
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Linking,
  Platform
} from 'react-native';
import { Video } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';

const VideoPlayer = ({ 
  source, 
  style = {},
  posterSource,
  usePoster = true,
  title = '',
  onError,
  onLoad,
  onPlaybackStatusUpdate
}) => {
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const videoRef = useRef(null);
  
  // Handle YouTube URLs specially
  const isYouTubeUrl = source?.uri && typeof source.uri === 'string' && 
    (source.uri.includes('youtube.com') || source.uri.includes('youtu.be'));
  
  // Extract video ID from YouTube URL if needed
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };
  
  // Handle opening YouTube links
  const openYouTubeVideo = async () => {
    if (!source?.uri) return;
    
    try {
      // Try to open in YouTube app first
      const videoId = getYouTubeVideoId(source.uri);
      const youtubeAppUrl = Platform.OS === 'ios' 
        ? `youtube://www.youtube.com/watch?v=${videoId}` 
        : `vnd.youtube:${videoId}`;
      
      await Linking.openURL(youtubeAppUrl);
    } catch (e) {
      // If YouTube app is not installed, open in browser
      Linking.openURL(source.uri).catch(err => {
        console.error('Error opening URL:', err);
        if (onError) onError(err);
      });
    }
  };
  
  // Handle playback status updates
  const handlePlaybackStatusUpdate = (playbackStatus) => {
    setStatus(playbackStatus);
    if (playbackStatus.isLoaded) {
      setLoading(false);
    }
    
    if (onPlaybackStatusUpdate) {
      onPlaybackStatusUpdate(playbackStatus);
    }
  };
  
  // Handle errors
  const handleVideoError = (err) => {
    console.error('Video error:', err);
    setError(true);
    setLoading(false);
    if (onError) onError(err);
  };
  
  // Toggle play/pause
  const togglePlayPause = () => {
    if (status.isPlaying) {
      videoRef.current?.pauseAsync();
    } else {
      videoRef.current?.playAsync();
    }
  };
  
  // Handle fullscreen toggle
  const toggleFullscreen = async () => {
    if (status.isPlaying) {
      if (status.fullscreen) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        videoRef.current?.setStatusAsync({ fullscreen: false });
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        videoRef.current?.setStatusAsync({ fullscreen: true });
      }
    }
  };
  
  // Render YouTube placeholder for YouTube links
  if (isYouTubeUrl) {
    return (
      <TouchableOpacity 
        style={[styles.container, style]}
        onPress={openYouTubeVideo}
        activeOpacity={0.8}
      >
        <View style={styles.youtubeContainer}>
          <Ionicons name="logo-youtube" size={50} color="#FF0000" />
          <Text style={styles.youtubeText}>{title || 'Watch on YouTube'}</Text>
          <TouchableOpacity 
            style={styles.playButton}
            onPress={openYouTubeVideo}
          >
            <Ionicons name="play" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }
  
  // Render local/remote video
  return (
    <View style={[styles.container, style]}>
      {source?.uri && (
        <Video
          ref={videoRef}
          source={source}
          posterSource={usePoster ? posterSource : null}
          posterStyle={styles.poster}
          usePoster={usePoster}
          style={styles.video}
          resizeMode="contain"
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onLoadStart={() => setLoading(true)}
          onLoad={(status) => {
            setLoading(false);
            if (onLoad) onLoad(status);
          }}
          onError={handleVideoError}
          useNativeControls={true}
        />
      )}
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF69B4" />
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#FF4444" />
          <Text style={styles.errorText}>Could not load video</Text>
        </View>
      )}
      
      {!loading && !error && !status.isPlaying && (
        <TouchableOpacity 
          style={styles.playButton}
          onPress={togglePlayPause}
        >
          <Ionicons name="play" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      
      {/* Custom controls (optional - can use in addition to or instead of useNativeControls) */}
      {/* <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={togglePlayPause}>
          <Ionicons 
            name={status.isPlaying ? "pause" : "play"} 
            size={24} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={toggleFullscreen}>
          <Ionicons 
            name={status.fullscreen ? "contract" : "expand"} 
            size={24} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  poster: {
    resizeMode: 'cover',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  errorContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  errorText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 14,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 60,
    height: 60,
    marginLeft: -30,
    marginTop: -30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  youtubeContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  youtubeText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});

export default VideoPlayer;