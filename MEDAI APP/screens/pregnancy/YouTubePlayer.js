// src/components/YouTubePlayer.js
import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';

const YouTubePlayer = ({ videoId, style = {} }) => {
  const [loading, setLoading] = useState(true);

  // Simple embedded YouTube HTML
  const embedHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; background-color: #000; }
          iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <iframe 
          src="https://www.youtube.com/embed/${videoId}?playsinline=1&controls=1&modestbranding=1"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: embedHTML }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        onLoadEnd={() => setLoading(false)}
      />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF69B4" />
        </View>
      )}
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
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
});

export default YouTubePlayer;