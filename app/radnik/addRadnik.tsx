import { Text, View, SafeAreaView, ScrollView, TextInput, TouchableOpacity, StyleSheet , Alert } from 'react-native'
import { useSQLiteContext } from 'expo-sqlite';
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react'

const addRadnik = () => {

  const database = useSQLiteContext();
  const [ime, setIme] = useState("");
  const [prezime, setPrezime] = useState("");
  const [sifra, setSifra] = useState("");
  const [role, setRole] = useState("admin");


  // CREATE
  const isLettersAndSymbols = (value: string): boolean => {
    return /^[a-zA-ZćčžšđĆČŽŠĐ!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\]*$/.test(value);
  }; 
  const handleTypes = async () => {
    if(ime === "Aleksandar" && prezime === "Milenković"){
      Alert.alert("Delete Error", "Ovo Ime i Prezime je rezervisano za glavnog admina.")
      return
    }
    if(ime == null || typeof ime !== "string" || ime == '' || prezime == null || typeof prezime !== "string" || prezime == '' || sifra == null || typeof sifra !== "string" || sifra == '' || !isLettersAndSymbols(ime) || !isLettersAndSymbols(prezime)){
      Alert.alert(
        "Error",
        "Nepravilno uneti podaci.",
        [{ text: "OK" , style: 'cancel'}]
      );
    } else {
      Alert.alert(
        "Adding Confirmation",
        "Da li želite da unesete Radnika?",
        [{ text: "Ne" , style: 'cancel'}, { text: "Da", onPress: async () => handleSave()}]
      );
    }
  }

  const handleSave = async () => {
      try {
        await database.runAsync("INSERT INTO korisnik (ime, prezime, sifra, role, deleted) VALUES (?, ?, ?, ?, ?);", [
          ime, prezime, sifra, role, 'false'
        ]);
        Alert.alert(
          "Adding Success",
          "Uspešno dodat Radnik.",
          [{ text: "OK" , style: 'default'}]
        );
      } catch (error) {
        console.log(error);
      }
  };

  const clearInputs = async () => {
    setIme("");
    setPrezime("");
    setSifra("");
  }

  return (
    <SafeAreaView className='h-full flex bg-primary'>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="mt-4 px-4 justify-center items-center">
            <Text className='text-center'>Ime</Text>
            <TextInput
              placeholder='Ime'
              value={ime}
              onChangeText={(text) => setIme(text)}
              className='w-3/4 mt-2 border border-gray-300 bg-white rounded-md p-3 text-gray-700'
            />
            <Text className='text-center mt-2'>Prezime</Text>
            <TextInput
              placeholder='Prezime'
              value={prezime}
              onChangeText={(text) => setPrezime(text)}
              className='w-3/4 mt-2 border border-gray-300 bg-white rounded-md p-3 text-gray-700'
            />
            <Text className='text-center mt-2'>Šifra</Text>
            <TextInput
              placeholder='Šifra'
              value={sifra}
              keyboardType="number-pad"
              onChangeText={(text) => setSifra(text)}
              className='w-3/4 mt-2 border border-gray-300 bg-white rounded-md p-3 text-gray-700'
            />
            <View className="flex-row items-center justify-center w-3/4 mt-4">
              <View className="w-52 bg-white border border-gray-300 rounded-lg overflow-hidden shadow-md">
                <Picker
                  selectedValue={role}
                  onValueChange={(itemValue) => setRole(itemValue)}
                  style={{ height: 60, width: '100%' }}
                  dropdownIconColor="#6B7280"
                >
                  <Picker.Item label="Admin" value="admin" />
                  <Picker.Item label="Menadžer" value="manager" />
                  <Picker.Item label="Radnik" value="user" />
                </Picker>
              </View>
            </View>
            <View className='w-full flex-row justify-around mt-3'>
              <TouchableOpacity 
              className='mt-4 bg-orange items-center w-1/4 rounded-md py-4 px-4'
              onPress={async () => handleTypes()}
              >
                <Text>Dodaj Radnika</Text>
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

export default addRadnik
