import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const VidiPopis = () => {

  const currentDate = new Date().toLocaleDateString('sr-RS', {
    // weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView>
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
          <Text className='text-center'>Funkcionalnosti...</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

export default VidiPopis