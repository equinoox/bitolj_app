import { StyleSheet, Text, View, Animated, Easing } from 'react-native'
import React, { useRef, useEffect } from 'react'

const Fallback = () => {
  
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startRotation = () => {
      rotateAnim.setValue(0);
      
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => startRotation()); // Recursively restart the animation
    };

    startRotation();
    
    return () => {
      rotateAnim.stopAnimation();
    };
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  }); 

    return (
    <View  style={{
      flex: 1,
      backgroundColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999
    }}
    >
        <Animated.View
          style={[
            styles.spinner,
            { transform: [{ rotate }] }, // Apply rotation
          ]}
        />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
  )
}

const styles = StyleSheet.create ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  }, 
  spinner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 5,
    borderColor: '#FFA500',
    borderTopColor: 'transparent',
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#082133',
  },
});

export default Fallback
