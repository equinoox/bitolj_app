import { StyleSheet, Text, View, Animated, Easing } from 'react-native'
import React, { useRef, useEffect } from 'react'

const Fallback = () => {
  
    const rotateAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
       
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1000, // 1 second
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start();
      }, [rotateAnim]);

    const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
    }); 

    return (
    <View className='flex justify-center items-center'>
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

const styles = {
    spinner: {
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 5,
      borderColor: '#3498db',
      borderTopColor: 'transparent',
      backgroundColor: 'transparent',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 18,
      color: '#082133',
    },
  };

export default Fallback
