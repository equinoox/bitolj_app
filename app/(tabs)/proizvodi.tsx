import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, MaterialIcons, AntDesign  } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { SessionExpiredOverlay } from '../../components/SessionExpiredOverlay';
import { router } from 'expo-router';
import React from 'react'
import { TouchableOpacityWithReset } from '@/components/TouchableOpacityWithReset';

const Proizvodi = () => {
  const { userData, isSessionExpired, setUserData, resetInactivityTimeout } = useAuth();
  const logoutConfirm = () => {
    Alert.alert(
      "Log Out",
      "Da li želite da se odjavite?",
      [{ text: "Ne" , style: 'cancel'}, { text: "Da", onPress: async () => logout()}]
    );
  }

  const logout = async () => {
    try{
      await setUserData(null);
      router.replace('/log-in');
    } catch (error) {
      console.error("Error: " + error)
    }
  };

  const currentDate = new Date().toLocaleDateString('sr-RS', {
    // weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView className= "flex-1">
        <View
        className="flex-1"
        onStartShouldSetResponder={() => {
          resetInactivityTimeout();
          return false;
        }}
      >
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        
        {/* Header */}
        <View className="flex bg-secondary rounded-3xl m-4 p-4">
          {/* Logout Button */}
          <TouchableOpacity
            className="absolute top-4 right-4 bg-secondary rounded-md items-center"
            onPress={logoutConfirm}
          >
            <AntDesign name="logout" size={42} color="#AA0000" />
          </TouchableOpacity>

          {/* Icon and Info Row */}
          <View className="flex flex-row items-center justify-evenly">
            {/* Person Icon and Title */}
            <View className="flex mb-2 items-center space-y-2">
              <FontAwesome5 name="user" size={48} color="#FFA500" />
              <Text className="text-2xl mt-2 font-bold text-white">{userData?.ime} {userData?.prezime}</Text>
            </View>

            {/* Clock Icon and Date */}
            <View className="flex items-center space-y-2">
              <MaterialIcons name="access-time" size={48} color="#FFA500" />
              <View className="items-center">
                <Text className="text-xl text-white">Današnji Datum</Text>
                <Text className="text-xl text-white">{currentDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content */}
        <View className='flex justify-center items-center m-4'>
          <Text className='font-semibold text-3xl'>Piće Menu</Text>
          <View className="mt-4 w-full border-t-2 border-black"/>
          {userData?.role === 'admin' ? (
            <>
              <TouchableOpacityWithReset 
                className='mt-4 bg-orange items-center w-2/4 rounded-md py-4 px-4'
                onPress={() => router.push("/pice/listPice")}
              >
                <Text>Lista Pića</Text>
              </TouchableOpacityWithReset>
              <TouchableOpacityWithReset 
                className='mt-4 bg-orange items-center w-2/4 rounded-md py-4 px-4'
                onPress={() => router.push("/pice/getPice")}
              >
                <Text>Promeni/Obriši Piće</Text>
              </TouchableOpacityWithReset>
              <TouchableOpacityWithReset 
                className='mt-4 bg-orange items-center w-2/4 rounded-md py-4 px-4'
                onPress={() => router.push("/pice/addPice")}
              >
                <Text>Dodaj Piće</Text>
              </TouchableOpacityWithReset>
            </>
          ) : userData?.role === 'manager' ? (
            <>
              <TouchableOpacityWithReset 
                className='mt-4 bg-orange items-center w-2/4 rounded-md py-4 px-4'
                onPress={() => router.push("/pice/listPice")}
              >
                <Text>Lista Pića</Text>
              </TouchableOpacityWithReset>
              <TouchableOpacityWithReset 
                className='mt-4 bg-orange items-center w-2/4 rounded-md py-4 px-4'
                onPress={() => router.push("/pice/addPice")}
              >
                <Text>Dodaj Piće</Text>
              </TouchableOpacityWithReset>
            </>
          ) : (
            // Non-admin content
            <TouchableOpacityWithReset 
            className='mt-4 bg-orange items-center w-2/4 rounded-md py-4 px-4'
            onPress={() => router.push("/pice/listPice")}
            >
              <Text>Lista Pića</Text>
            </TouchableOpacityWithReset>
          )}
        </View>
      </ScrollView>
      </View>
      <SessionExpiredOverlay
        visible={isSessionExpired}
        onLogout={logout}
      />
    </SafeAreaView>
  );
}

export default Proizvodi