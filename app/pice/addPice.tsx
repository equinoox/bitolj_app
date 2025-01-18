import { Text, View, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native'
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react'


const addPice = () => {

  const database = useSQLiteContext();
  const [naziv, setNaziv] = useState("");
  const [cena, setCena] = useState("");

  // CREATE
  const isNumeric = (value: string): boolean => {
    return /^[0-9]+$/.test(value);
  };  
  const handleTypes = async () => {
    if(naziv == null || typeof naziv !== "string" || naziv == '' || cena == null || !isNumeric(cena)){
      Alert.alert(
        "Error",
        "Nepravilno uneti podaci.",
        [{ text: "OK" , style: 'cancel'}]
      );
    } else {
      Alert.alert(
        "Adding Confirmation",
        "Da li želite da unesete Piće?",
        [{ text: "Ne" , style: 'cancel'}, { text: "Da", onPress: async () => handleSave()}]
      );
    }
  }
  const handleSave = async () => {
      try {
        await database.runAsync("INSERT INTO pice (naziv, cena, deleted) VALUES (?, ?, ?);", [
          naziv, cena, "false"
        ]);
        Alert.alert(
          "Adding Success",
          "Uspešno dodato Piće.",
          [{ text: "OK" , style: 'default'}]
        );
      } catch (error) {
        console.log(error);
      }
  };

  const clearInputs = async () => {
    setNaziv("");
    setCena("");
  }

  return (
    <SafeAreaView className='h-full flex bg-primary'>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="mt-4 px-4 justify-center items-center">
            <Text className='text-center'>Naziv</Text>
            <TextInput
              placeholder='Naziv'
              value={naziv}
              onChangeText={(text) => setNaziv(text)}
              className='w-3/4 mt-2 border border-gray-300 bg-white rounded-md p-3 text-gray-700'
            />
            <Text className='text-center mt-2'>Cena</Text>
            <TextInput
              placeholder='Cena'
              value={cena}
              onChangeText={(text) => setCena(text)}
              className='w-3/4 mt-2 border border-gray-300 bg-white rounded-md p-3 text-gray-700'
            />
            <View className='w-full flex-row justify-around mt-3'>
              <TouchableOpacity 
              className='mt-4 bg-orange items-center w-1/4 rounded-md py-4 px-4'
              onPress={async () => handleTypes()}
              >
                <Text>Dodaj Piće</Text>
              </TouchableOpacity>
              <TouchableOpacity 
              className='mt-4 bg-red-500 items-center w-1/4 rounded-md py-4 px-4'
              onPress={async () => clearInputs()}
              >
                <Text>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
    </SafeAreaView>
  )
}

export default addPice