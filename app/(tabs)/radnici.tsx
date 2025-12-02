import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { SessionExpiredOverlay } from '../../components/SessionExpiredOverlay';
import { TouchableOpacityWithReset } from '../../components/TouchableOpacityWithReset';


const Radnici = () => {
  const { userData, setUserData, isSessionExpired, resetInactivityTimeout } = useAuth();

  const logoutConfirm = () => {
    Alert.alert(
      "Log Out",
      "Da li želite da se odjavite?",
      [{ text: "Ne", style: 'cancel' }, { text: "Da", onPress: async () => logout() }]
    );
  }

  const logout = async () => {
    try {
      await setUserData(null);
      router.replace('/log-in');
    } catch (error) {
      console.error("Error: " + error)
    }
  };

  const currentDate = new Date().toLocaleDateString('sr-RS', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView className="flex-1">
      <View
        className="flex-1"
        onStartShouldSetResponder={() => {
          resetInactivityTimeout();
          return false;
        }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>

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
            <Text className='font-semibold text-3xl'>Opcije Menu</Text>
            <View className="mt-4 w-full border-t-2 border-black" />
            {userData?.role === 'admin' ? (
              <>
                <TouchableOpacityWithReset
                  className='mt-4 bg-orange items-center w-2/4 rounded-md py-4 px-4'
                  onPress={() => router.push("/radnik/listRadnik")}
                >
                  <Text className='font-semibold'>Lista Radnika</Text>
                </TouchableOpacityWithReset>
                <TouchableOpacityWithReset
                  className='mt-4 bg-orange items-center w-2/4 rounded-md py-4 px-4'
                  onPress={() => router.push("/radnik/getRadnik")}
                >
                  <Text className='font-semibold'>Promeni/Obriši Radnika</Text>
                </TouchableOpacityWithReset>
                <TouchableOpacityWithReset
                  className='mt-4 bg-orange items-center w-2/4 rounded-md py-4 px-4'
                  onPress={() => router.push("/radnik/roleRadnik")}
                >
                  <Text className='font-semibold'>Promeni poziciju Radnika</Text>
                </TouchableOpacityWithReset>
                <TouchableOpacityWithReset
                  className='mt-4 bg-orange items-center w-2/4 rounded-md py-4 px-4'
                  onPress={() => router.push("/radnik/passRadnik")}
                >
                  <Text className='font-semibold'>Promeni šifru Radnika</Text>
                </TouchableOpacityWithReset>
                <TouchableOpacityWithReset
                  className='mt-4 bg-orange items-center w-2/4 rounded-md py-4 px-4'
                  onPress={() => router.push("/radnik/addRadnik")}
                >
                  <Text className='font-semibold'>Dodaj Radnika</Text>
                </TouchableOpacityWithReset>
              </>
            ) : userData?.role === 'manager' ? (
              <>
                <TouchableOpacityWithReset
                  className='mt-4 bg-orange items-center w-2/4 rounded-md py-4 px-4'
                  onPress={() => router.push("/radnik/listRadnik")}
                >
                  <Text className='font-semibold'>Lista Radnika</Text>
                </TouchableOpacityWithReset>
              </>
            ) : (
              <View className="mt-8 p-4 bg-red-100 rounded-lg justify-center items-center">
                <MaterialIcons name="cancel" size={74} color="#393B44" />
                <Text className="text-red-600 text-center text-lg">
                  Ne možete pristupiti ostalim funkcionalnostima jer nemate administratorske privilegije.
                </Text>
              </View>
            )}

            <View className='mt-1 w-full items-center'>
              {userData?.role === 'admin' ? (
                <>
                  <TouchableOpacityWithReset 
                    className='mt-4 bg-orange items-center w-2/4 rounded-md py-4 px-4'
                    onPress={() => router.push("/pice/listPice")}
                  >
                    <Text className='font-semibold'>Lista Pića</Text>
                  </TouchableOpacityWithReset>
                  <TouchableOpacityWithReset 
                    className='mt-4 bg-orange items-center w-2/4 rounded-md py-4 px-4'
                    onPress={() => router.push("/pice/getPice")}
                  >
                    <Text className='font-semibold'>Promeni/Obriši Piće</Text>
                  </TouchableOpacityWithReset>
                  <TouchableOpacityWithReset 
                    className='mt-4 bg-orange items-center w-2/4 rounded-md py-4 px-4'
                    onPress={() => router.push("/pice/addPice")}
                  >
                    <Text className='font-semibold'>Dodaj Piće</Text>
                  </TouchableOpacityWithReset>
                </>
              ) : userData?.role === 'manager' ? (
                <>
                  <TouchableOpacityWithReset 
                    className='mt-4 bg-orange items-center w-2/4 rounded-md py-4 px-4'
                    onPress={() => router.push("/pice/listPice")}
                  >
                    <Text className='font-semibold'>Lista Pića</Text>
                  </TouchableOpacityWithReset>
                  <TouchableOpacityWithReset 
                    className='mt-4 bg-orange items-center w-2/4 rounded-md py-4 px-4'
                    onPress={() => router.push("/pice/addPice")}
                  >
                    <Text className='font-semibold'>Dodaj Piće</Text>
                  </TouchableOpacityWithReset>
                </>
              ) : (
                <TouchableOpacityWithReset 
                  className='mt-4 bg-orange items-center w-2/4 rounded-md py-4 px-4'
                  onPress={() => router.push("/pice/listPice")}
                >
                  <Text className='font-semibold'>Lista Pića</Text>
                </TouchableOpacityWithReset>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Session Expired Overlay */}
        <SessionExpiredOverlay
          visible={isSessionExpired}
          onLogout={logout}
        />
      </View>
    </SafeAreaView>
  );
}

export default Radnici