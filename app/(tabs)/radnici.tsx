import { View, Text, ScrollView, TextInput, TouchableOpacity, FlatList } from 'react-native'
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Korisnik } from '@/models/Korisnik';

const Radnici = () => {

  const currentDate = new Date().toLocaleDateString('sr-RS', {
    // weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
  const database = useSQLiteContext();
  const [ime, setIme] = useState("");
  const [prezime, setPrezime] = useState("");
  const [sifra, setSifra] = useState("");

  const handleSave = async () => {
    try {
      console.log("Adding Korisnik...")
      database.runAsync("INSERT INTO korisnik (ime, prezime, sifra) VALUES (?, ?, ?);", [
        ime, prezime, sifra
      ]);
    } catch (error) {
      console.log(error);
    }
  };

  // GET ALL KORISNIK
// =======================================================================================================  
const [data, setData] = useState<Korisnik[]>([]);
const loadData = async () => {
  const result = await database.getAllAsync<Korisnik>("SELECT * FROM korisnik");
  console.log(result);
  setData(result);
}
// =======================================================================================================  

// EVERY TIME PAGE LOADS WE NEED FUNCTION loadData to Load...
  useFocusEffect(
    useCallback( () => {
      loadData();
    }, [])
  );



  return (
    <SafeAreaView className= "flex-1">
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        
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
          <Text className='text-center font-semibold text-3xl'>Unesi Radnika</Text>
          <TextInput
            placeholder='Ime'
            value={ime}
            onChangeText={(text) => setIme(text)}
            className='w-full mt-2 border border-gray-300 bg-white rounded-md p-3 text-gray-700'
          />
          <TextInput
            placeholder='Prezime'
            value={prezime}
            onChangeText={(text) => setPrezime(text)}
            className='w-full mt-2 border border-gray-300 bg-white rounded-md p-3 text-gray-700'
          />
          <TextInput
            placeholder='Sifra'
            value={sifra}
            onChangeText={(text) => setSifra(text)}
            className='w-full mt-2 border border-gray-300 bg-white rounded-md p-3 text-gray-700'
          />
          {/* POTVRDI SIFRU FALI */}
          {/* <TextInput
            placeholder='Porvrdi Sifru'
            value={pSifra}
            onChangeText={(text) => setPsifra(text)}
            className='w-full mt-2 border border-gray-300 bg-white rounded-md p-3 text-gray-700'
          /> */}
          <TouchableOpacity 
          className='mt-4 bg-blue-500 rounded-md py-2 px-4'
          onPress={async () => handleSave() }
          >
            <Text>Dodaj</Text>
          </TouchableOpacity>

          <FlatList
            data={data}
            renderItem={ ({item}) => {
              return (
              <View>
                <Text>{item.ime}</Text>
                <Text>{item.prezime}</Text>
                {/* <Text>{item.sifra}</Text> */}
              </View>
              );
            }}
            nestedScrollEnabled
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

export default Radnici