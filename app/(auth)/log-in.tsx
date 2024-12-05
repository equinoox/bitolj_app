import { View, Text, ScrollView, Image, TouchableOpacity, Animated } from 'react-native'
import React, { useEffect, useRef, useState } from 'react';
import { Link, Redirect, Router, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import FormField from '@/components/FormField'


const LogIn = () => {
  const [form, setform] = useState({
    name: '',
    password: ''
  });

  // const submit = () => {
  //  BACK-END Logic
  // };

  const imageOpacity = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    Animated.sequence([
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView className="bg-primary h-full flex">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="w-full justify-center items-center min-h-[54vh] px-4 my-6 flex-1">
          <Animated.Image 
            source={require('../../assets/images/person_icon.png')}
            resizeMode="contain"
            style={{ opacity: imageOpacity }}
            className="max-w-[185px] h-[105px]"
          />
          <Text className="text-2xl text-black font-semibold mt-4 text-center">PRIJAVA KORISNIKA</Text>

          <FormField
            title="Ime"
            value={form.name}
            handleChangeText={(e) => setform({ ...form, name: e })}
            otherStyles="mt-5 w-full"
            keyboardType="name"
          />
          
          <FormField
            title="Šifra"
            value={form.password}
            handleChangeText={(e) => setform({ ...form, password: e })}
            otherStyles="mt-7 w-full"
            keyboardType="password"
          />
          
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/popis')} 
            className="bg-secondary rounded-xl min-h-[42px] justify-center items-center w-2/4 mt-6 active:opacity-20"
          >
            <Text className="text-white text-2xl font-semibold">Log In</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="bg-secondary_dark py-8 flex-shrink-0">
          <View className="justify-center items-center px-6">
            <Text className="text-text_color_2 text-lg italic">
              <Text className="text-orange font-bold">Restoran Bitolj</Text> @ 2024 All Rights Reserved
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LogIn