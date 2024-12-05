import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const Popis = () => {
  
  const currentDate = new Date().toLocaleDateString('sr-RS', {
    // weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
  
  return (
    <SafeAreaView className= "flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1}}>
        
        {/* Header */}
        <View className="flex bg-secondary rounded-3xl items-center space-y-8 m-4">
          {/* Person Icon and Welcome Text */}
          <View className="flex mt-3 mb-1 items-center space-y-2">
            <FontAwesome5 name="user" size={48} color="#FFA500" /> 
            <Text className="text-4xl font-bold text-white mt-2">Ime Prezime</Text> 
          </View>

          {/* Clock Icon and Date Text */}
          <View className="flex items-center space-y-2 mt-1 mb-3">
            <MaterialIcons name="access-time" size={48} color="#FFA500" /> 
            <Text className="text-xl text-white">Današnji Datum</Text> 
            <Text className="text-xl text-white">{currentDate}</Text>
          </View>
        </View>

        {/* Content */}
        <View className='flex justify-center items-center m-4'>
          <Text className='text-center'>Funkcionosti...</Text>
        </View>


        {/* Implement Dynamic Table!! */}
        {/* This is only Prototype */}
        {/* This table is for CREATE(INSERT) operation!!! */}
        {/* I need to use <FlatList/>!!! */}
        <View className="m-4">
          <View className="flex flex-row justify-between border-b-2 border-black pb-2">
            <Text className="flex-1 text-center text-lg font-bold">Piće</Text>
            <Text className="flex-1 text-center text-lg font-bold">Početak</Text>
            <Text className="flex-1 text-center text-lg font-bold">Kraj</Text>
            <Text className="flex-1 text-center text-lg font-bold">Cena</Text>
            <Text className="flex-1 text-center text-lg font-bold">Ukupno</Text>
          </View>

          <View className="flex flex-row justify-between py-2 border-b border-black">
            <Text className="flex-1 text-center">Tuborg</Text>
            <Text className="flex-1 text-center">150</Text>
            <Text className="flex-1 text-center">100</Text>
            <Text className="flex-1 text-center">100</Text>
            <Text className="flex-1 text-center">5000RSD</Text>
          </View>

          <View className="flex flex-row justify-between py-2 border-b border-black">
            <Text className="flex-1 text-center">Nikšićko</Text>
            <Text className="flex-1 text-center">60</Text>
            <Text className="flex-1 text-center">40</Text>
            <Text className="flex-1 text-center">120</Text>
            <Text className="flex-1 text-center">2400RSD</Text>
          </View>


          <View className="flex flex-row justify-between py-2">
            <Text className="flex-1 text-center">...</Text>
            <Text className="flex-1 text-center">...</Text>
            <Text className="flex-1 text-center">...</Text>
            <Text className="flex-1 text-center">...</Text>
            <Text className="flex-1 text-center">...</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

export default Popis