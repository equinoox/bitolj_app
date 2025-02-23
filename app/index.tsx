import { Text, View, ImageBackground, ScrollView, Image, TouchableOpacity, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef } from 'react';
import { FontAwesome5 } from '@expo/vector-icons'; // Import FontAwesome5

const App = () => {
  // Animated values for opacity
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <ImageBackground
      source={require('../assets/images/welcome_bg_image.webp')}
      className="flex-1"
      resizeMode="cover"
    >
      {/* Dark overlay */}
      <View className="absolute top-0 left-0 w-full h-full bg-black opacity-50" />
      <SafeAreaView className="h-full flex">
        {/* Upravljanje Bazom Button at the top */}
        <TouchableOpacity
          onPress={() => router.push('/db_manager')}
          className="bg-secondary rounded-xl min-h-[40px] justify-center items-center w-56 mt-4 mx-auto flex-row space-x-2"
        >
          <FontAwesome5 name="database" size={20} color="#FFA001" />
          <Text className="text-white text-cener text-lg font-bold ml-2">Database Options</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="w-full items-center px-4 py-8 flex-1 mt-36">
            {/* Header Image */}
            <Animated.Image
              source={require('../assets/images/headerIcon.webp')}
              style={{ opacity: imageOpacity }}
              className="w-[220px] max-w-[460px] h-[184px] max-h-[404px]"
              resizeMode="contain"
            />

            {/* Heading Text */}
            <Animated.View style={{ opacity: imageOpacity }} className="relative mt-7 p-4">
              <Text className="text-4xl text-orange font-bold text-center">RESTORAN BITOLJ</Text>
              <Text className="text-4xl text-text_color_2 font-bold text-center">Program za POPIS PIĆA</Text>
            </Animated.View>

            {/* Buttons */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/log-in')}
              className="bg-orange rounded-xl min-h-[62px] justify-center items-center w-3/4 active:opacity-20"
            >
              <Text className="text-black text-2xl font-bold">Nastavi</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="bg-secondary_dark py-8">
            <View className="justify-center items-center px-6">
              <Text className="text-text_color_2 text-lg italic">
                <Text className="text-orange font-bold">Restoran Bitolj</Text> @ 2024 All Rights Reserved
              </Text>
            </View>
          </View>
        </ScrollView>
        <StatusBar backgroundColor="#161622" style="light" />
      </SafeAreaView>
    </ImageBackground>
  );
};

export default App;